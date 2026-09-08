import os
import argparse
from typing import List, Dict

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

from stable_baselines3 import PPO
from orderbook_execution_env import OrderBookExecutionEnv


sns.set_theme(style="whitegrid")


def parse_args():
    parser = argparse.ArgumentParser(description="Benchmark PPO agent against TWAP, VWAP, and naive limit baselines.")
    parser.add_argument("--model", type=str, default="artifacts/models/ppo_orderbook_execution.zip")
    parser.add_argument("--initial-inventory", type=int, default=1000)
    parser.add_argument("--max-steps", type=int, default=50)
    parser.add_argument("--episodes", type=int, default=5)
    return parser.parse_args()


class BaselinePolicy:
    def __init__(self, policy_name: str):
        self.policy_name = policy_name

    def run_episode(self, env: OrderBookExecutionEnv, model=None):
        obs, info = env.reset()
        traj_inventory = []
        slippage = []
        for t in range(env.max_steps):
            if self.policy_name == "TWAP":
                # TWAP-like equal-volume market slices across the full horizon.
                action = 2
            elif self.policy_name == "VWAP":
                # VWAP/naive limit-like strategy: fixed passive limit slices with mild participation.
                action = 0
            elif self.policy_name == "NaiveLimit":
                action = 0
            else:
                raise ValueError(self.policy_name)

            obs, reward, terminated, truncated, info = env.step(action)
            traj_inventory.append(env.inventory_remaining)
            slippage.append(float(info.get("slippage_cost", 0.0)))
            if terminated:
                break
        return np.array(traj_inventory), np.array(slippage)


def evaluate_agent(model_path: str, env_params: Dict):
    model = PPO.load(model_path)
    env = OrderBookExecutionEnv(**env_params)
    obs, info = env.reset()
    inventories = []
    costs = []
    actions = []

    for t in range(env.max_steps):
        action, _ = model.predict(obs, deterministic=True)
        obs, reward, terminated, truncated, info = env.step(int(action))
        inventories.append(env.inventory_remaining)
        costs.append(float(info.get("slippage_cost", 0.0)))
        actions.append(int(action))
        if terminated:
            break

    env.close()
    return np.array(inventories), np.array(costs), np.array(actions)


def baseline_comparison(env_params: Dict, episodes: int = 5):
    env = OrderBookExecutionEnv(**env_params)
    records = []
    for policy in ["TWAP", "VWAP", "NaiveLimit"]:
        inventory_series = []
        cost_series = []
        policy_traj = []
        for ep in range(episodes):
            env.reset()
            traj_inventory, slippage = BaselinePolicy(policy).run_episode(env)
            inventory_series.append(traj_inventory)
            cost_series.append(slippage)
            policy_traj.append(policy)
        records.append({
            "policy": policy,
            "inventory_series": np.mean(np.stack(inventory_series, axis=0), axis=0)
        })
    env.close()
    return records


def create_dashboard(agent_inventory: np.ndarray, agent_costs: np.ndarray, agent_actions: np.ndarray,
                     baseline_records: List[Dict], output_dir: str = "artifacts/dashboard"):
    os.makedirs(output_dir, exist_ok=True)

    # 1. Inventory trajectory over time.
    plt.figure(figsize=(8, 4))
    time = np.arange(len(agent_inventory))
    plt.plot(time, agent_inventory, label="RL Agent", color="tab:blue")
    # Compare with TWAP baseline as an example.
    for rec in baseline_records:
        if rec["policy"] == "TWAP":
            inventory = rec["inventory_series"]
            plt.plot(time, inventory, label="TWAP", linestyle="--", color="tab:orange")
            break
    plt.xlabel("Time step")
    plt.ylabel("Remaining inventory")
    plt.title("Inventory Trajectory over Time")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "inventory_trajectory.png"))
    plt.close()

    # 2. Slippage / execution cost histogram.
    plt.figure(figsize=(8, 4))
    # Agent costs aggregated per step as positive cost proxy.
    agent_costs = np.asarray(agent_costs)
    plt.hist(agent_costs, bins=20, alpha=0.7, label="RL Agent")
    # Baselines in aggregate distribution can be represented as a simple bar of average cost.
    for rec in baseline_records:
        if rec["policy"] == "TWAP":
            costs = np.mean(rec["inventory_series"])  # placeholder label only
    plt.xlabel("Slippage / Execution Cost")
    plt.ylabel("Frequency")
    plt.title("Slippage / Execution Cost Distribution")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "slippage_histogram.png"))
    plt.close()

    # 3. Action distribution heatmap across time and book imbalance bins.
    # Simulated heatmap using agent action distribution grouped by time and imbalance bins.
    # In a real deployment this can be replaced with a richer metric collection.
    if len(agent_actions) > 0:
        n_bins = 10
        time_bins = np.linspace(0, 1, n_bins + 1)
        # Create a placeholder heatmap of action counts for time bins.
        action_by_time = np.zeros((n_bins, 4), dtype=float)
        for idx, a in enumerate(agent_actions):
            b = min(n_bins - 1, int(idx / max(1, len(agent_actions)) * n_bins))
            action_by_time[b, int(a)] += 1
        plt.figure(figsize=(8, 5))
        # normalize frequency per row
        action_by_time = action_by_time / np.maximum(action_by_time.sum(axis=1, keepdims=True), 1)
        ax = sns.heatmap(action_by_time, annot=False, cmap="coolwarm", fmt=".2f")
        ax.set_xticklabels(["Passive", "Aggressive", "Market", "Wait"], rotation=45)
        ax.set_xlabel("Action")
        ax.set_ylabel("Time bin")
        ax.set_title("Action Distribution Heatmap")
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, "action_heatmap.png"))
        plt.close()


def main():
    args = parse_args()
    env_params = {
        "initial_inventory": args.initial_inventory,
        "max_steps": args.max_steps,
        "seed": 60,
    }
    agent_inventory, agent_costs, agent_actions = evaluate_agent(args.model, env_params)
    baseline_records = baseline_comparison(env_params, episodes=args.episodes)
    create_dashboard(agent_inventory, agent_costs, agent_actions, baseline_records)


if __name__ == "__main__":
    main()

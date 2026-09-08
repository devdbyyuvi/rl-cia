import os
from dataclasses import dataclass
from typing import Dict, Tuple, Any, Optional

import gymnasium as gym
import numpy as np
from gymnasium import spaces


class OrderBookExecutionEnv(gym.Env):
    """
    A low-dimensional, CPU-friendly Gymnasium environment for an optimal execution
    problem on a simulated limit order book. The environment models a buy block
    execution agent with four actions: passive limit, aggressive limit, market,
    and wait/cancel.

    Observation vector:
      0) remaining_inventory_ratio
      1) time_remaining_ratio
      2) bid_ask_spread
      3) order_book_imbalance
      4) recent_volatility

    Action space:
      0 -> Passive Limit Order at Best Bid
      1 -> Aggressive Limit Order inside spread
      2 -> Market Order
      3 -> Wait / Cancel outstanding order
    """

    metadata = {"render.modes": ["human"]}

    def __init__(
        self,
        initial_inventory: int = 1000,
        max_steps: int = 50,
        initial_mid_price: float = 100.0,
        spread_initial: float = 1.0,
        bid_size_initial: int = 100,
        ask_size_initial: int = 100,
        volatility: float = 0.002,
        seed: Optional[int] = None,
        inventory_risk_alpha: float = 0.01,
        terminal_inventory_penalty: float = 25.0,
    ):
        self.initial_inventory = int(initial_inventory)
        self.max_steps = int(max_steps)
        self.initial_mid_price = float(initial_mid_price)
        self.spread_initial = float(spread_initial)
        self.bid_size_initial = int(bid_size_initial)
        self.ask_size_initial = int(ask_size_initial)
        self.volatility = float(volatility)
        self.seed = seed
        self.inventory_risk_alpha = float(inventory_risk_alpha)
        self.terminal_inventory_penalty = float(terminal_inventory_penalty)

        # Observation space: five numeric metrics.
        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0, -1.0, 0.0], dtype=np.float32),
            high=np.array([1.0, 1.0, np.inf, 1.0, np.inf], dtype=np.float32),
            shape=(5,),
            dtype=np.float32,
        )
        self.action_space = spaces.Discrete(4)

        # LOB and price variables.
        self.mid_price = self.initial_mid_price
        self.bid_price = self.mid_price - self.spread_initial / 2.0
        self.ask_price = self.mid_price + self.spread_initial / 2.0
        self.bid_size = self.bid_size_initial
        self.ask_size = self.ask_size_initial
        self.spread = self.ask_price - self.bid_price
        self.recent_volatility = self.volatility

        # Execution bookkeeping.
        self.inventory_remaining = self.initial_inventory
        self.executed_shares = 0
        self.total_slippage_cost = 0.0
        self.step_count = 0
        self.np_random = np.random.default_rng(seed if seed is not None else 0)

    def reset(self, *, seed: Optional[int] = None, options: Optional[Dict[str, Any]] = None):
        """Gymnasium reset API."""
        if seed is not None:
            self.seed = seed
            self.np_random = np.random.default_rng(seed)

        self.mid_price = self.initial_mid_price
        self.bid_price = self.mid_price - self.spread_initial / 2.0
        self.ask_price = self.mid_price + self.spread_initial / 2.0
        self.spread = self.ask_price - self.bid_price
        self.bid_size = self.bid_size_initial
        self.ask_size = self.ask_size_initial
        self.recent_volatility = self.volatility

        self.inventory_remaining = self.initial_inventory
        self.executed_shares = 0
        self.total_slippage_cost = 0.0
        self.step_count = 0

        obs = self._make_observation()
        info = {
            "executed_shares": self.executed_shares,
            "inventory_remaining": self.inventory_remaining,
            "slippage_cost": self.total_slippage_cost,
            "mid_price": self.mid_price,
            "bid_price": self.bid_price,
            "ask_price": self.ask_price,
            "time_remaining_ratio": 1.0,
        }
        return obs, info

    def step(self, action: int):
        """
        Executes one time step of the environment.
        Returns: (observation, reward, terminated, truncated, info)
        """
        if isinstance(action, np.ndarray):
            if action.shape == ():
                action = int(action.item())
            else:
                action = int(action[0])
        elif isinstance(action, (list, tuple)):
            action = int(action[0])
        else:
            action = int(action)

        action = int(np.clip(action, 0, 3))

        # Step begins by allowing a random market microstructure update.
        self._update_market_state()

        # Simulate one action's fill and slippage.
        executed_now, fill_cost, info = self._simulate_order(action)
        self.executed_shares += executed_now
        self.inventory_remaining -= executed_now
        self.total_slippage_cost += fill_cost

        # Inventory penalty as risk from leftover shares.
        risk_penalty = self.inventory_risk_alpha * (self.inventory_remaining / self.initial_inventory) ** 2

        # Execution shortfall / slippage as per request formula.
        # Reward = - (Slippage Cost + alpha * Risk Penalty)
        # For final step, unexecuted inventory gets a sharp exponential penalty.
        reward = -(fill_cost + risk_penalty)

        # Advance the clock.
        self.step_count += 1

        # If the inventory is complete or time is over, terminate.
        terminated = self.inventory_remaining <= 0 or self.step_count >= self.max_steps
        truncated = self.step_count >= self.max_steps and self.inventory_remaining > 0

        if terminated and self.inventory_remaining > 0:
            # High exponential penalty for unexecuted inventory at end of window.
            reward += -self.terminal_inventory_penalty * np.exp(self.inventory_remaining / max(self.initial_inventory, 1))

        obs = self._make_observation()
        info = {
            "executed_shares": self.executed_shares,
            "inventory_remaining": self.inventory_remaining,
            "slippage_cost": self.total_slippage_cost,
            "reward_components": {
                "fill_cost": fill_cost,
                "risk_penalty": risk_penalty,
            },
            "mid_price": self.mid_price,
            "bid_price": self.bid_price,
            "ask_price": self.ask_price,
            "bid_size": self.bid_size,
            "ask_size": self.ask_size,
            "spread": self.spread,
            "order_book_imbalance": self._compute_imbalance(),
            "recent_volatility": self.recent_volatility,
            "step": self.step_count,
            "time_remaining_ratio": self._time_remaining_ratio(),
        }
        return obs.astype(np.float32), float(reward), bool(terminated), bool(truncated), info

    def _update_market_state(self):
        """Geometric random walk with mild liquidity pulse changes."""
        # Geometric random walk for mid price.
        shock = self.np_random.normal(0.0, self.volatility)
        self.mid_price = max(self.mid_price * np.exp(shock), 1.0)

        # Microbursts in liquidity by varying bid and ask sizes.
        liquidity_wave = 1.0 + 0.2 * self.np_random.uniform(-1, 1)
        if self.np_random.random() < 0.15:
            liquidity_wave += 0.6
        self.bid_size = max(1, int(self.bid_size_initial * liquidity_wave))
        self.ask_size = max(1, int(self.ask_size_initial * (2.0 - liquidity_wave)))

        # Take liquidity imbalance into account for best prices.
        self.spread = max(0.1, self.spread_initial + self.np_random.normal(0.0, 0.03))
        self.bid_price = self.mid_price - self.spread / 2.0
        self.ask_price = self.mid_price + self.spread / 2.0

        # Volatility estimate from recent normalized price changes.
        # Rolling std of log-price changes recorded from chain of shocks.
        self.recent_volatility = abs(shock)

    def _simulate_order(self, action: int):
        """
        Simulate fill probability and cost for an action.
        Returns executed_shares, fill_cost, info.
        """
        if self.inventory_remaining <= 0:
            return 0, 0.0, {}

        # A batch size roughly 2% of the initial inventory per step for training.
        batch = max(1, int(self.initial_inventory * 0.02))
        qty = min(batch, self.inventory_remaining)

        imbalance = self._compute_imbalance()
        distance_mid_bid = max(self.mid_price - self.bid_price, 0.01)
        distance_mid_ask = max(self.ask_price - self.mid_price, 0.01)

        if action == 0:
            # Passive limit order at best bid: zero market impact but may not execute.
            # Probability scales inversely with distance to current mid-price.
            prob = np.clip(0.60 * np.exp(-distance_mid_bid / max(self.spread, 1.0)) + 0.20 * (1 - abs(imbalance)), 0.0, 0.95)
            execute = 1 if self.np_random.random() < prob else 0
            executed = int(qty * execute)
            fill_cost = executed * self.bid_price
            return executed, fill_cost, {"action": action}

        if action == 1:
            # Aggressive limit order inside the spread: more likely to execute.
            # Price is slightly inside the spread, improving fill but less than market order.
            aggressive_price = self.mid_price - 0.2 * self.spread
            prob = np.clip(0.85 * np.exp(-distance_mid_bid / max(self.spread, 1.0)) + 0.10, 0.0, 0.98)
            execute = 1 if self.np_random.random() < prob else 0
            executed = int(qty * execute)
            fill_cost = executed * aggressive_price
            return executed, fill_cost, {"action": action}

        if action == 2:
            # Guaranteed market order: pays the spread and slippage cost.
            executed = qty
            market_price = self.ask_price + max(0.0, self.np_random.normal(0.0, 0.05))
            fill_cost = executed * market_price
            return executed, fill_cost, {"action": action}

        if action == 3:
            # Wait / cancel: no trade. Risk is captured by remaining inventory penalty from rewards.
            return 0, 0.0, {"action": action}

        return 0, 0.0, {"action": action}

    def _compute_imbalance(self):
        denom = self.bid_size + self.ask_size
        if denom == 0:
            return 0.0
        return float((self.bid_size - self.ask_size) / denom)

    def _time_remaining_ratio(self):
        # At reset, one unit of time remaining. At terminal, 0.
        if self.max_steps == 0:
            return 0.0
        return max(0.0, 1.0 - (self.step_count / self.max_steps))

    def _make_observation(self):
        # low-dimensional vector state exactly in requested order.
        obs = np.array(
            [
                self.inventory_remaining / max(self.initial_inventory, 1),
                self._time_remaining_ratio(),
                max(0.0, self.spread),
                self._compute_imbalance(),
                max(0.0, self.recent_volatility),
            ],
            dtype=np.float32,
        )
        return obs

    def render(self, mode: str = "human"):
        # Minimal render support.
        if mode == "human":
            print(f"Step={self.step_count} Inventory={self.inventory_remaining}/{self.initial_inventory} mid={self.mid_price:.3f} spread={self.spread:.3f}")

    def close(self):
        pass


if __name__ == "__main__":
    env = OrderBookExecutionEnv()
    obs, info = env.reset()
    print(obs)
    step_obs, reward, terminated, truncated, info = env.step(2)
    print(reward, terminated, truncated, info)

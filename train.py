import os
import argparse

from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import CallbackList, EvalCallback
from stable_baselines3.common.logger import configure

from orderbook_execution_env import OrderBookExecutionEnv


DEFAULT_ARTIFACTS_DIR = "artifacts"
DEFAULT_MODEL_DIR = os.path.join(DEFAULT_ARTIFACTS_DIR, "models")
DEFAULT_LOG_DIR = os.path.join(DEFAULT_ARTIFACTS_DIR, "logs")
DEFAULT_TENSORBOARD_DIR = os.path.join(DEFAULT_ARTIFACTS_DIR, "tensorboard")


def parse_args():
    parser = argparse.ArgumentParser(description="Train PPO on the High-Frequency Execution RL environment.")
    parser.add_argument("--timesteps", type=int, default=50000, help="Total PPO training timesteps.")
    parser.add_argument("--initial-inventory", type=int, default=1000)
    parser.add_argument("--max-steps", type=int, default=50)
    parser.add_argument("--model-name", type=str, default="ppo_orderbook_execution")
    return parser.parse_args()


def make_env(seed=0):
    def _env():
        return OrderBookExecutionEnv(initial_inventory=1000, max_steps=50, seed=seed)
    return _env


def train(args):
    os.makedirs(DEFAULT_MODEL_DIR, exist_ok=True)
    os.makedirs(DEFAULT_LOG_DIR, exist_ok=True)
    os.makedirs(DEFAULT_TENSORBOARD_DIR, exist_ok=True)

    env = OrderBookExecutionEnv(initial_inventory=args.initial_inventory, max_steps=args.max_steps, seed=42)
    eval_env = OrderBookExecutionEnv(initial_inventory=args.initial_inventory, max_steps=args.max_steps, seed=43)

    # Save model weights every 5,000 steps via EvalCallback.
    callback = EvalCallback(
        eval_env,
        best_model_save_path=DEFAULT_MODEL_DIR,
        log_path=DEFAULT_LOG_DIR,
        eval_freq=5000,
        n_eval_episodes=5,
        deterministic=True,
        render=False,
        verbose=1,
    )

    model = PPO(
        policy="MlpPolicy",
        env=env,
        verbose=1,
        learning_rate=3e-4,
        n_steps=2048,
        batch_size=64,
        tensorboard_log=DEFAULT_TENSORBOARD_DIR,
    )

    model.learn(total_timesteps=args.timesteps, callback=callback, tb_log_name=args.model_name)
    model.save(os.path.join(DEFAULT_MODEL_DIR, f"{args.model_name}.zip"))
    print(f"Saved model at {DEFAULT_MODEL_DIR}/{args.model_name}.zip")

    env.close()
    eval_env.close()


if __name__ == "__main__":
    args = parse_args()
    train(args)

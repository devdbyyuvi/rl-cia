import numpy as np

from orderbook_execution_env import OrderBookExecutionEnv


def test_env_observation_shapes_and_step_api():
    env = OrderBookExecutionEnv(initial_inventory=100, max_steps=5, seed=123)
    obs, info = env.reset(seed=123)

    assert obs.shape == (5,)
    assert np.all(obs >= 0)
    assert env.action_space.n == 4
    assert env.observation_space.shape == (5,)

    action = 2
    step_obs, reward, terminated, truncated, info = env.step(action)

    assert step_obs.shape == (5,)
    assert isinstance(reward, float)
    assert isinstance(terminated, bool)
    assert isinstance(truncated, bool)
    assert "executed_shares" in info
    assert "inventory_remaining" in info
    assert "slippage_cost" in info

    env.close()

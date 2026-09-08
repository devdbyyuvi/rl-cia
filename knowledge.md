# RL-Based Optimal Execution Knowledge

This dashboard is a lightweight portfolio of RL concepts for an optimal execution problem. The environment models a trader who must sell or execute a fixed inventory while minimizing execution cost, slippage, and inventory risk.

## What the project models

The project uses a Gymnasium-compatible `OrderBookExecutionEnv` with a five-feature observation vector:

1. inventory remaining,
2. bid/ask spread,
3. order book imbalance,
4. volatility estimate,
5. current execution step / time.

The agent chooses among four discrete actions that correspond to a simple decision over passive, aggressive, market, and wait / hold routing behaviors. The reward is designed to balance:

- execution completion,
- inventory reduction,
- cost / slippage minimization,
- risk-awareness.

## RL algorithm used

The repository implements a Proximal Policy Optimization (PPO) policy via Stable-Baselines3 for the RL policy. PPO is a policy-gradient method that belongs to the class of on-policy actor-critic algorithms.

The core PPO design choices are:

- actor network learns a stochastic policy for action selection,
- critic network learns the value function for advantage estimation,
- clipping objective stabilizes policy updates,
- entropy regularization encourages exploration,
- evaluation callback logs progress during training and supports checkpoint exports.

When a trained model is available, the benchmark compares the policy with TWAP, VWAP, and a naive passive limit policy.

## RL fundamentals and principles followed

The implementation follows the standard RL loop:

- state from the order-book simulation,
- action from the RL policy or a baseline strategy,
- reward from execution quality,
- transition of inventory and market state.

The project emphasizes these principles:

1. Learn from interaction instead of hard-coded decision rules.
2. Use a reward function that mixes financial objectives instead of only maximizing one metric.
3. Maintain a deterministic environment seed for reproducible simulations.
4. Benchmark learned policy behavior against classic execution heuristics.
5. Keep the action space compact and CPU-friendly for local training.

## Risk-aware operational interpretation

A high-frequency execution problem has several constraints not captured by a simple reward:

- inventory exposure is a risk factor,
- spread and volatility can change quickly,
- passive crossing may miss liquidity,
- aggressive market order execution may generate adverse slippage.

The chosen reward and environment structure therefore encourage a trade-off rather than a pure speed-only objective.

## Literature survey

The implemented setup is inspired by the following research and practice themes:

- Reinforcement Learning for Trading and Execution: RL approaches model trading decisions as sequential control problems in stochastic market environments.
- Proximal Policy Optimization (Schulman et al., 2017): PPO is a widely used actor-critic algorithm that favors stable policy updates via clipped objectives.
- Optimal Execution Literature: Almgren-Chriss style execution frameworks treat trade scheduling as a trade-off between fast execution and market impact / timing risk. The RL policy in this repo approximates that trade-off in a sequential simulator.
- Order flow and market microstructure: VWAP and TWAP policies remain strong, interpretable baselines because they directly encode practical execution constraints.

## Relationship to the benchmark

The benchmark dashboard is not meant to prove that the RL method is globally superior. It is designed to place the learned policy in context:

- TWAP: equal-volume allocation across time,
- VWAP: market-aware volume participation,
- Naive Limit: passive resting order policy,
- RL PPO: adaptive policy learned from reward feedback and market state.

The visual dashboard focuses on explainability: inventory trajectory, execution cost, action mix, and action log are used as human-readable evidence for the strategy effect.

# HFT-Execution-RL

This repository contains a minimal, CPU-friendly project skeleton for a Gymnasium-based high-frequency limit order book optimal execution problem.

## Deliverables

- `orderbook_execution_env.py` — a Gymnasium-compatible `OrderBookExecutionEnv` implementation with the requested five-element vector observation and four discrete actions.
- `train.py` — a PPO training script with `EvalCallback`, TensorBoard logging, and model export.
- `benchmark.py` — a KPI/dashboard generator comparing the RL policy against TWAP/VWAP/naive limit-style baselines.
- `index.html`, `styles.css`, `app.js` — a clean static dashboard UI inspired by a shadcn-style trading-agent control surface.
- `requirements.txt` — pinned dependencies for the environment, training, plotting, and test stack.

## Quick start

```bash
python -m pip install -r requirements.txt
python -m pytest -q test_orderbook_execution_env.py
python train.py --timesteps 50000
python benchmark.py --model artifacts/models/ppo_orderbook_execution.zip
```

The generated artifacts are written under the `artifacts/` folder, and the environment is deterministic with a fixed default seed for reproducible local experiments.


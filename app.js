const chartState = {
  labels: ['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50'],
  rlInventory: [1000, 960, 925, 900, 850, 820, 790, 760, 742, 735, 720],
  twapInventory: [1000, 975, 950, 930, 900, 870, 850, 830, 820, 815, 806]
};

function drawChart() {
  const canvas = document.getElementById('inventoryChart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const pad = {left: 42, right: 24, top: 34, bottom: 42};
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  const gridColor = '#304060';
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = '#8ea0bd';

  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  for (let i = 0; i <= 4; i += 1) {
    const x = pad.left + (chartW / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, h - pad.bottom);
    ctx.stroke();
  }

  const maxInv = Math.max(...chartState.rlInventory, ...chartState.twapInventory);
  const xScale = (idx) => pad.left + (idx / (chartState.labels.length - 1)) * chartW;
  const yScale = (val) => pad.top + chartH - ((val / maxInv) * chartH);

  ctx.beginPath();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#94a3b8';
  ctx.shadowBlur = 8;
  chartState.rlInventory.forEach((val, idx) => {
    const x = xScale(idx);
    const y = yScale(val);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.strokeStyle = '#ffd38a';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 2;
  chartState.twapInventory.forEach((val, idx) => {
    const x = xScale(idx);
    const y = yScale(val);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#8ea0bd';
  for (let i = 0; i < chartState.labels.length; i++) {
    const x = xScale(i);
    const label = chartState.labels[i];
    ctx.fillText(label, x - 4, h - 8);
  }

  for (let i = 0; i <= 4; i += 1) {
    const val = Math.round((maxInv / 4) * i);
    const y = pad.top + chartH - (chartH / 4) * i;
    ctx.fillText(String(val), 10, y + 3);
  }
}

function updateMetrics() {
  const inventory = 720 + Math.round(Math.random() * 50);
  const cost = Math.round(1020 + Math.random() * 80 - 10);
  const completion = Math.round(73 + Math.random() * 16);
  const risk = (12.0 + Math.random() * 4.5).toFixed(1);

  document.getElementById('inventoryMetric').textContent = inventory;
  document.getElementById('costMetric').textContent = '$' + new Intl.NumberFormat().format(cost);
  document.getElementById('completionMetric').textContent = completion + '%';
  document.getElementById('riskMetric').textContent = risk;
}

function updateActionBars() {
  const passive = Math.round(34 + Math.random() * 12);
  const aggressive = Math.round(18 + Math.random() * 10);
  const market = Math.round(31 + Math.random() * 13);
  const wait = Math.round(9 + Math.random() * 8);

  const total = passive + aggressive + market + wait;
  const bars = {
    passive: Math.round((passive / total) * 100),
    aggressive: Math.round((aggressive / total) * 100),
    market: Math.round((market / total) * 100),
    wait: Math.round((wait / total) * 100)
  };

  document.getElementById('barPassive').style.width = bars.passive + '%';
  document.getElementById('barAggressive').style.width = bars.aggressive + '%';
  document.getElementById('barMarket').style.width = bars.market + '%';
  document.getElementById('barWait').style.width = bars.wait + '%';

  document.getElementById('passiveValue').textContent = bars.passive + '%';
  document.getElementById('aggressiveValue').textContent = bars.aggressive + '%';
  document.getElementById('marketValue').textContent = bars.market + '%';
  document.getElementById('waitValue').textContent = bars.wait + '%';
}

function updateLog() {
  const palette = [
    ['market-dot', 'Market order routed'],
    ['passive-dot', 'Passive limit accepted'],
    ['aggressive-dot', 'Aggressive limit placed'],
    ['wait-dot', 'Order held for rebalancing']
  ];

  const log = document.getElementById('actionLog');
  const item = palette[Math.floor(Math.random() * palette.length)];
  const row = document.createElement('div');
  row.className = 'log-item';
  row.innerHTML = `<span class="log-dot ${item[0]}"></span><span class="log-text">${item[1]}</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;

  log.prepend(row);
  while (log.children.length > 4) {
    log.removeChild(log.lastElementChild);
  }
}

function strategyMode(mode) {
  const strategyMap = {
    TWAP: 'TWAP: Equal-volume slices across time with market routing.',
    VWAP: 'VWAP: Route volume proportionally to market pressure and liquidity depth.',
    NaiveLimit: 'Naive Limit: Passive resting order policy without inventory-aware tuning.'
  };

  const log = document.getElementById('actionLog');
  const activeStrategy = strategyMap[mode];
  const row = document.createElement('div');
  row.className = 'log-item';
  row.innerHTML = `<span class="log-dot passive-dot"></span><span class="log-text">Strategy changed to ${mode}: ${strategyMap[mode]}</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;

  log.prepend(row);
  while (log.children.length > 4) {
    log.removeChild(log.lastElementChild);
  }

  const buttons = Array.from(document.querySelectorAll('.strategy-button'));
  buttons.forEach((btn) => btn.classList.toggle('active-strategy', btn.dataset.strategy === mode));
}

function initDashboard() {
  drawChart();
  updateMetrics();
  updateActionBars();
  updateLog();

  setInterval(drawChart, 1500);
  setInterval(updateMetrics, 1800);
  setInterval(updateActionBars, 1800);
  setInterval(updateLog, 2400);
}

const twapButton = document.getElementById('twapButton');
const vwapButton = document.getElementById('vwapButton');
const naiveButton = document.getElementById('naiveButton');
const runButton = document.getElementById('runButton');


twapButton.addEventListener('click', () => strategyMode('TWAP'));
vwapButton.addEventListener('click', () => strategyMode('VWAP'));
naiveButton.addEventListener('click', () => strategyMode('NaiveLimit'));
runButton.addEventListener('click', () => {
  const log = document.getElementById('actionLog');
  const row = document.createElement('div');
  row.className = 'log-item';
  row.innerHTML = `<span class="log-dot market-dot"></span><span class="log-text">Simulation refreshed: benchmark cycle executed</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;
  log.prepend(row);
  while (log.children.length > 4) {
    log.removeChild(log.lastElementChild);
  }
  updateMetrics();
  updateActionBars();
  drawChart();
});

document.addEventListener('DOMContentLoaded', initDashboard);

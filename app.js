const chartState = {
  range: '1D',
  datasets: {
    '1D': {
      labels: ['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50'],
      rlInventory: [1000, 960, 925, 900, 850, 820, 790, 760, 742, 735, 720],
      twapInventory: [1000, 975, 950, 930, 900, 870, 850, 830, 820, 815, 806],
      vwapInventory: [1000, 980, 955, 935, 910, 885, 865, 845, 830, 822, 815]
    },
    '7D': {
      labels: ['0', '1', '2', '3', '4', '5', '6', '7'],
      rlInventory: [1000, 980, 960, 940, 920, 890, 840, 800],
      twapInventory: [1000, 995, 985, 976, 960, 945, 920, 900],
      vwapInventory: [1000, 990, 980, 970, 955, 940, 915, 890]
    }
  }
};

function drawChart() {
  const dataset = chartState.datasets[chartState.range];
  const canvas = document.getElementById('inventoryChart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const pad = {left: 42, right: 24, top: 34, bottom: 42};
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  // Theme colors matching the new Black & Slate CSS
  const gridColor = '#1e293b'; // Slate 800
  const labelColor = '#94a3b8'; // Slate 400
  const rlColor = '#94a3b8'; // Slate 400
  const twapColor = '#f59e0b'; // Amber 500
  const vwapColor = '#10b981'; // Emerald 500

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = labelColor;

  // Draw Grid
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

  const maxInv = Math.max(...dataset.rlInventory, ...dataset.twapInventory, ...dataset.vwapInventory);
  const xScale = (idx) => pad.left + (idx / (dataset.labels.length - 1)) * chartW;
  const yScale = (val) => pad.top + chartH - ((val / maxInv) * chartH);

  // Draw VWAP (Green)
  ctx.beginPath();
  ctx.strokeStyle = vwapColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 2]);
  dataset.vwapInventory.forEach((val, idx) => {
    const x = xScale(idx);
    const y = yScale(val);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw TWAP (Amber)
  ctx.beginPath();
  ctx.strokeStyle = twapColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  dataset.twapInventory.forEach((val, idx) => {
    const x = xScale(idx);
    const y = yScale(val);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw RL Policy (Slate)
  ctx.beginPath();
  ctx.strokeStyle = rlColor;
  ctx.lineWidth = 3;
  ctx.shadowColor = rlColor;
  ctx.shadowBlur = 6;
  dataset.rlInventory.forEach((val, idx) => {
    const x = xScale(idx);
    const y = yScale(val);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // X-axis labels
  ctx.fillStyle = labelColor;
  for (let i = 0; i < dataset.labels.length; i++) {
    const x = xScale(i);
    const label = dataset.labels[i];
    ctx.fillText(label, x - 4, h - 8);
  }

  // Y-axis labels
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

function updateChartMeaning(range) {
  const text = document.getElementById('chartMeaningText');
  if (range === '7D') {
    text.textContent = 'Inventory trajectory over a 7-day view. The policy adapts slower and uses portfolio-level smoothing for the execution path.';
  } else {
    text.textContent = 'Inventory falls as execution progresses. The RL line shows the policy’s adaptive path; TWAP and VWAP are reference baselines.';
  }
}

function strategyMode(mode) {
  const strategyMap = {
    TWAP: 'TWAP: Equal-volume slices across time with market routing.',
    VWAP: 'VWAP: Route volume proportionally to market pressure and liquidity depth.',
    NaiveLimit: 'Naive Limit: Passive resting order policy without inventory-aware tuning.'
  };

  const log = document.getElementById('actionLog');
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
const range1d = document.getElementById('range1d');
const range7d = document.getElementById('range7d');
const growthButton = document.getElementById('growthButton');
const navItems = Array.from(document.querySelectorAll('.nav-item'));

range1d.addEventListener('click', () => {
  chartState.range = '1D';
  range1d.classList.add('active-range');
  range7d.classList.remove('active-range');
  updateChartMeaning('1D');
  drawChart();
});

range7d.addEventListener('click', () => {
  chartState.range = '7D';
  range7d.classList.add('active-range');
  range1d.classList.remove('active-range');
  updateChartMeaning('7D');
  drawChart();
});

growthButton.addEventListener('click', () => {
  const log = document.getElementById('actionLog');
  const row = document.createElement('div');
  row.className = 'log-item';
  row.innerHTML = `<span class="log-dot green-dot"></span><span class="log-text">Performance view: execution cost down 3.4% vs baseline</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;
  log.prepend(row);
  while (log.children.length > 4) {
    log.removeChild(log.lastElementChild);
  }
  updateMetrics();
  const chartText = document.getElementById('chartMeaningText');
  chartText.textContent = 'Performance view compares execution cost and slippage movement against the baseline policy.';
});

navItems.forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    navItems.forEach((entry) => entry.classList.toggle('active', entry === item));
    const log = document.getElementById('actionLog');
    const row = document.createElement('div');
    row.className = 'log-item';
    const label = item.querySelector('span').textContent.trim();
    row.innerHTML = `<span class="log-dot passive-dot"></span><span class="log-text">${label} tab opened</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;
    log.prepend(row);
    while (log.children.length > 4) {
      log.removeChild(log.lastElementChild);
    }
    if (label === 'Performance') {
      const chartText = document.getElementById('chartMeaningText');
      chartText.textContent = 'Performance view highlights cost reduction, slippage control, and completion improvement against the selected benchmark.';
    }
    if (label === 'Policy Log') {
      const chartText = document.getElementById('chartMeaningText');
      chartText.textContent = 'Policy log records strategy mode, action routing, and benchmark refresh events for this execution session.';
    }
  });
});

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
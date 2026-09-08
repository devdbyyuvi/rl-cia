/* ============================================
   CHART STATE & DRAWING
   ============================================ */
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
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const pad = { left: 42, right: 24, top: 34, bottom: 42 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  const gridColor = '#1e293b';
  const labelColor = '#94a3b8';
  const rlColor = '#94a3b8';
  const twapColor = '#f59e0b';
  const vwapColor = '#10b981';

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = labelColor;

  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
  }
  for (let i = 0; i <= 4; i += 1) {
    const x = pad.left + (chartW / 4) * i;
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, h - pad.bottom); ctx.stroke();
  }

  const maxInv = Math.max(...dataset.rlInventory, ...dataset.twapInventory, ...dataset.vwapInventory);
  const xScale = (idx) => pad.left + (idx / (dataset.labels.length - 1)) * chartW;
  const yScale = (val) => pad.top + chartH - ((val / maxInv) * chartH);

  // VWAP
  ctx.beginPath(); ctx.strokeStyle = vwapColor; ctx.lineWidth = 2; ctx.setLineDash([2, 2]);
  dataset.vwapInventory.forEach((val, idx) => { const x = xScale(idx); const y = yScale(val); idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke(); ctx.setLineDash([]);

  // TWAP
  ctx.beginPath(); ctx.strokeStyle = twapColor; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  dataset.twapInventory.forEach((val, idx) => { const x = xScale(idx); const y = yScale(val); idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke(); ctx.setLineDash([]);

  // RL Policy
  ctx.beginPath(); ctx.strokeStyle = rlColor; ctx.lineWidth = 3; ctx.shadowColor = rlColor; ctx.shadowBlur = 6;
  dataset.rlInventory.forEach((val, idx) => { const x = xScale(idx); const y = yScale(val); idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

  ctx.fillStyle = labelColor;
  for (let i = 0; i < dataset.labels.length; i++) { ctx.fillText(dataset.labels[i], xScale(i) - 4, h - 8); }
  for (let i = 0; i <= 4; i += 1) { ctx.fillText(String(Math.round((maxInv / 4) * i)), 10, pad.top + chartH - (chartH / 4) * i + 3); }
}

/* ============================================
   LIVE METRICS
   ============================================ */
function updateMetrics() {
  document.getElementById('inventoryMetric').textContent = 720 + Math.round(Math.random() * 50);
  document.getElementById('costMetric').textContent = '$' + new Intl.NumberFormat().format(Math.round(1020 + Math.random() * 80 - 10));
  document.getElementById('completionMetric').textContent = Math.round(73 + Math.random() * 16) + '%';
  document.getElementById('riskMetric').textContent = (12.0 + Math.random() * 4.5).toFixed(1);
}

function updateActionBars() {
  const p = Math.round(34 + Math.random() * 12), a = Math.round(18 + Math.random() * 10), m = Math.round(31 + Math.random() * 13), w = Math.round(9 + Math.random() * 8);
  const total = p + a + m + w;
  const bars = { passive: Math.round((p / total) * 100), aggressive: Math.round((a / total) * 100), market: Math.round((m / total) * 100), wait: Math.round((w / total) * 100) };
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
  const palette = [['market-dot', 'Market order routed'], ['passive-dot', 'Passive limit accepted'], ['aggressive-dot', 'Aggressive limit placed'], ['wait-dot', 'Order held for rebalancing']];
  const log = document.getElementById('actionLog');
  if (!log) return;
  const item = palette[Math.floor(Math.random() * palette.length)];
  const row = document.createElement('div');
  row.className = 'log-item';
  row.innerHTML = `<span class="log-dot ${item[0]}"></span><span class="log-text">${item[1]}</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;
  log.prepend(row);
  while (log.children.length > 4) log.removeChild(log.lastElementChild);
}

function updateChartMeaning(range) {
  const text = document.getElementById('chartMeaningText');
  if (!text) return;
  text.textContent = range === '7D'
    ? 'Inventory trajectory over a 7-day view. The policy adapts slower and uses portfolio-level smoothing for the execution path.'
    : 'Inventory falls as execution progresses. The RL line shows the policy\'s adaptive path; TWAP and VWAP are reference baselines.';
}

function strategyMode(mode) {
  const strategyMap = { TWAP: 'TWAP: Equal-volume slices across time with market routing.', VWAP: 'VWAP: Route volume proportionally to market pressure and liquidity depth.', NaiveLimit: 'Naive Limit: Passive resting order policy without inventory-aware tuning.' };
  const log = document.getElementById('actionLog');
  if (!log) return;
  const row = document.createElement('div');
  row.className = 'log-item';
  row.innerHTML = `<span class="log-dot passive-dot"></span><span class="log-text">Strategy changed to ${mode}: ${strategyMap[mode]}</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;
  log.prepend(row);
  while (log.children.length > 4) log.removeChild(log.lastElementChild);
  document.querySelectorAll('.strategy-button').forEach(btn => btn.classList.toggle('active-strategy', btn.dataset.strategy === mode));
}

/* ============================================
   VIEW SWITCHING (NEW)
   ============================================ */
function switchView(viewId) {
  document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });

  if (viewId === 'execution') drawChart();
}

/* ============================================
   POLICY LOG FILTERING (NEW)
   ============================================ */
function filterPolicyLog(filter) {
  const rows = document.querySelectorAll('#policyLogTable tbody tr');
  rows.forEach(row => {
    if (filter === 'all' || row.dataset.type === filter) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
  document.querySelectorAll('.log-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
}

/* ============================================
   INITIALIZATION
   ============================================ */
function initDashboard() {
  drawChart();
  updateMetrics();
  updateActionBars();
  updateLog();

  setInterval(drawChart, 1500);
  setInterval(updateMetrics, 1800);
  setInterval(updateActionBars, 1800);
  setInterval(updateLog, 2400);

  // Nav view switching
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  // Policy log filters
  document.querySelectorAll('.log-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => filterPolicyLog(btn.dataset.filter));
  });

  // Range buttons
  document.getElementById('range1d')?.addEventListener('click', () => {
    chartState.range = '1D';
    document.getElementById('range1d').classList.add('active-range');
    document.getElementById('range7d').classList.remove('active-range');
    updateChartMeaning('1D');
    drawChart();
  });

  document.getElementById('range7d')?.addEventListener('click', () => {
    chartState.range = '7D';
    document.getElementById('range7d').classList.add('active-range');
    document.getElementById('range1d').classList.remove('active-range');
    updateChartMeaning('7D');
    drawChart();
  });

  // Growth button
  document.getElementById('growthButton')?.addEventListener('click', () => {
    const log = document.getElementById('actionLog');
    if (!log) return;
    const row = document.createElement('div');
    row.className = 'log-item';
    row.innerHTML = `<span class="log-dot green-dot"></span><span class="log-text">Performance view: execution cost down 3.4% vs baseline</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;
    log.prepend(row);
    while (log.children.length > 4) log.removeChild(log.lastElementChild);
    updateMetrics();
    const chartText = document.getElementById('chartMeaningText');
    if (chartText) chartText.textContent = 'Performance view compares execution cost and slippage movement against the baseline policy.';
  });

  // Strategy buttons
  document.getElementById('twapButton')?.addEventListener('click', () => strategyMode('TWAP'));
  document.getElementById('vwapButton')?.addEventListener('click', () => strategyMode('VWAP'));
  document.getElementById('naiveButton')?.addEventListener('click', () => strategyMode('NaiveLimit'));

  // Run button
  document.getElementById('runButton')?.addEventListener('click', () => {
    const log = document.getElementById('actionLog');
    if (!log) return;
    const row = document.createElement('div');
    row.className = 'log-item';
    row.innerHTML = `<span class="log-dot market-dot"></span><span class="log-text">Simulation refreshed: benchmark cycle executed</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;
    log.prepend(row);
    while (log.children.length > 4) log.removeChild(log.lastElementChild);
    updateMetrics();
    updateActionBars();
    drawChart();
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);
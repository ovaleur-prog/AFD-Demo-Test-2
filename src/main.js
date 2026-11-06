import './style.css';
import '@fontsource-variable/inter';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Chart from 'chart.js/auto';
import { createIcons, Sun, Moon, LayoutDashboard, Zap, MapPin, Bell, TrendingUp, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight, Search, Download, Radio, CircleHelp, Layers, Maximize, X, Check, CheckCheck, AlertTriangle, Activity, Globe2, Leaf, Users, ArrowRight, ExternalLink, RefreshCw, Menu, SlidersHorizontal, Cable, ShieldCheck } from 'lucide';
import { sites, regions, initialAlerts, corridors, summarize, selectSites, generationSeries, forecastSeries } from './data.js';

const iconSet = { Sun, Moon, LayoutDashboard, Zap, MapPin, Bell, TrendingUp, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight, Search, Download, Radio, CircleHelp, Layers, Maximize, X, Check, CheckCheck, AlertTriangle, Activity, Globe2, Leaf, Users, ArrowRight, ExternalLink, RefreshCw, Menu, SlidersHorizontal, Cable, ShieldCheck };
const icon = (name, extra = '') => `<i data-lucide="${name}" ${extra}></i>`;
const icons = () => createIcons({ icons: iconSet, attrs: { 'stroke-width': 1.7 } });
const $ = selector => document.querySelector(selector);
const fmt = (value, digits = 0) => value.toLocaleString('en-US', { maximumFractionDigits: digits });
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const countryCount = new Set(sites.map(site => site.country)).size;
const state = { region: 'All regions', country: '', alertFilter: 'All', showResolved: false, theme: 'light', alerts: structuredClone(initialAlerts), corridors: true, siteStatus: 'All', search: '' };
let map, countries, siteLayer, corridorLayer, productionChart, forecastChart, toastTimer;
let storageWarning = '';

try {
  state.theme = localStorage.getItem('helios-theme') === 'dark' ? 'dark' : 'light';
  const saved = JSON.parse(localStorage.getItem('helios-resolved') || '[]');
  if (!Array.isArray(saved) || saved.some(id => typeof id !== 'string')) throw new Error('Invalid saved alert state');
  state.alerts.forEach(alert => { alert.resolved = saved.includes(alert.id); });
} catch (error) {
  console.error('Could not restore demo preferences:', error);
  storageWarning = 'Saved preferences could not be loaded. Using the default demo state.';
}
document.documentElement.dataset.theme = state.theme;

$('#app').innerHTML = `
  <a class="skip-link" href="#main">Skip to dashboard</a>
  <aside class="sidebar" aria-label="Main navigation">
    <a href="#overview" class="brand" aria-label="Helios home"><span class="brand-mark">${icon('sun')}</span><span>helios<span class="brand-period">.</span></span></a>
    <div class="workspace-label">ENERGY INTELLIGENCE</div>
    <div class="workspace"><span class="workspace-icon">${icon('globe-2')}</span><div><strong>Africa operations</strong><small>Pan-African portfolio</small></div><span class="workspace-dot"></span></div>
    <div class="nav-label">WORKSPACE</div>
    <nav>
      <a class="nav-item active" href="#overview">${icon('layout-dashboard')}<span>Overview</span></a>
      <a class="nav-item" href="#assets">${icon('map-pin')}<span>Solar assets</span><small>16</small></a>
      <a class="nav-item" href="#alerts">${icon('bell')}<span>Alert center</span><small class="nav-alert-count">4</small></a>
      <a class="nav-item" href="#trends">${icon('trending-up')}<span>Forecast & trends</span></a>
    </nav>
    <div class="sidebar-note"><span class="note-sun">${icon('sun')}</span><strong>A brighter energy future.</strong><p>One connected view of Africa’s solar potential.</p><div class="note-line"></div><span>${sites.length} sites · ${countryCount} countries</span></div>
    <div class="sidebar-bottom"><button id="about-btn">${icon('circle-help')}<span>About this demo</span>${icon('arrow-up-right')}</button><div class="operator"><div class="avatar">AO</div><div><strong>Africa Operations</strong><small>Grid operator · Demo</small></div><span class="operator-dot"></span></div></div>
  </aside>
  <div class="shell">
    <header class="topbar">
      <div class="breadcrumb"><button class="icon-button mobile-menu" id="menu-btn" aria-label="Toggle navigation">${icon('menu')}</button><span>Workspace</span>${icon('chevron-right')}<strong>Africa operations</strong></div>
      <div class="top-actions"><span class="demo-pill"><span></span>Demo feed</span><div class="top-divider"></div><button class="icon-button" id="theme-btn" aria-label="Switch to dark mode"></button><button class="icon-button notification-btn" id="notifications-btn" aria-label="Go to open alerts">${icon('bell')}<span class="notification-dot"></span></button><div class="avatar top-avatar">AO</div></div>
    </header>
    <main id="main">
      <section id="overview" class="scroll-section">
        <div class="page-heading"><div><div class="eyebrow"><span class="live-dot"></span>PAN-AFRICAN SOLAR NETWORK</div><h1>Energy overview<span class="title-dot">.</span></h1><p>Your grid, in focus. Monitor production. Act with confidence.</p></div><div class="heading-actions"><label class="region-select">${icon('globe-2')}<select id="region-filter" aria-label="Filter by region"><option>All regions</option>${regions.map(region => `<option>${region}</option>`).join('')}</select>${icon('chevron-down')}</label><button class="button export-button" id="export-btn">${icon('download')}<span>Export report</span></button></div></div>
        <div class="context-line"><div><span class="snapshot-label">${icon('radio')}<span>Simulated snapshot · 12:00 UTC</span></span><span class="context-separator">/</span><span>Illustrative operational data</span></div><button class="text-button hidden" id="clear-country"></button><button class="text-button" id="refresh-btn" title="Reload the simulated snapshot">${icon('refresh-cw')}<span>Refresh snapshot</span></button></div>
        <div class="kpi-grid" id="kpis"></div>
        <div id="anomaly-banner"></div>
        <div class="middle-grid">
          <section class="panel map-panel" id="network">
            <div class="panel-heading"><div><h2>Network at a glance <span class="mini-tag">AFRICA</span></h2><p>Connected sites. Continental perspective.</p></div><button class="icon-button" id="fit-map" aria-label="Reset map extent" title="Reset map extent">${icon('maximize')}</button></div>
            <div class="map-stage"><div id="africa-map" role="region" aria-label="Interactive vector map of Africa with solar sites and transmission corridors"></div><div class="map-overlay"><span class="map-live"><span class="live-dot"></span>SOLAR NETWORK</span><button id="corridors-btn" aria-pressed="true" title="Toggle transmission corridors">${icon('layers')}<span>Corridors</span></button></div><div class="map-geography">ATLANTIC<br>OCEAN</div><div class="map-geography indian">INDIAN<br>OCEAN</div><div id="map-error" class="map-error hidden" role="alert"></div></div>
            <div class="map-footer"><div class="map-legend"><span><b class="legend-dot healthy"></b>Healthy</span><span><b class="legend-dot warning"></b>Attention</span><span><b class="legend-dot offline"></b>Offline</span></div><span class="map-source">Natural Earth · No map tiles</span></div>
            <div class="corridor-legend">${corridors.map(c => `<span><b style="background:${c.color}"></b>${c.name}</span>`).join('')}<small>Illustrative transmission routes</small></div>
          </section>
          <section class="panel regional-panel"><div class="panel-heading"><div><h2>Regional production</h2><p>A shared grid. Different rhythms.</p></div><span class="unit-badge">MW</span></div><div id="regional-bars"></div><div class="region-insight">${icon('activity')}<div><strong id="region-insight-title"></strong><p id="region-insight-detail"></p></div></div><button class="panel-link" id="compare-regions">Explore all solar assets ${icon('arrow-right')}</button></section>
        </div>
      </section>
      <section class="charts-grid scroll-section" id="trends">
        <div class="panel production-panel"><div class="panel-heading"><div><h2>Daily generation</h2><p>Today’s output against the clear-sky baseline</p></div><span class="unit-badge">24 HOURS</span></div><div class="chart-summary"><strong id="generation-total"></strong><span>produced so far</span><div class="chart-legend"><span><b class="line-legend green"></b>Actual</span><span><b class="line-legend dashed"></b>Clear sky</span></div></div><div class="chart-container"><canvas id="production-chart" role="img" aria-label="24-hour simulated solar generation in MW versus clear-sky baseline"></canvas></div><div class="chart-foot"><span>${icon('sun')} Sunrise 06:00 · Sunset 19:00</span><span>Normalized UTC demo profile</span></div></div>
        <div class="panel forecast-panel"><div class="panel-heading"><div><h2>The week ahead</h2><p>7-day generation forecast</p></div><span class="forecast-tag">${icon('trending-up')}OUTLOOK</span></div><div class="chart-summary"><strong id="forecast-total"></strong><span>expected this week</span><span class="forecast-range">±12% range</span></div><div class="chart-container"><canvas id="forecast-chart" role="img" aria-label="Seven-day simulated generation forecast in GWh with uncertainty range"></canvas></div><div class="chart-foot"><span>Illustrative model · Not dispatch guidance</span><span id="forecast-date"></span></div></div>
      </section>
      <section class="panel alert-panel scroll-section" id="alerts"><div class="panel-heading"><div><h2>Operational alert center <span class="count-badge" id="alert-count"></span></h2><p>Know what needs attention. Keep the network moving.</p></div><label class="resolved-toggle"><input type="checkbox" id="show-resolved" />Show resolved</label></div><div class="alert-toolbar"><div class="filter-tabs" role="group" aria-label="Filter alerts by category">${['All', 'Equipment', 'Anomaly', 'Outage'].map((category, index) => `<button data-category="${category}" class="${index === 0 ? 'active' : ''}" aria-pressed="${index === 0}">${category}<span id="category-count-${category}"></span></button>`).join('')}</div><span class="sla-note">${icon('shield-check')} Detection SLA &lt;30s</span></div><div class="table-scroll"><table class="alert-table"><thead><tr><th>Alert / asset</th><th>Category</th><th>Detected</th><th>Status</th><th class="text-right">Action</th></tr></thead><tbody id="alert-rows"></tbody></table></div><div class="alert-footer"><span id="alert-footer-count"></span><span>${icon('check-check')} Resolutions saved on this device</span></div></section>
      <section class="panel asset-panel scroll-section" id="assets"><div class="panel-heading"><div><h2>Solar asset directory <span class="count-badge" id="asset-count"></span></h2><p>Real locations. Simulated telemetry. One operational view.</p></div><label class="search-box">${icon('search')}<input id="asset-search" type="search" placeholder="Find a site or country…" aria-label="Search solar assets" /></label></div><div class="asset-toolbar"><label>Status <select id="site-status"><option>All</option><option>Healthy</option><option>Attention</option><option>Offline</option></select></label><span>Select an asset to inspect its telemetry</span></div><div class="table-scroll"><table class="asset-table"><thead><tr><th>Solar site</th><th>Region</th><th>Output / capacity</th><th>Irradiance</th><th>Health</th><th>Status</th><th></th></tr></thead><tbody id="asset-rows"></tbody></table></div></section>
      <div class="impact-strip"><div class="impact-intro"><span>${icon('leaf')}</span><div><strong>Energy with impact</strong><p>Next-day modeled potential</p></div></div><div><strong id="impact-carbon"></strong><span>tonnes of CO₂ avoided</span></div><div><strong id="impact-homes"></strong><span>household-days powered</span></div><span class="impact-note">Estimates · 0.4 t CO₂/MWh<br>5 kWh per household-day</span></div>
      <footer class="page-footer"><span><b>helios.</b> Built for a brighter Africa.</span><span>V1 demo · No operational connection <span class="footer-dot">·</span> Snapshot 12:00 UTC</span></footer>
    </main>
  </div>
  <dialog id="detail-dialog" aria-labelledby="dialog-title"><div id="dialog-content"></div></dialog>
  <div id="toast" class="toast hidden" role="status" aria-live="polite"></div>
`;

function notify(message, isError = false) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.toggle('error', isError);
  $('#toast').classList.remove('hidden');
  toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), 5500);
}

function persist(key, value) {
  try { localStorage.setItem(key, value); }
  catch (error) {
    console.error(`Could not save ${key}:`, error);
    notify('Changes apply for this session, but could not be saved on this device.', true);
    return false;
  }
  return true;
}

function scopedSites() { return selectSites(state.region, state.country); }
function scopedAlerts() {
  const ids = new Set(scopedSites().map(site => site.id));
  return state.alerts.filter(alert => ids.has(alert.siteId));
}
const statusLabel = status => ({ healthy: 'Healthy', warning: 'Attention', offline: 'Offline' }[status]);
const statusPill = status => `<span class="status-pill ${status}"><b></b>${statusLabel(status)}</span>`;

function renderKpis() {
  const metrics = summarize(scopedSites(), state.alerts);
  const availability = metrics.total ? metrics.active / metrics.total * 100 : 0;
  const cards = [
    { label: 'Total production', value: fmt(metrics.output, 1), unit: 'MW', icon: 'zap', className: 'solar', note: `${fmt(metrics.capacity)} MW installed capacity`, footer: `${metrics.capacity ? fmt(metrics.output / metrics.capacity * 100, 1) : '0'}% capacity utilization`, trend: 'sun' },
    { label: 'Active solar sites', value: metrics.active, unit: `/ ${metrics.total}`, icon: 'map-pin', className: 'green', note: state.country || (state.region === 'All regions' ? `Across ${countryCount} African countries` : state.region), footer: `${metrics.total - metrics.active} offline · ${scopedSites().filter(s => s.status === 'warning').length} need attention`, trend: 'activity' },
    { label: 'Network SLA', value: metrics.total ? '99.94' : '—', unit: metrics.total ? '%' : '', icon: 'shield-check', className: 'blue', note: 'Simulated 30-day transport uptime', footer: metrics.total ? `Above 99.9% SLA · ${fmt(availability, 1)}% sites online` : 'No assets in this selection', trend: 'check' },
    { label: 'Open alerts', value: metrics.openAlerts, unit: '', icon: 'bell', className: 'amber', note: `${scopedAlerts().filter(a => !a.resolved && a.severity === 'critical').length} critical · action recommended`, footer: 'Detection within 8–12 seconds', trend: 'radio' },
  ];
  $('#kpis').innerHTML = cards.map(card => `<article class="kpi-card"><div class="kpi-top"><span>${card.label}</span><span class="kpi-icon ${card.className}">${icon(card.icon)}</span></div><div class="kpi-value">${card.value}<span>${card.unit}</span></div><p>${card.note}</p><div class="kpi-bottom ${card.className}">${icon(card.trend)}<span>${card.footer}</span></div></article>`).join('');
  const anomaly = scopedAlerts().find(alert => !alert.resolved && alert.category === 'Anomaly');
  $('#anomaly-banner').innerHTML = anomaly
    ? `<div class="anomaly-banner"><div class="anomaly-icon">${icon('activity')}</div><div class="anomaly-copy"><strong>Anomaly detected <span class="banner-separator">/</span> ${sites.find(s => s.id === anomaly.siteId).name}</strong><p>Output 48.7% below baseline. Stable irradiance suggests an equipment issue.</p></div><span class="detection-time">${icon('zap')}Detected in ${anomaly.latency}s <small>within 30s SLA</small></span><button class="button anomaly-action" data-alert="${anomaly.id}">Investigate ${icon('arrow-right')}</button></div>`
    : `<div class="clear-banner">${icon('shield-check')}<strong>No open production anomalies in this view.</strong><span>Equipment and outage alerts remain available below.</span></div>`;
  $('.nav-alert-count').textContent = state.alerts.filter(a => !a.resolved).length;
  $('.notification-dot').classList.toggle('hidden', !state.alerts.some(a => !a.resolved));
  $('#clear-country').classList.toggle('hidden', !state.country);
  $('#clear-country').innerHTML = state.country ? `${escapeHtml(state.country)} ${icon('x')}` : '';
}

function renderRegions() {
  const selection = scopedSites();
  const rows = regions.map(region => {
    const list = selection.filter(s => s.region === region);
    return { region, ...summarize(list, state.alerts), warning: list.some(s => s.status !== 'healthy') };
  });
  const max = Math.max(1, ...rows.map(row => row.output));
  $('#regional-bars').innerHTML = rows.map((row, index) => `<button class="regional-row ${state.region === row.region ? 'selected' : ''}" data-region="${row.region}" aria-label="Filter to ${row.region}, ${fmt(row.output, 1)} MW"><div class="regional-row-head"><span><b class="region-number">0${index + 1}</b>${row.region}${row.warning ? '<b class="attention-dot" title="Asset needs attention"></b>' : ''}</span><strong>${fmt(row.output, 1)}<small>MW</small></strong></div><div class="bar-track"><span style="width:${row.output / max * 100}%" class="${row.warning ? 'has-warning' : ''}"></span></div><div class="regional-row-foot"><span>${row.active}/${row.total} sites online</span><span>${row.capacity ? fmt(row.output / row.capacity * 100, 1) : '0'}% utilization</span></div></button>`).join('');
  const underperforming = rows.filter(row => row.total).sort((a, b) => a.output / a.capacity - b.output / b.capacity)[0];
  $('#region-insight-title').textContent = underperforming ? `${underperforming.region} in focus` : 'No assets in this country';
  $('#region-insight-detail').textContent = underperforming ? `${fmt(underperforming.output / underperforming.capacity * 100, 1)}% utilization${underperforming.warning ? ' · Review flagged assets for potential recovery.' : ' · All monitored assets are healthy.'}` : 'Select another country or reset the map to view the demo portfolio.';
}

function renderAlerts() {
  const alerts = scopedAlerts();
  const open = alerts.filter(a => !a.resolved);
  $('#alert-count').textContent = open.length;
  for (const category of ['All', 'Equipment', 'Anomaly', 'Outage']) {
    $(`#category-count-${category}`).textContent = open.filter(a => category === 'All' || a.category === category).length;
  }
  const visible = alerts.filter(a => (state.showResolved || !a.resolved) && (state.alertFilter === 'All' || a.category === state.alertFilter));
  $('#alert-rows').innerHTML = visible.length ? visible.map(alert => {
    const site = sites.find(s => s.id === alert.siteId);
    return `<tr><td><button class="alert-title" data-alert="${alert.id}"><span class="severity-symbol ${alert.resolved ? 'resolved' : alert.severity}">${icon(alert.resolved ? 'check' : 'alert-triangle')}</span><span><strong>${alert.title}</strong><small>${site.name} <b>·</b> ${site.country}</small></span></button></td><td><span class="category-pill">${alert.category}</span></td><td><span class="detected-age">${alert.age}</span><small class="table-secondary">${alert.detected} UTC · ${alert.latency}s detection</small></td><td><span class="severity-pill ${alert.resolved ? 'resolved' : alert.severity}">${alert.resolved ? 'Resolved' : alert.severity === 'critical' ? 'Critical' : 'Warning'}</span></td><td class="text-right">${alert.resolved ? `<span class="resolved-check">${icon('check-check')}Logged</span>` : `<button class="resolve-button" data-resolve="${alert.id}" aria-label="Resolve ${alert.title} at ${site.name}">${icon('check')}Resolve</button>`}</td></tr>`;
  }).join('') : `<tr><td colspan="5"><div class="empty-state">${icon('check-check')}<strong>No ${state.showResolved ? 'matching' : 'open'} alerts</strong><span>${state.alertFilter === 'All' ? 'This selection is clear.' : 'Try another category or enable “Show resolved”.'}</span></div></td></tr>`;
  $('#alert-footer-count').textContent = `${visible.length} ${visible.length === 1 ? 'alert' : 'alerts'} shown · ${open.length} open in this view`;
  document.querySelectorAll('[data-category]').forEach(button => {
    const active = button.dataset.category === state.alertFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function renderAssets() {
  const filtered = scopedSites().filter(site => (state.siteStatus === 'All' || statusLabel(site.status) === state.siteStatus) && `${site.name} ${site.country}`.toLowerCase().includes(state.search.toLowerCase()));
  $('#asset-count').textContent = filtered.length;
  $('#asset-rows').innerHTML = filtered.length ? filtered.map(site => `<tr><td><button class="asset-title" data-site="${site.id}"><span class="asset-sun">${icon('sun')}</span><span><strong>${site.name}</strong><small>${site.country}</small></span></button></td><td>${site.region}</td><td><strong>${fmt(site.output, 1)} <small>MW</small></strong><small class="table-secondary">of ${fmt(site.capacity, 1)} MW</small></td><td>${fmt(site.irradiance)} <small>W/m²</small></td><td><span class="health-cell"><span class="health-track"><b style="width:${site.health}%" class="${site.status}"></b></span>${site.health}%</span></td><td>${statusPill(site.status)}</td><td><button class="icon-button" data-site="${site.id}" aria-label="Inspect ${site.name}">${icon('arrow-up-right')}</button></td></tr>`).join('') : '<tr><td colspan="7"><div class="empty-state"><strong>No matching solar assets</strong><span>Clear your search or change the region, country or status filter.</span></div></td></tr>';
}

function chartColors() {
  const dark = state.theme === 'dark';
  return { text: dark ? '#94a3b8' : '#839094', grid: dark ? '#293442' : '#edf0f1', green: dark ? '#8fd19b' : '#58a56c', baseline: dark ? '#8090a4' : '#bbc3c7', yellow: '#e8c33b' };
}
function chartOptions(unit) {
  const colors = chartColors();
  return {
    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#172d2a', padding: 12, cornerRadius: 8, callbacks: { label: context => `${context.dataset.label}: ${fmt(context.parsed.y, 2)} ${unit}` } } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: colors.text, font: { size: 10 }, maxRotation: 0 } },
      y: { beginAtZero: true, border: { display: false }, grid: { color: colors.grid, drawTicks: false }, ticks: { color: colors.text, padding: 12, maxTicksLimit: 5, font: { size: 10 }, callback: value => fmt(value) }, title: { display: true, text: unit, color: colors.text, align: 'end', font: { size: 10 } } },
    },
  };
}
function renderCharts() {
  const selection = scopedSites();
  const daily = generationSeries(selection);
  const forecast = forecastSeries(selection);
  const colors = chartColors();
  productionChart?.destroy();
  forecastChart?.destroy();
  const options = chartOptions('MW');
  options.scales.x.ticks.callback = (_, index) => index % 3 === 0 ? `${String(index).padStart(2, '0')}:00` : '';
  productionChart = new Chart($('#production-chart'), {
    type: 'line',
    data: { labels: Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`), datasets: [
      { label: 'Actual', data: daily.actual, borderColor: colors.green, backgroundColor: state.theme === 'dark' ? '#8fd19b18' : '#73c66e18', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2.5 },
      { label: 'Clear sky', data: daily.baseline, borderColor: colors.baseline, borderDash: [5, 5], tension: 0.4, pointRadius: 0, borderWidth: 1.8 },
    ] }, options,
  });
  const start = new Date();
  start.setUTCHours(12, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, index) => new Date(start.getTime() + (index + 1) * 86400000));
  forecastChart = new Chart($('#forecast-chart'), {
    type: 'line',
    data: { labels: days.map(day => day.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })), datasets: [
      { label: 'Lower estimate', data: forecast.map(n => +(n * 0.88).toFixed(2)), borderWidth: 0, pointRadius: 0, tension: 0.35, backgroundColor: 'transparent' },
      { label: 'Upper estimate', data: forecast.map(n => +(n * 1.12).toFixed(2)), borderWidth: 0, pointRadius: 0, tension: 0.35, backgroundColor: '#e8c33b20', fill: '-1' },
      { label: 'Forecast', data: forecast, borderColor: colors.yellow, backgroundColor: colors.yellow, pointBackgroundColor: colors.yellow, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5, tension: 0.35 },
    ] }, options: chartOptions('GWh'),
  });
  const produced = daily.actual.reduce((sum, value, index, series) => index ? sum + ((value ?? 0) + (series[index - 1] ?? 0)) / 2 * (value === null ? 0 : 1) : sum, 0) / 1000;
  $('#generation-total').textContent = `${fmt(produced, 2)} GWh`;
  $('#forecast-total').textContent = `${fmt(forecast.reduce((a, b) => a + b, 0), 1)} GWh`;
  $('#forecast-date').textContent = `${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} – ${days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`;
  $('#impact-carbon').textContent = fmt(forecast[0] * 1000 * 0.4);
  $('#impact-homes').textContent = fmt(forecast[0] * 1000000 / 5);
}

function countryStyle(feature) {
  const selected = feature.properties.name === state.country;
  const hasSite = scopedSites().some(site => site.country === feature.properties.name);
  const dark = state.theme === 'dark';
  return { color: dark ? '#3e5050' : '#bccdc7', weight: selected ? 2 : 0.7, fillColor: selected ? '#f9d648' : hasSite ? dark ? '#354d42' : '#d8e4d5' : dark ? '#253837' : '#e6ece6', fillOpacity: selected ? 0.75 : 1 };
}
function popupMarkup(site) {
  return `<div class="site-popup"><span class="popup-eyebrow">SOLAR SUBSTATION · DEMO</span><h3>${site.name}</h3><p>${site.country} · ${site.region}</p>${statusPill(site.status)}<div class="popup-metrics"><div><span>Output</span><strong>${fmt(site.output, 1)} <small>MW</small></strong></div><div><span>Irradiance</span><strong>${site.irradiance} <small>W/m²</small></strong></div><div><span>Asset health</span><strong>${site.health}<small>%</small></strong></div><div><span>Capacity</span><strong>${fmt(site.capacity, 1)} <small>MW</small></strong></div></div><button data-site="${site.id}" class="popup-button">Inspect solar asset <span>↗</span></button></div>`;
}
function renderMapSites() {
  if (!map) return;
  countries?.setStyle(countryStyle);
  siteLayer.clearLayers();
  scopedSites().forEach(site => {
    const marker = L.marker([site.lat, site.lng], {
      icon: L.divIcon({ className: 'solar-marker-wrapper', html: `<span class="solar-marker ${site.status}"><span></span></span>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
      title: `${site.name} · ${statusLabel(site.status)}`, alt: `${site.name} solar substation`,
    }).bindPopup(popupMarkup(site), { maxWidth: 300, minWidth: 260 }).addTo(siteLayer);
    marker.on('popupopen', () => icons());
  });
}
async function initMap() {
  map = L.map('africa-map', { zoomControl: false, attributionControl: false, minZoom: 2, maxZoom: 8, zoomSnap: 0.25, zoomDelta: 0.5, scrollWheelZoom: false, maxBounds: [[-60, -65], [60, 90]], maxBoundsViscosity: 0.7 });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  map.fitBounds([[-35, -18], [37, 51]], { padding: [16, 16] });
  map.createPane('corridors');
  map.getPane('corridors').style.zIndex = 450;
  corridorLayer = L.layerGroup().addTo(map);
  siteLayer = L.layerGroup().addTo(map);
  corridors.forEach(corridor => {
    L.polyline(corridor.points, { pane: 'corridors', color: corridor.color, weight: 2, opacity: 0.85, dashArray: '5 6' }).bindTooltip(`${corridor.name} · ${corridor.fullName}<br>Illustrative route, not an engineering alignment`, { sticky: true }).addTo(corridorLayer);
  });
  renderMapSites();
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/africa.geojson`);
    if (!response.ok) throw new Error(`Geometry request failed (${response.status})`);
    const geometry = await response.json();
    if (geometry.type !== 'FeatureCollection' || !geometry.features?.length) throw new Error('Invalid Africa geometry');
    countries = L.geoJSON(geometry, {
      style: countryStyle,
      onEachFeature(feature, layer) {
        layer.bindTooltip(escapeHtml(feature.properties.name), { sticky: true, className: 'country-tooltip' });
        layer.on({
          mouseover: () => layer.setStyle({ fillOpacity: 0.8, weight: 1.5 }),
          mouseout: () => layer.setStyle(countryStyle(feature)),
          click: () => {
            state.country = feature.properties.name;
            state.region = 'All regions';
            $('#region-filter').value = state.region;
            renderDashboard();
            map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 5 });
            notify(`${state.country} selected · ${scopedSites().length} demo assets`);
          },
        });
      },
    }).addTo(map);
    countries.bringToBack();
  } catch (error) {
    console.error('Map initialization failed:', error);
    $('#map-error').classList.remove('hidden');
    $('#map-error').innerHTML = '<strong>Country boundaries could not load.</strong><span>Solar telemetry is still available. Reload to retry.</span>';
    notify('Africa map geometry could not load. Please reload the page.', true);
  }
}

function renderDashboard() {
  renderKpis();
  renderRegions();
  renderAlerts();
  renderAssets();
  renderCharts();
  renderMapSites();
  icons();
}
function setRegion(region) {
  state.region = region;
  state.country = '';
  $('#region-filter').value = region;
  renderDashboard();
  const selection = scopedSites();
  if (map && region !== 'All regions' && selection.length) map.fitBounds(L.latLngBounds(selection.map(s => [s.lat, s.lng])), { padding: [50, 50], maxZoom: 4 });
  else resetMapExtent();
}
function resetMapExtent() { map?.fitBounds([[-35, -18], [37, 51]], { padding: [16, 16] }); }

function showDialog(markup) {
  $('#dialog-content').innerHTML = `<button class="dialog-close icon-button" id="close-dialog" aria-label="Close details">${icon('x')}</button>${markup}`;
  icons();
  if (!$('#detail-dialog').open) $('#detail-dialog').showModal();
}
function alertDialog(id) {
  const alert = state.alerts.find(item => item.id === id);
  const site = sites.find(item => item.id === alert.siteId);
  showDialog(`<span class="dialog-eyebrow">${alert.id} · ${alert.category.toUpperCase()}</span><div class="dialog-heading"><span class="severity-symbol ${alert.resolved ? 'resolved' : alert.severity}">${icon(alert.resolved ? 'check' : 'alert-triangle')}</span><h2 id="dialog-title">${alert.title}</h2></div><p class="dialog-subtitle">${site.name} · ${site.country}</p><div class="dialog-sla">${icon('zap')}Detected in <strong>${alert.latency} seconds</strong><span>30-second operator SLA met</span></div><p class="dialog-description">${alert.detail}</p><div class="dialog-metrics"><div><span>Current output</span><strong>${fmt(site.output, 1)}<small> MW</small></strong></div><div><span>Irradiance</span><strong>${site.irradiance}<small> W/m²</small></strong></div><div><span>Asset health</span><strong>${site.health}<small>%</small></strong></div></div><div class="dialog-note">${icon('circle-help')}Resolving logs an operator action in this demo. It does not restore equipment or change telemetry.</div><div class="dialog-actions"><button class="button" data-locate="${site.id}">${icon('map-pin')}Locate on map</button>${alert.resolved ? '<span class="severity-pill resolved">Resolution logged</span>' : `<button class="button primary-button" data-confirm-resolve="${alert.id}">${icon('check-check')}Confirm resolution</button>`}</div>`);
}
function siteDialog(id) {
  const site = sites.find(item => item.id === id);
  const alerts = state.alerts.filter(alert => alert.siteId === id && !alert.resolved);
  showDialog(`<span class="dialog-eyebrow">SOLAR ASSET · ${site.technology.toUpperCase()}</span><h2 id="dialog-title">${site.name}</h2><p class="dialog-subtitle">${site.country} · ${site.region}</p>${statusPill(site.status)}<div class="dialog-metrics"><div><span>Current output</span><strong>${fmt(site.output, 1)}<small> MW</small></strong></div><div><span>Irradiance</span><strong>${site.irradiance}<small> W/m²</small></strong></div><div><span>Asset health</span><strong>${site.health}<small>%</small></strong></div></div><div class="site-detail-list"><div><span>Installed capacity</span><strong>${fmt(site.capacity, 1)} MW</strong></div><div><span>Capacity utilization</span><strong>${fmt(site.output / site.capacity * 100, 1)}%</strong></div><div><span>Coordinates</span><strong>${site.lat.toFixed(2)}, ${site.lng.toFixed(2)}</strong></div><div><span>Telemetry timestamp</span><strong>12:00 UTC · simulated</strong></div></div>${alerts.length ? `<div class="site-alert-links">${alerts.map(alert => `<button data-alert="${alert.id}">${icon('alert-triangle')}${alert.title}${icon('arrow-right')}</button>`).join('')}</div>` : '<div class="dialog-note">No open alerts for this solar asset.</div>'}<div class="dialog-actions"><span class="table-secondary">Illustrative data · Not for dispatch</span><button class="button primary-button" data-locate="${site.id}">${icon('map-pin')}Locate on map</button></div>`);
}
function locateSite(id) {
  const site = sites.find(item => item.id === id);
  if (!map) { notify('Map is not ready. Try again shortly.', true); return; }
  $('#detail-dialog').close();
  if (!scopedSites().some(item => item.id === id)) setRegion('All regions');
  $('#network').scrollIntoView({ behavior: 'smooth', block: 'center' });
  map.setView([site.lat, site.lng], 5, { animate: false });
  siteLayer.eachLayer(marker => { if (marker.options.title.startsWith(`${site.name} ·`)) marker.openPopup(); });
}
function resolveAlert(id) {
  const alert = state.alerts.find(item => item.id === id);
  alert.resolved = true;
  const saved = persist('helios-resolved', JSON.stringify(state.alerts.filter(item => item.resolved).map(item => item.id)));
  renderKpis();
  renderAlerts();
  icons();
  if ($('#detail-dialog').open) alertDialog(id);
  if (saved) notify(`${id} resolved. Operator action saved; asset telemetry is unchanged.`);
}

function exportReport() {
  const selected = scopedSites();
  const rows = [
    ['Helios V1 — SIMULATED operational report'],
    ['Snapshot', '12:00 UTC', 'Region', state.region, 'Country', state.country || 'All'],
    ['Site', 'Country', 'Region', 'Output MW', 'Capacity MW', 'Irradiance W/m²', 'Health %', 'Status', 'Open alerts'],
    ...selected.map(site => [site.name, site.country, site.region, site.output, site.capacity, site.irradiance, site.health, statusLabel(site.status), state.alerts.filter(a => !a.resolved && a.siteId === site.id).length]),
    [],
    ['Alert ID', 'Site', 'Category', 'Severity', 'Title', 'Detected UTC', 'Detection seconds', 'Resolution status'],
    ...scopedAlerts().map(alert => [alert.id, sites.find(site => site.id === alert.siteId).name, alert.category, alert.severity, alert.title, alert.detected, alert.latency, alert.resolved ? 'Resolved' : 'Open']),
  ];
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'helios-africa-simulated-report.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify(`Report exported · ${selected.length} assets in the current region/country selection.`);
}

function renderThemeButton() {
  $('#theme-btn').innerHTML = icon(state.theme === 'light' ? 'moon' : 'sun');
  $('#theme-btn').setAttribute('aria-label', `Switch to ${state.theme === 'light' ? 'dark' : 'light'} mode`);
  icons();
}
$('#theme-btn').addEventListener('click', () => {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = state.theme;
  persist('helios-theme', state.theme);
  renderThemeButton();
  renderCharts();
  countries?.setStyle(countryStyle);
});
$('#region-filter').addEventListener('change', event => setRegion(event.target.value));
$('#clear-country').addEventListener('click', () => setRegion('All regions'));
$('#fit-map').addEventListener('click', () => setRegion('All regions'));
$('#corridors-btn').addEventListener('click', () => {
  if (!map) { notify('Map is not ready yet.', true); return; }
  state.corridors = !state.corridors;
  if (state.corridors) corridorLayer.addTo(map); else map.removeLayer(corridorLayer);
  $('#corridors-btn').setAttribute('aria-pressed', String(state.corridors));
  $('.corridor-legend').classList.toggle('muted', !state.corridors);
});
$('#show-resolved').addEventListener('change', event => { state.showResolved = event.target.checked; renderAlerts(); icons(); });
$('#asset-search').addEventListener('input', event => { state.search = event.target.value; renderAssets(); icons(); });
$('#site-status').addEventListener('change', event => { state.siteStatus = event.target.value; renderAssets(); icons(); });
$('#export-btn').addEventListener('click', exportReport);
$('#compare-regions').addEventListener('click', () => $('#assets').scrollIntoView({ behavior: 'smooth' }));
$('#notifications-btn').addEventListener('click', () => $('#alerts').scrollIntoView({ behavior: 'smooth' }));
$('#refresh-btn').addEventListener('click', () => {
  renderDashboard();
  notify('Simulated 12:00 UTC snapshot reloaded. This demo is not connected to live operations.');
});
$('#menu-btn').addEventListener('click', () => {
  const open = $('.sidebar').classList.toggle('mobile-open');
  $('#menu-btn').setAttribute('aria-expanded', String(open));
});
$('#about-btn').addEventListener('click', () => showDialog(`<span class="dialog-eyebrow">HELIOS · V1 DEMO</span><h2 id="dialog-title">A connected view of Africa.</h2><p class="dialog-description">Helios brings solar generation, equipment health, regional comparisons and operator alerts into one workspace.</p><div class="site-detail-list"><div><span>Portfolio</span><strong>${sites.length} sites · ${countryCount} countries</strong></div><div><span>Data source</span><strong>Simulated 12:00 UTC snapshot</strong></div><div><span>Map geometry</span><strong>Natural Earth, public domain</strong></div><div><span>Libraries</span><strong>Tailwind · Leaflet · Chart.js · Lucide</strong></div></div><div class="dialog-note">Country outlines are cartographic context, not a statement on disputed boundaries. Corridor routes are illustrative. Site capacities and outputs are not certified operational records. Forecasts are synthetic, normalized UTC profiles—not a meteorological service.</div><p class="dialog-description">Dark mode and alert resolutions persist on this device. Resolving an alert records an operator action only. Export a CSV to inspect the current portfolio and alerts.</p>`));
document.addEventListener('click', event => {
  const target = event.target.closest('button, a.nav-item');
  if (!target) return;
  if (target.dataset.alert) alertDialog(target.dataset.alert);
  if (target.dataset.site) siteDialog(target.dataset.site);
  if (target.dataset.resolve) alertDialog(target.dataset.resolve);
  if (target.dataset.confirmResolve) resolveAlert(target.dataset.confirmResolve);
  if (target.dataset.locate) locateSite(target.dataset.locate);
  if (target.dataset.region) setRegion(target.dataset.region);
  if (target.dataset.category) { state.alertFilter = target.dataset.category; renderAlerts(); icons(); }
  if (target.id === 'close-dialog') $('#detail-dialog').close();
  if (target.classList.contains('nav-item')) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item === target));
    $('.sidebar').classList.remove('mobile-open');
    $('#menu-btn').setAttribute('aria-expanded', 'false');
  }
});
$('#detail-dialog').addEventListener('click', event => {
  if (event.target === $('#detail-dialog')) {
    const bounds = $('#detail-dialog').getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('#detail-dialog').close();
  }
});

renderDashboard();
renderThemeButton();
initMap();
if (storageWarning) notify(storageWarning, true);

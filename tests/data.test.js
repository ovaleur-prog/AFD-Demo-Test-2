import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sites, regions, initialAlerts, corridors, selectSites, summarize, generationSeries, forecastSeries } from '../src/data.js';

test('portfolio telemetry and regional totals are internally consistent', () => {
  assert.equal(sites.length, 16);
  assert.equal(new Set(sites.map(site => site.id)).size, sites.length);
  assert.equal(new Set(sites.map(site => site.country)).size, 15);
  for (const site of sites) {
    assert.ok(regions.includes(site.region));
    assert.ok(site.capacity > 0 && site.output >= 0 && site.output <= site.capacity);
    assert.ok(site.irradiance >= 0 && site.irradiance <= 1200);
    assert.ok(site.health >= 0 && site.health <= 100);
    assert.ok(['healthy', 'warning', 'offline'].includes(site.status));
    if (site.status === 'offline') assert.equal(site.output, 0);
  }
  const all = summarize(sites, initialAlerts);
  assert.equal(all.active, 15);
  assert.equal(all.openAlerts, 4);
  const total = regions.reduce((sum, region) => sum + summarize(selectSites(region), initialAlerts).output, 0);
  assert.ok(Math.abs(total - all.output) < 0.000001);
});

test('region, country and empty filters scope production and alerts', () => {
  const west = selectSites('West Africa');
  assert.equal(west.length, 4);
  assert.equal(summarize(west, initialAlerts).openAlerts, 2);
  assert.equal(selectSites('All regions', 'South Africa').length, 2);
  assert.equal(selectSites('West Africa', 'Egypt').length, 0);
  assert.equal(selectSites('All regions', 'Algeria').length, 0);
  assert.deepEqual(summarize([], initialAlerts), { output: 0, capacity: 0, active: 0, total: 0, openAlerts: 0 });
});

test('operator resolves alerts without silently restoring physical assets', () => {
  const alerts = structuredClone(initialAlerts);
  alerts.find(alert => alert.siteId === 'kinshasa').resolved = true;
  const summary = summarize(sites, alerts);
  assert.equal(summary.openAlerts, 3);
  assert.equal(summary.active, 15);
  assert.equal(sites.find(site => site.id === 'kinshasa').output, 0);
});

test('anomaly detection meets the exact sub-30s SLA and baseline drop', () => {
  for (const alert of initialAlerts) {
    assert.ok(sites.some(site => site.id === alert.siteId));
    assert.ok(alert.latency > 0 && alert.latency < 30);
  }
  const zagtouli = sites.find(site => site.id === 'zagtouli');
  const expected = zagtouli.capacity * 0.78;
  assert.equal(Math.round((1 - zagtouli.output / expected) * 1000) / 10, 48.7);
});

test('24-hour diurnal profile is dark at night and stops actual readings at noon', () => {
  const series = generationSeries(sites);
  assert.equal(series.baseline.length, 24);
  assert.equal(series.actual.length, 24);
  assert.equal(series.actual[12], +summarize(sites, []).output.toFixed(1));
  for (let hour = 0; hour < 24; hour++) {
    if (hour <= 6 || hour >= 19) assert.equal(series.baseline[hour], 0);
    if (hour > 12) assert.equal(series.actual[hour], null);
    else assert.ok(series.actual[hour] <= series.baseline[hour]);
  }
  assert.ok(series.baseline[12] > series.baseline[8]);
});

test('forecast always contains seven finite daily energy estimates and scopes to selection', () => {
  const forecast = forecastSeries(sites);
  assert.equal(forecast.length, 7);
  assert.ok(forecast.every(value => Number.isFinite(value) && value > 0));
  assert.ok(forecastSeries(selectSites('West Africa'))[0] < forecast[0]);
  assert.deepEqual(forecastSeries([]), [0, 0, 0, 0, 0, 0, 0]);
});

test('real bundled Africa GeoJSON covers the portfolio and island nations', async () => {
  const geometry = JSON.parse(await readFile(new URL('../public/data/africa.geojson', import.meta.url), 'utf8'));
  assert.equal(geometry.type, 'FeatureCollection');
  assert.ok(geometry.features.length >= 50);
  const names = new Set(geometry.features.map(feature => feature.properties.name));
  for (const country of new Set(sites.map(site => site.country))) assert.ok(names.has(country), `Missing ${country}`);
  for (const country of ['Madagascar', 'Seychelles', 'Mauritius', 'Comoros']) assert.ok(names.has(country), `Missing ${country}`);
  for (const feature of geometry.features) {
    assert.ok(['Polygon', 'MultiPolygon'].includes(feature.geometry.type));
    assert.ok(feature.geometry.coordinates.length);
  }
});

test('all required power pools have plausible interactive route geometry', () => {
  assert.deepEqual(corridors.map(corridor => corridor.name), ['WAPP', 'EAPP', 'SAPP']);
  for (const corridor of corridors) {
    assert.ok(corridor.points.length > 3);
    assert.ok(corridor.points.every(([lat, lng]) => lat >= -36 && lat <= 38 && lng >= -26 && lng <= 56));
  }
});

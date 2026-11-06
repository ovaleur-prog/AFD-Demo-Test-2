export const regions = ['North Africa', 'West Africa', 'East Africa', 'Southern Africa', 'Central Africa'];

// Locations and capacities are illustrative; telemetry is entirely simulated.
export const sites = [
  { id: 'noor', name: 'Noor Ouarzazate', country: 'Morocco', region: 'North Africa', lat: 31.06, lng: -6.87, capacity: 580, output: 452, irradiance: 936, health: 98, status: 'healthy', technology: 'Solar complex' },
  { id: 'benban', name: 'Benban Solar Park', country: 'Egypt', region: 'North Africa', lat: 24.46, lng: 32.74, capacity: 1650, output: 1287, irradiance: 952, health: 99, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'toujounine', name: 'Toujounine', country: 'Mauritania', region: 'West Africa', lat: 18.12, lng: -15.88, capacity: 50, output: 39, irradiance: 902, health: 97, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'boke', name: 'Boké Solar Hub', country: 'Guinea', region: 'West Africa', lat: 10.94, lng: -14.3, capacity: 80, output: 58, irradiance: 864, health: 96, status: 'healthy', technology: 'Demo installation' },
  { id: 'zagtouli', name: 'Zagtouli Solar Park', country: 'Burkina Faso', region: 'West Africa', lat: 12.29, lng: -1.63, capacity: 33, output: 13.2, irradiance: 889, health: 72, status: 'warning', technology: 'Photovoltaic' },
  { id: 'bui', name: 'Bui Solar', country: 'Ghana', region: 'West Africa', lat: 8.28, lng: -2.24, capacity: 50, output: 37, irradiance: 876, health: 95, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'garissa', name: 'Garissa Solar', country: 'Kenya', region: 'East Africa', lat: -0.46, lng: 39.63, capacity: 54.6, output: 43, irradiance: 912, health: 98, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'soroti', name: 'Soroti Solar', country: 'Uganda', region: 'East Africa', lat: 1.72, lng: 33.61, capacity: 10, output: 7.4, irradiance: 856, health: 96, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'rwamagana', name: 'Rwamagana Solar', country: 'Rwanda', region: 'East Africa', lat: -1.95, lng: 30.44, capacity: 8.5, output: 6.6, irradiance: 870, health: 97, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'bangui', name: 'Sakaï Solar', country: 'Central African Republic', region: 'Central Africa', lat: 4.42, lng: 18.51, capacity: 15, output: 11.3, irradiance: 828, health: 94, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'kinshasa', name: 'Kinshasa Solar Hub', country: 'Democratic Republic of the Congo', region: 'Central Africa', lat: -4.33, lng: 15.32, capacity: 100, output: 0, irradiance: 842, health: 0, status: 'offline', technology: 'Demo installation' },
  { id: 'kafue', name: 'Bangweulu Solar', country: 'Zambia', region: 'Southern Africa', lat: -15.42, lng: 28.44, capacity: 54, output: 41, irradiance: 924, health: 97, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'mocuba', name: 'Mocuba Solar', country: 'Mozambique', region: 'Southern Africa', lat: -16.84, lng: 36.99, capacity: 40, output: 29, irradiance: 892, health: 95, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'deaar', name: 'De Aar Solar', country: 'South Africa', region: 'Southern Africa', lat: -30.65, lng: 24.01, capacity: 175, output: 133, irradiance: 945, health: 96, status: 'healthy', technology: 'Photovoltaic' },
  { id: 'jasper', name: 'Jasper Solar', country: 'South Africa', region: 'Southern Africa', lat: -28.72, lng: 24.48, capacity: 96, output: 72, irradiance: 931, health: 93, status: 'warning', technology: 'Photovoltaic' },
  { id: 'hardap', name: 'Hardap Solar', country: 'Namibia', region: 'Southern Africa', lat: -24.53, lng: 17.96, capacity: 37, output: 28, irradiance: 948, health: 98, status: 'healthy', technology: 'Photovoltaic' },
];

export const initialAlerts = [
  { id: 'ALT-1042', category: 'Anomaly', severity: 'critical', siteId: 'zagtouli', title: 'Unexpected generation drop', detail: 'Generation is 48.7% below the clear-sky baseline while irradiance remains stable at 889 W/m². Inspect inverter strings 4–6 and compare DC input.', detected: '12:00:08', latency: 8, age: 'Just now', resolved: false },
  { id: 'ALT-1041', category: 'Outage', severity: 'critical', siteId: 'kinshasa', title: 'Substation telemetry offline', detail: 'The substation gateway has missed three heartbeats. Output is unavailable and treated as zero in this simulated snapshot. Check backhaul connectivity and dispatch local support.', detected: '11:46:12', latency: 12, age: '14 min ago', resolved: false },
  { id: 'ALT-1040', category: 'Equipment', severity: 'warning', siteId: 'jasper', title: 'Inverter temperature elevated', detail: 'Inverter JAS-07 is at 76 °C, above its 70 °C advisory threshold. Production remains online. Inspect cooling fans and air intake.', detected: '11:32:09', latency: 9, age: '28 min ago', resolved: false },
  { id: 'ALT-1039', category: 'Equipment', severity: 'warning', siteId: 'bui', title: 'Preventive maintenance due', detail: 'Combiner box inspection is due. No generation impact is observed. Schedule a maintenance window with the regional team.', detected: '11:18:11', latency: 11, age: '42 min ago', resolved: false },
];

export const corridors = [
  { name: 'WAPP', fullName: 'West African Power Pool', color: '#dba127', points: [[18.12,-15.88],[14.7,-17.4],[10.94,-14.3],[9.5,-13.7],[6.3,-10.8],[5.3,-4],[8.28,-2.24],[12.29,-1.63],[6.2,1.2],[6.5,3.4],[9.1,7.4]] },
  { name: 'EAPP', fullName: 'Eastern Africa Power Pool', color: '#5d96b1', points: [[24.46,32.74],[15.6,32.5],[9,38.7],[1.72,33.61],[-1.95,30.44],[-6.8,39.2],[-0.46,39.63],[9,38.7]] },
  { name: 'SAPP', fullName: 'Southern African Power Pool', color: '#9a8bba', points: [[-4.33,15.32],[-11.7,27.5],[-15.42,28.44],[-17.8,31],[-16.84,36.99],[-25.9,32.6],[-26.2,28],[-30.65,24.01],[-28.72,24.48],[-24.53,17.96]] },
];

export function summarize(selectedSites, alerts) {
  const output = selectedSites.reduce((sum, site) => sum + site.output, 0);
  const capacity = selectedSites.reduce((sum, site) => sum + site.capacity, 0);
  const ids = new Set(selectedSites.map(site => site.id));
  return {
    output, capacity,
    active: selectedSites.filter(site => site.status !== 'offline').length,
    total: selectedSites.length,
    openAlerts: alerts.filter(alert => !alert.resolved && ids.has(alert.siteId)).length,
  };
}

export function selectSites(region, country = '') {
  return sites.filter(site => (region === 'All regions' || site.region === region) && (!country || site.country === country));
}

export function generationSeries(selectedSites) {
  const capacity = selectedSites.reduce((sum, site) => sum + site.capacity, 0);
  const peak = selectedSites.reduce((sum, site) => sum + site.output, 0);
  const shape = hour => hour <= 6 || hour >= 19 ? 0 : Math.sin((hour - 6) / 13 * Math.PI);
  return {
    baseline: Array.from({ length: 24 }, (_, hour) => +(capacity * 0.82 * shape(hour)).toFixed(1)),
    actual: Array.from({ length: 24 }, (_, hour) => hour > 12 ? null : +(peak * shape(hour) / shape(12) * (hour === 10 ? 0.93 : 1)).toFixed(1)),
  };
}

export function forecastSeries(selectedSites) {
  const capacity = selectedSites.reduce((sum, site) => sum + site.capacity, 0);
  return [5.4, 5.8, 5.6, 4.9, 5.5, 5.9, 6.1].map(hours => +(capacity * hours / 1000).toFixed(2));
}

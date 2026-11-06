# Helios — Africa solar operations demo

A self-contained single-page V1 following the product and design documents in [Documents Markdown](./Documents%20Markdown/). The requested lightweight single-page stack takes precedence over the proposed Next.js architecture: Vite, plain JavaScript, compiled Tailwind CSS, Leaflet, Chart.js and Lucide. Inter, libraries and map geometry are bundled locally; runtime requires no external requests, map tiles, account or API keys.

## Run

Requires Node.js 18+.

```sh
npm install
npm run dev -- --port 5173
```

For the production build:

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

Open http://localhost:4173 for preview or http://localhost:5173 for development. Both bind only to the local machine.

## Included

- Production, active-site, simulated transport SLA and open-alert KPIs.
- Local vector Africa map: pan, keyboard-accessible solar markers, zoom controls, country selection, regional scoping and reset.
- Illustrative WAPP, EAPP and SAPP corridors with tooltips and visibility toggle.
- 16 solar installations across 15 countries; output, irradiance, health and capacity popups.
- Anomaly banner with one-click investigation and explicit 8-second simulated detection latency.
- Five-region production comparison, 24-hour diurnal chart and next-seven-day forecast with ±12% illustrative range.
- Equipment, Anomaly and Outage filters; confirmation-based alert resolution and optional resolved-history view.
- Searchable asset directory, status filters and scoped CSV export.
- Light mode by default, persistent dark-mode toggle, responsive navigation and layouts.

## Data and modeling

All telemetry, alerts, network uptime, generation curves and forecasts are **simulated**, not connected to SCADA or actual operations. Capacities and coordinates are illustrative, including two explicit demo installations. The feed is a fixed 12:00 UTC snapshot; refresh reloads that snapshot rather than inventing live data. The 99.94% network SLA is illustrative 30-day transport uptime, distinct from instantaneous site availability.

The diurnal curve is a normalized UTC profile, not site-specific local solar time. Actual observations stop at 12:00; the dashed clear-sky baseline extends for 24 hours. Forecast dates roll to the next seven UTC dates. Impact estimates use the next-day forecast, 0.4 tonnes CO₂ per MWh and 5 kWh per household-day.

Alert resolutions and theme preference persist in browser local storage. Resolution records an operator action, **not equipment recovery**: physical health, site output and outage status remain unchanged. Category/search/status filters affect their respective tables; region and country selection scope the KPIs, charts, map sites and report. CSV export includes all assets and all alert statuses in the selected region/country.

To reset the demo's resolution history, clear the `helios-resolved` local-storage key in browser developer tools.

### Map attribution

[Natural Earth 1:50m Admin-0 countries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson), filtered to `CONTINENT = Africa`, plus Seychelles and Mauritius (classified as offshore islands in the source), and reduced to country name, code and original polygon geometry. [Natural Earth data is public domain](https://www.naturalearthdata.com/about/terms-of-use/). The bundled [Africa GeoJSON](./public/data/africa.geojson) is approximately 289 KB and contains 56 country/territory geometries.

Country outlines are cartographic context, not a statement on disputed boundaries. Small territories follow Natural Earth's dataset. Corridor paths are schematic illustrative connections, **not authoritative engineering alignments**. No tile server, map watermark or geospatial API is used.

## Validation

```sh
npm test
npm run build
```

The Node test suite covers portfolio consistency, regional/country filtering, resolution semantics, the strict sub-30-second detection threshold, diurnal output, seven-day forecast shape and real map geometry. Browser acceptance checks cover the dashboard, theme persistence, country selection, site telemetry, alert filters/resolution, navigation, export and responsive layouts.

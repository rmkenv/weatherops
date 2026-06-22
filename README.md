# WeatherOps v2.0

**Open-source weather intelligence platform by IQSpatial.**
No API keys. No Docker. Deploys to Vercel in one click.

## What's new in v2.0

| Feature | Detail |
|---------|--------|
| **Forecast model selector** | Choose GFS, ECMWF, ICON, NAM, HRRR, or Auto — all free via Open-Meteo |
| **NEXRAD radar map** | Live composite reflectivity tiles via Iowa Mesonet (free) |
| **USGS streamgauges** | Live stage/discharge markers with flood status coloring |
| **NWS alert polygons** | Alert zones rendered as GeoJSON overlays on the map |
| **30-year climate normals** | P10/P50/P90 ribbons behind 10-day forecast via Open-Meteo Archive API |
| **Baskerville-Emin GDD** | Sine-curve method replaces simple average; 5 crops with upper cutoffs |
| **ET₀ (FAO-56)** | Native Open-Meteo ET₀ + Hargreaves-Samani cross-check; 10-day sparkline |

## Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS → Vercel
- **Map**: Leaflet 1.9 + CartoDB dark tiles + Iowa Mesonet NEXRAD
- **Weather**: [Open-Meteo](https://open-meteo.com/) forecast + archive (free, no key)
- **Alerts**: [NWS / weather.gov](https://api.weather.gov/) (free, US only)
- **Gauges**: [USGS WaterServices](https://waterservices.usgs.gov/) (free)
- **ETL**: GitHub Actions (every 15 min) → flat JSON in `/public/data/`

## Quick start

```bash
git clone https://github.com/rmkenv/weatherops
cd weatherops
npm install
npm run dev       # http://localhost:3000
```

## Deploy

```bash
npx vercel --prod
```

Zero environment variables required.

## Architecture

```
app/
  page.tsx                ← Server component, ISR 15min, parallel fetch all locs
  api/weather/route.ts    ← Client refresh — accepts ?model= param
components/
  WeatherDashboard.tsx    ← Client shell (tabs, model selector, unit toggle)
  tabs/
    NowTab.tsx            ← Current conditions, pressure gauge, solar window
    HourlyTab.tsx         ← 24h strip + 48h sparklines
    TenDayTab.tsx         ← Forecast table + 30yr normals ribbon
    DerivedTab.tsx        ← BE-GDD, multi-crop, ET₀, wet bulb, field ops
    MapTab.tsx            ← Leaflet, NEXRAD, USGS gauges, NWS polygons
    AlertsTab.tsx         ← NWS alerts + all-location compare
  ui/
    ModelSelector.tsx     ← Dropdown: GFS/ECMWF/ICON/NAM/HRRR/Auto
    NormalsRibbon.tsx     ← SVG P10/P50/P90 climate ribbon
    PressureGauge.tsx     ← Animated SVG arc gauge
    Sparkline.tsx         ← Generic 2D SVG polyline
    Tile.tsx              ← Metric card with accent color
    TabNav.tsx / LocationSwitcher.tsx / WaveBackground.tsx / SectionLabel.tsx
services/
  weather/client.ts       ← Open-Meteo forecast (model-aware)
  weather/types.ts        ← TypeScript interfaces incl. ClimateNormal
  alerts/client.ts        ← NWS alerts + severity colors
  climate/client.ts       ← 30yr archive → P10/P50/P90 normals (localStorage cache)
  derived/index.ts        ← GDD-BE, multi-crop, ET₀, Ra, wet bulb, field ops
lib/
  constants.ts            ← Locations, WMO codes, FORECAST_MODELS, NEXRAD URL
  units.ts                ← cToF, mmToIn, kphToMph, windDir
scripts/etl.js            ← GitHub Actions writer
.github/workflows/etl.yml ← Every 15 minutes
```

## Adding locations

Edit `lib/constants.ts` → `LOCATIONS`. Add `{ id, label, lat, lon }`. All components auto-update.

## Credits

Data: [Open-Meteo](https://open-meteo.com/) · [NWS](https://api.weather.gov/) · [USGS](https://waterservices.usgs.gov/) · [Iowa Mesonet NEXRAD](https://mesonet.agron.iastate.edu/)
Built by [IQSpatial](https://iqspatial.com) · [@rmkenv](https://github.com/rmkenv)

# Smart Farm – React App

React (Vite + TypeScript) front end for the smart farming system covering all 10 functional requirements.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview   # optional: preview production build
```

## Features (by FR)

| FR | Feature | Route / Page |
|----|---------|--------------|
| FR1 | Real-time soil moisture, temperature, humidity (IoT sensors) | `/sensors` |
| FR2 | Auto irrigation from moisture thresholds + weather | `/irrigation` |
| FR3 | Weather forecast for irrigation planning | `/weather` |
| FR4 | Upload leaf images → AI disease detection + remedies | `/disease` |
| FR5 | Crop-specific details (moisture, temp, fertilizer, duration) | `/crops` |
| FR6 | Alerts (low moisture, rainfall, temp, diseases) | `/alerts` |
| FR7 | Multiple farm plots, separate dashboards | `/plots`, `/sensors?plot=2` |
| FR8 | Historical sensor data with charts | `/history` |
| FR9 | Farmers list products in marketplace | `/marketplace/list` |
| FR10 | Buyers browse, place orders, direct transactions | `/marketplace` |

Data is currently mocked. Replace with your backend/API and (for FR4) your AI disease-detection service.

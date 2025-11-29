# 📱 Transit Mobile App

Cross-platform React Native mobile application for the Open Transit Route Finder. Provides an interactive map interface for discovering transit stops and planning routes.

## Overview

This mobile app delivers:
- **Interactive Map** - MapLibre-powered map with transit stop visualization
- **Stop Discovery** - Find nearby bus stops, train stations, and transit hubs
- **Route Planning** - Visual journey planning between any two points
- **Real-time Updates** - Live connection to the backend API

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native with Expo |
| Language | TypeScript |
| Maps | MapLibre GL Native |
| Navigation | Expo Router |
| State Management | React Context / Zustand |

## Screenshots

*Coming soon*

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
├── src/
│   ├── api/               # API client and mock data
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions
├── assets/                # Images, fonts, icons
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Running on Device

```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Physical device
# Scan QR code with Expo Go app
npx expo start
```

## Features

### Map View

The main screen displays an interactive map powered by MapLibre GL:

- **Stop Markers** - Transit stops rendered as circle layers
- **User Location** - Blue dot showing current position
- **Route Lines** - GeoJSON paths drawn as polylines

### Route Planning

1. Tap starting location on map
2. Tap destination
3. View calculated route with transfer information
4. Follow step-by-step directions

### Offline Support

*Planned for future release*

## API Integration

The app connects to the Go backend for data:

```typescript
// Example API call
const stops = await fetch('http://localhost:8080/stops');
const data = await stops.json();
```

### Development Mode

For development without a backend, the app includes mock data:

```typescript
// src/api/mockStops.ts
export const MOCK_STOPS = [
  {
    id: "101",
    name: "Central Station",
    coordinates: { lat: 40.7128, lon: -74.0060 }
  }
];
```

Toggle between mock and live data in the configuration.

## Configuration

### Environment Variables

Create a `.env` file:

```
API_BASE_URL=http://localhost:8080
MAP_STYLE_URL=https://tiles.example.com/style.json
```

### Map Styles

The app uses free map tiles. Configure your preferred style in:

```typescript
// src/config/map.ts
export const MAP_STYLE = 'https://tiles.example.com/style.json';
```

## Dependencies

Key packages:

| Package | Purpose |
|---------|---------|
| `expo` | Development framework |
| `@maplibre/maplibre-react-native` | Map rendering |
| `expo-location` | GPS access |
| `expo-router` | File-based routing |

## Development

### Code Style

The project uses ESLint and Prettier:

```bash
# Lint
npm run lint

# Format
npm run format
```

### Type Checking

```bash
npx tsc --noEmit
```

### Testing

```bash
npm test
```

## Building for Production

### Expo Build

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

### Local Build

```bash
npx expo prebuild
cd ios && pod install && cd ..
npx expo run:ios --configuration Release
```

## Troubleshooting

### Map Not Loading

1. Check MapLibre is installed: `npm list @maplibre/maplibre-react-native`
2. Verify style URL is accessible
3. Check for CORS issues in console

### API Connection Failed

1. Ensure backend is running on `localhost:8080`
2. For physical device, use your machine's local IP
3. Check CORS is enabled on backend

### Location Permission Denied

1. Go to device Settings → Apps → Transit App → Permissions
2. Enable Location access

## License

MIT License - See [LICENSE](../LICENSE) for details.

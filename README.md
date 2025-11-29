# 🚍 Open Transit Route Finder

A modern, open-source public transportation route finder that helps users navigate city transit systems. Built with a React Native mobile app and a high-performance Go backend, this application provides real-time route planning using GTFS (General Transit Feed Specification) data.

## Overview

Open Transit Route Finder enables users to:
- **Find transit stops** near their location on an interactive map
- **Plan routes** between any two points using public transportation
- **View real-time information** about buses, trains, and other transit options

The application processes standard GTFS data, making it compatible with thousands of transit agencies worldwide.

## Architecture

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐
│                 │ ◄───────────────► │                 │
│   Mobile App    │                    │   Go Backend    │
│  (React Native) │                    │   (REST API)    │
│                 │                    │                 │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │   GTFS Data     │
                                       │  (stops, routes │
                                       │   schedules)    │
                                       └─────────────────┘
```

## Tech Stack

### Mobile (React Native)
| Technology | Purpose |
|------------|---------|
| **Expo** | Development framework and build tooling |
| **React Native** | Cross-platform mobile development |
| **MapLibre GL** | Open-source map rendering |
| **TypeScript** | Type-safe development |

### Backend (Go)
| Technology | Purpose |
|------------|---------|
| **Go 1.21+** | High-performance server runtime |
| **net/http** | Standard library HTTP server |
| **rs/cors** | CORS middleware for mobile access |
| **CSA Algorithm** | Connection Scan Algorithm for route finding |

### Data
| Format | Description |
|--------|-------------|
| **GTFS** | Industry-standard transit data format |
| **GeoJSON** | Geographic data interchange format |

## Project Structure

```
transport-app/
├── backend/                 # Go REST API server
│   ├── cmd/api/            # Application entry point
│   ├── internal/
│   │   ├── api/            # HTTP handlers
│   │   ├── data/           # GTFS parsing logic
│   │   ├── gtfs/           # GTFS data structures
│   │   └── router/         # Route calculation (CSA)
│   └── pkg/models/         # Shared data models
├── mobile/                  # React Native Expo app
├── data/
│   └── gtfs/               # GTFS feed files
├── docs/
│   ├── api/                # API documentation
│   ├── architecture/       # System design docs
│   └── contracts/          # API contracts
└── scripts/                # Build and deployment scripts
```

## Getting Started

### Prerequisites
- **Go 1.21+** for backend development
- **Node.js 18+** and npm for mobile development
- **Expo CLI** for React Native development

### Backend Setup

```bash
cd backend
go mod download
go run ./cmd/api/
```

The server starts at `http://localhost:8080`

### Mobile Setup

```bash
cd mobile
npm install
npx expo start
```

### Verify Installation

```bash
# Test the health endpoint
curl http://localhost:8080/health
# Response: Backend is running!
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/stops` | List all transit stops |
| `GET` | `/stops/nearest` | Find nearest stop to coordinates |
| `GET` | `/route` | Calculate route between two points |

See [API Contract](docs/contracts/api_contract.md) for detailed specifications.

## How It Works

1. **GTFS Ingestion**: The backend parses GTFS files (stops.txt, routes.txt, stop_times.txt) into optimized in-memory structures.

2. **Stop Discovery**: Users see nearby stops rendered as pins on the MapLibre map.

3. **Route Calculation**: When a user requests a route, the Connection Scan Algorithm (CSA) finds the optimal path through the transit network.

4. **GeoJSON Response**: Routes are returned as GeoJSON LineStrings, which MapLibre renders as visual paths on the map.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is open source and available under the [MIT License](LICENSE).
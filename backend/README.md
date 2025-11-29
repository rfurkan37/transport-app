# 🚀 Transit API Backend

High-performance Go backend for the Open Transit Route Finder. Parses GTFS data and exposes a REST API for transit stop discovery and route planning.

## Overview

This service handles:
- **GTFS Data Parsing** - Ingests standard transit feed files into optimized data structures
- **Stop Discovery** - Provides geographic queries for finding transit stops
- **Route Calculation** - Implements the Connection Scan Algorithm (CSA) for efficient journey planning
- **REST API** - Serves JSON responses to the mobile application

## Tech Stack

| Component | Technology |
|-----------|------------|
| Language | Go 1.21+ |
| HTTP Server | net/http (standard library) |
| CORS | github.com/rs/cors |
| Algorithm | Connection Scan Algorithm (CSA) |
| Data Format | GTFS, GeoJSON |

## Project Structure

```
backend/
├── cmd/
│   └── api/
│       └── main.go         # Application entry point
├── internal/
│   ├── api/                # HTTP handlers and middleware
│   ├── data/               # GTFS file parsing
│   ├── gtfs/               # GTFS data structures
│   └── router/             # Route calculation logic (CSA)
├── pkg/
│   └── models/             # Shared data models
├── go.mod
└── go.sum
```

## Getting Started

### Prerequisites

- Go 1.21 or higher
- GTFS data files in `/data/gtfs/`

### Installation

```bash
# Install dependencies
go mod download

# Build the binary
go build -o api ./cmd/api/

# Or run directly
go run ./cmd/api/
```

### Running the Server

```bash
go run ./cmd/api/
# Output: Starting server on :8080...
```

### Verify

```bash
curl http://localhost:8080/health
# Response: Backend is running!
```

## API Reference

### Health Check

```
GET /health
```

**Response:** `200 OK`
```
Backend is running!
```

### List Stops

```
GET /stops
```

**Response:** `200 OK`
```json
[
  {
    "id": "101",
    "name": "Central Station",
    "coordinates": { "lat": 40.7128, "lon": -74.0060 }
  }
]
```

### Find Nearest Stop

```
GET /stops/nearest?lat=40.7128&lon=-74.0060
```

**Response:** `200 OK`
```json
{
  "id": "101",
  "name": "Central Station",
  "coordinates": { "lat": 40.7128, "lon": -74.0060 },
  "distance": 150.5
}
```

### Calculate Route

```
GET /route?from=LAT,LON&to=LAT,LON
```

**Response:** `200 OK`
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[lon1, lat1], [lon2, lat2], ...]
      }
    }
  ]
}
```

## GTFS Data

The backend expects GTFS files in the `/data/gtfs/` directory:

| File | Purpose |
|------|---------|
| `stops.txt` | Transit stop locations and names |
| `routes.txt` | Route definitions |
| `trips.txt` | Trip information |
| `stop_times.txt` | Arrival/departure times at stops |
| `calendar.txt` | Service schedules |

## Algorithm: Connection Scan Algorithm (CSA)

The router uses CSA for efficient journey planning:

1. **Load Connections** - Parse `stop_times.txt` into connection objects
2. **Sort by Time** - Order all connections by departure time
3. **Scan** - Linear scan through connections to find optimal path
4. **Output** - Convert result to GeoJSON for map rendering

CSA provides O(n) time complexity where n is the number of connections, making it suitable for real-time queries.

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `GTFS_PATH` | `../data/gtfs` | Path to GTFS files |

## Development

### VS Code Setup

1. Install the "Go" extension by the Go Team
2. Run `Ctrl+Shift+P` → "Go: Install/Update Tools" → Select all → OK

### Testing

```bash
go test ./...
```

### Linting

```bash
go vet ./...
```

## License

MIT License - See [LICENSE](../LICENSE) for details.

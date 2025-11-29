# Transport API Backend

Go backend server for the Kocaeli transport application.

## Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go         # Application entry point
├── internal/
│   ├── geo/
│   │   └── distance.go     # Geographic utilities (haversine)
│   ├── handler/
│   │   └── handler.go      # HTTP request handlers
│   ├── model/
│   │   └── model.go        # Data structures
│   └── service/
│       ├── gtfs.go         # GTFS data loader
│       └── kentkart.go     # Kentkart API client
├── go.mod
├── go.sum
└── README.md
```

## Running the Server

```bash
cd backend
go run ./cmd/server

# Or with custom data directory:
GTFS_DATA_DIR=/path/to/data go run ./cmd/server
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /stops` | List all stops (supports `lat`, `lon`, `radius` params) |
| `GET /stops/arrivals?stop_id=X` | Real-time arrivals for a stop |
| `GET /routes` | List all routes |
| `GET /route/shape?route_id=X` | Get shape points for a route |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `GTFS_DATA_DIR` | `../../data/kocaeli_transport_data` | Path to GTFS CSV files |

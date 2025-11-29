# System Design

## Overview

Open Transit Route Finder is a public transportation journey planner that processes GTFS data to provide stop discovery and route calculation via a mobile app.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MOBILE DEVICE                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         React Native App                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   MapView   │  │  StopList   │  │ RoutePanel  │  │  SearchBar  │   │  │
│  │  │  (MapLibre) │  │             │  │             │  │             │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │  │
│  │         │                │                │                │          │  │
│  │         └────────────────┴────────────────┴────────────────┘          │  │
│  │                                   │                                    │  │
│  │                          ┌────────┴────────┐                          │  │
│  │                          │   API Client    │                          │  │
│  │                          └────────┬────────┘                          │  │
│  └───────────────────────────────────┼───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                                       │ HTTP/JSON
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────┐
│                              GO BACKEND                                     │
│  ┌───────────────────────────────────┼───────────────────────────────────┐  │
│  │                          ┌────────┴────────┐                          │  │
│  │                          │  HTTP Server    │                          │  │
│  │                          │  (net/http)     │                          │  │
│  │                          └────────┬────────┘                          │  │
│  │                                   │                                    │  │
│  │         ┌─────────────────────────┼─────────────────────────┐         │  │
│  │         │                         │                         │         │  │
│  │  ┌──────┴──────┐  ┌───────────────┴───────────────┐  ┌─────┴──────┐  │  │
│  │  │ /stops      │  │ /route                        │  │ /health    │  │  │
│  │  │ Handler     │  │ Handler                       │  │ Handler    │  │  │
│  │  └──────┬──────┘  └───────────────┬───────────────┘  └────────────┘  │  │
│  │         │                         │                                   │  │
│  │  ┌──────┴──────┐  ┌───────────────┴───────────────┐                  │  │
│  │  │ Stop Store  │  │  Connection Scan Algorithm   │                  │  │
│  │  │             │  │          (CSA)                │                  │  │
│  │  └──────┬──────┘  └───────────────┬───────────────┘                  │  │
│  │         │                         │                                   │  │
│  │         └─────────────────────────┘                                   │  │
│  │                         │                                             │  │
│  │              ┌──────────┴──────────┐                                  │  │
│  │              │    GTFS Parser      │                                  │  │
│  │              └──────────┬──────────┘                                  │  │
│  └─────────────────────────┼─────────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │         GTFS Files          │
              │  stops.txt | routes.txt     │
              │  stop_times.txt | trips.txt │
              └─────────────────────────────┘
```

## Component Details

### Mobile App (React Native + Expo)

| Component | Responsibility |
|-----------|---------------|
| **MapView** | Renders MapLibre map, handles gestures, displays markers and routes |
| **StopList** | Lists nearby stops, handles selection |
| **RoutePanel** | Displays route details, step-by-step directions |
| **SearchBar** | Origin/destination input, autocomplete |
| **API Client** | HTTP requests to backend, response parsing |

### Backend (Go)

| Component | Responsibility |
|-----------|---------------|
| **HTTP Server** | Request routing, CORS handling, response serialization |
| **Stop Handler** | Serves stop data, handles nearest-stop queries |
| **Route Handler** | Accepts route requests, returns GeoJSON paths |
| **GTFS Parser** | Reads and parses GTFS files at startup |
| **CSA Engine** | Connection Scan Algorithm implementation |

## Data Flow

### Stop Discovery

```
1. User opens app
2. App requests current location
3. App calls GET /stops
4. Backend returns all stops as JSON array
5. App renders stops as map markers
```

### Route Calculation

```
1. User selects origin and destination
2. App calls GET /route?from=LAT,LON&to=LAT,LON
3. Backend:
   a. Finds nearest stops to origin/destination
   b. Runs CSA to find optimal path
   c. Converts path to GeoJSON
4. App renders GeoJSON as polyline on map
```

## Connection Scan Algorithm (CSA)

CSA is chosen for its simplicity and efficiency in schedule-based transit routing.

### How It Works

1. **Preprocessing**: Load all connections (stop_times) and sort by departure time
2. **Initialization**: Set earliest arrival time at origin to query time, all others to infinity
3. **Scan**: Iterate through connections in order:
   - If we can reach the departure stop in time, update arrival at destination stop
   - Track which connection was used to reach each stop
4. **Reconstruction**: Backtrack from destination to build the journey

### Complexity

- **Time**: O(n) where n = number of connections
- **Space**: O(s) where s = number of stops

### Why CSA?

| Algorithm | Pros | Cons |
|-----------|------|------|
| **CSA** | Simple, fast, handles real schedules | Single criterion (earliest arrival) |
| **RAPTOR** | Multi-criteria (transfers, walking) | More complex |
| **Dijkstra** | Well-known | Doesn't handle time-dependent graphs well |

CSA provides the best balance of simplicity and performance for this application.

## GTFS Data Model

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   routes    │───────│   trips     │───────│ stop_times  │
│             │ 1   n │             │ 1   n │             │
│ route_id    │       │ trip_id     │       │ stop_id     │
│ route_name  │       │ route_id    │       │ trip_id     │
│             │       │ service_id  │       │ arrival     │
└─────────────┘       └─────────────┘       │ departure   │
                                            └──────┬──────┘
                                                   │
                                                   │ n
                                            ┌──────┴──────┐
                                            │   stops     │
                                            │             │
                                            │ stop_id     │
                                            │ stop_name   │
                                            │ stop_lat    │
                                            │ stop_lon    │
                                            └─────────────┘
```

## Scalability Considerations

### Current Design (MVP)

- In-memory data storage
- Single server instance
- All GTFS data loaded at startup

### Future Enhancements

| Concern | Solution |
|---------|----------|
| Large datasets | Spatial indexing (R-tree) for stop queries |
| Multiple cities | Sharding by geographic region |
| High traffic | Horizontal scaling with load balancer |
| Real-time updates | Redis pub/sub for GTFS-RT integration |

## Security

| Layer | Protection |
|-------|------------|
| Transport | HTTPS in production |
| CORS | Restricted origins |
| Rate Limiting | Request throttling (TODO) |
| Input Validation | Coordinate bounds checking |

## Deployment

```
┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │   Go Backend    │
│                 │     │                 │
│  App Store /    │     │  Docker / VPS   │
│  Play Store     │     │  or Cloud Run   │
└─────────────────┘     └─────────────────┘
         │                      │
         │    HTTPS             │
         └──────────────────────┘
```

## Monitoring (Future)

- **Metrics**: Request latency, error rates, route calculation time
- **Logging**: Structured JSON logs
- **Tracing**: Distributed tracing for request flows
- **Alerting**: PagerDuty/Slack integration

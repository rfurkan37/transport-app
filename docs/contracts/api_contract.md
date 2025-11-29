# API Contract

This document defines the exact JSON responses for all API endpoints.

## Stops Endpoint

### GET /stops

Returns a list of all transit stops.

**Response:**

```json
[
  {
    "id": "101",
    "name": "Central Station",
    "coordinates": { "lat": 40.7128, "lon": -74.0060 }
  }
]
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the stop |
| `name` | string | Human-readable name of the stop |
| `coordinates` | object | Geographic location of the stop |
| `coordinates.lat` | number | Latitude in decimal degrees |
| `coordinates.lon` | number | Longitude in decimal degrees |

---

## Health Endpoint

### GET /health

Returns the health status of the backend service.

**Response:**

```
Backend is running!
```

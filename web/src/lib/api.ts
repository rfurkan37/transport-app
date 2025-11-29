import { API_BASE_URL, Stop, RouteResponse, BusRoute, ShapePoint } from "./config";

// Generic fetch wrapper with error handling
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Handle non-JSON responses (like health check)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text() as unknown as T;
}

// Health check
export async function checkHealth(): Promise<string> {
  return fetchApi<string>("/health");
}

// Get all stops
export async function getStops(): Promise<Stop[]> {
  const response = await fetchApi<{ stops: Array<{ stop_id: string; stop_name: string; stop_lat: number; stop_lon: number }> }>("/stops");
  // Transform backend format to frontend format
  return response.stops.map((stop) => ({
    id: stop.stop_id,
    name: stop.stop_name,
    coordinates: {
      lat: stop.stop_lat,
      lon: stop.stop_lon,
    },
  }));
}

// Get nearest stop
export async function getNearestStop(lat: number, lon: number): Promise<Stop> {
  return fetchApi<Stop>(`/stops/nearest?lat=${lat}&lon=${lon}`);
}

// Calculate route
export async function getRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<RouteResponse> {
  return fetchApi<RouteResponse>(
    `/route?from=${fromLat},${fromLon}&to=${toLat},${toLon}`
  );
}

// Get all bus routes
export async function getBusRoutes(): Promise<BusRoute[]> {
  const response = await fetchApi<{ routes: BusRoute[]; count: number }>("/routes");
  return response.routes;
}

// Get route shape (geometry) for a specific route
export async function getRouteShape(routeId: string): Promise<ShapePoint[]> {
  const response = await fetchApi<{ route_id: string; points: ShapePoint[] }>(
    `/route/shape?route_id=${encodeURIComponent(routeId)}`
  );
  return response.points || [];
}

// Debug: Raw API call for the console
export async function rawApiCall(
  method: string,
  endpoint: string,
  body?: string
): Promise<{ status: number; data: unknown; time: number }> {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = performance.now();

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body || undefined,
  });

  const endTime = performance.now();
  const time = Math.round(endTime - startTime);

  let data: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    data,
    time,
  };
}

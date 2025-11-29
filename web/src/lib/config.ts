// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Map configuration
export const MAP_CONFIG = {
  // Using a free OpenStreetMap style - you can change this to any MapLibre-compatible style
  styleUrl: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  defaultCenter: { lng: 29.4317, lat: 40.7999 }, // Kocaeli, Turkey
  defaultZoom: 11,
};

// Stop type definition
export interface Stop {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

// Bus route type definition
export interface BusRoute {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number; // 0=tram, 3=bus, 4=ferry, 7=cable car
  route_desc: string;
  route_color: string;
  route_text_color: string;
  route_url: string;
}

// Shape point for route geometry
export interface ShapePoint {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
}

// Route response type (GeoJSON)
export interface RouteResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "LineString";
      coordinates: Array<[number, number]>;
    };
    properties?: Record<string, unknown>;
  }>;
}

// API response types
export interface HealthResponse {
  status: string;
  message: string;
}

// Route colors for visualization (when route_color is not specified)
export const ROUTE_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
];

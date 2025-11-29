"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_CONFIG, Stop, RouteResponse, BusRoute, ShapePoint, ROUTE_COLORS } from "@/lib/config";

interface RouteShapeData {
  route: BusRoute;
  points: ShapePoint[];
}

interface MapViewProps {
  stops: Stop[];
  route: RouteResponse | null;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  selectedPoints: { from: { lng: number; lat: number } | null; to: { lng: number; lat: number } | null };
  busRouteShapes?: Map<string, RouteShapeData>;
  allRoutes?: BusRoute[];
}

function getRouteColor(route: BusRoute, index: number): string {
  if (route.route_color && route.route_color.length > 0) {
    return `#${route.route_color}`;
  }
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

// Calculate distance between two points in meters (haversine)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if a stop is near any point in the route shapes
function isStopNearRoutes(
  stop: Stop,
  routeShapes: Map<string, RouteShapeData>,
  threshold: number = 50 // meters
): boolean {
  for (const shapeData of routeShapes.values()) {
    for (const point of shapeData.points) {
      const distance = haversineDistance(
        stop.coordinates.lat,
        stop.coordinates.lon,
        point.shape_pt_lat,
        point.shape_pt_lon
      );
      if (distance <= threshold) {
        return true;
      }
    }
  }
  return false;
}

export function MapView({ stops, route, onMapClick, selectedPoints, busRouteShapes, allRoutes = [] }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const fromMarkerRef = useRef<maplibregl.Marker | null>(null);
  const toMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.styleUrl,
      center: [MAP_CONFIG.defaultCenter.lng, MAP_CONFIG.defaultCenter.lat],
      zoom: MAP_CONFIG.defaultZoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    // Handle click on stops layer (both layers)
    const handleStopClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const props = feature.properties;

      // Close existing popup
      popupRef.current?.remove();

      // Create styled popup
      popupRef.current = new maplibregl.Popup({ 
        offset: 15,
        className: "stop-popup",
        closeButton: true,
      })
        .setLngLat(coordinates)
        .setHTML(`
          <div class="stop-popup-content">
            <div class="stop-popup-title">${props?.name || "Unknown Stop"}</div>
            <div class="stop-popup-id">ID: ${props?.id || "N/A"}</div>
            <div class="stop-popup-coords">${coordinates[1].toFixed(5)}, ${coordinates[0].toFixed(5)}</div>
          </div>
        `)
        .addTo(map.current!);
    };

    map.current.on("click", "stops-layer", handleStopClick);
    map.current.on("click", "stops-icon-layer", handleStopClick);

    // Change cursor on hover
    map.current.on("mouseenter", "stops-layer", () => {
      if (map.current) map.current.getCanvas().style.cursor = "pointer";
    });
    map.current.on("mouseleave", "stops-layer", () => {
      if (map.current) map.current.getCanvas().style.cursor = "";
    });
    map.current.on("mouseenter", "stops-icon-layer", () => {
      if (map.current) map.current.getCanvas().style.cursor = "pointer";
    });
    map.current.on("mouseleave", "stops-icon-layer", () => {
      if (map.current) map.current.getCanvas().style.cursor = "";
    });

    // General map click (not on stops or routes)
    map.current.on("click", (e) => {
      // Check if click was on a stop or route
      const stopFeatures = map.current?.queryRenderedFeatures(e.point, { layers: ["stops-layer", "stops-icon-layer"] });
      if (stopFeatures && stopFeatures.length > 0) return;
      
      const routeFeatures = map.current?.queryRenderedFeatures(e.point, { layers: ["bus-routes-layer"] });
      if (routeFeatures && routeFeatures.length > 0) return;
      
      onMapClick?.({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    return () => {
      popupRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [onMapClick]);

  // Update stops using GeoJSON layer - filter by selected routes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const sourceId = "stops-source";
    const layerId = "stops-layer";
    const iconLayerId = "stops-icon-layer";

    // Filter stops: if routes are selected, only show stops near those routes
    let filteredStops = stops;
    const hasSelectedRoutes = busRouteShapes && busRouteShapes.size > 0;
    
    if (hasSelectedRoutes) {
      filteredStops = stops.filter(stop => isStopNearRoutes(stop, busRouteShapes));
    }

    // Convert stops to GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: filteredStops.map((stop) => ({
        type: "Feature",
        properties: { id: stop.id, name: stop.name },
        geometry: {
          type: "Point",
          coordinates: [stop.coordinates.lon, stop.coordinates.lat],
        },
      })),
    };

    // Update or create source
    const source = map.current.getSource(sourceId) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(geojson);
    } else {
      map.current.addSource(sourceId, { type: "geojson", data: geojson });
      
      // Add bus stop icon to the map
      const stopIcon = new Image(48, 48);
      stopIcon.onload = () => {
        if (!map.current) return;
        if (!map.current.hasImage("bus-stop-icon")) {
          map.current.addImage("bus-stop-icon", stopIcon);
        }
      };
      // Bus stop SVG as data URL
      stopIcon.src = `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="#1e40af" stroke="#ffffff" stroke-width="3"/>
          <circle cx="24" cy="24" r="12" fill="#60a5fa"/>
          <rect x="20" y="14" width="8" height="20" rx="2" fill="#ffffff"/>
          <circle cx="24" cy="18" r="2" fill="#1e40af"/>
          <rect x="21" y="22" width="6" height="2" fill="#1e40af"/>
          <rect x="21" y="26" width="6" height="2" fill="#1e40af"/>
          <rect x="21" y="30" width="6" height="2" fill="#1e40af"/>
        </svg>
      `)}`;

      // Add circle layer as fallback (before icon loads)
      map.current.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 12, 8, 16, 12],
          "circle-color": "#1e40af",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-opacity": 0.95,
        },
      });

      // Add inner circle for bus stop icon effect
      map.current.addLayer({
        id: iconLayerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 2, 12, 4, 16, 6],
          "circle-color": "#60a5fa",
          "circle-opacity": 1,
        },
      });
    }
  }, [stops, mapLoaded, busRouteShapes]);

  // Update bus route shapes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const sourceId = "bus-routes-source";
    const layerId = "bus-routes-layer";
    const outlineLayerId = "bus-routes-outline-layer";

    // Create GeoJSON from bus route shapes
    const features: GeoJSON.Feature[] = [];
    
    if (busRouteShapes) {
      busRouteShapes.forEach((shapeData, routeId) => {
        if (shapeData.points.length > 0) {
          const routeIndex = allRoutes.findIndex(r => r.route_id === routeId);
          const color = getRouteColor(shapeData.route, routeIndex >= 0 ? routeIndex : 0);
          
          features.push({
            type: "Feature",
            properties: {
              routeId: shapeData.route.route_id,
              shortName: shapeData.route.route_short_name,
              longName: shapeData.route.route_long_name,
              color: color,
            },
            geometry: {
              type: "LineString",
              coordinates: shapeData.points
                .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
                .map(p => [p.shape_pt_lon, p.shape_pt_lat]),
            },
          });
        }
      });
    }

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    // Update or create source
    const source = map.current.getSource(sourceId) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(geojson);
    } else {
      map.current.addSource(sourceId, { type: "geojson", data: geojson });

      // Add outline layer (darker, thicker line behind)
      map.current.addLayer({
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#000000",
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 4, 12, 7, 16, 10],
          "line-opacity": 0.4,
        },
      });

      // Add main colored line layer
      map.current.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2, 12, 4, 16, 6],
          "line-opacity": 0.85,
        },
      });

      // Add hover interactions
      map.current.on("mouseenter", layerId, (e) => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = "pointer";

        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          
          // Get coordinates along the line where mouse is
          const coords = e.lngLat;

          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup({
            offset: 10,
            className: "route-popup",
            closeButton: false,
          })
            .setLngLat(coords)
            .setHTML(`
              <div class="route-popup-content">
                <div class="route-popup-badge" style="background-color: ${props?.color}">
                  ${props?.shortName || "Route"}
                </div>
                <div class="route-popup-name">${props?.longName || ""}</div>
              </div>
            `)
            .addTo(map.current);
        }
      });

      map.current.on("mouseleave", layerId, () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });
    }
  }, [busRouteShapes, mapLoaded, allRoutes]);

  // Update calculated route line (point A to B)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const sourceId = "route-source";
    const layerId = "route-layer";

    // Remove existing route layer and source
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Add route if available
    if (route && route.features.length > 0) {
      map.current.addSource(sourceId, {
        type: "geojson",
        data: route as GeoJSON.FeatureCollection,
      });

      map.current.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#22c55e",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });
    }
  }, [route, mapLoaded]);

  // Update from/to markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Update FROM marker
    if (selectedPoints.from) {
      if (fromMarkerRef.current) {
        fromMarkerRef.current.setLngLat([selectedPoints.from.lng, selectedPoints.from.lat]);
      } else {
        const el = document.createElement("div");
        el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3" fill="#22c55e"/>
        </svg>`;
        fromMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([selectedPoints.from.lng, selectedPoints.from.lat])
          .addTo(map.current);
      }
    } else if (fromMarkerRef.current) {
      fromMarkerRef.current.remove();
      fromMarkerRef.current = null;
    }

    // Update TO marker
    if (selectedPoints.to) {
      if (toMarkerRef.current) {
        toMarkerRef.current.setLngLat([selectedPoints.to.lng, selectedPoints.to.lat]);
      } else {
        const el = document.createElement("div");
        el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5" fill="#ef4444"/>
        </svg>`;
        toMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([selectedPoints.to.lng, selectedPoints.to.lat])
          .addTo(map.current);
      }
    } else if (toMarkerRef.current) {
      toMarkerRef.current.remove();
      toMarkerRef.current = null;
    }
  }, [selectedPoints, mapLoaded]);

  // Fly to stops when loaded
  const flyToStops = useCallback(() => {
    if (!map.current || stops.length === 0) return;

    if (stops.length === 1) {
      map.current.flyTo({
        center: [stops[0].coordinates.lon, stops[0].coordinates.lat],
        zoom: 14,
      });
    } else {
      const bounds = new maplibregl.LngLatBounds();
      stops.forEach((stop) => {
        bounds.extend([stop.coordinates.lon, stop.coordinates.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [stops]);

  useEffect(() => {
    if (mapLoaded && stops.length > 0) {
      flyToStops();
    }
  }, [mapLoaded, stops.length, flyToStops]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}

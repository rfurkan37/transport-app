"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { MapView } from "@/components/map-view";
import { RoutePanel } from "@/components/route-panel";
import { ApiConsole } from "@/components/api-console";
import { LayersPanel } from "@/components/layers-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { getStops, getRoute, getBusRoutes, getRouteShape } from "@/lib/api";
import { Stop, RouteResponse, BusRoute, ShapePoint } from "@/lib/config";
import { Terminal, Navigation, Layers } from "lucide-react";

interface RouteShapeData {
  route: BusRoute;
  points: ShapePoint[];
}

export default function Dashboard() {
  const [selectedFrom, setSelectedFrom] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedTo, setSelectedTo] = useState<{ lng: number; lat: number } | null>(null);
  const [selectingPoint, setSelectingPoint] = useState<"from" | "to" | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteResponse | null>(null);
  
  // Bus routes state
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());
  const [routeShapes, setRouteShapes] = useState<Map<string, RouteShapeData>>(new Map());
  const [loadingShapes, setLoadingShapes] = useState<Set<string>>(new Set());

  // Fetch stops
  const {
    data: stops = [],
    isLoading: stopsLoading,
    error: stopsError,
    refetch: refetchStops,
  } = useQuery<Stop[], Error>({
    queryKey: ["stops"],
    queryFn: getStops,
    retry: false,
  });

  // Fetch bus routes
  const {
    data: busRoutes = [],
    isLoading: routesLoading,
    error: routesError,
  } = useQuery<BusRoute[], Error>({
    queryKey: ["busRoutes"],
    queryFn: getBusRoutes,
    retry: false,
  });

  // Fetch route shape when a route is selected
  const fetchRouteShape = useCallback(async (routeId: string, route: BusRoute) => {
    if (routeShapes.has(routeId)) return; // Already loaded
    
    setLoadingShapes(prev => new Set(prev).add(routeId));
    
    try {
      const points = await getRouteShape(routeId);
      setRouteShapes(prev => {
        const newMap = new Map(prev);
        newMap.set(routeId, { route, points });
        return newMap;
      });
    } catch (error) {
      console.error(`Failed to load shape for route ${routeId}:`, error);
    } finally {
      setLoadingShapes(prev => {
        const newSet = new Set(prev);
        newSet.delete(routeId);
        return newSet;
      });
    }
  }, [routeShapes]);

  // Toggle route visibility
  const handleToggleRoute = useCallback((routeId: string) => {
    setSelectedRoutes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
        // Fetch shape if not already loaded
        const route = busRoutes.find(r => r.route_id === routeId);
        if (route) {
          fetchRouteShape(routeId, route);
        }
      }
      return newSet;
    });
  }, [busRoutes, fetchRouteShape]);

  // Select all routes
  const handleSelectAll = useCallback(() => {
    const allRouteIds = new Set(busRoutes.map(r => r.route_id));
    setSelectedRoutes(allRouteIds);
    // Fetch all shapes
    busRoutes.forEach(route => {
      fetchRouteShape(route.route_id, route);
    });
  }, [busRoutes, fetchRouteShape]);

  // Deselect all routes
  const handleDeselectAll = useCallback(() => {
    setSelectedRoutes(new Set());
  }, []);

  // Get visible route shapes
  const visibleRouteShapes = new Map<string, RouteShapeData>();
  selectedRoutes.forEach(routeId => {
    const shape = routeShapes.get(routeId);
    if (shape) {
      visibleRouteShapes.set(routeId, shape);
    }
  });

  // Route calculation mutation
  const routeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFrom || !selectedTo) throw new Error("Select both points");
      return getRoute(selectedFrom.lat, selectedFrom.lng, selectedTo.lat, selectedTo.lng);
    },
    onSuccess: (data) => {
      setCurrentRoute(data);
    },
  });

  // Handle map click
  const handleMapClick = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      if (selectingPoint === "from") {
        setSelectedFrom(lngLat);
        setSelectingPoint(null);
        setCurrentRoute(null);
      } else if (selectingPoint === "to") {
        setSelectedTo(lngLat);
        setSelectingPoint(null);
        setCurrentRoute(null);
      }
    },
    [selectingPoint]
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Map Panel */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="h-full relative">
            <MapView
              stops={stops}
              route={currentRoute}
              onMapClick={handleMapClick}
              selectedPoints={{ from: selectedFrom, to: selectedTo }}
              busRouteShapes={visibleRouteShapes}
              allRoutes={busRoutes}
            />
            {selectingPoint && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg">
                Click on the map to set {selectingPoint === "from" ? "origin" : "destination"}
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Side Panel */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <Tabs defaultValue="route" className="h-full flex flex-col">
            <div className="border-b px-2">
              <TabsList className="w-full justify-start h-12 bg-transparent">
                <TabsTrigger value="route" className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Route
                </TabsTrigger>
                <TabsTrigger value="console" className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Console
                </TabsTrigger>
                <TabsTrigger value="layers" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Routes
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="route" className="flex-1 m-0 overflow-hidden">
              <div className="h-full p-4">
                <RoutePanel
                  stops={stops}
                  stopsLoading={stopsLoading}
                  stopsError={stopsError}
                  refetchStops={refetchStops}
                  selectedFrom={selectedFrom}
                  selectedTo={selectedTo}
                  onClearFrom={() => {
                    setSelectedFrom(null);
                    setCurrentRoute(null);
                  }}
                  onClearTo={() => {
                    setSelectedTo(null);
                    setCurrentRoute(null);
                  }}
                  onCalculateRoute={() => routeMutation.mutate()}
                  routeLoading={routeMutation.isPending}
                  routeError={routeMutation.error}
                  selectingPoint={selectingPoint}
                  onSelectingChange={setSelectingPoint}
                />
              </div>
            </TabsContent>

            <TabsContent value="console" className="flex-1 m-0 overflow-hidden">
              <div className="h-full p-4">
                <ApiConsole />
              </div>
            </TabsContent>

            <TabsContent value="layers" className="flex-1 m-0 overflow-hidden">
              <div className="h-full p-4">
                <LayersPanel
                  routes={busRoutes}
                  routesLoading={routesLoading}
                  routesError={routesError}
                  selectedRoutes={selectedRoutes}
                  onToggleRoute={handleToggleRoute}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  loadingShapes={loadingShapes}
                />
              </div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

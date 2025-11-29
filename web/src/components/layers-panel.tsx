"use client";

import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BusRoute, ROUTE_COLORS } from "@/lib/config";
import { Bus, TramFront, Ship, CableCar, Search, Eye, EyeOff, Loader2 } from "lucide-react";

interface LayersPanelProps {
  routes: BusRoute[];
  routesLoading: boolean;
  routesError: Error | null;
  selectedRoutes: Set<string>;
  onToggleRoute: (routeId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  loadingShapes: Set<string>;
}

function getRouteIcon(routeType: number) {
  switch (routeType) {
    case 0: return <TramFront className="h-4 w-4" />;
    case 3: return <Bus className="h-4 w-4" />;
    case 4: return <Ship className="h-4 w-4" />;
    case 7: return <CableCar className="h-4 w-4" />;
    default: return <Bus className="h-4 w-4" />;
  }
}

function getRouteTypeName(routeType: number) {
  switch (routeType) {
    case 0: return "Tram";
    case 3: return "Bus";
    case 4: return "Ferry";
    case 7: return "Cable Car";
    default: return "Transit";
  }
}

function getRouteColor(route: BusRoute, index: number): string {
  if (route.route_color && route.route_color.length > 0) {
    return `#${route.route_color}`;
  }
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

export function LayersPanel({
  routes,
  routesLoading,
  routesError,
  selectedRoutes,
  onToggleRoute,
  onSelectAll,
  onDeselectAll,
  loadingShapes,
}: LayersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const query = searchQuery.toLowerCase();
    return routes.filter(
      (route) =>
        route.route_short_name.toLowerCase().includes(query) ||
        route.route_long_name.toLowerCase().includes(query)
    );
  }, [routes, searchQuery]);

  // Group routes by type
  const groupedRoutes = useMemo(() => {
    const groups: Record<number, BusRoute[]> = {};
    filteredRoutes.forEach((route) => {
      if (!groups[route.route_type]) {
        groups[route.route_type] = [];
      }
      groups[route.route_type].push(route);
    });
    return groups;
  }, [filteredRoutes]);

  if (routesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading routes...</span>
        </div>
      </div>
    );
  }

  if (routesError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-destructive">
          <p className="font-medium">Failed to load routes</p>
          <p className="text-sm text-muted-foreground mt-1">{routesError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header with stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Bus Routes</h3>
          <Badge variant="secondary">{routes.length} routes</Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <Eye className="h-3 w-3" />
            Show All
          </button>
          <button
            onClick={onDeselectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors"
          >
            <EyeOff className="h-3 w-3" />
            Hide All
          </button>
          {selectedRoutes.size > 0 && (
            <Badge variant="outline" className="ml-auto">
              {selectedRoutes.size} visible
            </Badge>
          )}
        </div>
      </div>

      {/* Routes list */}
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-4 pb-4">
          {Object.entries(groupedRoutes)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([typeStr, typeRoutes]) => {
              const routeType = Number(typeStr);
              return (
                <div key={routeType} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground sticky top-0 bg-background py-1">
                    {getRouteIcon(routeType)}
                    <span>{getRouteTypeName(routeType)}</span>
                    <span className="text-xs">({typeRoutes.length})</span>
                  </div>

                  <div className="grid gap-1">
                    {typeRoutes.map((route, index) => {
                      const isSelected = selectedRoutes.has(route.route_id);
                      const isLoading = loadingShapes.has(route.route_id);
                      const color = getRouteColor(route, routes.indexOf(route));

                      return (
                        <button
                          key={route.route_id}
                          onClick={() => onToggleRoute(route.route_id)}
                          disabled={isLoading}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all
                            ${isSelected 
                              ? "bg-primary/10 ring-1 ring-primary/30" 
                              : "hover:bg-muted/50"
                            }
                            ${isLoading ? "opacity-50 cursor-wait" : ""}
                          `}
                        >
                          {/* Color indicator */}
                          <div
                            className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20"
                            style={{ backgroundColor: color }}
                          />

                          {/* Route info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm">
                                {route.route_short_name || route.route_id}
                              </span>
                              {isLoading && (
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {route.route_long_name || route.route_desc || "No description"}
                            </p>
                          </div>

                          {/* Visibility indicator */}
                          <div className={`transition-opacity ${isSelected ? "opacity-100" : "opacity-30"}`}>
                            {isSelected ? (
                              <Eye className="h-4 w-4 text-primary" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {filteredRoutes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No routes found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try a different search term</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}


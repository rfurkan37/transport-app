"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Stop } from "@/lib/config";
import {
  MapPin,
  Navigation,
  Loader2,
  RefreshCw,
  CircleDot,
  Target,
  X,
} from "lucide-react";

interface RoutePanelProps {
  stops: Stop[];
  stopsLoading: boolean;
  stopsError: Error | null;
  refetchStops: () => void;
  selectedFrom: { lng: number; lat: number } | null;
  selectedTo: { lng: number; lat: number } | null;
  onClearFrom: () => void;
  onClearTo: () => void;
  onCalculateRoute: () => void;
  routeLoading: boolean;
  routeError: Error | null;
  selectingPoint: "from" | "to" | null;
  onSelectingChange: (point: "from" | "to" | null) => void;
}

export function RoutePanel({
  stops,
  stopsLoading,
  stopsError,
  refetchStops,
  selectedFrom,
  selectedTo,
  onClearFrom,
  onClearTo,
  onCalculateRoute,
  routeLoading,
  routeError,
  selectingPoint,
  onSelectingChange,
}: RoutePanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            <CardTitle className="text-lg">Route Planner</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={refetchStops}>
            <RefreshCw className={`h-4 w-4 ${stopsLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>
          Click on the map to select points, or use stops below
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Point Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant={selectingPoint === "from" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => onSelectingChange(selectingPoint === "from" ? null : "from")}
            >
              <CircleDot className="h-4 w-4 mr-2 text-green-500" />
              {selectingPoint === "from" ? "Click map..." : "Set Origin"}
            </Button>
            <Button
              variant={selectingPoint === "to" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => onSelectingChange(selectingPoint === "to" ? null : "to")}
            >
              <Target className="h-4 w-4 mr-2 text-red-500" />
              {selectingPoint === "to" ? "Click map..." : "Set Destination"}
            </Button>
          </div>

          {/* Selected Points Display */}
          <div className="space-y-2">
            {selectedFrom && (
              <div className="flex items-center justify-between p-2 rounded-md bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-mono">
                    {selectedFrom.lat.toFixed(4)}, {selectedFrom.lng.toFixed(4)}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearFrom}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            {selectedTo && (
              <div className="flex items-center justify-between p-2 rounded-md bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-mono">
                    {selectedTo.lat.toFixed(4)}, {selectedTo.lng.toFixed(4)}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearTo}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Calculate Route Button */}
          <Button
            className="w-full"
            disabled={!selectedFrom || !selectedTo || routeLoading}
            onClick={onCalculateRoute}
          >
            {routeLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Calculate Route
              </>
            )}
          </Button>

          {routeError && (
            <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {routeError.message}
            </div>
          )}
        </div>

        <Separator />

        {/* Stops List */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Stops
            <Badge variant="secondary">{stops.length}</Badge>
          </span>
        </div>

        {stopsError && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            Failed to load stops: {stopsError.message}
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-4">
            {stopsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : stops.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No stops loaded. Start your backend!
              </div>
            ) : (
              stops.map((stop) => (
                <div
                  key={stop.id}
                  className="p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (selectingPoint === "from") {
                      onSelectingChange(null);
                      // This would need to be connected to parent state
                    } else if (selectingPoint === "to") {
                      onSelectingChange(null);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm">{stop.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {stop.coordinates.lat.toFixed(5)}, {stop.coordinates.lon.toFixed(5)}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {stop.id}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

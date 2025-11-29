// Package handler provides HTTP handlers for the transport API.
package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/rfurkan37/transport-app/backend/internal/geo"
	"github.com/rfurkan37/transport-app/backend/internal/model"
	"github.com/rfurkan37/transport-app/backend/internal/service"
)

// Handler holds dependencies for HTTP handlers.
type Handler struct {
	gtfs     *model.GTFSData
	kentkart *service.KentkartClient
}

// New creates a new Handler with the given dependencies.
func New(gtfs *model.GTFSData, kentkart *service.KentkartClient) *Handler {
	return &Handler{
		gtfs:     gtfs,
		kentkart: kentkart,
	}
}

// Health returns the API health status.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"version": "1.0.0",
	})
}

// Stops response types

type stopsResponse struct {
	Stops []*model.Stop `json:"stops"`
	Count int           `json:"count"`
}

// Stops returns all stops or nearby stops if lat/lon provided.
func (h *Handler) Stops(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	lat := r.URL.Query().Get("lat")
	lon := r.URL.Query().Get("lon")
	radiusStr := r.URL.Query().Get("radius")

	// No location filter - return all stops
	if lat == "" || lon == "" {
		json.NewEncoder(w).Encode(stopsResponse{
			Stops: h.gtfs.StopsList,
			Count: len(h.gtfs.StopsList),
		})
		return
	}

	// Parse coordinates
	latF, err := strconv.ParseFloat(lat, 64)
	if err != nil {
		http.Error(w, "invalid lat parameter", http.StatusBadRequest)
		return
	}
	lonF, err := strconv.ParseFloat(lon, 64)
	if err != nil {
		http.Error(w, "invalid lon parameter", http.StatusBadRequest)
		return
	}

	radius := 500.0 // default 500m
	if radiusStr != "" {
		if radius, err = strconv.ParseFloat(radiusStr, 64); err != nil {
			http.Error(w, "invalid radius parameter", http.StatusBadRequest)
			return
		}
	}

	// Find nearby stops
	nearby := h.findNearbyStops(latF, lonF, radius)
	json.NewEncoder(w).Encode(stopsResponse{
		Stops: nearby,
		Count: len(nearby),
	})
}

// Arrivals response types

type arrivalsResponse struct {
	StopID   string              `json:"stop_id"`
	StopName string              `json:"stop_name"`
	Arrivals []model.StopArrival `json:"arrivals"`
}

// Arrivals returns real-time arrivals for a stop.
func (h *Handler) Arrivals(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	stopID := r.URL.Query().Get("stop_id")
	if stopID == "" {
		http.Error(w, "stop_id parameter required", http.StatusBadRequest)
		return
	}

	stop, ok := h.gtfs.Stops[stopID]
	if !ok {
		http.Error(w, "stop not found", http.StatusNotFound)
		return
	}

	arrivals, err := h.kentkart.GetStopArrivals(stopID, stop.Lat, stop.Lon)
	if err != nil {
		log.Printf("Error fetching arrivals for stop %s: %v", stopID, err)
		http.Error(w, "failed to fetch arrivals", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(arrivalsResponse{
		StopID:   stop.ID,
		StopName: stop.Name,
		Arrivals: arrivals,
	})
}

// Routes response types

type routesResponse struct {
	Routes []*model.Route `json:"routes"`
	Count  int            `json:"count"`
}

// Routes returns all routes.
func (h *Handler) Routes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(routesResponse{
		Routes: h.gtfs.RoutesList,
		Count:  len(h.gtfs.RoutesList),
	})
}

// RouteShape response types

type routeShapeResponse struct {
	RouteID string             `json:"route_id"`
	Points  []model.ShapePoint `json:"points"`
}

// RouteShape returns the shape points for a route.
func (h *Handler) RouteShape(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	routeID := r.URL.Query().Get("route_id")
	if routeID == "" {
		http.Error(w, "route_id parameter required", http.StatusBadRequest)
		return
	}

	route, ok := h.gtfs.Routes[routeID]
	if !ok {
		http.Error(w, "route not found", http.StatusNotFound)
		return
	}

	var shapePoints []model.ShapePoint
	for _, trip := range h.gtfs.Trips {
		if trip.RouteID == route.ID && trip.ShapeID != "" {
			if points, ok := h.gtfs.Shapes[trip.ShapeID]; ok {
				shapePoints = points
				break
			}
		}
	}

	json.NewEncoder(w).Encode(routeShapeResponse{
		RouteID: route.ID,
		Points:  shapePoints,
	})
}

// Helper functions

func (h *Handler) findNearbyStops(lat, lon, radiusMeters float64) []*model.Stop {
	var nearby []*model.Stop
	for _, stop := range h.gtfs.StopsList {
		if geo.HaversineDistance(lat, lon, stop.Lat, stop.Lon) <= radiusMeters {
			nearby = append(nearby, stop)
		}
	}
	return nearby
}

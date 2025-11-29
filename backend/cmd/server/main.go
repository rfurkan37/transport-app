// Package main is the entry point for the transport API server.
package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/rfurkan37/transport-app/backend/internal/handler"
	"github.com/rfurkan37/transport-app/backend/internal/service"
	"github.com/rs/cors"
)

func main() {
	// Determine data directory
	dataDir := os.Getenv("GTFS_DATA_DIR")
	if dataDir == "" {
		dataDir = filepath.Join("..", "..", "data", "kocaeli_transport_data")
	}

	// Load GTFS data
	log.Printf("Loading GTFS data from %s...\n", dataDir)
	gtfsData, err := service.LoadGTFS(dataDir)
	if err != nil {
		log.Fatalf("Failed to load GTFS data: %v", err)
	}
	log.Println("GTFS data loaded successfully!")

	// Create services and handler
	kentkartClient := service.NewKentkartClient()
	h := handler.New(gtfsData, kentkartClient)

	// Set up routes
	mux := http.NewServeMux()
	mux.HandleFunc("/health", h.Health)
	mux.HandleFunc("/stops", h.Stops)
	mux.HandleFunc("/stops/arrivals", h.Arrivals)
	mux.HandleFunc("/routes", h.Routes)
	mux.HandleFunc("/route/shape", h.RouteShape)

	// Enable CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}).Handler(mux)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on :%s\n", port)
	log.Println("Endpoints:")
	log.Println("  GET /health              - Health check")
	log.Println("  GET /stops               - List all stops (or nearby with lat/lon/radius)")
	log.Println("  GET /stops/arrivals      - Real-time arrivals for a stop")
	log.Println("  GET /routes              - List all routes")
	log.Println("  GET /route/shape         - Get shape points for a route")

	if err := http.ListenAndServe(":"+port, corsHandler); err != nil {
		log.Fatal(err)
	}
}

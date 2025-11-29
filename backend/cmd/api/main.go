package main

import (
	"log"
	"net/http"

	"github.com/rs/cors"
)

func main() {
	mux := http.NewServeMux()

	// Define your Integration Points (Routes)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Backend is running!"))
	})

	// Enable CORS (Allows your Phone/Emulator to talk to Localhost)
	handler := cors.Default().Handler(mux)

	log.Println("Starting server on :8080...")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}

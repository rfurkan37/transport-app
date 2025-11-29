// Package service contains business logic for the transport API.
package service

import (
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"

	"github.com/rfurkan37/transport-app/backend/internal/model"
)

// LoadGTFS loads all GTFS data from a directory.
func LoadGTFS(dataDir string) (*model.GTFSData, error) {
	data := model.NewGTFSData()

	loaders := []struct {
		file string
		load func(string, *model.GTFSData) error
		req  bool
	}{
		{"agency.csv", loadAgencies, true},
		{"stops.csv", loadStops, true},
		{"routes.csv", loadRoutes, true},
		{"trips.csv", loadTrips, true},
		{"calendar.csv", loadCalendar, true},
		{"shapes.csv", loadShapes, true},
		{"places.csv", loadPlaces, false},
	}

	for _, l := range loaders {
		path := filepath.Join(dataDir, l.file)
		if err := l.load(path, data); err != nil {
			if l.req {
				return nil, fmt.Errorf("loading %s: %w", l.file, err)
			}
			fmt.Printf("Warning: %s not loaded: %v\n", l.file, err)
		}
	}

	// Build lists for iteration
	for _, stop := range data.Stops {
		data.StopsList = append(data.StopsList, stop)
	}
	for _, route := range data.Routes {
		data.RoutesList = append(data.RoutesList, route)
	}

	return data, nil
}

// CSV reading helpers

func readCSV(path string) ([][]string, map[string]int, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, nil, err
	}

	if len(records) == 0 {
		return nil, nil, fmt.Errorf("empty CSV file")
	}

	header := make(map[string]int)
	for i, col := range records[0] {
		header[col] = i
	}

	return records[1:], header, nil
}

func getField(record []string, header map[string]int, field string) string {
	if idx, ok := header[field]; ok && idx < len(record) {
		return record[idx]
	}
	return ""
}

func getFieldFloat(record []string, header map[string]int, field string) float64 {
	if s := getField(record, header, field); s != "" {
		if f, err := strconv.ParseFloat(s, 64); err == nil {
			return f
		}
	}
	return 0
}

func getFieldInt(record []string, header map[string]int, field string) int {
	if s := getField(record, header, field); s != "" {
		if i, err := strconv.Atoi(s); err == nil {
			return i
		}
	}
	return 0
}

// Individual loaders

func loadAgencies(path string, data *model.GTFSData) error {
	records, header, err := readCSV(path)
	if err != nil {
		return err
	}

	for _, r := range records {
		agency := &model.Agency{
			ID:       getField(r, header, "agency_id"),
			Name:     getField(r, header, "agency_name"),
			URL:      getField(r, header, "agency_url"),
			Timezone: getField(r, header, "agency_timezone"),
			Lang:     getField(r, header, "agency_lang"),
		}
		data.Agencies[agency.ID] = agency
	}

	fmt.Printf("Loaded %d agencies\n", len(data.Agencies))
	return nil
}

func loadStops(path string, data *model.GTFSData) error {
	records, header, err := readCSV(path)
	if err != nil {
		return err
	}

	for _, r := range records {
		stop := &model.Stop{
			ID:                 getField(r, header, "stop_id"),
			Name:               getField(r, header, "stop_name"),
			Lat:                getFieldFloat(r, header, "stop_lat"),
			Lon:                getFieldFloat(r, header, "stop_lon"),
			WheelchairBoarding: getFieldInt(r, header, "wheelchair_boarding"),
			URL:                getField(r, header, "stop_url"),
			LocationType:       getFieldInt(r, header, "location_type"),
			ParentStation:      getField(r, header, "parent_station"),
		}
		data.Stops[stop.ID] = stop
	}

	fmt.Printf("Loaded %d stops\n", len(data.Stops))
	return nil
}

func loadRoutes(path string, data *model.GTFSData) error {
	records, header, err := readCSV(path)
	if err != nil {
		return err
	}

	for _, r := range records {
		route := &model.Route{
			ID:        getField(r, header, "route_id"),
			AgencyID:  getField(r, header, "agency_id"),
			ShortName: getField(r, header, "route_short_name"),
			LongName:  getField(r, header, "route_long_name"),
			Type:      getFieldInt(r, header, "route_type"),
			Desc:      getField(r, header, "route_desc"),
			Color:     getField(r, header, "route_color"),
			TextColor: getField(r, header, "route_text_color"),
			URL:       getField(r, header, "route_url"),
		}
		data.Routes[route.ID] = route
	}

	fmt.Printf("Loaded %d routes\n", len(data.Routes))
	return nil
}

func loadTrips(path string, data *model.GTFSData) error {
	records, header, err := readCSV(path)
	if err != nil {
		return err
	}

	for _, r := range records {
		trip := &model.Trip{
			RouteID:              getField(r, header, "route_id"),
			ServiceID:            getField(r, header, "service_id"),
			TripID:               getField(r, header, "trip_id"),
			DirectionID:          getFieldInt(r, header, "direction_id"),
			ShapeID:              getField(r, header, "shape_id"),
			Headsign:             getField(r, header, "trip_headsign"),
			ShortName:            getField(r, header, "trip_short_name"),
			WheelchairAccessible: getFieldInt(r, header, "wheelchair_accessible"),
			BikesAllowed:         getFieldInt(r, header, "bikes_allowed"),
		}
		data.Trips[trip.TripID] = trip
	}

	fmt.Printf("Loaded %d trips\n", len(data.Trips))
	return nil
}

func loadCalendar(path string, data *model.GTFSData) error {
	records, header, err := readCSV(path)
	if err != nil {
		return err
	}

	for _, r := range records {
		cal := &model.Calendar{
			ServiceID: getField(r, header, "service_id"),
			Monday:    getFieldInt(r, header, "monday"),
			Tuesday:   getFieldInt(r, header, "tuesday"),
			Wednesday: getFieldInt(r, header, "wednesday"),
			Thursday:  getFieldInt(r, header, "thursday"),
			Friday:    getFieldInt(r, header, "friday"),
			Saturday:  getFieldInt(r, header, "saturday"),
			Sunday:    getFieldInt(r, header, "sunday"),
			StartDate: getField(r, header, "start_date"),
			EndDate:   getField(r, header, "end_date"),
		}
		data.Calendars[cal.ServiceID] = cal
	}

	fmt.Printf("Loaded %d calendar entries\n", len(data.Calendars))
	return nil
}

func loadShapes(path string, data *model.GTFSData) error {
	records, header, err := readCSV(path)
	if err != nil {
		return err
	}

	for _, r := range records {
		point := model.ShapePoint{
			ShapeID:  getField(r, header, "shape_id"),
			Lat:      getFieldFloat(r, header, "shape_pt_lat"),
			Lon:      getFieldFloat(r, header, "shape_pt_lon"),
			Sequence: getFieldInt(r, header, "shape_pt_sequence"),
		}
		data.Shapes[point.ShapeID] = append(data.Shapes[point.ShapeID], point)
	}

	// Sort shape points by sequence
	for shapeID := range data.Shapes {
		sort.Slice(data.Shapes[shapeID], func(i, j int) bool {
			return data.Shapes[shapeID][i].Sequence < data.Shapes[shapeID][j].Sequence
		})
	}

	fmt.Printf("Loaded %d shapes\n", len(data.Shapes))
	return nil
}

func loadPlaces(path string, data *model.GTFSData) error {
	records, header, err := readCSV(path)
	if err != nil {
		return err
	}

	for _, r := range records {
		place := &model.Place{
			ID:   getField(r, header, "place_id"),
			Name: getField(r, header, "place_name"),
			Lat:  getFieldFloat(r, header, "place_lat"),
			Lon:  getFieldFloat(r, header, "place_lon"),
			Type: getField(r, header, "place_type"),
		}
		if place.ID != "" {
			data.Places[place.ID] = place
		}
	}

	fmt.Printf("Loaded %d places\n", len(data.Places))
	return nil
}

// Package model defines all data structures for the transport API.
package model

// Agency represents a transit agency from GTFS agency.csv
type Agency struct {
	ID       string `json:"agency_id"`
	Name     string `json:"agency_name"`
	URL      string `json:"agency_url"`
	Timezone string `json:"agency_timezone"`
	Lang     string `json:"agency_lang"`
}

// Stop represents a transit stop from GTFS stops.csv
type Stop struct {
	ID                 string  `json:"stop_id"`
	Name               string  `json:"stop_name"`
	Lat                float64 `json:"stop_lat"`
	Lon                float64 `json:"stop_lon"`
	WheelchairBoarding int     `json:"wheelchair_boarding"`
	URL                string  `json:"stop_url,omitempty"`
	LocationType       int     `json:"location_type"`
	ParentStation      string  `json:"parent_station,omitempty"`
}

// Route represents a transit route from GTFS routes.csv
type Route struct {
	ID        string `json:"route_id"`
	AgencyID  string `json:"agency_id"`
	ShortName string `json:"route_short_name"`
	LongName  string `json:"route_long_name"`
	Type      int    `json:"route_type"` // 0=tram, 3=bus, 4=ferry, 7=cable car
	Desc      string `json:"route_desc,omitempty"`
	Color     string `json:"route_color,omitempty"`
	TextColor string `json:"route_text_color,omitempty"`
	URL       string `json:"route_url,omitempty"`
}

// Trip represents a trip from GTFS trips.csv
type Trip struct {
	RouteID              string `json:"route_id"`
	ServiceID            string `json:"service_id"`
	TripID               string `json:"trip_id"`
	DirectionID          int    `json:"direction_id"`
	ShapeID              string `json:"shape_id"`
	Headsign             string `json:"trip_headsign,omitempty"`
	ShortName            string `json:"trip_short_name,omitempty"`
	WheelchairAccessible int    `json:"wheelchair_accessible"`
	BikesAllowed         int    `json:"bikes_allowed"`
}

// Calendar represents service days from GTFS calendar.csv
type Calendar struct {
	ServiceID string `json:"service_id"`
	Monday    int    `json:"monday"`
	Tuesday   int    `json:"tuesday"`
	Wednesday int    `json:"wednesday"`
	Thursday  int    `json:"thursday"`
	Friday    int    `json:"friday"`
	Saturday  int    `json:"saturday"`
	Sunday    int    `json:"sunday"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

// ShapePoint represents a point in a route shape from GTFS shapes.csv
type ShapePoint struct {
	ShapeID  string  `json:"shape_id"`
	Lat      float64 `json:"shape_pt_lat"`
	Lon      float64 `json:"shape_pt_lon"`
	Sequence int     `json:"shape_pt_sequence"`
}

// Place represents a transit card kiosk from places.csv
type Place struct {
	ID   string  `json:"place_id"`
	Name string  `json:"place_name"`
	Lat  float64 `json:"place_lat"`
	Lon  float64 `json:"place_lon"`
	Type string  `json:"place_type"`
}

// GTFSData holds all loaded GTFS data in memory
type GTFSData struct {
	Agencies  map[string]*Agency
	Stops     map[string]*Stop
	Routes    map[string]*Route
	Trips     map[string]*Trip
	Calendars map[string]*Calendar
	Shapes    map[string][]ShapePoint
	Places    map[string]*Place

	// Slices for iteration
	StopsList  []*Stop
	RoutesList []*Route
}

// NewGTFSData creates an empty GTFSData structure
func NewGTFSData() *GTFSData {
	return &GTFSData{
		Agencies:  make(map[string]*Agency),
		Stops:     make(map[string]*Stop),
		Routes:    make(map[string]*Route),
		Trips:     make(map[string]*Trip),
		Calendars: make(map[string]*Calendar),
		Shapes:    make(map[string][]ShapePoint),
		Places:    make(map[string]*Place),
	}
}

// StopArrival represents a bus arrival at a stop
type StopArrival struct {
	RouteCode   string `json:"route_code"`
	RouteName   string `json:"route_name"`
	RouteColor  string `json:"route_color"`
	Direction   string `json:"direction"`
	RouteType   string `json:"route_type"`
	ArrivalTime string `json:"arrival_time"`
	Headsign    string `json:"headsign"`
}

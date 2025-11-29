package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/rfurkan37/transport-app/backend/internal/model"
)

const (
	kentkartBaseURL = "https://service.kentkart.com/rl1/web"
	kocaeliRegion   = "004"
)

// KentkartClient handles communication with the Kentkart API.
type KentkartClient struct {
	httpClient *http.Client
	region     string
}

// NewKentkartClient creates a new Kentkart API client.
func NewKentkartClient() *KentkartClient {
	return &KentkartClient{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		region:     kocaeliRegion,
	}
}

// Kentkart API response types

type nearestBusResponse struct {
	Result    kentkartResult `json:"result"`
	StopInfo  stopInfo       `json:"stopInfo"`
	BusList   []busInfo      `json:"busList"`
	RouteList []routeInfo    `json:"routeList"`
}

type kentkartResult struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type stopInfo struct {
	BusStopID   string `json:"busStopid"`
	BusStopName string `json:"busStopName"`
	Lat         string `json:"lat"`
	Lng         string `json:"lng"`
}

type busInfo struct {
	BusID       string `json:"busId"`
	RouteCode   string `json:"routeCode"`
	Lat         string `json:"lat"`
	Lng         string `json:"lng"`
	ArrivalTime string `json:"arrivalTime"`
}

type routeInfo struct {
	RouteCode           string `json:"routeCode"`
	DisplayRouteCode    string `json:"displayRouteCode"`
	Name                string `json:"name"`
	HeadSign            string `json:"headSign"`
	RouteColor          string `json:"routeColor"`
	Direction           string `json:"direction"`
	RouteType           string `json:"routeType"`
	RouteTextColor      string `json:"routeTextColor"`
	StopArrivalTime     string `json:"stopArrivalTime"`
	NextTripArrivalTime string `json:"nextTripArrivalTime"`
}

// GetStopArrivals fetches real-time arrivals for a stop.
func (c *KentkartClient) GetStopArrivals(stopID string, lat, lon float64) ([]model.StopArrival, error) {
	resp, err := c.getNearestBus(stopID, lat, lon)
	if err != nil {
		return nil, err
	}

	arrivals := make([]model.StopArrival, 0, len(resp.RouteList))
	for _, route := range resp.RouteList {
		arrivalTime := route.NextTripArrivalTime
		if arrivalTime == "" {
			arrivalTime = route.StopArrivalTime
		}

		arrivals = append(arrivals, model.StopArrival{
			RouteCode:   route.DisplayRouteCode,
			RouteName:   route.Name,
			RouteColor:  route.RouteColor,
			Direction:   route.Direction,
			RouteType:   route.RouteType,
			ArrivalTime: arrivalTime,
			Headsign:    route.HeadSign,
		})
	}

	return arrivals, nil
}

func (c *KentkartClient) getNearestBus(stopID string, lat, lon float64) (*nearestBusResponse, error) {
	params := url.Values{}
	params.Set("region", c.region)
	params.Set("lang", "tr")
	params.Set("authType", "4")
	params.Set("accuracy", "0")
	params.Set("lat", fmt.Sprintf("%f", lat))
	params.Set("lng", fmt.Sprintf("%f", lon))
	params.Set("busStopId", stopID)

	reqURL := fmt.Sprintf("%s/nearest/bus?%s", kentkartBaseURL, params.Encode())

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Origin", "https://m.kentkart.com")
	req.Header.Set("Referer", "https://m.kentkart.com/")
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; TransportApp/1.0)")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	var result nearestBusResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parsing response: %w", err)
	}

	return &result, nil
}

# 🖥️ Transit Dev Dashboard

A modern web-based development dashboard for testing and debugging the Open Transit Route Finder. Built with Next.js 14, shadcn/ui, and MapLibre GL JS.

## Purpose

This dashboard provides a full-screen map interface for backend developers to:

- **Visualize transit stops** loaded from the backend API
- **Test route calculations** by clicking origin/destination on the map
- **Debug API endpoints** with the built-in API console
- **Inspect responses** in real-time with request timing

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Modern UI components |
| **MapLibre GL JS** | Open-source map rendering |
| **TanStack Query** | Data fetching and caching |
| **Lucide Icons** | Beautiful icons |

## Getting Started

### Prerequisites

- Node.js 18+
- Backend server running on `http://localhost:8080`

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Features

### 🗺️ Interactive Map

- Full-screen MapLibre map with dark theme
- Click to select origin/destination points
- Stop markers with popups showing details
- Route visualization as GeoJSON lines
- Zoom, pan, and geolocation controls

### 🧭 Route Planner

- Set origin and destination by clicking the map
- View selected coordinates
- Calculate routes via backend API
- See route drawn on map

### 🔧 API Console

- Test any API endpoint directly
- Quick buttons for common endpoints
- Request/response logging with timing
- JSON response formatting
- Error handling display

### 📊 Status Monitoring

- Real-time backend health checking
- Visual indicator for API connectivity
- Auto-refresh every 10 seconds

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── globals.css       # Global styles + MapLibre fixes
│   │   ├── layout.tsx        # Root layout with providers
│   │   └── page.tsx          # Main dashboard page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── api-console.tsx   # API testing panel
│   │   ├── header.tsx        # Top navigation bar
│   │   ├── map-view.tsx      # MapLibre map component
│   │   ├── providers.tsx     # React Query provider
│   │   └── route-panel.tsx   # Route planning panel
│   └── lib/
│       ├── api.ts            # API client functions
│       ├── config.ts         # Configuration and types
│       └── utils.ts          # Utility functions
├── package.json
└── tsconfig.json
```

## Usage

### Testing Stops

1. Start your backend: `cd ../backend && go run ./cmd/api/`
2. Start the dashboard: `npm run dev`
3. Open http://localhost:3000
4. Stops will automatically load and display on the map

### Testing Routes

1. Click "Set Origin" button
2. Click on the map to place the origin (green circle)
3. Click "Set Destination" button
4. Click on the map to place the destination (red pin)
5. Click "Calculate Route"
6. Route will be drawn on the map (green line)

### API Debugging

1. Switch to the "Console" tab
2. Use quick buttons or enter custom endpoint
3. Click send to execute request
4. View response with status code and timing

## Development Tips

### Adding Mock Data

For testing without a backend, modify `src/lib/api.ts`:

```typescript
export async function getStops(): Promise<Stop[]> {
  // Return mock data for testing
  return [
    { id: "1", name: "Mock Stop", coordinates: { lat: 40.7128, lon: -74.006 } }
  ];
}
```

### Custom Map Style

Change the map style in `src/lib/config.ts`:

```typescript
export const MAP_CONFIG = {
  styleUrl: "your-maplibre-style-url",
  // ...
};
```

## License

MIT License - See [LICENSE](../LICENSE) for details.

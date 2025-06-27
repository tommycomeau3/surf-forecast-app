<<<<<<< HEAD
# 🏄‍♂️ California Surf Forecast App

A comprehensive web application that aggregates surf forecasts from multiple APIs and ranks California surf spots based on user preferences including skill level, wave height, and wind tolerance.

## Features

- **Location-Based Search**: Automatic geolocation detection or manual location entry
- **User Preferences**: Customizable skill level, wave height range, and wind tolerance
- **Smart Ranking**: AI-powered ranking algorithm that scores surf spots based on current conditions and user preferences
- **Real-Time Forecasts**: Integration with Stormglass and OpenWeatherMap APIs
- **Detailed Spot Information**: Comprehensive forecast data, spot characteristics, and safety tips
- **Responsive Design**: Optimized for desktop and mobile devices

## Technology Stack

### Frontend
- **React.js** - Modern UI framework with hooks
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Custom styling with responsive design

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **Axios** - HTTP client for external APIs

### APIs
- **Stormglass API** - Marine weather data
- **OpenWeatherMap API** - Weather data
- **Nominatim** - Geocoding service

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd surf-forecast-app
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb surf_forecast
   
   # Run the initialization script
   psql -d surf_forecast -f server/src/models/init.sql
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp server/.env.example server/.env
   
   # Edit server/.env with your configuration:
   # - Database credentials
   # - API keys (optional for development)
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

## Environment Configuration

### Server Environment Variables (server/.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=surf_forecast
DB_USER=your_username
DB_PASSWORD=your_password

# API Keys (Optional - app works without them but with limited data)
STORMGLASS_API_KEY=your_stormglass_api_key
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key

# Cache Configuration
FORECAST_CACHE_DURATION=7200000
```

### Client Environment Variables (client/.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## API Keys Setup (Optional)

The application can work without API keys using mock data, but for real forecast data:

### Stormglass API
1. Sign up at [stormglass.io](https://stormglass.io)
2. Get your free API key (10 requests/day)
3. Add to `server/.env` as `STORMGLASS_API_KEY`

### OpenWeatherMap API
1. Sign up at [openweathermap.org](https://openweathermap.org/api)
2. Get your free API key (1000 requests/day)
3. Add to `server/.env` as `OPENWEATHERMAP_API_KEY`

## Database Schema

The application uses three main tables:

- **surf_spots**: California surf spot locations and characteristics
- **user_preferences**: User settings and preferences
- **forecast_cache**: Cached forecast data to minimize API calls

## Architecture

### Frontend Architecture
```
client/src/
├── components/          # React components
│   ├── Header.js       # Navigation header
│   ├── LocationSelector.js  # Location input/detection
│   ├── PreferencesForm.js   # User preferences form
│   ├── SpotList.js     # Ranked surf spots list
│   └── SpotDetail.js   # Individual spot details
├── services/           # API communication
│   └── apiService.js   # Backend API client
├── utils/              # Utility functions
│   └── sessionUtils.js # Session management
└── App.js              # Main application component
```

### Backend Architecture
```
server/src/
├── routes/             # API endpoints
│   ├── spots.js        # Surf spots CRUD
│   ├── preferences.js  # User preferences
│   └── forecast.js     # Forecast and ranking
├── services/           # Business logic
│   ├── forecastService.js  # API integrations
│   └── rankingService.js   # Spot ranking algorithm
├── models/             # Database models
│   ├── database.js     # Database connection
│   └── init.sql        # Database schema
└── index.js            # Express server setup
```

## Ranking Algorithm

The application uses a weighted scoring system:

- **Wave Height Match (40%)**: How well the current wave height matches user preferences
- **Wind Conditions (30%)**: Offshore winds are preferred, onshore winds penalized
- **Skill Level Compatibility (20%)**: Matches spot difficulty with user skill level
- **Distance (10%)**: Closer spots get slight preference

## Development

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend in development mode
npm run dev

# Start only the backend server
npm run server:dev

# Start only the frontend
npm run client:dev

# Build for production
npm run build

# Start production server
npm start
```

### Adding New Surf Spots

To add new surf spots to the database:

```sql
INSERT INTO surf_spots (name, latitude, longitude, region, break_type, difficulty_level) 
VALUES ('Spot Name', lat, lng, 'Region', 'break_type', 'difficulty_level');
```

## Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd client && npm run build
   ```

2. **Set up production environment**
   - Configure production database
   - Set environment variables
   - Set up reverse proxy (nginx recommended)

3. **Start the production server**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Surf forecast data provided by Stormglass and OpenWeatherMap
- Geocoding services by Nominatim/OpenStreetMap
- California surf spot data compiled from various public sources

## Support

For support, please open an issue on GitHub or contact the development team.

---

**Happy Surfing! 🏄‍♂️🌊**
=======
# surf-forecast-app
>>>>>>> 044503f55b3188737c3bff6159616eca396e3309

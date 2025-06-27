-- Create database tables for surf forecast app

-- Surf spots table
CREATE TABLE IF NOT EXISTS surf_spots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    region VARCHAR(100) NOT NULL,
    break_type VARCHAR(50),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    min_wave_height DECIMAL(4, 2) DEFAULT 0,
    max_wave_height DECIMAL(4, 2) DEFAULT 20,
    max_wind_speed DECIMAL(4, 2) DEFAULT 25,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    max_distance_km INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forecast cache table
CREATE TABLE IF NOT EXISTS forecast_cache (
    id SERIAL PRIMARY KEY,
    spot_id INTEGER REFERENCES surf_spots(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    wave_height DECIMAL(4, 2),
    wave_period DECIMAL(4, 2),
    wind_speed DECIMAL(4, 2),
    wind_direction INTEGER,
    tide_height DECIMAL(4, 2),
    forecast_time TIMESTAMP NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_surf_spots_location ON surf_spots(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_forecast_cache_spot_time ON forecast_cache(spot_id, forecast_time);
CREATE INDEX IF NOT EXISTS idx_user_preferences_session ON user_preferences(session_id);

-- Insert sample California surf spots
INSERT INTO surf_spots (name, latitude, longitude, region, break_type, difficulty_level) VALUES
-- Northern California
('Ocean Beach', 37.7694, -122.5107, 'Northern California', 'beach_break', 'intermediate'),
('Mavericks', 37.4914, -122.5014, 'Northern California', 'reef_break', 'advanced'),
('Santa Cruz - Steamer Lane', 36.9541, -122.0263, 'Northern California', 'point_break', 'intermediate'),
('Pacifica - Linda Mar', 37.5847, -122.4906, 'Northern California', 'beach_break', 'beginner'),

-- Central California
('Morro Bay', 35.3669, -120.8499, 'Central California', 'beach_break', 'beginner'),
('Pismo Beach', 35.1428, -120.6413, 'Central California', 'beach_break', 'beginner'),
('Jalama Beach', 34.5014, -120.5058, 'Central California', 'beach_break', 'intermediate'),

-- Southern California
('Malibu - Surfrider Beach', 34.0359, -118.6767, 'Southern California', 'point_break', 'intermediate'),
('Manhattan Beach', 33.8847, -118.4109, 'Southern California', 'beach_break', 'beginner'),
('Huntington Beach', 33.6595, -117.9988, 'Southern California', 'beach_break', 'beginner'),
('Trestles', 33.3897, -117.5547, 'Southern California', 'point_break', 'intermediate'),
('La Jolla - Windansea', 32.8328, -117.2713, 'Southern California', 'reef_break', 'advanced'),
('Swamis', 33.0370, -117.2920, 'Southern California', 'reef_break', 'intermediate')

ON CONFLICT DO NOTHING;
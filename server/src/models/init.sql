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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_spot_name_region UNIQUE (name, region)
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

-- Insert surf spots from various regions
INSERT INTO surf_spots (name, latitude, longitude, region, break_type, difficulty_level) VALUES
-- Northern California
('Ocean Beach', 37.7694, -122.5107, 'Northern California', 'beach_break', 'intermediate'),
('Mavericks', 37.4914, -122.5014, 'Northern California', 'reef_break', 'advanced'),
('Santa Cruz - Steamer Lane', 36.9541, -122.0263, 'Northern California', 'point_break', 'intermediate'),
('Pacifica - Linda Mar', 37.5847, -122.4906, 'Northern California', 'beach_break', 'beginner'),
('Half Moon Bay', 37.4636, -122.4286, 'Northern California', 'beach_break', 'intermediate'),
('Bolinas', 37.9085, -122.6861, 'Northern California', 'beach_break', 'intermediate'),
('Pleasure Point', 36.9697, -121.9558, 'Northern California', 'reef_break', 'intermediate'),

-- Central California
('Morro Bay', 35.3669, -120.8499, 'Central California', 'beach_break', 'beginner'),
('Pismo Beach', 35.1428, -120.6413, 'Central California', 'beach_break', 'beginner'),
('Jalama Beach', 34.5014, -120.5058, 'Central California', 'beach_break', 'intermediate'),
('Cayucos', 35.4419, -120.8919, 'Central California', 'beach_break', 'beginner'),
('Avila Beach', 35.1808, -120.7319, 'Central California', 'beach_break', 'beginner'),
('Surf Beach', 34.7369, -120.6058, 'Central California', 'beach_break', 'intermediate'),

-- Southern California
('Malibu - Surfrider Beach', 34.0359, -118.6767, 'Southern California', 'point_break', 'intermediate'),
('Manhattan Beach', 33.8847, -118.4109, 'Southern California', 'beach_break', 'beginner'),
('Huntington Beach', 33.6595, -117.9988, 'Southern California', 'beach_break', 'beginner'),
('Trestles', 33.3897, -117.5547, 'Southern California', 'point_break', 'intermediate'),
('La Jolla - Windansea', 32.8328, -117.2713, 'Southern California', 'reef_break', 'advanced'),
('Swamis', 33.0370, -117.2920, 'Southern California', 'reef_break', 'intermediate'),
('Venice Beach', 33.9850, -118.4695, 'Southern California', 'beach_break', 'beginner'),
('El Segundo', 33.9192, -118.4165, 'Southern California', 'beach_break', 'beginner'),
('Redondo Beach', 33.8439, -118.3931, 'Southern California', 'beach_break', 'beginner'),
('Palos Verdes', 33.7617, -118.4109, 'Southern California', 'reef_break', 'advanced'),
('San Onofre', 33.3697, -117.5547, 'Southern California', 'beach_break', 'beginner'),
('Cardiff Reef', 33.0153, -117.2797, 'Southern California', 'reef_break', 'intermediate'),
('Blacks Beach', 32.8897, -117.2514, 'Southern California', 'beach_break', 'advanced'),

-- Hawaii
('Pipeline', 21.6597, -158.0497, 'Hawaii', 'reef_break', 'advanced'),
('Waikiki', 21.2697, -157.8197, 'Hawaii', 'reef_break', 'beginner'),
('Sunset Beach', 21.6747, -158.0397, 'Hawaii', 'beach_break', 'advanced'),
('Hanauma Bay', 21.2697, -157.6947, 'Hawaii', 'reef_break', 'intermediate'),
('Makaha', 21.4697, -158.2197, 'Hawaii', 'beach_break', 'intermediate'),
('Haleiwa', 21.5947, -158.1097, 'Hawaii', 'reef_break', 'intermediate'),
('Honolua Bay', 21.0197, -156.6397, 'Hawaii', 'reef_break', 'advanced'),

-- Oregon
('Cannon Beach', 45.8917, -123.9614, 'Oregon', 'beach_break', 'intermediate'),
('Lincoln City', 44.9581, -124.0178, 'Oregon', 'beach_break', 'beginner'),
('Newport', 44.6369, -124.0531, 'Oregon', 'beach_break', 'intermediate'),
('Seaside', 45.9931, -123.9231, 'Oregon', 'beach_break', 'beginner'),

-- Washington
('Westport', 46.9042, -124.1053, 'Washington', 'beach_break', 'intermediate'),
('La Push', 47.9131, -124.6364, 'Washington', 'beach_break', 'advanced'),

-- Florida
('Cocoa Beach', 28.3200, -80.6075, 'Florida', 'beach_break', 'beginner'),
('New Smyrna Beach', 29.0258, -80.9270, 'Florida', 'beach_break', 'intermediate'),
('Sebastian Inlet', 27.8628, -80.4492, 'Florida', 'reef_break', 'intermediate'),
('Jacksonville Beach', 30.2936, -81.3964, 'Florida', 'beach_break', 'beginner'),

-- North Carolina
('Cape Hatteras', 35.2269, -75.6197, 'North Carolina', 'beach_break', 'intermediate'),
('Wrightsville Beach', 34.2086, -77.7964, 'North Carolina', 'beach_break', 'beginner'),

-- New York
('Montauk', 41.0486, -71.9581, 'New York', 'beach_break', 'intermediate'),
('Rockaway Beach', 40.5831, -73.8153, 'New York', 'beach_break', 'beginner'),

-- New Jersey
('Manasquan Inlet', 40.1031, -74.0364, 'New Jersey', 'beach_break', 'intermediate'),
('Ocean City', 39.2775, -74.5742, 'New Jersey', 'beach_break', 'beginner')

ON CONFLICT (name, region) DO NOTHING;
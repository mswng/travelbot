USE ai_tour_guide;

CREATE TABLE IF NOT EXISTS places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    place_id VARCHAR(255) UNIQUE,          -- Google Place ID (dùng để dedup)
    name VARCHAR(500) NOT NULL,
    description TEXT,
    address VARCHAR(1000),
    city VARCHAR(200),
    country VARCHAR(100) DEFAULT 'Vietnam',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2),
    total_ratings INT DEFAULT 0,
    price_level INT,                       -- 0-4 (Google scale)
    price_range VARCHAR(200),              -- text mô tả giá
    opening_hours TEXT,                    -- JSON string
    phone VARCHAR(50),
    website VARCHAR(500),
    place_type VARCHAR(100),
    source VARCHAR(50),                    -- google/foursquare/tripadvisor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_rating (rating),
    INDEX idx_place_type (place_type)
);

CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    place_id VARCHAR(255),
    cuisine_type VARCHAR(200),
    menu_highlights TEXT,
    avg_price_per_person DECIMAL(10, 2),
    delivery_available BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    place_id VARCHAR(255),
    photo_url TEXT,
    FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE
);
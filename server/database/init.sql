-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'user' or 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create EvaluationMetrics table
CREATE TABLE IF NOT EXISTS EvaluationMetrics (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id),
    test_type VARCHAR(50) NOT NULL,
    score FLOAT NOT NULL,
    total FLOAT NOT NULL,
    details TEXT, -- JSON string of the evaluation details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user if not exists
INSERT INTO Users (name, email, password_hash, role)
SELECT 'Admin User', 'admin@upsc.com', '$2b$10$Lk4YZ09s6TC1d5F8GREAh.pG3tP4ByxyxM.6P6D.sSPYkaya3gNCq', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE email = 'admin@upsc.com');

-- Create Streaks table
CREATE TABLE IF NOT EXISTS Streaks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id),
    current_streak INT DEFAULT 0,
    highest_streak INT DEFAULT 0,
    last_test_date VARCHAR(50),
    completed_today BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create SavedFlashcards table
CREATE TABLE IF NOT EXISTS SavedFlashcards (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    topic VARCHAR(255),
    subject VARCHAR(255),
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create TokenUsage table
CREATE TABLE IF NOT EXISTS TokenUsage (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id),
    tokens_used INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create SystemLogs table
CREATE TABLE IF NOT EXISTS SystemLogs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    meta TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

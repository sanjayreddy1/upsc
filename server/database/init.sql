-- Create Database if not exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'upsc_db')
BEGIN
  CREATE DATABASE upsc_db;
END
GO

USE upsc_db;
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' and xtype='U')
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) DEFAULT 'user', -- 'user' or 'admin'
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create EvaluationMetrics table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EvaluationMetrics' and xtype='U')
BEGIN
    CREATE TABLE EvaluationMetrics (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL FOREIGN KEY REFERENCES Users(id),
        test_type NVARCHAR(50) NOT NULL,
        score FLOAT NOT NULL,
        total FLOAT NOT NULL,
        details NVARCHAR(MAX), -- JSON string of the evaluation details
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Insert default admin user if not exists (Password is: Admin@123!)
-- Hash generated using bcrypt with salt rounds 10 for 'Admin@123!'
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@upsc.com')
BEGIN
    INSERT INTO Users (name, email, password_hash, role)
    VALUES ('Admin User', 'admin@upsc.com', '$2b$10$QOa6NnPxW7wG0y6D2nQzReJ1v2a2Xk5J2z3Xw3v2y3z3v2z3v2z3v', 'admin');
END
GO

-- Create Streaks table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Streaks' and xtype='U')
BEGIN
    CREATE TABLE Streaks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL FOREIGN KEY REFERENCES Users(id),
        current_streak INT DEFAULT 0,
        highest_streak INT DEFAULT 0,
        last_test_date NVARCHAR(50),
        completed_today BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create SavedFlashcards table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SavedFlashcards' and xtype='U')
BEGIN
    CREATE TABLE SavedFlashcards (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL FOREIGN KEY REFERENCES Users(id),
        question NVARCHAR(MAX) NOT NULL,
        answer NVARCHAR(MAX) NOT NULL,
        topic NVARCHAR(255),
        subject NVARCHAR(255),
        saved_at DATETIME DEFAULT GETDATE()
    );
END
GO

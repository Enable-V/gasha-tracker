-- HSR Gacha Database Initialization
CREATE DATABASE IF NOT EXISTS hsr_gacha_db;
USE hsr_gacha_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Gacha banners table
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    banner_id VARCHAR(20) UNIQUE NOT NULL,
    banner_name VARCHAR(100) NOT NULL,
    banner_type ENUM('character', 'weapon', 'standard', 'beginner') NOT NULL,
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gacha pulls table
CREATE TABLE IF NOT EXISTS gacha_pulls (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    banner_id VARCHAR(20) NOT NULL,
    gacha_id VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    rank_type INT NOT NULL,
    time TIMESTAMP NOT NULL,
    pity_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_banner (user_id, banner_id),
    INDEX idx_time (time),
    INDEX idx_rank_type (rank_type)
);

-- User statistics table
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    banner_type VARCHAR(20) NOT NULL,
    total_pulls INT DEFAULT 0,
    five_star_count INT DEFAULT 0,
    four_star_count INT DEFAULT 0,
    three_star_count INT DEFAULT 0,
    current_pity INT DEFAULT 0,
    last_five_star_time TIMESTAMP NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_banner (user_id, banner_type)
);

-- Insert default banners
INSERT IGNORE INTO banners (banner_id, banner_name, banner_type) VALUES
('1001', 'Character Event Banner', 'character'),
('2001', 'Light Cone Event Banner', 'weapon'),
('3001', 'Stellar Warp (Standard)', 'standard'),
('4001', 'Departure Warp (Beginner)', 'beginner');

-- Insert demo user
INSERT IGNORE INTO users (uid, username) VALUES ('100000001', 'Demo User');

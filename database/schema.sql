-- ============================================================
-- Travel Library & Book Rental System - MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS travel_library_db;
USE travel_library_db;

-- Drop tables if they exist to allow clean re-initialization
DROP TABLE IF EXISTS `returns`;
DROP TABLE IF EXISTS `rentals`;
DROP TABLE IF EXISTS `library_connections`;
DROP TABLE IF EXISTS `library_books`;
DROP TABLE IF EXISTS `books`;
DROP TABLE IF EXISTS `libraries`;
DROP TABLE IF EXISTS `users`;

-- ------------------------------------------------------------
-- 1. Table: users
-- Stores passenger accounts and administrators.
-- ------------------------------------------------------------
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. Table: libraries
-- Stores physical travel library locations (stations, airports, hubs).
-- ------------------------------------------------------------
CREATE TABLE `libraries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(120) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `type` ENUM('station', 'airport', 'hub') NOT NULL DEFAULT 'station',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. Table: books
-- Catalog of books available across the network.
-- ------------------------------------------------------------
CREATE TABLE `books` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `author` VARCHAR(150) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `isbn` VARCHAR(20) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. Table: library_books
-- Tracks book stock and real-time availability at each library.
-- ------------------------------------------------------------
CREATE TABLE `library_books` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `library_id` INT NOT NULL,
    `book_id` INT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 0,
    `available_quantity` INT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_lb_library` FOREIGN KEY (`library_id`) REFERENCES `libraries` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_lb_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
    CONSTRAINT `uk_library_book` UNIQUE (`library_id`, `book_id`),
    CONSTRAINT `chk_qty_positive` CHECK (`quantity` >= 0),
    CONSTRAINT `chk_avail_qty` CHECK (`available_quantity` >= 0 AND `available_quantity` <= `quantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. Table: library_connections
-- Defines active travel routes between source & destination libraries.
-- ------------------------------------------------------------
CREATE TABLE `library_connections` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `source_library_id` INT NOT NULL,
    `destination_library_id` INT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT `fk_lc_source` FOREIGN KEY (`source_library_id`) REFERENCES `libraries` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_lc_dest` FOREIGN KEY (`destination_library_id`) REFERENCES `libraries` (`id`) ON DELETE CASCADE,
    CONSTRAINT `uk_connection` UNIQUE (`source_library_id`, `destination_library_id`),
    CONSTRAINT `chk_diff_libraries` CHECK (`source_library_id` <> `destination_library_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. Table: rentals
-- Tracks book borrowing transactions across travel routes.
-- ------------------------------------------------------------
CREATE TABLE `rentals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rental_code` VARCHAR(50) NOT NULL UNIQUE,
    `user_id` INT NOT NULL,
    `book_id` INT NOT NULL,
    `source_library_id` INT NOT NULL,
    `destination_library_id` INT NOT NULL,
    `rental_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `due_date` DATETIME NOT NULL,
    `status` ENUM('rented', 'returned', 'overdue', 'cancelled') NOT NULL DEFAULT 'rented',
    CONSTRAINT `fk_rentals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rentals_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rentals_source_lib` FOREIGN KEY (`source_library_id`) REFERENCES `libraries` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rentals_dest_lib` FOREIGN KEY (`destination_library_id`) REFERENCES `libraries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 7. Table: returns
-- Records completion details when a book is returned to a destination library.
-- ------------------------------------------------------------
CREATE TABLE `returns` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rental_id` INT NOT NULL UNIQUE,
    `return_library_id` INT NOT NULL,
    `return_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `condition` ENUM('good', 'damaged', 'lost') NOT NULL DEFAULT 'good',
    `remarks` TEXT NULL,
    CONSTRAINT `fk_returns_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_returns_library` FOREIGN KEY (`return_library_id`) REFERENCES `libraries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- Sample Data Ingestion
-- ============================================================

-- 1. Test Users (Passenger & Admin)
INSERT INTO `users` (`name`, `email`, `password`, `mobile`, `role`) VALUES
('Alex Passenger', 'alex.passenger@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '+15550192834', 'user'),
('Admin User', 'admin@travellib.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '+15550009999', 'admin');

-- 2. Sample Libraries (Indian Railway & Airport Hubs + International Terminals)
INSERT INTO `libraries` (`id`, `name`, `city`, `location`, `type`) VALUES
(1, 'Chandrapur Railway Library', 'Chandrapur', 'Platform 1, Chandrapur Junction Railway Station, MH 442401', 'station'),
(2, 'Nagpur Railway Library', 'Nagpur', 'Main Concourse, Nagpur Junction Railway Station, MH 440001', 'station'),
(3, 'Mumbai Central Railway Library', 'Mumbai', 'Executive Lounge, Mumbai Central Railway Station, MH 400008', 'station'),
(4, 'Pune Airport Travel Library', 'Pune', 'Departure Concourse, Pune International Airport (PNQ), MH 411032', 'airport'),
(5, 'Grand Central Express Library', 'New York', 'Main Concourse, Grand Central Terminal, NY 10017', 'station'),
(6, 'Heathrow Airport Terminal 5 Library', 'London', 'Departure Lounge, Terminal 5, Heathrow Airport (LHR)', 'airport');

-- 3. Sample Books (Popular travel & fiction titles)
INSERT INTO `books` (`id`, `title`, `author`, `category`, `isbn`) VALUES
(1, 'The Alchemist', 'Paulo Coelho', 'Fiction', '9780062315007'),
(2, 'Wings of Fire', 'A.P.J. Abdul Kalam', 'Biography', '9788173711466'),
(3, 'Atomic Habits', 'James Clear', 'Self-Help', '9780735211292'),
(4, 'The Guide', 'R.K. Narayan', 'Classic', '9780143039648'),
(5, 'Ikigai: The Japanese Secret to a Long and Happy Life', 'Héctor García', 'Non-Fiction', '9780143130727'),
(6, 'The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', '9780743273565'),
(7, '1984', 'George Orwell', 'Dystopian', '9780451524935');

-- 4. Library Book Availability Stock
INSERT INTO `library_books` (`library_id`, `book_id`, `quantity`, `available_quantity`) VALUES
-- Chandrapur
(1, 1, 5, 5), -- The Alchemist
(1, 2, 4, 4), -- Wings of Fire
(1, 3, 3, 3), -- Atomic Habits
(1, 4, 3, 3), -- The Guide
-- Nagpur
(2, 1, 4, 4), -- The Alchemist
(2, 3, 5, 5), -- Atomic Habits
(2, 5, 4, 4), -- Ikigai
(2, 7, 3, 3), -- 1984
-- Mumbai
(3, 1, 6, 6), -- The Alchemist
(3, 2, 5, 5), -- Wings of Fire
(3, 4, 4, 4), -- The Guide
(3, 5, 5, 5), -- Ikigai
(3, 6, 4, 4), -- The Great Gatsby
-- Pune
(4, 3, 4, 4), -- Atomic Habits
(4, 5, 4, 4), -- Ikigai
(4, 6, 3, 3), -- The Great Gatsby
-- NY & London
(5, 6, 5, 5),
(5, 7, 4, 3),
(6, 1, 4, 4),
(6, 5, 4, 4);

-- 5. Library Connections (Travel routes)
INSERT INTO `library_connections` (`source_library_id`, `destination_library_id`, `active`) VALUES
(1, 2, TRUE), -- Chandrapur -> Nagpur
(1, 3, TRUE), -- Chandrapur -> Mumbai
(2, 3, TRUE), -- Nagpur -> Mumbai
(2, 4, TRUE), -- Nagpur -> Pune
(3, 4, TRUE), -- Mumbai -> Pune
(4, 3, TRUE), -- Pune -> Mumbai
(3, 2, TRUE), -- Mumbai -> Nagpur
(2, 1, TRUE), -- Nagpur -> Chandrapur
(5, 6, TRUE), -- New York -> London
(6, 5, TRUE); -- London -> New York

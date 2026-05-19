CREATE DATABASE IF NOT EXISTS great_battle;
USE great_battle;

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'http://localhost:3000/avatars/default.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    attack INT NOT NULL,
    defense INT NOT NULL,
    cost INT NOT NULL,
    image_url VARCHAR(255),
    rarity VARCHAR(20) DEFAULT 'common' 
);

INSERT INTO Cards (name, attack, defense, cost, image_url, rarity) VALUES 
('Iron Man', 6, 7, 6, '/assets/cards/ironman.png', 'epic'),
('Thanos', 9, 8, 8, '/assets/cards/thanos.png', 'legendary'),
('Spider-Man', 6, 5, 5, '/assets/cards/spiderman.png', 'rare'),
('Captain America', 4, 7, 5, '/assets/cards/cap.png', 'rare'),
('Thor', 7, 8, 7, '/assets/cards/thor.png', 'epic'),
('Hulk', 9, 6, 7, '/assets/cards/hulk.png', 'epic'),
('Black Widow', 3, 2, 2, '/assets/cards/blackwidow.png', 'common'),
('Doctor Strange', 7, 6, 6, '/assets/cards/doctorstrange.png', 'epic'),
('Wolverine', 5, 6, 5, '/assets/cards/wolverine.png', 'rare'),
('Deadpool', 4, 5, 4, '/assets/cards/deadpool.png', 'rare'),
('Loki', 6, 5, 5, '/assets/cards/loki.png', 'rare'),
('Black Panther', 5, 6, 5, '/assets/cards/blackpanther.png', 'rare'),
('Scarlet Witch', 10, 5, 7, '/assets/cards/scarletwitch.png', 'legendary'),
('Vision', 5, 8, 6, '/assets/cards/vision.png', 'rare'),
('Hawkeye', 4, 1, 2, '/assets/cards/hawkeye.png', 'common'),
('Ant-Man', 3, 4, 3, '/assets/cards/antman.png', 'common'),
('Star-Lord', 4, 3, 3, '/assets/cards/starlord.png', 'common'),
('Gamora', 6, 3, 4, '/assets/cards/gamora.png', 'common'),
('Rocket Raccoon', 3, 2, 2, '/assets/cards/rocket.png', 'common'),
('Groot', 4, 7, 5, '/assets/cards/groot.png', 'rare'),
('Drax', 5, 4, 4, '/assets/cards/drax.png', 'common'),
('Nick Fury', 2, 3, 2, '/assets/cards/fury.png', 'common'),
('Winter Soldier', 5, 4, 4, '/assets/cards/wintersoldier.png', 'common'),
('Falcon', 4, 3, 3, '/assets/cards/falcon.png', 'common'),
('Shang-Chi', 7, 4, 5, '/assets/cards/shangchi.png', 'rare');
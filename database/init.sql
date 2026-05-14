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
    image_url VARCHAR(255)
);


INSERT INTO Cards (name, attack, defense, cost, image_url) VALUES 
('Iron Man', 6, 7, 6, '/assets/cards/ironman.png'),
('Thanos', 9, 8, 8, '/assets/cards/thanos.png'),
('Spider-Man', 6, 5, 5, '/assets/cards/spiderman.png'),
('Captain America', 4, 7, 5, '/assets/cards/cap.png'),
('Thor', 7, 8, 7, '/assets/cards/thor.png'),
('Hulk', 9, 6, 7, '/assets/cards/hulk.png'),
('Black Widow', 3, 2, 2, '/assets/cards/blackwidow.png'),
('Doctor Strange', 7, 6, 6, '/assets/cards/doctorstrange.png'),
('Wolverine', 5, 6, 5, '/assets/cards/wolverine.png'),
('Deadpool', 4, 5, 4, '/assets/cards/deadpool.png'),
('Loki', 6, 5, 5, '/assets/cards/loki.png'),
('Black Panther', 5, 6, 5, '/assets/cards/blackpanther.png'),
('Scarlet Witch', 10, 5, 7, '/assets/cards/scarletwitch.png'),
('Vision', 5, 8, 6, '/assets/cards/vision.png'),
('Hawkeye', 4, 1, 2, '/assets/cards/hawkeye.png'),
('Ant-Man', 3, 4, 3, '/assets/cards/antman.png'),
('Star-Lord', 4, 3, 3, '/assets/cards/starlord.png'),
('Gamora', 6, 3, 4, '/assets/cards/gamora.png'),
('Rocket Raccoon', 3, 2, 2, '/assets/cards/rocket.png'),
('Groot', 4, 7, 5, '/assets/cards/groot.png'),
('Drax', 5, 4, 4, '/assets/cards/drax.png'),
('Nick Fury', 2, 3, 2, '/assets/cards/fury.png'),
('Winter Soldier', 5, 4, 4, '/assets/cards/wintersoldier.png'),
('Falcon', 4, 3, 3, '/assets/cards/falcon.png'),
('Shang-Chi', 7, 4, 5, '/assets/cards/shangchi.png');
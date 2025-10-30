CREATE DATABASE IF NOT EXISTS virtual_trainer;

USE virtual_trainer;

CREATE TABLE IF NOT EXISTS exercises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  target VARCHAR(255),
  equipment VARCHAR(255),
  bodyPart VARCHAR(255),
  gifUrl VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT,
  participant_name VARCHAR(255),
  exercise_id INT,
  reps INT,
  technique_score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

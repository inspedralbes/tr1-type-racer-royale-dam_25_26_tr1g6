-- =================================================================
-- SCRIPT DE CREACIÓN DE TABLAS PARA LA BASE DE DATOS FITTONI
-- Fichero: 01_schema.sql
-- =================================================================

-- Seleccionamos la base de datos que Docker Compose ha creado para nosotros.
USE fittoni_db;

-- -----------------------------------------------------
-- Tabla: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `provider` VARCHAR(50) NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabla: muscles
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `muscles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabla: exercises
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `exercises` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `youtube_id` VARCHAR(20) NULL,
  `body_part` VARCHAR(100) NULL,
  `target_muscle` VARCHAR(100) NULL,
  `equipment` VARCHAR(100) NULL,
  `gif_url` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabla: sessions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `exercise_id` INT NOT NULL,
  `creator_id` INT NOT NULL,
  `session_type` ENUM('public', 'private') NULL DEFAULT 'public',
  `invitation_code` VARCHAR(50) NULL UNIQUE,
  `capacity` INT NULL DEFAULT 10,
  `guid` VARCHAR(255) NOT NULL UNIQUE,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabla: session_participants
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `session_participants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `session_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `total_reps` INT NULL DEFAULT 0,
  `average_quality` FLOAT NULL DEFAULT 0,
  `joined_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_user_unique` (`session_id`, `user_id`),
  FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabla: exercise_muscles
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `exercise_muscles` (
  `exercise_id` INT NOT NULL,
  `muscle_id` INT NOT NULL,
  PRIMARY KEY (`exercise_id`, `muscle_id`),
  FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`muscle_id`) REFERENCES `muscles` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB;
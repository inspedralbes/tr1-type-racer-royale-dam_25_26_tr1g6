-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 04-11-2025 a las 08:32:54
-- Versión del servidor: 10.11.13-MariaDB-0ubuntu0.24.04.1
-- Versión de PHP: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `PGR6`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Admin_se_une_Sala_Publica`
--

CREATE TABLE `Admin_se_une_Sala_Publica` (
  `id_admin` int(11) NOT NULL,
  `id_sala_publica` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ejercicio`
--

CREATE TABLE `ejercicio` (
  `id_ejercicio` int(11) NOT NULL,
  `ej_nom` varchar(255) NOT NULL,
  `ej_detalles` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Ejercicio_fortalece_Musculo`
--

CREATE TABLE `Ejercicio_fortalece_Musculo` (
  `id_ejercicio` int(11) NOT NULL,
  `id_musculo` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `musculo`
--

CREATE TABLE `musculo` (
  `id_musculo` int(11) NOT NULL,
  `mu_nom` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Sala`
--

CREATE TABLE `Sala` (
  `id_sala` int(11) NOT NULL,
  `id_ejercicio` int(11) NOT NULL COMMENT 'Relación "Se basa"',
  `capacidad` int(11) NOT NULL DEFAULT 10
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Sala_Privada`
--

CREATE TABLE `Sala_Privada` (
  `id_sala_privada` int(11) NOT NULL,
  `id_sala` int(11) NOT NULL COMMENT 'FK a la tabla base Sala (Relación 1 a 1)',
  `id_user_creador` int(11) NOT NULL COMMENT 'Relación "Crea", solo puede ser un Usuario No-Admin',
  `codigo_invitacion` varchar(50) DEFAULT NULL COMMENT 'Código para unirse a esta sala privada'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Sala_Publica`
--

CREATE TABLE `Sala_Publica` (
  `id_sala_publica` int(11) NOT NULL,
  `id_sala` int(11) NOT NULL COMMENT 'FK a la tabla base Sala (Relación 1 a 1)',
  `id_admin_creador` int(11) NOT NULL COMMENT 'Relación "Crea/Borra", solo puede ser un Admin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Usuario`
--

CREATE TABLE `Usuario` (
  `id_usuario` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `gmail` varchar(255) NOT NULL,
  `camara_acces` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Usuario_Admin`
--

CREATE TABLE `Usuario_Admin` (
  `id_admin` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL COMMENT 'FK a la tabla base Usuario (Relación 1 a 1)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Usuario_No_Admin`
--

CREATE TABLE `Usuario_No_Admin` (
  `id_user` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL COMMENT 'FK a la tabla base Usuario (Relación 1 a 1)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Usuario_se_une_Sala_Privada`
--

CREATE TABLE `Usuario_se_une_Sala_Privada` (
  `id_user` int(11) NOT NULL,
  `id_sala_privada` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `Admin_se_une_Sala_Publica`
--
ALTER TABLE `Admin_se_une_Sala_Publica`
  ADD PRIMARY KEY (`id_admin`,`id_sala_publica`),
  ADD KEY `id_sala_publica` (`id_sala_publica`);

--
-- Indices de la tabla `ejercicio`
--
ALTER TABLE `ejercicio`
  ADD PRIMARY KEY (`id_ejercicio`);

--
-- Indices de la tabla `Ejercicio_fortalece_Musculo`
--
ALTER TABLE `Ejercicio_fortalece_Musculo`
  ADD PRIMARY KEY (`id_ejercicio`,`id_musculo`),
  ADD KEY `id_musculo` (`id_musculo`);

--
-- Indices de la tabla `musculo`
--
ALTER TABLE `musculo`
  ADD PRIMARY KEY (`id_musculo`);

--
-- Indices de la tabla `Sala`
--
ALTER TABLE `Sala`
  ADD PRIMARY KEY (`id_sala`),
  ADD KEY `id_ejercicio` (`id_ejercicio`);

--
-- Indices de la tabla `Sala_Privada`
--
ALTER TABLE `Sala_Privada`
  ADD PRIMARY KEY (`id_sala_privada`),
  ADD UNIQUE KEY `id_sala` (`id_sala`),
  ADD KEY `id_user_creador` (`id_user_creador`);

--
-- Indices de la tabla `Sala_Publica`
--
ALTER TABLE `Sala_Publica`
  ADD PRIMARY KEY (`id_sala_publica`),
  ADD UNIQUE KEY `id_sala` (`id_sala`),
  ADD KEY `id_admin_creador` (`id_admin_creador`);

--
-- Indices de la tabla `Usuario`
--
ALTER TABLE `Usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `gmail` (`gmail`);

--
-- Indices de la tabla `Usuario_Admin`
--
ALTER TABLE `Usuario_Admin`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `Usuario_No_Admin`
--
ALTER TABLE `Usuario_No_Admin`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `Usuario_se_une_Sala_Privada`
--
ALTER TABLE `Usuario_se_une_Sala_Privada`
  ADD PRIMARY KEY (`id_user`,`id_sala_privada`),
  ADD KEY `id_sala_privada` (`id_sala_privada`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `ejercicio`
--
ALTER TABLE `ejercicio`
  MODIFY `id_ejercicio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `musculo`
--
ALTER TABLE `musculo`
  MODIFY `id_musculo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Sala`
--
ALTER TABLE `Sala`
  MODIFY `id_sala` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Sala_Privada`
--
ALTER TABLE `Sala_Privada`
  MODIFY `id_sala_privada` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Sala_Publica`
--
ALTER TABLE `Sala_Publica`
  MODIFY `id_sala_publica` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Usuario`
--
ALTER TABLE `Usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Usuario_Admin`
--
ALTER TABLE `Usuario_Admin`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Usuario_No_Admin`
--
ALTER TABLE `Usuario_No_Admin`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `Admin_se_une_Sala_Publica`
--
ALTER TABLE `Admin_se_une_Sala_Publica`
  ADD CONSTRAINT `Admin_se_une_Sala_Publica_ibfk_1` FOREIGN KEY (`id_admin`) REFERENCES `Usuario_Admin` (`id_admin`) ON DELETE CASCADE,
  ADD CONSTRAINT `Admin_se_une_Sala_Publica_ibfk_2` FOREIGN KEY (`id_sala_publica`) REFERENCES `Sala_Publica` (`id_sala_publica`) ON DELETE CASCADE;

--
-- Filtros para la tabla `Ejercicio_fortalece_Musculo`
--
ALTER TABLE `Ejercicio_fortalece_Musculo`
  ADD CONSTRAINT `Ejercicio_fortalece_Musculo_ibfk_1` FOREIGN KEY (`id_ejercicio`) REFERENCES `ejercicio` (`id_ejercicio`) ON DELETE CASCADE,
  ADD CONSTRAINT `Ejercicio_fortalece_Musculo_ibfk_2` FOREIGN KEY (`id_musculo`) REFERENCES `musculo` (`id_musculo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `Sala`
--
ALTER TABLE `Sala`
  ADD CONSTRAINT `Sala_ibfk_1` FOREIGN KEY (`id_ejercicio`) REFERENCES `ejercicio` (`id_ejercicio`);

--
-- Filtros para la tabla `Sala_Privada`
--
ALTER TABLE `Sala_Privada`
  ADD CONSTRAINT `Sala_Privada_ibfk_1` FOREIGN KEY (`id_sala`) REFERENCES `Sala` (`id_sala`) ON DELETE CASCADE,
  ADD CONSTRAINT `Sala_Privada_ibfk_2` FOREIGN KEY (`id_user_creador`) REFERENCES `Usuario_No_Admin` (`id_user`);

--
-- Filtros para la tabla `Sala_Publica`
--
ALTER TABLE `Sala_Publica`
  ADD CONSTRAINT `Sala_Publica_ibfk_1` FOREIGN KEY (`id_sala`) REFERENCES `Sala` (`id_sala`) ON DELETE CASCADE,
  ADD CONSTRAINT `Sala_Publica_ibfk_2` FOREIGN KEY (`id_admin_creador`) REFERENCES `Usuario_Admin` (`id_admin`);

--
-- Filtros para la tabla `Usuario_Admin`
--
ALTER TABLE `Usuario_Admin`
  ADD CONSTRAINT `Usuario_Admin_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `Usuario_No_Admin`
--
ALTER TABLE `Usuario_No_Admin`
  ADD CONSTRAINT `Usuario_No_Admin_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `Usuario_se_une_Sala_Privada`
--
ALTER TABLE `Usuario_se_une_Sala_Privada`
  ADD CONSTRAINT `Usuario_se_une_Sala_Privada_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `Usuario_No_Admin` (`id_user`) ON DELETE CASCADE,
  ADD CONSTRAINT `Usuario_se_une_Sala_Privada_ibfk_2` FOREIGN KEY (`id_sala_privada`) REFERENCES `Sala_Privada` (`id_sala_privada`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

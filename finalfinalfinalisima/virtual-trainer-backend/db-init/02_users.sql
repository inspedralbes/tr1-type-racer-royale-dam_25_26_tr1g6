-- =================================================================
-- SCRIPT DE CREACIÓN DE USUARIO PARA LA APLICACIÓN
-- Fichero: 02_users.sql
-- =================================================================

-- Seleccionamos la base de datos sobre la que vamos a trabajar.
USE fittoni_db;

-- Creamos el usuario que la aplicación Node.js usará para conectarse.
-- El '%' significa que se puede conectar desde cualquier IP (necesario para Docker).
CREATE USER IF NOT EXISTS 'fittoni_user'@'%' IDENTIFIED BY 'Jugador203';

-- Le damos todos los permisos necesarios a ese usuario, pero SÓLO sobre la base de datos 'fittoni_db'.
GRANT ALL PRIVILEGES ON fittoni_db.* TO 'fittoni_user'@'%';

-- Aplicamos los cambios de privilegios.
FLUSH PRIVILEGES;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: proyecto_final
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `administradores`
--

DROP TABLE IF EXISTS `administradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administradores` (
  `id_administrador` int(11) NOT NULL AUTO_INCREMENT,
  `id_persona` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nivel_acceso` enum('superadmin','admin') DEFAULT 'admin',
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_administrador`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `id_persona` (`id_persona`),
  KEY `idx_administradores_usuario` (`usuario`),
  CONSTRAINT `administradores_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administradores`
--

LOCK TABLES `administradores` WRITE;
/*!40000 ALTER TABLE `administradores` DISABLE KEYS */;
INSERT INTO `administradores` VALUES (1,1,'administracion','$2b$10$TkKMPUwwFjX1bVtjBrKjGeHuqoXdxJj4gK9VEUiAFqmnxwLw07nWy','superadmin','activo','2025-11-06 06:14:26'),(2,26,'admincero','$2b$10$UgKaUuD7ZUUNQErMo/nXbe9vP678Vqze.W43jo9LQqDr0H9bc6riy','admin','activo','2025-11-06 07:57:09'),(3,27,'adminjuan','$2b$10$.mlQpOdxPJN57GL.Q4gdYuijSdlBghU/YX8jsepGv0B/MHpTzaRuO','admin','activo','2025-11-06 07:57:09'),(4,28,'administrador','$2b$10$Qey5quvJe.XbSfVIUmyM7.2hIFe/SrSdPjQCZD2c27zqcdbRFjzJO','admin','activo','2025-11-06 07:57:09');
/*!40000 ALTER TABLE `administradores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administrativos`
--

DROP TABLE IF EXISTS `administrativos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrativos` (
  `id_administrativo` int(11) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `id_persona` int(11) NOT NULL,
  PRIMARY KEY (`id_administrativo`),
  KEY `fk_administrativo_persona` (`id_persona`),
  CONSTRAINT `administrativos_ibfk_1` FOREIGN KEY (`id_administrativo`) REFERENCES `personas` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrativos`
--

LOCK TABLES `administrativos` WRITE;
/*!40000 ALTER TABLE `administrativos` DISABLE KEYS */;
INSERT INTO `administrativos` VALUES (1,'Secretario',1),(7,'Cajero',7);
/*!40000 ALTER TABLE `administrativos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumnos`
--

DROP TABLE IF EXISTS `alumnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumnos` (
  `id_alumno` int(11) NOT NULL,
  `legajo` varchar(50) DEFAULT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `domicilio` varchar(200) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `fecha_registro` date DEFAULT curdate(),
  `usuario` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_alumno`),
  UNIQUE KEY `legajo` (`legajo`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `fk_alumno_persona` (`id_persona`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_registro` (`fecha_registro`),
  KEY `idx_alumnos_usuario` (`usuario`),
  CONSTRAINT `alumnos_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `personas` (`id_persona`),
  CONSTRAINT `fk_alumno_persona` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumnos`
--

LOCK TABLES `alumnos` WRITE;
/*!40000 ALTER TABLE `alumnos` DISABLE KEYS */;
INSERT INTO `alumnos` VALUES (4,'A001',4,'11-1439-3159','Av. Corrientes 1234, CABA','1998-05-15','activo','2025-10-13','alumnamica','$2b$10$l03kEKBP5XppeFwfASgO/ON2f1tubg8UNGBz2bLGkh.z1c1olCSXS'),(5,'A002',5,'11-5925-6186','Av. Santa Fe 4567, CABA','1995-08-22','activo','2025-08-06','alumno5','$2b$10$JjfezYLYCQ63UnP4mD0gIOAQFhzUGgrNqIBwnf9u8RxhmWurLJdoy'),(6,'A003',6,'11-5212-6600','Av. Rivadavia 890, CABA','2000-03-10','activo','2025-02-16','alumno6','$2b$10$JjfezYLYCQ63UnP4mD0gIOAQFhzUGgrNqIBwnf9u8RxhmWurLJdoy'),(15,'A004',15,'+54 3B1 4463243',NULL,NULL,'activo','2025-11-01','alumno15','$2b$10$JjfezYLYCQ63UnP4mD0gIOAQFhzUGgrNqIBwnf9u8RxhmWurLJdoy'),(16,'A005',16,'+54 381 8865633',NULL,NULL,'activo','2025-11-01','alumno16','$2b$10$JjfezYLYCQ63UnP4mD0gIOAQFhzUGgrNqIBwnf9u8RxhmWurLJdoy'),(21,'A006',21,'+54 381 555444888','Sarmiento 200',NULL,'activo','2025-11-02','alumnomatias','$2b$10$gL4p14BytrOqmNbd0Z8xz.CI/Flzh4BCFvmAzyiXNdrYA/n01CF4u');
/*!40000 ALTER TABLE `alumnos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `anuncios`
--

DROP TABLE IF EXISTS `anuncios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anuncios` (
  `id_anuncio` int(11) NOT NULL AUTO_INCREMENT,
  `id_curso` int(11) NOT NULL,
  `id_profesor` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `link_url` varchar(500) DEFAULT NULL,
  `importante` tinyint(1) DEFAULT 0,
  `notificar` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_anuncio`),
  KEY `id_curso` (`id_curso`),
  KEY `id_profesor` (`id_profesor`),
  CONSTRAINT `anuncios_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `anuncios_ibfk_2` FOREIGN KEY (`id_profesor`) REFERENCES `profesores` (`id_profesor`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anuncios`
--

LOCK TABLES `anuncios` WRITE;
/*!40000 ALTER TABLE `anuncios` DISABLE KEYS */;
INSERT INTO `anuncios` VALUES (1,1,2,'Anuncio de prueba Ingles Base','Prueba','2025-11-02 14:50:15',NULL,0,1),(2,1,2,'Anuncio de prueba Ingles Base con Enlace','Prueba con enlace','2025-11-02 14:50:34','https://www.youtube.com/watch?v=eiMvHLWOUSo',0,1),(3,1,2,'Anuncio de prueba Ingles Base con Poll','Prueba con poll','2025-11-02 14:51:03',NULL,0,1),(4,5,2,'Anuncio de prueba ingles intermedio','Prueba','2025-11-02 14:51:29',NULL,1,1),(5,5,2,'Anuncio de prueba ingles intermedio con enlace','Prueba','2025-11-02 14:51:50','https://www.youtube.com/watch?v=eiMvHLWOUSo',0,1),(6,5,2,'Anuncio de prueba Ingles Intermedio con poll','Prueba','2025-11-02 14:52:16',NULL,0,1),(7,1,2,'prueba notificacion','prueba','2025-11-02 17:11:13',NULL,0,1),(8,1,2,'anuncio para los alumnos de ingles base','ingles base 1','2025-11-02 17:15:07',NULL,0,1),(9,1,2,'nueva prueba de notificacion anuncio','anuncio','2025-11-02 17:17:35',NULL,0,1),(11,4,24,'anuncio japones !','anuncio !','2025-11-06 02:21:45',NULL,1,1);
/*!40000 ALTER TABLE `anuncios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asistencias`
--

DROP TABLE IF EXISTS `asistencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencias` (
  `id_asistencia` int(11) NOT NULL AUTO_INCREMENT,
  `id_curso` int(11) NOT NULL,
  `id_alumno` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `estado` enum('presente','ausente','tardanza','justificado') DEFAULT 'ausente',
  `observaciones` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_asistencia`),
  UNIQUE KEY `unique_asistencia` (`id_curso`,`id_alumno`,`fecha`),
  KEY `idx_curso_fecha` (`id_curso`,`fecha`),
  KEY `idx_alumno` (`id_alumno`),
  KEY `idx_fecha` (`fecha`),
  CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `asistencias_ibfk_2` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencias`
--

LOCK TABLES `asistencias` WRITE;
/*!40000 ALTER TABLE `asistencias` DISABLE KEYS */;
INSERT INTO `asistencias` VALUES (7,7,4,'2025-11-04','ausente',NULL,'2025-11-04 01:30:56'),(8,7,16,'2025-11-04','tardanza',NULL,'2025-11-04 01:30:56'),(9,7,6,'2025-11-04','tardanza',NULL,'2025-11-04 01:30:56'),(10,7,21,'2025-11-04','ausente',NULL,'2025-11-04 01:30:56'),(11,7,5,'2025-11-04','justificado',NULL,'2025-11-04 01:30:56'),(12,7,15,'2025-11-04','presente',NULL,'2025-11-04 01:30:56'),(13,7,4,'2025-11-05','presente',NULL,'2025-11-04 01:31:06'),(14,7,16,'2025-11-05','presente',NULL,'2025-11-04 01:31:06'),(15,7,6,'2025-11-05','presente',NULL,'2025-11-04 01:31:06'),(16,7,21,'2025-11-05','presente',NULL,'2025-11-04 01:31:06'),(17,7,5,'2025-11-05','presente',NULL,'2025-11-04 01:31:06'),(18,7,15,'2025-11-05','presente',NULL,'2025-11-04 01:31:06'),(19,7,4,'2025-11-06','presente',NULL,'2025-11-04 01:31:11'),(20,7,16,'2025-11-06','presente',NULL,'2025-11-04 01:31:11'),(21,7,6,'2025-11-06','presente',NULL,'2025-11-04 01:31:11'),(22,7,21,'2025-11-06','presente',NULL,'2025-11-04 01:31:11'),(23,7,5,'2025-11-06','presente',NULL,'2025-11-04 01:31:11'),(24,7,15,'2025-11-06','presente',NULL,'2025-11-04 01:31:11');
/*!40000 ALTER TABLE `asistencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `aulas`
--

DROP TABLE IF EXISTS `aulas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aulas` (
  `id_aula` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_aula` varchar(50) DEFAULT NULL,
  `capacidad` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_aula`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aulas`
--

LOCK TABLES `aulas` WRITE;
/*!40000 ALTER TABLE `aulas` DISABLE KEYS */;
INSERT INTO `aulas` VALUES (1,'Aula 101',25),(2,'Aula 102',20),(4,'Aula 103',20);
/*!40000 ALTER TABLE `aulas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calificaciones`
--

DROP TABLE IF EXISTS `calificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calificaciones` (
  `id_calificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_alumno` int(11) NOT NULL,
  `id_curso` int(11) NOT NULL,
  `parcial1` decimal(4,2) DEFAULT NULL,
  `parcial2` decimal(4,2) DEFAULT NULL,
  `final` decimal(4,2) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_calificacion`),
  UNIQUE KEY `unique_alumno_curso` (`id_alumno`,`id_curso`),
  KEY `id_curso` (`id_curso`),
  KEY `idx_curso` (`id_curso`),
  CONSTRAINT `calificaciones_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`),
  CONSTRAINT `calificaciones_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`),
  CONSTRAINT `chk_parcial1` CHECK (`parcial1` is null or `parcial1` >= 0 and `parcial1` <= 10),
  CONSTRAINT `chk_parcial2` CHECK (`parcial2` is null or `parcial2` >= 0 and `parcial2` <= 10),
  CONSTRAINT `chk_final` CHECK (`final` is null or `final` >= 0 and `final` <= 10)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calificaciones`
--

LOCK TABLES `calificaciones` WRITE;
/*!40000 ALTER TABLE `calificaciones` DISABLE KEYS */;
INSERT INTO `calificaciones` VALUES (1,4,3,9.00,5.00,3.50,'2025-11-01 02:01:27','2025-11-01 06:27:00'),(2,5,3,6.00,4.00,7.00,'2025-11-01 02:13:06','2025-11-01 06:27:00'),(3,5,1,0.00,0.00,0.00,'2025-11-01 03:58:26','2025-11-02 00:55:14'),(4,6,1,0.00,0.00,0.00,'2025-11-01 03:58:55','2025-11-02 00:55:05'),(5,4,2,4.00,NULL,NULL,'2025-11-01 03:59:29','2025-11-01 03:59:29'),(6,6,2,2.00,NULL,NULL,'2025-11-01 03:59:29','2025-11-01 03:59:29'),(7,6,7,8.00,9.00,0.00,'2025-11-04 01:28:31','2025-11-04 01:28:31'),(8,4,7,8.00,8.00,6.00,'2025-11-04 01:28:43','2025-11-04 01:29:13'),(9,16,7,9.00,9.00,9.00,'2025-11-04 01:29:25','2025-11-04 01:29:25');
/*!40000 ALTER TABLE `calificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_conversaciones`
--

DROP TABLE IF EXISTS `chat_conversaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_conversaciones` (
  `id_conversacion` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_usuario` enum('invitado','alumno','profesor') NOT NULL,
  `id_usuario` int(11) DEFAULT NULL COMMENT 'NULL para invitados, id_alumno o id_profesor para usuarios loggeados',
  `nombre_invitado` varchar(100) DEFAULT NULL COMMENT 'Solo para usuarios invitados sin login',
  `estado` enum('pendiente','activa','cerrada') DEFAULT 'pendiente',
  `fecha_inicio` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  `atendido_por` int(11) DEFAULT NULL COMMENT 'id_usuario del admin que atiende',
  `mensajes_no_leidos_admin` int(11) DEFAULT 0 COMMENT 'Contador de mensajes no leÃ­dos por el admin',
  `mensajes_no_leidos_usuario` int(11) DEFAULT 0 COMMENT 'Contador de mensajes no leÃ­dos por el usuario',
  `ultima_actividad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_conversacion`),
  KEY `idx_estado` (`estado`),
  KEY `idx_atendido_por` (`atendido_por`),
  KEY `idx_tipo_usuario` (`tipo_usuario`),
  KEY `idx_ultima_actividad` (`ultima_actividad`),
  CONSTRAINT `chat_conversaciones_ibfk_1` FOREIGN KEY (`atendido_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Conversaciones de chat de soporte';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_conversaciones`
--

LOCK TABLES `chat_conversaciones` WRITE;
/*!40000 ALTER TABLE `chat_conversaciones` DISABLE KEYS */;
INSERT INTO `chat_conversaciones` VALUES (15,'profesor',10,NULL,'activa','2025-11-04 00:45:23',NULL,NULL,0,0,'2025-11-04 00:45:49'),(17,'alumno',4,NULL,'activa','2025-11-04 01:02:09',NULL,NULL,0,1,'2025-11-06 06:07:20'),(19,'profesor',12,NULL,'activa','2025-11-04 01:03:50',NULL,NULL,0,0,'2025-11-04 01:12:42'),(20,'profesor',13,NULL,'activa','2025-11-04 01:26:32',NULL,NULL,0,0,'2025-11-04 16:01:59');
/*!40000 ALTER TABLE `chat_conversaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_estadisticas`
--

DROP TABLE IF EXISTS `chat_estadisticas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_estadisticas` (
  `id_estadistica` int(11) NOT NULL AUTO_INCREMENT,
  `id_conversacion` int(11) NOT NULL,
  `tiempo_primera_respuesta` int(11) DEFAULT NULL COMMENT 'Tiempo en segundos hasta primera respuesta del admin',
  `tiempo_total_conversacion` int(11) DEFAULT NULL COMMENT 'DuraciÃ³n total en segundos',
  `total_mensajes` int(11) DEFAULT 0,
  `mensajes_usuario` int(11) DEFAULT 0,
  `mensajes_admin` int(11) DEFAULT 0,
  `calificacion` tinyint(1) DEFAULT NULL COMMENT 'CalificaciÃ³n de 1-5 estrellas',
  `comentario_calificacion` text DEFAULT NULL,
  `fecha_calificacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_estadistica`),
  KEY `id_conversacion` (`id_conversacion`),
  KEY `idx_calificacion` (`calificacion`),
  CONSTRAINT `chat_estadisticas_ibfk_1` FOREIGN KEY (`id_conversacion`) REFERENCES `chat_conversaciones` (`id_conversacion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='EstadÃ­sticas y mÃ©tricas del chat';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_estadisticas`
--

LOCK TABLES `chat_estadisticas` WRITE;
/*!40000 ALTER TABLE `chat_estadisticas` DISABLE KEYS */;
INSERT INTO `chat_estadisticas` VALUES (15,15,NULL,NULL,0,0,0,NULL,NULL,NULL),(17,17,NULL,NULL,0,0,0,NULL,NULL,NULL),(19,19,NULL,NULL,0,0,0,NULL,NULL,NULL),(20,20,NULL,NULL,0,0,0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `chat_estadisticas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_mensajes`
--

DROP TABLE IF EXISTS `chat_mensajes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_mensajes` (
  `id_mensaje` int(11) NOT NULL AUTO_INCREMENT,
  `id_conversacion` int(11) NOT NULL,
  `tipo_remitente` enum('invitado','alumno','profesor','admin') NOT NULL,
  `id_remitente` int(11) DEFAULT NULL COMMENT 'NULL para invitados, id del usuario para loggeados',
  `nombre_remitente` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha_envio` timestamp NOT NULL DEFAULT current_timestamp(),
  `leido` tinyint(1) DEFAULT 0,
  `leido_por_admin` tinyint(1) DEFAULT 0,
  `leido_por_usuario` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id_mensaje`),
  KEY `idx_conversacion` (`id_conversacion`),
  KEY `idx_leido` (`leido`),
  KEY `idx_fecha_envio` (`fecha_envio`),
  KEY `idx_tipo_remitente` (`tipo_remitente`),
  CONSTRAINT `chat_mensajes_ibfk_1` FOREIGN KEY (`id_conversacion`) REFERENCES `chat_conversaciones` (`id_conversacion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=254 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Mensajes del chat de soporte';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_mensajes`
--

LOCK TABLES `chat_mensajes` WRITE;
/*!40000 ALTER TABLE `chat_mensajes` DISABLE KEYS */;
INSERT INTO `chat_mensajes` VALUES (212,15,'profesor',10,'Pablo Garcia','hola soporte','2025-11-04 00:45:23',1,1,0),(213,15,'profesor',10,'Pablo Garcia','necesito ayuda','2025-11-04 00:45:26',1,1,0),(214,15,'profesor',10,'Pablo Garcia','en algo','2025-11-04 00:45:29',1,1,0),(215,15,'profesor',10,'Pablo Garcia','hola','2025-11-04 00:45:37',1,1,0),(216,15,'admin',NULL,'Eduardo Mendoza','digame garcia','2025-11-04 00:45:47',1,0,1),(220,17,'alumno',4,'Micaela Gomez','hola soporte','2025-11-04 01:02:09',1,1,0),(221,17,'admin',1,'Eduardo Mendoza','digame micaela','2025-11-04 01:02:18',1,0,1),(222,17,'alumno',4,'Micaela Gomez','hola soporte','2025-11-04 01:02:26',1,1,0),(225,19,'profesor',12,'Irina Lopez','hola soporte','2025-11-04 01:03:50',1,1,0),(226,19,'admin',1,'Eduardo Mendoza','hola irina','2025-11-04 01:04:03',1,0,1),(227,19,'profesor',12,'Irina Lopez','hola soporte','2025-11-04 01:12:35',1,1,0),(230,20,'profesor',13,'Javier Monteros','hola soy el profesor javier necesito soporte','2025-11-04 01:26:32',1,1,0),(231,20,'admin',1,'Eduardo Mendoza','hola javier','2025-11-04 01:26:43',1,0,1),(249,20,'admin',1,'Eduardo Mendoza','digame javier, que necesita','2025-11-04 16:01:47',1,0,1),(251,17,'alumno',4,'Micaela Gomez','hola','2025-11-06 06:07:04',1,1,0),(252,17,'alumno',4,'Micaela Gomez','si','2025-11-06 06:07:08',1,1,0),(253,17,'admin',1,'Eduardo Mendoza','si','2025-11-06 06:07:20',0,0,0);
/*!40000 ALTER TABLE `chat_mensajes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classroom_conversaciones`
--

DROP TABLE IF EXISTS `classroom_conversaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom_conversaciones` (
  `id_conversacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_curso` int(11) NOT NULL,
  `id_alumno_usuario` int(11) NOT NULL COMMENT 'id_usuario del alumno (desde tabla Usuarios)',
  `id_alumno_usuario2` int(11) DEFAULT NULL,
  `id_profesor_usuario` int(11) DEFAULT NULL COMMENT 'id_usuario del profesor (NULL si es chat entre alumnos)',
  `ultimo_mensaje` text DEFAULT NULL,
  `fecha_ultimo_mensaje` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `mensajes_no_leidos_alumno` int(11) DEFAULT 0 COMMENT 'Mensajes sin leer por el alumno',
  `mensajes_no_leidos_profesor` int(11) DEFAULT 0 COMMENT 'Mensajes sin leer por el profesor',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_conversacion`),
  UNIQUE KEY `unique_conversacion` (`id_alumno_usuario`,`id_alumno_usuario2`,`id_curso`,`id_profesor_usuario`),
  KEY `idx_curso` (`id_curso`),
  KEY `idx_alumno` (`id_alumno_usuario`),
  KEY `idx_profesor` (`id_profesor_usuario`),
  KEY `idx_fecha` (`fecha_ultimo_mensaje`),
  KEY `id_alumno_usuario2` (`id_alumno_usuario2`),
  CONSTRAINT `classroom_conversaciones_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `classroom_conversaciones_ibfk_2` FOREIGN KEY (`id_alumno_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `classroom_conversaciones_ibfk_3` FOREIGN KEY (`id_profesor_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `classroom_conversaciones_ibfk_4` FOREIGN KEY (`id_alumno_usuario2`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Conversaciones entre alumnos y profesores por curso en Classroom';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classroom_conversaciones`
--

LOCK TABLES `classroom_conversaciones` WRITE;
/*!40000 ALTER TABLE `classroom_conversaciones` DISABLE KEYS */;
INSERT INTO `classroom_conversaciones` VALUES (1,1,4,NULL,2,'hola profesor','2025-11-04 14:29:42',0,0,'2025-11-04 13:53:04'),(2,1,9,NULL,2,NULL,'2025-11-04 13:54:33',0,0,'2025-11-04 13:54:33'),(3,1,6,NULL,2,NULL,'2025-11-04 13:54:33',0,0,'2025-11-04 13:54:33'),(4,1,5,NULL,2,NULL,'2025-11-04 13:54:34',0,0,'2025-11-04 13:54:34'),(5,1,8,NULL,2,'hola profesor','2025-11-04 14:28:48',0,1,'2025-11-04 13:54:34'),(6,4,4,NULL,12,NULL,'2025-11-04 14:03:59',0,0,'2025-11-04 14:03:59'),(9,1,4,8,NULL,'hola mica','2025-11-04 14:50:10',0,6,'2025-11-04 14:16:54'),(10,2,8,8,NULL,NULL,'2025-11-04 14:36:38',0,0,'2025-11-04 14:23:15'),(11,1,8,8,NULL,'hola','2025-11-04 14:36:38',0,1,'2025-11-04 14:23:22'),(12,2,8,NULL,3,'hola','2025-11-04 14:50:55',0,1,'2025-11-04 14:23:25'),(13,2,8,9,NULL,'hola','2025-11-04 14:42:29',0,1,'2025-11-04 14:42:14'),(14,1,8,5,NULL,'hola','2025-11-04 14:42:25',0,1,'2025-11-04 14:42:24');
/*!40000 ALTER TABLE `classroom_conversaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classroom_estadisticas`
--

DROP TABLE IF EXISTS `classroom_estadisticas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom_estadisticas` (
  `id_estadistica` int(11) NOT NULL AUTO_INCREMENT,
  `id_curso` int(11) NOT NULL,
  `total_conversaciones` int(11) DEFAULT 0,
  `total_mensajes` int(11) DEFAULT 0,
  `mensajes_hoy` int(11) DEFAULT 0,
  `promedio_tiempo_respuesta_profesor` int(11) DEFAULT 0 COMMENT 'En minutos',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_estadistica`),
  UNIQUE KEY `unique_curso` (`id_curso`),
  CONSTRAINT `classroom_estadisticas_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='EstadÃ­sticas del sistema de chat de Classroom por curso';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classroom_estadisticas`
--

LOCK TABLES `classroom_estadisticas` WRITE;
/*!40000 ALTER TABLE `classroom_estadisticas` DISABLE KEYS */;
INSERT INTO `classroom_estadisticas` VALUES (1,1,8,17,17,0,'2025-11-04 14:50:10'),(2,5,0,0,0,0,'2025-11-04 12:08:57'),(3,2,3,2,2,0,'2025-11-04 14:50:55'),(4,3,0,0,0,0,'2025-11-04 12:08:57'),(5,4,1,0,0,0,'2025-11-04 14:03:59'),(6,7,0,0,0,0,'2025-11-04 12:08:57'),(7,6,0,0,0,0,'2025-11-04 12:08:57');
/*!40000 ALTER TABLE `classroom_estadisticas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classroom_mensajes`
--

DROP TABLE IF EXISTS `classroom_mensajes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom_mensajes` (
  `id_mensaje` int(11) NOT NULL AUTO_INCREMENT,
  `id_conversacion` int(11) NOT NULL,
  `id_usuario_remitente` int(11) NOT NULL COMMENT 'id_usuario del que envÃ­a (alumno o profesor)',
  `tipo_remitente` enum('alumno','profesor') NOT NULL COMMENT 'Tipo de usuario que envÃ­a',
  `mensaje` text NOT NULL,
  `tiene_archivo` tinyint(1) DEFAULT 0,
  `nombre_archivo` varchar(255) DEFAULT NULL,
  `ruta_archivo` varchar(500) DEFAULT NULL,
  `leido` tinyint(1) DEFAULT 0,
  `fecha_envio` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_lectura` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_mensaje`),
  KEY `idx_conversacion` (`id_conversacion`),
  KEY `idx_remitente` (`id_usuario_remitente`),
  KEY `idx_fecha` (`fecha_envio`),
  KEY `idx_leido` (`leido`),
  CONSTRAINT `classroom_mensajes_ibfk_1` FOREIGN KEY (`id_conversacion`) REFERENCES `classroom_conversaciones` (`id_conversacion`) ON DELETE CASCADE,
  CONSTRAINT `classroom_mensajes_ibfk_2` FOREIGN KEY (`id_usuario_remitente`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mensajes del chat de Classroom entre alumnos y profesores';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classroom_mensajes`
--

LOCK TABLES `classroom_mensajes` WRITE;
/*!40000 ALTER TABLE `classroom_mensajes` DISABLE KEYS */;
INSERT INTO `classroom_mensajes` VALUES (1,1,2,'profesor','prueba para micaela gomez',0,NULL,NULL,1,'2025-11-04 13:54:40','2025-11-04 13:59:05'),(2,1,4,'alumno','hola profesor',0,NULL,NULL,1,'2025-11-04 14:09:05','2025-11-04 14:09:29'),(3,1,2,'profesor','hola gomez',0,NULL,NULL,1,'2025-11-04 14:10:20','2025-11-04 14:10:39'),(4,1,2,'profesor','hola gomez',0,NULL,NULL,1,'2025-11-04 14:14:35','2025-11-04 14:14:46'),(5,1,2,'profesor','hola',0,NULL,NULL,1,'2025-11-04 14:14:41','2025-11-04 14:14:46'),(6,1,2,'profesor','gomez',0,NULL,NULL,1,'2025-11-04 14:14:42','2025-11-04 14:14:46'),(7,1,4,'alumno','hola profesor',0,NULL,NULL,1,'2025-11-04 14:14:56','2025-11-04 14:29:42'),(8,1,4,'alumno','hola profesor',0,NULL,NULL,1,'2025-11-04 14:14:59','2025-11-04 14:29:42'),(9,9,4,'alumno','hola hernan',0,NULL,NULL,0,'2025-11-04 14:17:20',NULL),(10,11,8,'alumno','hola',0,NULL,NULL,0,'2025-11-04 14:28:38',NULL),(11,5,8,'alumno','hola profesor',0,NULL,NULL,0,'2025-11-04 14:28:48',NULL),(12,14,8,'alumno','hola',0,NULL,NULL,0,'2025-11-04 14:42:25',NULL),(13,13,8,'alumno','hola',0,NULL,NULL,0,'2025-11-04 14:42:29',NULL),(14,9,8,'alumno','hola micaela',0,NULL,NULL,0,'2025-11-04 14:49:12',NULL),(15,9,8,'alumno','hola',0,NULL,NULL,0,'2025-11-04 14:49:53',NULL),(16,9,4,'alumno','hola hernan',0,NULL,NULL,0,'2025-11-04 14:49:58',NULL),(17,9,4,'alumno','hola hernan',0,NULL,NULL,0,'2025-11-04 14:50:03',NULL),(18,9,8,'alumno','hola mica',0,NULL,NULL,0,'2025-11-04 14:50:10',NULL),(19,12,8,'alumno','hola',0,NULL,NULL,0,'2025-11-04 14:50:55',NULL);
/*!40000 ALTER TABLE `classroom_mensajes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentarios_anuncios`
--

DROP TABLE IF EXISTS `comentarios_anuncios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentarios_anuncios` (
  `id_comentario` int(11) NOT NULL AUTO_INCREMENT,
  `id_anuncio` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `tipo_usuario` enum('profesor','alumno') NOT NULL,
  `contenido` text NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_comentario`),
  KEY `idx_anuncio` (`id_anuncio`),
  KEY `idx_fecha` (`fecha_creacion`),
  CONSTRAINT `comentarios_anuncios_ibfk_1` FOREIGN KEY (`id_anuncio`) REFERENCES `anuncios` (`id_anuncio`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentarios_anuncios`
--

LOCK TABLES `comentarios_anuncios` WRITE;
/*!40000 ALTER TABLE `comentarios_anuncios` DISABLE KEYS */;
INSERT INTO `comentarios_anuncios` VALUES (1,2,4,'alumno','buena prueba','2025-11-02 16:45:54'),(2,2,4,'alumno','probando otra vez notificaciones','2025-11-02 16:56:51'),(3,8,4,'alumno','hola profe','2025-11-02 17:16:13'),(5,9,4,'alumno','prueba.','2025-11-06 01:25:48'),(6,11,15,'alumno','bien profesora !','2025-11-06 02:22:17');
/*!40000 ALTER TABLE `comentarios_anuncios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conceptos_pago`
--

DROP TABLE IF EXISTS `conceptos_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conceptos_pago` (
  `id_concepto` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  `monto_sugerido` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_concepto`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conceptos_pago`
--

LOCK TABLES `conceptos_pago` WRITE;
/*!40000 ALTER TABLE `conceptos_pago` DISABLE KEYS */;
INSERT INTO `conceptos_pago` VALUES (1,'MatrÃ­cula',5000.00),(2,'Cuota Mensual',10000.00);
/*!40000 ALTER TABLE `conceptos_pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cursos`
--

DROP TABLE IF EXISTS `cursos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cursos` (
  `id_curso` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_curso` varchar(100) DEFAULT NULL,
  `id_idioma` int(11) DEFAULT NULL,
  `id_nivel` int(11) DEFAULT NULL,
  `id_profesor` int(11) DEFAULT NULL,
  `horario` varchar(100) DEFAULT 'Horario por definir',
  `cupo_maximo` int(11) DEFAULT 30,
  `id_aula` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_curso`),
  KEY `id_idioma` (`id_idioma`),
  KEY `id_nivel` (`id_nivel`),
  KEY `id_profesor` (`id_profesor`),
  KEY `id_aula` (`id_aula`),
  KEY `idx_idioma_nivel` (`id_idioma`,`id_nivel`),
  CONSTRAINT `cursos_ibfk_1` FOREIGN KEY (`id_idioma`) REFERENCES `idiomas` (`id_idioma`),
  CONSTRAINT `cursos_ibfk_2` FOREIGN KEY (`id_nivel`) REFERENCES `niveles` (`id_nivel`),
  CONSTRAINT `cursos_ibfk_3` FOREIGN KEY (`id_profesor`) REFERENCES `profesores` (`id_profesor`),
  CONSTRAINT `cursos_ibfk_4` FOREIGN KEY (`id_aula`) REFERENCES `aulas` (`id_aula`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cursos`
--

LOCK TABLES `cursos` WRITE;
/*!40000 ALTER TABLE `cursos` DISABLE KEYS */;
INSERT INTO `cursos` VALUES (1,'InglÃ©s Base ',1,1,2,'19:40',50,2,'2025-11-01 21:31:38','2025-11-01 21:31:38'),(2,'FrancÃ©s Base',2,3,3,'20:00',40,1,'2025-11-01 21:31:38','2025-11-01 21:31:38'),(3,'Aleman Base',3,4,10,'21:30',30,NULL,'2025-11-01 21:31:38','2025-11-01 21:31:38'),(4,'Japones Basico',5,1,24,'20:30',30,4,'2025-11-02 05:36:25','2025-11-02 15:00:38'),(5,'Ingles Intermedio',1,4,2,'18:30',15,4,'2025-11-02 17:48:21','2025-11-02 17:48:21'),(6,'Italiano Base',6,3,2,'20:30',20,1,'2025-11-03 05:20:52','2025-11-03 05:20:52'),(7,'Japones Intermedio',5,4,25,'17:40',20,1,'2025-11-04 01:27:23','2025-11-04 01:27:23');
/*!40000 ALTER TABLE `cursos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuestas`
--

DROP TABLE IF EXISTS `encuestas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encuestas` (
  `id_encuesta` int(11) NOT NULL AUTO_INCREMENT,
  `id_anuncio` int(11) NOT NULL,
  `pregunta` varchar(255) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_encuesta`),
  KEY `id_anuncio` (`id_anuncio`),
  CONSTRAINT `encuestas_ibfk_1` FOREIGN KEY (`id_anuncio`) REFERENCES `anuncios` (`id_anuncio`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuestas`
--

LOCK TABLES `encuestas` WRITE;
/*!40000 ALTER TABLE `encuestas` DISABLE KEYS */;
INSERT INTO `encuestas` VALUES (1,3,'Clases maÃ±ana','2025-11-02 14:51:03'),(2,6,'Clases maÃ±ana','2025-11-02 14:52:16'),(3,7,'Clases maÃ±ana si o si','2025-11-02 17:11:13'),(4,8,'si','2025-11-02 17:15:07');
/*!40000 ALTER TABLE `encuestas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entregas_tareas`
--

DROP TABLE IF EXISTS `entregas_tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entregas_tareas` (
  `id_entrega` int(11) NOT NULL AUTO_INCREMENT,
  `id_tarea` int(11) NOT NULL,
  `id_alumno` int(11) NOT NULL,
  `contenido` text DEFAULT NULL,
  `archivo_url` varchar(500) DEFAULT NULL,
  `fecha_entrega` datetime DEFAULT current_timestamp(),
  `calificacion` decimal(5,2) DEFAULT NULL,
  `comentario_profesor` text DEFAULT NULL,
  PRIMARY KEY (`id_entrega`),
  KEY `id_tarea` (`id_tarea`),
  KEY `id_alumno` (`id_alumno`),
  CONSTRAINT `entregas_tareas_ibfk_1` FOREIGN KEY (`id_tarea`) REFERENCES `tareas` (`id_tarea`) ON DELETE CASCADE,
  CONSTRAINT `entregas_tareas_ibfk_2` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregas_tareas`
--

LOCK TABLES `entregas_tareas` WRITE;
/*!40000 ALTER TABLE `entregas_tareas` DISABLE KEYS */;
INSERT INTO `entregas_tareas` VALUES (1,4,4,'entrego tarea','uploads/sdas.jpg','2025-11-02 17:27:19',8.00,'buena tarea'),(2,4,15,'tarea entregada ',NULL,'2025-11-03 22:54:02',NULL,NULL);
/*!40000 ALTER TABLE `entregas_tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos_calendario`
--

DROP TABLE IF EXISTS `eventos_calendario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos_calendario` (
  `id_evento` int(11) NOT NULL AUTO_INCREMENT,
  `id_curso` int(11) NOT NULL,
  `id_profesor` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` enum('examen','clase_especial','feriado','reunion','otro') DEFAULT 'otro',
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `color` varchar(7) DEFAULT '#667eea',
  `notificar` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_evento`),
  KEY `id_profesor` (`id_profesor`),
  KEY `idx_fecha` (`fecha_inicio`),
  KEY `idx_curso` (`id_curso`),
  CONSTRAINT `eventos_calendario_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `eventos_calendario_ibfk_2` FOREIGN KEY (`id_profesor`) REFERENCES `profesores` (`id_profesor`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos_calendario`
--

LOCK TABLES `eventos_calendario` WRITE;
/*!40000 ALTER TABLE `eventos_calendario` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventos_calendario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `idiomas`
--

DROP TABLE IF EXISTS `idiomas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `idiomas` (
  `id_idioma` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_idioma` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_idioma`),
  UNIQUE KEY `nombre_idioma` (`nombre_idioma`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `idiomas`
--

LOCK TABLES `idiomas` WRITE;
/*!40000 ALTER TABLE `idiomas` DISABLE KEYS */;
INSERT INTO `idiomas` VALUES (3,'Aleman'),(2,'Frances'),(1,'Ingles'),(6,'Italiano'),(5,'Japones'),(4,'Portugues');
/*!40000 ALTER TABLE `idiomas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripciones`
--

DROP TABLE IF EXISTS `inscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripciones` (
  `id_inscripcion` int(11) NOT NULL AUTO_INCREMENT,
  `id_alumno` int(11) DEFAULT NULL,
  `id_curso` int(11) DEFAULT NULL,
  `fecha_inscripcion` date NOT NULL DEFAULT curdate(),
  `estado` varchar(50) DEFAULT 'activo',
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id_inscripcion`),
  UNIQUE KEY `unique_inscripcion_activa` (`id_alumno`,`id_curso`,`estado`),
  KEY `id_alumno` (`id_alumno`),
  KEY `id_curso` (`id_curso`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_inscripcion` (`fecha_inscripcion`),
  KEY `idx_alumno_estado` (`id_alumno`,`estado`),
  CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`),
  CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripciones`
--

LOCK TABLES `inscripciones` WRITE;
/*!40000 ALTER TABLE `inscripciones` DISABLE KEYS */;
INSERT INTO `inscripciones` VALUES (20,16,1,'2025-11-01','activo',NULL),(21,15,1,'2025-11-01','activo',NULL),(22,6,1,'2025-11-01','activo',NULL),(23,5,1,'2025-11-01','activo',NULL),(24,4,1,'2025-11-01','activo',NULL),(25,16,2,'2025-11-01','activo',NULL),(26,15,2,'2025-11-01','activo',NULL),(27,16,4,'2025-11-02','activo',NULL),(28,15,4,'2025-11-02','activo',NULL),(29,6,4,'2025-11-02','activo',NULL),(30,5,4,'2025-11-02','activo',NULL),(31,4,4,'2025-11-02','activo',NULL),(32,21,7,'2025-11-03','activo',NULL),(33,16,7,'2025-11-03','activo',NULL),(34,15,7,'2025-11-03','activo',NULL),(35,6,7,'2025-11-03','activo',NULL),(36,5,7,'2025-11-03','activo',NULL),(37,4,7,'2025-11-03','activo',NULL);
/*!40000 ALTER TABLE `inscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medios_pago`
--

DROP TABLE IF EXISTS `medios_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medios_pago` (
  `id_medio_pago` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_medio_pago`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medios_pago`
--

LOCK TABLES `medios_pago` WRITE;
/*!40000 ALTER TABLE `medios_pago` DISABLE KEYS */;
INSERT INTO `medios_pago` VALUES (1,'Efectivo'),(3,'Tarjeta de CrÃ©dito'),(2,'Transferencia');
/*!40000 ALTER TABLE `medios_pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `niveles`
--

DROP TABLE IF EXISTS `niveles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `niveles` (
  `id_nivel` int(11) NOT NULL AUTO_INCREMENT,
  `id_idioma` int(11) DEFAULT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_nivel`),
  KEY `id_idioma` (`id_idioma`),
  CONSTRAINT `niveles_ibfk_1` FOREIGN KEY (`id_idioma`) REFERENCES `idiomas` (`id_idioma`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `niveles`
--

LOCK TABLES `niveles` WRITE;
/*!40000 ALTER TABLE `niveles` DISABLE KEYS */;
INSERT INTO `niveles` VALUES (1,1,'A1'),(2,1,'B1'),(3,2,'A1'),(4,3,'A2');
/*!40000 ALTER TABLE `niveles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notas_calendario`
--

DROP TABLE IF EXISTS `notas_calendario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notas_calendario` (
  `id_nota` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `tipo_usuario` enum('alumno','profesor') NOT NULL,
  `fecha` date NOT NULL,
  `titulo` varchar(100) DEFAULT NULL,
  `contenido` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#FFD700',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_nota`),
  KEY `idx_usuario_fecha` (`id_usuario`,`fecha`),
  KEY `idx_fecha` (`fecha`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notas_calendario`
--

LOCK TABLES `notas_calendario` WRITE;
/*!40000 ALTER TABLE `notas_calendario` DISABLE KEYS */;
/*!40000 ALTER TABLE `notas_calendario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `tipo_usuario` enum('profesor','alumno') NOT NULL,
  `tipo_notificacion` enum('entrega_tarea','nueva_inscripcion','comentario','calificacion','anuncio_importante','nueva_tarea','anuncio') DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `id_referencia` int(11) DEFAULT NULL COMMENT 'ID de la tarea, inscripciÃ³n, etc.',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_usuario` (`id_usuario`,`tipo_usuario`),
  KEY `idx_leida` (`leida`),
  KEY `idx_fecha` (`fecha_creacion`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,2,'profesor','entrega_tarea','Nueva entrega recibida','Juan PÃ©rez ha entregado la tarea Prueba de tarea',NULL,1,1,'2025-11-02 16:22:29'),(2,2,'profesor','nueva_inscripcion','Nueva inscripciÃ³n','MarÃ­a GarcÃ­a se inscribiÃ³ en InglÃ©s Base 1',NULL,1,1,'2025-11-02 16:22:29'),(3,2,'profesor','anuncio_importante','Anuncio importante publicado','Se publicÃ³ el anuncio: Cambio de horario en InglÃ©s Intermedio',NULL,1,1,'2025-11-02 16:30:18'),(4,2,'profesor','comentario','Nuevo comentario','Micaela Gomez comentÃ³ en \"Anuncio de prueba Ingles Base con Enlace\"',NULL,1,2,'2025-11-02 16:56:51'),(5,16,'alumno','nueva_tarea','Nueva tarea asignada','tarea para ingles base - InglÃ©s Base ','/tareas/4',0,4,'2025-11-02 17:15:29'),(6,15,'alumno','nueva_tarea','Nueva tarea asignada','tarea para ingles base - InglÃ©s Base ','/tareas/4',1,4,'2025-11-02 17:15:29'),(7,6,'alumno','nueva_tarea','Nueva tarea asignada','tarea para ingles base - InglÃ©s Base ','/tareas/4',0,4,'2025-11-02 17:15:29'),(8,5,'alumno','nueva_tarea','Nueva tarea asignada','tarea para ingles base - InglÃ©s Base ','/tareas/4',0,4,'2025-11-02 17:15:29'),(9,4,'alumno','nueva_tarea','Nueva tarea asignada','tarea para ingles base - InglÃ©s Base ','/tareas/4',1,4,'2025-11-02 17:15:29'),(10,2,'profesor','comentario','Nuevo comentario','Micaela Gomez comentÃ³ en \"anuncio para los alumnos de ingles base\"',NULL,1,8,'2025-11-02 17:16:13'),(11,16,'alumno','anuncio','Nuevo anuncio','nueva prueba de notificacion anuncio - InglÃ©s Base ','/anuncios/9',0,9,'2025-11-02 17:17:35'),(12,15,'alumno','anuncio','Nuevo anuncio','nueva prueba de notificacion anuncio - InglÃ©s Base ','/anuncios/9',1,9,'2025-11-02 17:17:35'),(13,6,'alumno','anuncio','Nuevo anuncio','nueva prueba de notificacion anuncio - InglÃ©s Base ','/anuncios/9',0,9,'2025-11-02 17:17:35'),(14,5,'alumno','anuncio','Nuevo anuncio','nueva prueba de notificacion anuncio - InglÃ©s Base ','/anuncios/9',0,9,'2025-11-02 17:17:35'),(15,4,'alumno','anuncio','Nuevo anuncio','nueva prueba de notificacion anuncio - InglÃ©s Base ','/anuncios/9',1,9,'2025-11-02 17:17:35'),(16,2,'profesor','entrega_tarea','Nueva entrega recibida','Micaela Gomez ha entregado la tarea \"tarea para ingles base\" del curso InglÃ©s Base ','/entregas/4',1,4,'2025-11-02 17:27:19'),(17,4,'alumno','calificacion','Nueva calificaciÃ³n','Tu entrega de \"tarea para ingles base\" ha sido calificada: 8','/tareas/4',1,4,'2025-11-02 17:49:24'),(18,25,'profesor','nueva_inscripcion','Nueva inscripciÃ³n','Matias Rodriguez se inscribiÃ³ en Japones Intermedio','/cursos/7',1,7,'2025-11-03 22:27:47'),(19,25,'profesor','nueva_inscripcion','Nueva inscripciÃ³n','Gabriela Jimenez se inscribiÃ³ en Japones Intermedio','/cursos/7',1,7,'2025-11-03 22:27:47'),(20,25,'profesor','nueva_inscripcion','Nueva inscripciÃ³n','Hernan Toledo se inscribiÃ³ en Japones Intermedio','/cursos/7',1,7,'2025-11-03 22:27:47'),(21,25,'profesor','nueva_inscripcion','Nueva inscripciÃ³n','Paula Martinez se inscribiÃ³ en Japones Intermedio','/cursos/7',1,7,'2025-11-03 22:27:47'),(22,25,'profesor','nueva_inscripcion','Nueva inscripciÃ³n','Jorge Sanchez se inscribiÃ³ en Japones Intermedio','/cursos/7',1,7,'2025-11-03 22:27:47'),(23,25,'profesor','nueva_inscripcion','Nueva inscripciÃ³n','Micaela Gomez se inscribiÃ³ en Japones Intermedio','/cursos/7',1,7,'2025-11-03 22:27:47'),(24,21,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio nipon intermedio - Japones Intermedio','/anuncios/10',1,10,'2025-11-03 22:52:39'),(25,16,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio nipon intermedio - Japones Intermedio','/anuncios/10',0,10,'2025-11-03 22:52:39'),(26,15,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio nipon intermedio - Japones Intermedio','/anuncios/10',1,10,'2025-11-03 22:52:39'),(27,6,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio nipon intermedio - Japones Intermedio','/anuncios/10',0,10,'2025-11-03 22:52:39'),(28,5,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio nipon intermedio - Japones Intermedio','/anuncios/10',0,10,'2025-11-03 22:52:39'),(29,4,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio nipon intermedio - Japones Intermedio','/anuncios/10',1,10,'2025-11-03 22:52:39'),(30,25,'profesor','comentario','Nuevo comentario','Hernan Toledo comentÃ³ en \"anuncio nipon intermedio\"',NULL,1,10,'2025-11-03 22:53:45'),(31,2,'profesor','entrega_tarea','Nueva entrega recibida','Hernan Toledo ha entregado la tarea \"tarea para ingles base\" del curso InglÃ©s Base ','/entregas/4',1,4,'2025-11-03 22:54:02'),(32,2,'profesor','comentario','Nuevo comentario','Micaela Gomez comentÃ³ en \"nueva prueba de notificacion anuncio\"',NULL,1,9,'2025-11-06 01:25:48'),(33,16,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio japones ! - Japones Basico','/anuncios/11',0,11,'2025-11-06 02:21:45'),(34,15,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio japones ! - Japones Basico','/anuncios/11',0,11,'2025-11-06 02:21:45'),(35,6,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio japones ! - Japones Basico','/anuncios/11',0,11,'2025-11-06 02:21:45'),(36,5,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio japones ! - Japones Basico','/anuncios/11',0,11,'2025-11-06 02:21:45'),(37,4,'alumno','anuncio_importante','âš ï¸ Anuncio Importante','anuncio japones ! - Japones Basico','/anuncios/11',0,11,'2025-11-06 02:21:45'),(38,24,'profesor','comentario','Nuevo comentario','Hernan Toledo comentÃ³ en \"anuncio japones !\"',NULL,0,11,'2025-11-06 02:22:17');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opciones_encuesta`
--

DROP TABLE IF EXISTS `opciones_encuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opciones_encuesta` (
  `id_opcion` int(11) NOT NULL AUTO_INCREMENT,
  `id_encuesta` int(11) NOT NULL,
  `texto` varchar(255) NOT NULL,
  `votos` int(11) DEFAULT 0,
  PRIMARY KEY (`id_opcion`),
  KEY `id_encuesta` (`id_encuesta`),
  CONSTRAINT `opciones_encuesta_ibfk_1` FOREIGN KEY (`id_encuesta`) REFERENCES `encuestas` (`id_encuesta`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opciones_encuesta`
--

LOCK TABLES `opciones_encuesta` WRITE;
/*!40000 ALTER TABLE `opciones_encuesta` DISABLE KEYS */;
INSERT INTO `opciones_encuesta` VALUES (1,1,'si',1),(2,1,'no',0),(3,2,'si',0),(4,2,'no',0),(5,2,'tal vez',0),(6,3,'no',0),(7,3,'ok',0),(8,4,'no',1),(9,4,'no se',0);
/*!40000 ALTER TABLE `opciones_encuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos` (
  `id_pago` int(11) NOT NULL AUTO_INCREMENT,
  `id_alumno` int(11) DEFAULT NULL,
  `id_concepto` int(11) DEFAULT NULL,
  `id_medio_pago` int(11) DEFAULT NULL,
  `id_administrativo` int(11) DEFAULT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `fecha_pago` date DEFAULT NULL,
  `estado_pago` enum('pendiente','pagado','mora') DEFAULT 'pagado',
  `periodo` varchar(7) DEFAULT NULL COMMENT 'Formato: YYYY-MM para identificar mes de la cuota',
  `fecha_vencimiento` date DEFAULT NULL,
  PRIMARY KEY (`id_pago`),
  KEY `id_alumno` (`id_alumno`),
  KEY `id_concepto` (`id_concepto`),
  KEY `id_medio_pago` (`id_medio_pago`),
  KEY `id_administrativo` (`id_administrativo`),
  KEY `idx_pagos_periodo` (`periodo`),
  KEY `idx_estado_pago` (`estado_pago`),
  KEY `idx_fecha_vencimiento` (`fecha_vencimiento`),
  KEY `idx_alumno_periodo` (`id_alumno`,`periodo`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`),
  CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`id_concepto`) REFERENCES `conceptos_pago` (`id_concepto`),
  CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`id_medio_pago`) REFERENCES `medios_pago` (`id_medio_pago`),
  CONSTRAINT `pagos_ibfk_4` FOREIGN KEY (`id_administrativo`) REFERENCES `administrativos` (`id_administrativo`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
INSERT INTO `pagos` VALUES (1,4,1,1,7,5000.00,'2025-01-10','pagado',NULL,NULL),(22,5,1,NULL,NULL,9500.00,NULL,'pendiente','2025-09','2025-09-10'),(23,6,1,NULL,NULL,9500.00,NULL,'pendiente','2025-10','2025-10-10'),(24,4,1,NULL,NULL,10000.00,NULL,'pendiente','2025-12','2025-12-10'),(25,5,1,NULL,NULL,9500.00,NULL,'pendiente','2025-12','2025-12-10'),(33,5,1,NULL,NULL,9500.00,NULL,'pendiente','2025-09','2025-09-10'),(34,6,1,NULL,NULL,9500.00,NULL,'pendiente','2025-10','2025-10-10'),(35,4,1,NULL,NULL,10000.00,NULL,'pendiente','2025-12','2025-12-10'),(43,5,1,NULL,NULL,9500.00,NULL,'pendiente','2025-09','2025-09-10'),(44,6,1,NULL,NULL,9500.00,NULL,'pendiente','2025-10','2025-10-10'),(52,5,1,NULL,NULL,9500.00,NULL,'pendiente','2025-09','2025-09-10');
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfiles`
--

DROP TABLE IF EXISTS `perfiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfiles` (
  `id_perfil` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_perfil` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_perfil`),
  UNIQUE KEY `nombre_perfil` (`nombre_perfil`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfiles`
--

LOCK TABLES `perfiles` WRITE;
/*!40000 ALTER TABLE `perfiles` DISABLE KEYS */;
INSERT INTO `perfiles` VALUES (1,'admin'),(3,'alumno'),(2,'profesor');
/*!40000 ALTER TABLE `perfiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personas`
--

DROP TABLE IF EXISTS `personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personas` (
  `id_persona` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `mail` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `dni` varchar(20) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_nacimiento` date DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `biografia` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `mail` (`mail`),
  KEY `idx_dni` (`dni`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personas`
--

LOCK TABLES `personas` WRITE;
/*!40000 ALTER TABLE `personas` DISABLE KEYS */;
INSERT INTO `personas` VALUES (1,'Eduardo','Mendoza','eduardo.mendoza@cemi.com','+543814463243','42445058','2025-11-01 21:40:39',NULL,NULL,NULL,NULL),(2,'Bautista','Bareiro','bautista.bareiro@cemi.com','11-4567-8901','35123789','2025-11-01 21:40:39','1999-06-05','Buenos Aires','Hola alumnos.','/uploads/avatars/avatar-2-1762402329670-519210788.png'),(3,'Carlos','Lucena','carlos.lucena@cemi.com','11-4567-8902','33987456','2025-11-01 21:40:39',NULL,NULL,NULL,NULL),(4,'Micaela','Gomez','micaela.gomez@cemi.com','11-1439-3159','40123456','2025-11-01 21:40:39',NULL,NULL,'Hola soy micaela estudiante de idiomas.','/uploads/avatars/avatar-4-1762403115086-984387695.jpg'),(5,'Jorge','Sanchez','jorge.sanchez@cemi.com','11-5925-6186','38987654','2025-11-01 21:40:39',NULL,NULL,NULL,NULL),(6,'Paula','Martinez','paula.martinez@cemi.com','11-5212-6600','42555777','2025-11-01 21:40:39',NULL,NULL,NULL,NULL),(7,'Sofia','LÃ³pez','sofia.lopez@cemi.com',NULL,NULL,'2025-11-01 21:40:39',NULL,NULL,NULL,NULL),(8,'Mario','Gonzalez','mario.gonzalez@cemi.com','11-4567-8903','37555888','2025-11-01 21:40:39',NULL,NULL,NULL,NULL),(9,'Fernanda','Cruz','fernanda.cruz@cemi.com','11-4567-8904','36444777','2025-11-01 21:40:39',NULL,NULL,NULL,NULL),(10,'Pablo','Garcia','pablo.garcia@cemi.com','11-4567-8905','34222333','2025-11-01 21:40:39',NULL,NULL,NULL,NULL),(15,'Hernan','Toledo','hernantoledo@gmail.com','+54 381 4463243','42444059','2025-11-01 21:45:50',NULL,NULL,NULL,NULL),(16,'Gabriela','Jimenez','gabrielajimenez@hotmail.com','+54 381 8865633','41010583','2025-11-01 21:50:34',NULL,NULL,NULL,NULL),(21,'Matias','Rodriguez','matiasrodriguez@yahoo.com.ar','+54 381 555444888','40889654','2025-11-02 10:54:10',NULL,NULL,NULL,NULL),(24,'Irina','Lopez','irinalopezcemi@cemi.com',NULL,'32889456','2025-11-02 11:45:48',NULL,NULL,NULL,'/uploads/avatars/avatar-12-1762406487943-430033344.webp'),(25,'Javier','Monteros','javiermonteros@educacion.com',NULL,'24014506','2025-11-03 22:21:19',NULL,NULL,NULL,NULL),(26,'Administrador','Cero','admincero@prueba.com','+543814463243','42445059','2025-11-04 00:30:22',NULL,NULL,NULL,NULL),(27,'Juan','Perez','juanperezadmin@cemi.com','+543816658975','501232321','2025-11-04 13:01:23',NULL,NULL,NULL,NULL),(28,'Eduardo','Mendez','administracioncemi@cemi.com','-','45668998','2025-11-06 04:47:37',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `personas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profesores`
--

DROP TABLE IF EXISTS `profesores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profesores` (
  `id_profesor` int(11) NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `estado` enum('activo','inactivo','licencia') DEFAULT 'activo',
  `usuario` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_profesor`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `id_persona` (`id_persona`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_ingreso` (`fecha_ingreso`),
  KEY `idx_profesores_usuario` (`usuario`),
  CONSTRAINT `profesores_ibfk_1` FOREIGN KEY (`id_profesor`) REFERENCES `personas` (`id_persona`),
  CONSTRAINT `profesores_ibfk_2` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profesores`
--

LOCK TABLES `profesores` WRITE;
/*!40000 ALTER TABLE `profesores` DISABLE KEYS */;
INSERT INTO `profesores` VALUES (2,'InglÃ©s',2,'11-4567-8901','2022-07-01','activo','profbareiro','$2b$10$vYeRz7zgLr9cfZl.rWsV9uoCG2IJjkmkl8Wbg0epqKsPElXag/OD2'),(3,'FrancÃ©s',3,'11-7890-1234','2024-09-26','activo','proflucena','$2b$10$aCfHm7kK5QjvaoPQ4AM3Xud8sPn80HKV10KcIDo86i1pTdK1/W.Ze'),(10,'Aleman',10,'11-3456-7890','2025-05-12','activo','profgarcia','$2b$10$6GZ7eXPU2biB88JU000XbOy8dlK/g.YV/62hzdpHkk0dtK7MlBmtS'),(24,'Japones',24,'+54 381 9955443','2025-11-02','activo','profirina','$2b$10$iKGWbBGdROMnN5IBAcyQFu7BInXF0J02mND.VviWu.CXS2rp43WRS'),(25,'Japones Intermedio',25,'+543816658975','2025-11-03','activo','profjavier','$2b$10$hg7C1K/EwXr9LkhSnIf0GexWhjtl0JitxpyLo96/0NR4wbP3utSTu');
/*!40000 ALTER TABLE `profesores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profesores_idiomas`
--

DROP TABLE IF EXISTS `profesores_idiomas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profesores_idiomas` (
  `id_profesor` int(11) NOT NULL,
  `id_idioma` int(11) NOT NULL,
  PRIMARY KEY (`id_profesor`,`id_idioma`),
  KEY `id_idioma` (`id_idioma`),
  CONSTRAINT `profesores_idiomas_ibfk_1` FOREIGN KEY (`id_profesor`) REFERENCES `profesores` (`id_profesor`),
  CONSTRAINT `profesores_idiomas_ibfk_2` FOREIGN KEY (`id_idioma`) REFERENCES `idiomas` (`id_idioma`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profesores_idiomas`
--

LOCK TABLES `profesores_idiomas` WRITE;
/*!40000 ALTER TABLE `profesores_idiomas` DISABLE KEYS */;
INSERT INTO `profesores_idiomas` VALUES (2,1),(3,2),(10,3);
/*!40000 ALTER TABLE `profesores_idiomas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas`
--

DROP TABLE IF EXISTS `tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas` (
  `id_tarea` int(11) NOT NULL AUTO_INCREMENT,
  `id_curso` int(11) NOT NULL,
  `id_profesor` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `requerimientos` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_limite` datetime NOT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `archivo_adjunto` varchar(500) DEFAULT NULL,
  `puntos` int(11) DEFAULT 100,
  `notificar` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_tarea`),
  KEY `id_curso` (`id_curso`),
  KEY `id_profesor` (`id_profesor`),
  CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`id_profesor`) REFERENCES `profesores` (`id_profesor`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (2,5,2,'Prueba de tarea para ingles intermedio','Probando 123','que la prueba funcione ','2025-11-02 15:05:23','2025-11-25 23:59:00','https://github.com/thingswenevershared/prog','http://localhost:3000/uploads/tareas/IMG_20220217_223259813_HDR-1762106723014-639395177.jpg',90,1),(3,1,2,'Prueba de tarea para ingles base','Tarea','que se haga la tarea','2025-11-02 17:08:55','2025-11-14 23:59:00',NULL,'http://localhost:3000/uploads/tareas/IMG_20220523_231821007_HDR-1762114135604-63483456.jpg',100,1),(4,1,2,'tarea para ingles base','ingles base','tarea','2025-11-02 17:15:29','2025-11-27 23:59:00',NULL,NULL,100,1);
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `id_perfil` int(11) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  KEY `id_persona` (`id_persona`),
  KEY `id_perfil` (`id_perfil`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`),
  CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`id_perfil`) REFERENCES `perfiles` (`id_perfil`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'administracion','$2b$10$TkKMPUwwFjX1bVtjBrKjGeHuqoXdxJj4gK9VEUiAFqmnxwLw07nWy',1,1,'2025-11-01 21:44:52'),(2,'profbareiro','$2b$10$RIAvUynNqo7VGvWmgPb2FezJsKtFiPy75Y9zsY3XH75dwl598qtbK',2,2,'2025-11-01 21:44:52'),(3,'proflucena','$2b$10$ZQLdEWn88.TbU.0xPhZxS.n15hwC2IeBG/ib96rrlBwhonue0MnDG',3,2,'2025-11-01 21:44:52'),(4,'alumnamica','$2b$10$ppnYPeZHqJOaEcbbB6/frO1PKarhxan/TftSEaxOiYa2ULvTHX3Hq',4,3,'2025-11-01 21:44:52'),(5,'alumnojorge','alumnojorgecemi',5,3,'2025-11-01 21:44:52'),(6,'alumnapaula','alumnapaulacemi',6,3,'2025-11-01 21:44:52'),(7,'profgarcia','$2b$10$H8DXA.GeC.qmmqa8pR1bVeCa1zUFgAE2kw9G4sZKKenpSFkTqkSSi',10,2,'2025-11-01 21:44:52'),(8,'alumnohernan','$2b$10$QtUxpXATLCPc9Po42lN5oevMtU6IYBW6PfcBS63IbWxh6oOjC1bVm',15,3,'2025-11-01 21:45:50'),(9,'alumnagabriela','$2b$10$o6mewQLiLP0LirRVsfF3aOYayelpWL1BL1q/QqtX4zQn0GNXUf2zO',16,3,'2025-11-01 21:50:34'),(10,'alumnomatias','$2b$10$.zKHS8o5VBT9SgGOZ3SZBOaSdbwCRafVvn/6YL4OgRpAuh/Rfa01u',21,3,'2025-11-02 10:54:10'),(12,'profirina','$2b$10$SPyLwuPFlrUjgfYWLXZRUeDyDGXB6ZKwkooVyzH9mzKPnUpJ6dPNC',24,2,'2025-11-02 11:46:05'),(13,'profjavier','$2b$10$37KHmPjx40dB7XQj9SaWqeW7LmtO6JrUZura1QtMWqsYe5qTbbW.y',25,2,'2025-11-03 22:21:37'),(14,'admincero','$2b$10$UgKaUuD7ZUUNQErMo/nXbe9vP678Vqze.W43jo9LQqDr0H9bc6riy',26,1,'2025-11-04 00:30:22'),(15,'adminjuan','$2b$10$.mlQpOdxPJN57GL.Q4gdYuijSdlBghU/YX8jsepGv0B/MHpTzaRuO',27,1,'2025-11-04 13:01:23'),(16,'administrador','$2b$10$Qey5quvJe.XbSfVIUmyM7.2hIFe/SrSdPjQCZD2c27zqcdbRFjzJO',28,1,'2025-11-06 04:47:37');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vista_classroom_conversaciones`
--

DROP TABLE IF EXISTS `vista_classroom_conversaciones`;
/*!50001 DROP VIEW IF EXISTS `vista_classroom_conversaciones`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_classroom_conversaciones` AS SELECT 
 1 AS `id_conversacion`,
 1 AS `id_curso`,
 1 AS `nombre_curso`,
 1 AS `id_alumno_usuario`,
 1 AS `alumno_username`,
 1 AS `alumno_nombre_completo`,
 1 AS `id_profesor_usuario`,
 1 AS `profesor_username`,
 1 AS `profesor_nombre_completo`,
 1 AS `ultimo_mensaje`,
 1 AS `fecha_ultimo_mensaje`,
 1 AS `mensajes_no_leidos_alumno`,
 1 AS `mensajes_no_leidos_profesor`,
 1 AS `fecha_creacion`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_classroom_mensajes_recientes`
--

DROP TABLE IF EXISTS `vista_classroom_mensajes_recientes`;
/*!50001 DROP VIEW IF EXISTS `vista_classroom_mensajes_recientes`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_classroom_mensajes_recientes` AS SELECT 
 1 AS `id_mensaje`,
 1 AS `id_conversacion`,
 1 AS `id_curso`,
 1 AS `nombre_curso`,
 1 AS `id_usuario_remitente`,
 1 AS `remitente_username`,
 1 AS `remitente_nombre`,
 1 AS `tipo_remitente`,
 1 AS `mensaje`,
 1 AS `leido`,
 1 AS `fecha_envio`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_inscripciones`
--

DROP TABLE IF EXISTS `vista_inscripciones`;
/*!50001 DROP VIEW IF EXISTS `vista_inscripciones`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_inscripciones` AS SELECT 
 1 AS `id_inscripcion`,
 1 AS `id_alumno`,
 1 AS `alumno`,
 1 AS `legajo`,
 1 AS `id_curso`,
 1 AS `nombre_curso`,
 1 AS `idioma`,
 1 AS `nivel`,
 1 AS `fecha_inscripcion`,
 1 AS `estado`,
 1 AS `profesor`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_pagos`
--

DROP TABLE IF EXISTS `vista_pagos`;
/*!50001 DROP VIEW IF EXISTS `vista_pagos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_pagos` AS SELECT 
 1 AS `id_pago`,
 1 AS `id_alumno`,
 1 AS `alumno`,
 1 AS `legajo`,
 1 AS `concepto`,
 1 AS `monto`,
 1 AS `fecha_pago`,
 1 AS `periodo`,
 1 AS `fecha_vencimiento`,
 1 AS `estado_pago`,
 1 AS `medio_pago`,
 1 AS `administrativo`,
 1 AS `estado_visual`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_profesores`
--

DROP TABLE IF EXISTS `vista_profesores`;
/*!50001 DROP VIEW IF EXISTS `vista_profesores`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_profesores` AS SELECT 
 1 AS `id_profesor`,
 1 AS `nombre_completo`,
 1 AS `especialidad`,
 1 AS `idiomas`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `votos_encuesta`
--

DROP TABLE IF EXISTS `votos_encuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `votos_encuesta` (
  `id_voto` int(11) NOT NULL AUTO_INCREMENT,
  `id_encuesta` int(11) NOT NULL,
  `id_opcion` int(11) NOT NULL,
  `id_alumno` int(11) NOT NULL,
  `fecha_voto` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_voto`),
  UNIQUE KEY `unique_vote` (`id_encuesta`,`id_alumno`),
  KEY `id_opcion` (`id_opcion`),
  KEY `id_alumno` (`id_alumno`),
  CONSTRAINT `votos_encuesta_ibfk_1` FOREIGN KEY (`id_encuesta`) REFERENCES `encuestas` (`id_encuesta`) ON DELETE CASCADE,
  CONSTRAINT `votos_encuesta_ibfk_2` FOREIGN KEY (`id_opcion`) REFERENCES `opciones_encuesta` (`id_opcion`) ON DELETE CASCADE,
  CONSTRAINT `votos_encuesta_ibfk_3` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `votos_encuesta`
--

LOCK TABLES `votos_encuesta` WRITE;
/*!40000 ALTER TABLE `votos_encuesta` DISABLE KEYS */;
INSERT INTO `votos_encuesta` VALUES (1,1,1,4,'2025-11-02 16:41:20'),(2,4,8,4,'2025-11-03 02:04:00');
/*!40000 ALTER TABLE `votos_encuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `vista_classroom_conversaciones`
--

/*!50001 DROP VIEW IF EXISTS `vista_classroom_conversaciones`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `vista_classroom_conversaciones` AS select `cc`.`id_conversacion` AS `id_conversacion`,`cc`.`id_curso` AS `id_curso`,`c`.`nombre_curso` AS `nombre_curso`,`cc`.`id_alumno_usuario` AS `id_alumno_usuario`,`ua`.`username` AS `alumno_username`,concat(`pa`.`nombre`,' ',`pa`.`apellido`) AS `alumno_nombre_completo`,`cc`.`id_profesor_usuario` AS `id_profesor_usuario`,`up`.`username` AS `profesor_username`,concat(`pp`.`nombre`,' ',`pp`.`apellido`) AS `profesor_nombre_completo`,`cc`.`ultimo_mensaje` AS `ultimo_mensaje`,`cc`.`fecha_ultimo_mensaje` AS `fecha_ultimo_mensaje`,`cc`.`mensajes_no_leidos_alumno` AS `mensajes_no_leidos_alumno`,`cc`.`mensajes_no_leidos_profesor` AS `mensajes_no_leidos_profesor`,`cc`.`fecha_creacion` AS `fecha_creacion` from (((((`classroom_conversaciones` `cc` join `cursos` `c` on(`cc`.`id_curso` = `c`.`id_curso`)) join `usuarios` `ua` on(`cc`.`id_alumno_usuario` = `ua`.`id_usuario`)) join `personas` `pa` on(`ua`.`id_persona` = `pa`.`id_persona`)) join `usuarios` `up` on(`cc`.`id_profesor_usuario` = `up`.`id_usuario`)) join `personas` `pp` on(`up`.`id_persona` = `pp`.`id_persona`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_classroom_mensajes_recientes`
--

/*!50001 DROP VIEW IF EXISTS `vista_classroom_mensajes_recientes`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `vista_classroom_mensajes_recientes` AS select `cm`.`id_mensaje` AS `id_mensaje`,`cm`.`id_conversacion` AS `id_conversacion`,`cc`.`id_curso` AS `id_curso`,`c`.`nombre_curso` AS `nombre_curso`,`cm`.`id_usuario_remitente` AS `id_usuario_remitente`,`u`.`username` AS `remitente_username`,concat(`p`.`nombre`,' ',`p`.`apellido`) AS `remitente_nombre`,`cm`.`tipo_remitente` AS `tipo_remitente`,`cm`.`mensaje` AS `mensaje`,`cm`.`leido` AS `leido`,`cm`.`fecha_envio` AS `fecha_envio` from ((((`classroom_mensajes` `cm` join `classroom_conversaciones` `cc` on(`cm`.`id_conversacion` = `cc`.`id_conversacion`)) join `cursos` `c` on(`cc`.`id_curso` = `c`.`id_curso`)) join `usuarios` `u` on(`cm`.`id_usuario_remitente` = `u`.`id_usuario`)) join `personas` `p` on(`u`.`id_persona` = `p`.`id_persona`)) order by `cm`.`fecha_envio` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_inscripciones`
--

/*!50001 DROP VIEW IF EXISTS `vista_inscripciones`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `vista_inscripciones` AS select `i`.`id_inscripcion` AS `id_inscripcion`,`i`.`id_alumno` AS `id_alumno`,concat(`p`.`nombre`,' ',`p`.`apellido`) AS `alumno`,`a`.`legajo` AS `legajo`,`i`.`id_curso` AS `id_curso`,`c`.`nombre_curso` AS `nombre_curso`,`id`.`nombre_idioma` AS `idioma`,`n`.`descripcion` AS `nivel`,`i`.`fecha_inscripcion` AS `fecha_inscripcion`,`i`.`estado` AS `estado`,concat(`pp`.`nombre`,' ',`pp`.`apellido`) AS `profesor` from (((((((`inscripciones` `i` join `alumnos` `a` on(`a`.`id_alumno` = `i`.`id_alumno`)) join `personas` `p` on(`p`.`id_persona` = `a`.`id_persona`)) join `cursos` `c` on(`c`.`id_curso` = `i`.`id_curso`)) left join `idiomas` `id` on(`id`.`id_idioma` = `c`.`id_idioma`)) left join `niveles` `n` on(`n`.`id_nivel` = `c`.`id_nivel`)) left join `profesores` `prof` on(`prof`.`id_profesor` = `c`.`id_profesor`)) left join `personas` `pp` on(`pp`.`id_persona` = `prof`.`id_persona`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_pagos`
--

/*!50001 DROP VIEW IF EXISTS `vista_pagos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `vista_pagos` AS select `p`.`id_pago` AS `id_pago`,`p`.`id_alumno` AS `id_alumno`,concat(`per`.`nombre`,' ',`per`.`apellido`) AS `alumno`,`a`.`legajo` AS `legajo`,`c`.`descripcion` AS `concepto`,`p`.`monto` AS `monto`,`p`.`fecha_pago` AS `fecha_pago`,`p`.`periodo` AS `periodo`,`p`.`fecha_vencimiento` AS `fecha_vencimiento`,`p`.`estado_pago` AS `estado_pago`,`m`.`descripcion` AS `medio_pago`,`ad`.`cargo` AS `administrativo`,case when `p`.`fecha_pago` is null and `p`.`fecha_vencimiento` < curdate() then 'mora' when `p`.`fecha_pago` is null and to_days(`p`.`fecha_vencimiento`) - to_days(curdate()) <= 5 then 'proximo_vencimiento' when `p`.`fecha_pago` is not null then 'pagado' else 'al_dia' end AS `estado_visual` from (((((`pagos` `p` join `alumnos` `a` on(`a`.`id_alumno` = `p`.`id_alumno`)) join `personas` `per` on(`per`.`id_persona` = `a`.`id_persona`)) join `conceptos_pago` `c` on(`c`.`id_concepto` = `p`.`id_concepto`)) join `medios_pago` `m` on(`m`.`id_medio_pago` = `p`.`id_medio_pago`)) left join `administrativos` `ad` on(`ad`.`id_administrativo` = `p`.`id_administrativo`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_profesores`
--

/*!50001 DROP VIEW IF EXISTS `vista_profesores`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `vista_profesores` AS select `p`.`id_profesor` AS `id_profesor`,concat(`per`.`nombre`,' ',`per`.`apellido`) AS `nombre_completo`,`p`.`especialidad` AS `especialidad`,group_concat(`i`.`nombre_idioma` separator ', ') AS `idiomas` from (((`profesores` `p` join `personas` `per` on(`per`.`id_persona` = `p`.`id_profesor`)) left join `profesores_idiomas` `pi` on(`p`.`id_profesor` = `pi`.`id_profesor`)) left join `idiomas` `i` on(`pi`.`id_idioma` = `i`.`id_idioma`)) group by `p`.`id_profesor` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-06  5:44:05

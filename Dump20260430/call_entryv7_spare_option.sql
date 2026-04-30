-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: call_entryv7
-- ------------------------------------------------------
-- Server version	8.0.45

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
-- Table structure for table `spare_option`
--

DROP TABLE IF EXISTS `spare_option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spare_option` (
  `id` int NOT NULL AUTO_INCREMENT,
  `spare_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spare_option`
--

LOCK TABLES `spare_option` WRITE;
/*!40000 ALTER TABLE `spare_option` DISABLE KEYS */;
INSERT INTO `spare_option` VALUES (1,'11xLight'),(2,'Addon card'),(3,'Auxiliary Light'),(4,'Axis card New code'),(5,'Axis card Old Code'),(6,'Axis motor'),(7,'10MP Camera'),(8,'10MP Camera Cable'),(9,'Central Card 64 Bit'),(10,'Central card Old Code'),(11,'Co-axial Light'),(12,'Cooling Fan'),(13,'Encoder Readerhead'),(14,'GP Sheet 2015'),(15,'GP Sheet 4020'),(16,'GP Sheet 4030'),(17,'H-Nut 2mm'),(18,'H-Nut 2mm Asmbly'),(19,'H-Nut 5mm'),(20,'H-Nut 5mm Asmbly'),(21,'Joystick Box'),(22,'Joystick Cable'),(23,'Lighting Card'),(24,'Lighting Card (HT)'),(25,'Motherboard'),(26,'Motor Cupler'),(27,'D33 Controller'),(28,'Power Adaptor'),(29,'Probe PCB'),(30,'Profile Light'),(31,'Retractor Spring'),(32,'Surface Light'),(33,'Surface Light(Probe Sslot)'),(34,'Surface Light (HT)'),(35,'Usb Module'),(36,'Zoom In/Out Motor'),(37,'Zoom In/Out Motor Assembly'),(38,'Limitswitch'),(39,'NOTA');
/*!40000 ALTER TABLE `spare_option` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-30 14:14:32

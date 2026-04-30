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
-- Table structure for table `work_done`
--

DROP TABLE IF EXISTS `work_done`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_done` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_front_id` int NOT NULL,
  `done_date` date DEFAULT NULL,
  `done_by` varchar(20) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'open',
  PRIMARY KEY (`id`),
  KEY `work_front_id` (`work_front_id`),
  CONSTRAINT `work_done_ibfk_1` FOREIGN KEY (`work_front_id`) REFERENCES `work_front` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_done`
--

LOCK TABLES `work_done` WRITE;
/*!40000 ALTER TABLE `work_done` DISABLE KEYS */;
INSERT INTO `work_done` VALUES (1,4,'2026-03-31','SP','closed'),(2,11,'2026-04-01','VB','closed'),(3,16,'2026-04-02','DM','closed'),(4,1,'2026-04-02','VB','closed'),(5,18,'2026-04-29','ST ','closed'),(6,3,'2026-04-29','','closed'),(7,5,'2026-04-29','','closed'),(8,20,'2026-04-29','','closed'),(9,19,'2026-04-29','','closed'),(10,9,'2026-04-29','SD','closed'),(11,21,'2026-04-29','AK','closed');
/*!40000 ALTER TABLE `work_done` ENABLE KEYS */;
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

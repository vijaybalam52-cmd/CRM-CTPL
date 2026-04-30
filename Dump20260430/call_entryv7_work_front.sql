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
-- Table structure for table `work_front`
--

DROP TABLE IF EXISTS `work_front`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_front` (
  `id` int NOT NULL AUTO_INCREMENT,
  `issue_id` int NOT NULL,
  `short_form_id` int NOT NULL,
  `cluster_id` int NOT NULL,
  `status` varchar(50) DEFAULT 'open',
  `contact_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `issue_id` (`issue_id`),
  KEY `short_form_id` (`short_form_id`),
  KEY `cluster_id` (`cluster_id`),
  KEY `work_front_contact` (`contact_id`),
  CONSTRAINT `work_front_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_front_ibfk_1` FOREIGN KEY (`issue_id`) REFERENCES `ticket_issues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_front_ibfk_2` FOREIGN KEY (`short_form_id`) REFERENCES `short_form` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_front_ibfk_3` FOREIGN KEY (`cluster_id`) REFERENCES `cluster` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_front`
--

LOCK TABLES `work_front` WRITE;
/*!40000 ALTER TABLE `work_front` DISABLE KEYS */;
INSERT INTO `work_front` VALUES (1,1,1,7,'done',95),(2,2,2,11,'open',2),(3,3,3,2,'done',7),(4,4,4,14,'done',10),(5,5,5,2,'done',11),(6,6,9,11,'open',16),(7,7,7,11,'open',17),(8,8,8,11,'open',21),(9,9,10,4,'done',22),(10,10,1,118,'open',1123),(11,11,1,43,'done',693),(12,12,1,106,'open',139),(13,13,1,96,'open',4),(14,14,2,96,'open',3),(15,15,5,88,'open',35),(16,16,1,1,'done',587),(17,18,1,41,'open',265),(18,19,1,38,'done',1126),(19,20,1,38,'done',1126),(20,21,2,38,'done',1126),(21,22,1,14,'done',1127),(22,23,1,18,'open',1128);
/*!40000 ALTER TABLE `work_front` ENABLE KEYS */;
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

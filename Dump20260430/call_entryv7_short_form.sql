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
-- Table structure for table `short_form`
--

DROP TABLE IF EXISTS `short_form`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `short_form` (
  `id` int NOT NULL AUTO_INCREMENT,
  `s` int DEFAULT NULL,
  `a` int DEFAULT NULL,
  `i` int DEFAULT NULL,
  `d` int DEFAULT NULL,
  `e` int DEFAULT NULL,
  `f` int DEFAULT NULL,
  `p` int DEFAULT NULL,
  `prior` int DEFAULT NULL,
  `purpose` varchar(100) DEFAULT NULL,
  `priority` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `short_form`
--

LOCK TABLES `short_form` WRITE;
/*!40000 ALTER TABLE `short_form` DISABLE KEYS */;
INSERT INTO `short_form` VALUES (1,1,0,0,0,0,1,0,1,'Service','F 1 Service'),(2,0,1,0,0,0,1,0,2,'Calib','F 2 Calib'),(3,0,0,1,0,0,1,0,3,'Train/Upg','F 3 Train/Upg'),(4,0,0,0,1,0,1,0,4,'PMV','F 4 PMV'),(5,0,0,0,0,1,1,0,5,'Demo','F 5 Demo'),(6,0,0,0,0,0,1,1,6,'Extend','F 6 Extend'),(7,0,0,0,0,0,0,0,1,'Tele','T 1 Tele'),(8,0,0,0,0,0,0,0,2,'Online','T 2 Online'),(9,0,0,0,0,0,0,0,3,'Disc','T 3 Disc'),(10,0,0,0,0,0,0,0,4,'Courier','T 4 Courier');
/*!40000 ALTER TABLE `short_form` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-30 14:14:33

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
-- Table structure for table `dist`
--

DROP TABLE IF EXISTS `dist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `zarc` int DEFAULT NULL,
  `clust` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dist`
--

LOCK TABLES `dist` WRITE;
/*!40000 ALTER TABLE `dist` DISABLE KEYS */;
INSERT INTO `dist` VALUES (1,8011,'E-City'),(2,8012,'Bommasandra'),(3,8013,'Hosur'),(4,8021,'Jigani'),(5,8022,'Harohalli'),(6,8023,'Kanakapura'),(7,8031,'Banashankari'),(8,8032,'Bidadi'),(9,8033,'Mysore'),(10,8041,'Magadi Rd'),(11,8051,'Peenya'),(12,8052,'Tumkur'),(13,8053,'Hassan'),(14,8054,'Nelamangala'),(15,8061,'Dod Pura'),(16,8071,'Devanahalli'),(17,8081,'WhiteField'),(18,8082,'Kolar'),(19,8083,'Kuppam'),(20,8084,'Chittor'),(21,8001,'Hubli'),(22,8002,'Belgaum'),(23,8003,'Goa'),(24,8004,'Kolhapur'),(25,8005,'Kolkata'),(26,8006,'Tanjavur'),(27,8007,'Mangalore'),(28,2115,'Dadar '),(29,2114,'Goregaon'),(30,2113,'Vasai'),(31,2112,'Palghar'),(32,2111,'Vapi'),(33,2221,'Vikhroli'),(34,2222,'Thane'),(35,2223,'Dombivli'),(36,2301,'Nashik'),(37,2224,'Navi Mumbai'),(38,2411,'Bhosari'),(39,2412,'Hinjewadi'),(40,2413,'Talegaon'),(41,2421,'Chakan'),(42,2431,'Ahmdnagar'),(43,2441,'Hadapsar'),(44,2451,'Shirwal'),(45,2461,'Pirangut'),(46,2010,'Jalgaon '),(47,2020,'Nagpur'),(48,2021,'Aurangabad'),(49,2030,'Chiplun'),(50,5011,'Sanand'),(51,5021,'Kadi'),(52,5031,'Vatva'),(53,5111,'Anand'),(54,5112,'Vadodara'),(55,5121,'Kalol'),(56,5122,'Halol'),(57,5131,'Jhagadia'),(58,5231,'Wadhwan'),(59,5301,'Rajkot'),(60,5302,'Morbi'),(61,5401,'Jamnagar'),(62,1001,'Bhopal'),(63,1002,'Jodhpur'),(64,1015,'Jaipur'),(65,1042,'Haridwar'),(66,1054,'Kanpur'),(67,1111,'Gurgaon'),(68,1112,'Manesar'),(69,1113,'Binola /Bawal/Nimran'),(70,1114,'Alwar/Bhiwadi'),(71,1121,'Bahadurgarh'),(72,1122,'Rohtak'),(73,1131,'Kundli'),(74,1132,'Sonipat'),(75,1141,'Ghaziabad'),(76,1151,'Noida'),(77,1152,'Gr Noida'),(78,1153,'Aligarh'),(79,1154,'Agra'),(80,1161,'Faridabad'),(81,1162,'Delhi/ New Delhi'),(82,1311,'Baddi'),(83,1312,'Parwanoo'),(84,1313,'Solan'),(85,1333,'Patiala'),(86,1334,'Chandigarh'),(87,1335,'Ludhiana'),(88,4011,'OMR'),(89,4012,'Kalpakkam'),(90,4013,'Pondicherry'),(91,4021,'Guindy'),(92,4022,'Thirumudivakkam'),(93,4023,'Tambaram'),(94,4024,'MM Nagar'),(95,4025,'Villupuram'),(96,4031,'Sriperumbadur'),(97,4032,'Oragadam'),(98,4033,'Ranipet'),(99,4034,'Sholinghur'),(100,4041,'Ambattur'),(101,4042,'Avadi'),(102,4043,'Thiruvallur'),(103,4051,'Ennore'),(104,4052,'Sricity'),(105,4101,'Madurai'),(106,4102,'Tirunelveli'),(107,4103,'Kochin'),(108,4111,'Arasur'),(109,4111,'Kalapatti Rd'),(110,4112,'Avinashi Rd'),(111,4121,'Trichy Rd'),(112,4131,'Pollachi Rd'),(113,4141,'Pallakad Rd'),(114,4151,'Mpalyam Rd'),(115,4161,'Ganapathy '),(116,4162,'Annur'),(117,6011,'Patancheruvu'),(118,6021,'Jeedimetla'),(119,6031,'Cherlapally');
/*!40000 ALTER TABLE `dist` ENABLE KEYS */;
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

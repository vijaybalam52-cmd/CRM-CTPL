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
-- Table structure for table `cluster`
--

DROP TABLE IF EXISTS `cluster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cluster` (
  `id` int NOT NULL AUTO_INCREMENT,
  `z` int DEFAULT NULL,
  `a` int DEFAULT NULL,
  `r` int DEFAULT NULL,
  `c` int DEFAULT NULL,
  `cluster` varchar(50) DEFAULT NULL,
  `region` varchar(50) DEFAULT NULL,
  `zarc` int DEFAULT NULL,
  `rg` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster`
--

LOCK TABLES `cluster` WRITE;
/*!40000 ALTER TABLE `cluster` DISABLE KEYS */;
INSERT INTO `cluster` VALUES (1,8,0,1,1,'E-City','Bangalore',8011,'BLR'),(2,8,0,1,2,'Bommasandra','Bangalore',8012,'BLR'),(3,8,0,1,3,'Hosur','Bangalore',8013,'BLR'),(4,8,0,2,1,'Jigani','Bangalore',8021,'BLR'),(5,8,0,2,2,'Harohalli','Bangalore',8022,'BLR'),(6,8,0,2,3,'Kanakapura','Bangalore',8023,'BLR'),(7,8,0,3,1,'Banashankari','Bangalore',8031,'BLR'),(8,8,0,3,2,'Bidadi','Bangalore',8032,'BLR'),(9,8,0,3,3,'Mysore','Bangalore',8033,'BLR'),(10,8,0,4,1,'Magadi Rd','Bangalore',8041,'BLR'),(11,8,0,5,1,'Peenya','Bangalore',8051,'BLR'),(12,8,0,5,2,'Tumkur','Bangalore',8052,'BLR'),(13,8,0,5,3,'Hassan','Bangalore',8053,'BLR'),(14,8,0,5,4,'Nelamangala','Bangalore',8054,'BLR'),(15,8,0,6,1,'Dod Pura','Bangalore',8061,'BLR'),(16,8,0,7,1,'Devanahalli','Bangalore',8071,'BLR'),(17,8,0,8,1,'WhiteField','Bangalore',8081,'BLR'),(18,8,0,8,2,'Kolar','Bangalore',8082,'BLR'),(19,8,0,8,3,'Kuppam','Bangalore',8083,'BLR'),(20,8,0,8,4,'Chittor','Bangalore',8084,'BLR'),(21,8,0,0,1,'Hubli','Bangalore',8001,'BLR'),(22,8,0,0,2,'Belgaum','Bangalore',8002,'BLR'),(23,8,0,0,3,'Goa','Bangalore',8003,'BLR'),(24,8,0,0,4,'Kolhapur','Bangalore',8004,'BLR'),(25,8,0,0,5,'Kolkata','Bangalore',8005,'BLR'),(26,8,0,0,6,'Tanjavur','Bangalore',8006,'BLR'),(27,8,0,0,7,'Mangalore','Bangalore',8007,'BLR'),(28,2,1,1,5,'Dadar ','Maharashtra',2115,'MH'),(29,2,1,1,4,'Goregaon','Maharashtra',2114,'MH'),(30,2,1,1,3,'Vasai','Maharashtra',2113,'MH'),(31,2,1,1,2,'Palghar','Maharashtra',2112,'MH'),(32,2,1,1,1,'Vapi','Maharashtra',2111,'MH'),(33,2,2,2,1,'Vikhroli','Maharashtra',2221,'MH'),(34,2,2,2,2,'Thane','Maharashtra',2222,'MH'),(35,2,2,2,3,'Dombivli','Maharashtra',2223,'MH'),(36,2,3,0,1,'Nashik','Maharashtra',2301,'MH'),(37,2,2,2,4,'Navi Mumbai','Maharashtra',2224,'MH'),(38,2,4,1,1,'Bhosari','Maharashtra',2411,'MH'),(39,2,4,1,2,'Hinjewadi','Maharashtra',2412,'MH'),(40,2,4,1,3,'Talegaon','Maharashtra',2413,'MH'),(41,2,4,2,1,'Chakan','Maharashtra',2421,'MH'),(42,2,4,3,1,'Ahmdnagar','Maharashtra',2431,'MH'),(43,2,4,4,1,'Hadapsar','Maharashtra',2441,'MH'),(44,2,4,5,1,'Shirwal','Maharashtra',2451,'MH'),(45,2,4,6,1,'Pirangut','Maharashtra',2461,'MH'),(46,2,0,1,0,'Jalgaon ','Maharashtra',2010,'MH'),(47,2,0,2,0,'Nagpur','Maharashtra',2020,'MH'),(48,2,0,2,1,'Aurangabad','Maharashtra',2021,'MH'),(49,2,0,3,0,'Chiplun','Maharashtra',2030,'MH'),(50,5,0,1,1,'Sanand','Gujarat',5011,'GJ'),(51,5,0,2,1,'Kadi','Gujarat',5021,'GJ'),(52,5,0,3,1,'Vatva','Gujarat',5031,'GJ'),(53,5,1,1,1,'Anand','Gujarat',5111,'GJ'),(54,5,1,1,2,'Vadodara','Gujarat',5112,'GJ'),(55,5,1,2,1,'Kalol','Gujarat',5121,'GJ'),(56,5,1,2,2,'Halol','Gujarat',5122,'GJ'),(57,5,1,3,1,'Jhagadia','Gujarat',5131,'GJ'),(58,5,2,3,1,'Wadhwan','Gujarat',5231,'GJ'),(59,5,3,0,1,'Rajkot','Gujarat',5301,'GJ'),(60,5,3,0,2,'Morbi','Gujarat',5302,'GJ'),(61,5,4,0,1,'Jamnagar','Gujarat',5401,'GJ'),(62,1,0,0,1,'Bhopal','New Delhi',1001,'NCR'),(63,1,0,0,2,'Jodhpur','New Delhi',1002,'NCR'),(64,1,0,1,5,'Jaipur','New Delhi',1015,'NCR'),(65,1,0,4,2,'Haridwar','New Delhi',1042,'NCR'),(66,1,0,5,4,'Kanpur','New Delhi',1054,'NCR'),(67,1,1,1,1,'Gurgaon','New Delhi',1111,'NCR'),(68,1,1,1,2,'Manesar','New Delhi',1112,'NCR'),(69,1,1,1,3,'Binola /Bawal/Nimran','New Delhi',1113,'NCR'),(70,1,1,1,4,'Alwar/Bhiwadi','New Delhi',1114,'NCR'),(71,1,1,2,1,'Bahadurgarh','New Delhi',1121,'NCR'),(72,1,1,2,2,'Rohtak','New Delhi',1122,'NCR'),(73,1,1,3,1,'Kundli','New Delhi',1131,'NCR'),(74,1,1,3,2,'Sonipat','New Delhi',1132,'NCR'),(75,1,1,4,1,'Ghaziabad','New Delhi',1141,'NCR'),(76,1,1,5,1,'Noida','New Delhi',1151,'NCR'),(77,1,1,5,2,'Gr Noida','New Delhi',1152,'NCR'),(78,1,1,5,3,'Aligarh','New Delhi',1153,'NCR'),(79,1,1,5,4,'Agra','New Delhi',1154,'NCR'),(80,1,1,6,1,'Faridabad','New Delhi',1161,'NCR'),(81,1,1,6,2,'Delhi/ New Delhi','New Delhi',1162,'NCR'),(82,1,3,1,1,'Baddi','New Delhi',1311,'NCR'),(83,1,3,1,2,'Parwanoo','New Delhi',1312,'NCR'),(84,1,3,1,3,'Solan','New Delhi',1313,'NCR'),(85,1,3,3,3,'Patiala','New Delhi',1333,'NCR'),(86,1,3,3,4,'Chandigarh','New Delhi',1334,'NCR'),(87,1,3,3,5,'Ludhiana','New Delhi',1335,'NCR'),(88,4,0,1,1,'OMR','Chennai',4011,'CHN'),(89,4,0,1,2,'Kalpakkam','Chennai',4012,'CHN'),(90,4,0,1,3,'Pondicherry','Chennai',4013,'CHN'),(91,4,0,2,1,'Guindy','Chennai',4021,'CHN'),(92,4,0,2,2,'Thirumudivakkam','Chennai',4022,'CHN'),(93,4,0,2,3,'Tambaram','Chennai',4023,'CHN'),(94,4,0,2,4,'MM Nagar','Chennai',4024,'CHN'),(95,4,0,2,5,'Villupuram','Chennai',4025,'CHN'),(96,4,0,3,1,'Sriperumbadur','Chennai',4031,'CHN'),(97,4,0,3,2,'Oragadam','Chennai',4032,'CHN'),(98,4,0,3,3,'Ranipet','Chennai',4033,'CHN'),(99,4,0,3,4,'Sholinghur','Chennai',4034,'CHN'),(100,4,0,4,1,'Ambattur','Chennai',4041,'CHN'),(101,4,0,4,2,'Avadi','Chennai',4042,'CHN'),(102,4,0,4,3,'ss','Chennai',4043,'CHN'),(103,4,0,5,1,'Ennore','Chennai',4051,'CHN'),(104,4,0,5,2,'Sricity','Chennai',4052,'CHN'),(105,4,1,0,1,'Madurai','Coimbatore',4101,'CBE'),(106,4,1,0,2,'Tirunelveli','Coimbatore',4102,'CBE'),(107,4,1,0,3,'Kochin','Coimbatore',4103,'CBE'),(108,4,1,1,1,'Arasur','Coimbatore',4111,'CBE'),(109,4,1,1,1,'Kalapatti Rd','Coimbatore',4111,'CBE'),(110,4,1,1,2,'Avinashi Rd','Coimbatore',4112,'CBE'),(111,4,1,2,1,'Trichy Rd','Coimbatore',4121,'CBE'),(112,4,1,3,1,'Pollachi Rd','Coimbatore',4131,'CBE'),(113,4,1,4,1,'Pallakad Rd','Coimbatore',4141,'CBE'),(114,4,1,5,1,'Mpalyam Rd','Coimbatore',4151,'CBE'),(115,4,1,6,1,'Ganapathy ','Coimbatore',4161,'CBE'),(116,4,1,6,2,'Annur','Coimbatore',4162,'CBE'),(117,6,0,1,1,'Patancheruvu','Hyderabad',6011,'HYD'),(118,6,0,2,1,'Jeedimetla','Hyderabad',6021,'HYD'),(119,6,0,3,1,'Cherlapally','Hyderabad',6031,'HYD'),(120,3,0,0,1,'Kolkata','Kolkata',3001,'KOL'),(121,3,0,0,2,'Kharagpur','Kolkata',3002,'KOL'),(122,3,0,0,3,'Howrah','Kolkata',3003,'KOL'),(123,3,0,0,4,'Cuttack','Kolkata',3004,'KOL');
/*!40000 ALTER TABLE `cluster` ENABLE KEYS */;
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

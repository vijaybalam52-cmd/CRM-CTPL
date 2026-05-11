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
-- Table structure for table `ticket_issues`
--

DROP TABLE IF EXISTS `ticket_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_issues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `start_time` varchar(20) DEFAULT NULL,
  `end_time` varchar(20) DEFAULT NULL,
  `log_by` varchar(50) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `fault` varchar(255) DEFAULT NULL,
  `priority` varchar(20) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'open',
  `contact_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ticket_issues_fk` (`ticket_id`),
  KEY `ticket_issue_contact` (`contact_id`),
  CONSTRAINT `ticket_issue_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_issues_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_issues`
--

LOCK TABLES `ticket_issues` WRITE;
/*!40000 ALTER TABLE `ticket_issues` DISABLE KEYS */;
INSERT INTO `ticket_issues` VALUES (1,1,'2026-03-30','15:20','15:21','VJB','Mr.Sridhar','they are service','F 1 Service','close',96),(2,2,'2026-03-30','17:12','17:13','VJB','Mr.Dhiren Shah','they want calib','F 2 Calib','WF',2),(3,3,'2026-03-30','17:13','17:13','VJB','Mr.Vadiraja','they want upgrade','F 3 Train/Upg','close',7),(4,4,'2026-03-30','17:14','17:14','VJB','Mr.Manoj','they want PMV','F 4 PMV','close',10),(5,5,'2026-03-30','17:15','17:15','VJB','Mr.Pandian','they want demo','F 5 Demo','close',196),(6,6,'2026-03-30','17:16','17:16','VJB','Mr. Rajesh Chabria','they want disc','T 3 Disc','close',16),(7,7,'2026-03-30','17:17','17:17','VJB','Mr.Ananthram','they have softwer issues','T 1 Tele','close',17),(8,8,'2026-03-30','17:18','17:19','VJB','Mr.Santosh Prabhu','they have problem','T 2 Online','WF',21),(9,9,'2026-03-30','17:20','17:20','VJB','Mr.Pandit','they have light issues','T 4 Courier','close',22),(10,10,'2026-03-31','15:10',NULL,'SM','Ramanan','Zoom In /out Issue','F 1 Service','close',1123),(11,11,'2026-04-01','08:49','08:50','VJB','Mr. Ganesh B. Hande','they want service','F 1 Service','close',693),(12,12,'2026-04-01','15:04','15:05','VJB','Mr. Kannan','they want service','F 1 Service','close',139),(13,13,'2026-04-01','15:07','15:07','VJB','Mr.Venkat Nagaraj','they want service','F 1 Service','close',4),(14,14,'2026-04-02','08:52','08:52','VJB','Mr.Prabhakaran','they want calib','F 2 Calib','open',3),(15,15,'2026-04-02','08:55','08:55','VJB','Mr.A.Venkatesan','they want demo','F 5 Demo','close',35),(16,16,'2026-04-02','09:02','09:02','VJB','Mr. Sreenivasan.K','they want serivce','F 1 Service','close',998),(17,17,'2026-04-02','14:24',NULL,'PY','Ms. Nisha','Scale Issue','F 1 Service','open',938),(18,18,'2026-04-07','15:21','15:21','VJB','Mr. Anil Naik','they want service','F 1 Service','close',265),(19,19,'2026-04-29','09:23','09:24','VJB','karthik','service','F 1 Service','close',1125),(20,20,'2026-04-29','10:29','10:29','VJB','vijay','issue','F 1 Service','close',1126),(21,20,'2026-04-29','10:30','10:30','VJB','karthik','issue2','F 2 Calib','close',1125),(22,21,'2026-04-29','18:59','18:59','SD','Siva Prakash V','Camera is not detecting','F 1 Service','close',1127),(23,22,'2026-04-29','19:05','19:07','SD','Ravindrachari','Axes jerky movement and JS cable loose connectivity','F 1 Service','close',1128),(24,23,'2026-05-01','14:55','14:55','VJB','Siva Prakash V','issuse-1','F 1 Service','close',1127),(25,24,'2026-05-02','09:55','09:55','VJB','vijay','issues - 1','F 2 Calib','open',1129),(26,24,'2026-05-02','09:56','09:56','VJB','vijay','issues - 2','F 3 Train/Upg','close',1129),(27,25,'2026-05-08','17:45','17:48','SD','Mr. Shivakumar Pujar','Axes Movement issue','F 6 Extand','WF',1006),(28,26,'2026-05-08','18:01','18:01','SD','Mr. Naveen Sachdava','Axes Movement issue','F 1 Service','WF',586),(29,27,'2026-05-08','18:05','18:05','SD','Mr. Rajesh Chabria','Zoom in/out issue','F 1 Service','WF',16),(30,28,'2026-05-10','16:12','16:13','SM','Mr. Babu','movement issues','F 1 Service','open',455),(31,29,'2026-05-10','16:15','16:15','SM','karthik','movement issue','F 1 Service','WF',1125),(32,30,'2026-05-10','16:15','16:16','SM','Mr. Binnami Sharma','movement issues','F 1 Service','WF',403),(33,31,'2026-05-10','16:17','16:17','SM','Mr. Chetana','movement issue','F 1 Service','WF',123),(34,2,'2026-05-10','16:17','16:17','SM','Mr.Dhiren Shah','light issue','F 3 Train/Upg','WF',2),(35,32,'2026-05-10','16:18','16:18','SM','Mr.Shwetha G','movement issue','F 4 PMV','WF',170);
/*!40000 ALTER TABLE `ticket_issues` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-10 17:28:03

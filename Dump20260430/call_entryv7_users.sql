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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `tag_name` varchar(10) NOT NULL,
  `role_id` int DEFAULT NULL,
  `email_id` varchar(255) NOT NULL,
  `phone_no` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `create_date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Vijay Bala','VJB',4,'vijaybala@gmail.com','9087744988','scrypt:32768:8:1$FQLIZy9dshfgHENJ$a4eae0da50582ddd45b025f890925ed8e94874e9000a3bb8d0477b325a0cc83297495b221387c0449c111392fe0aa18ea6364815918a916d89f45f952f205275','2026-03-16'),(2,'Satish','SM',2,'satish@gmail.com','1234567890','scrypt:32768:8:1$CO2mPvzh2Dwv7kBs$070245f690332b423f0a31a575df129d0a86577e8ee703eafa9db46ebd12ec3a343e700fe99453953a125a76dbfd3b8a7f315b3bb1d6a0fe635b999303be9954','2026-03-16'),(4,'pawan','PY',2,'ae1@rapidi.in','9513770541','scrypt:32768:8:1$5RinSadTv1BA5h8o$a22735b024ee4e13fe8029b5d35593728679f5e29b791c4edfeefe5fe06c0e9ddfb2dab841b9d2204b2361e6b30f095345c0068450e394556ca0ae6aa438b36e','2026-03-29'),(5,'Shivaputra','SD',1,'shiva@rapidi.in','9880022500','scrypt:32768:8:1$dxuVLMwBUZuZ1N7h$45f9365bf927136e9c1ba8670de754076a032ade9e189bc06433426c8d81c456db41ecc067ee50aa0d3dd5df980864c231574ebc5cb5b4e5a5afbbdafd58a08b','2026-03-31');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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

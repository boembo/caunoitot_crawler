-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 07, 2023 at 03:09 AM
-- Server version: 8.0.31
-- PHP Version: 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `caunoitot_job`
--

-- --------------------------------------------------------

--
-- Table structure for table `job`
--

DROP TABLE IF EXISTS `job`;
CREATE TABLE IF NOT EXISTS `job` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reward` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `overview` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_it_job` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `benefits` text COLLATE utf8mb4_unicode_ci,
  `job_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_team_size` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `job_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `employment_type` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `level` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `total_vacancies` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `gross_month_salary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `interview_process` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `report_to` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `preferred_skill` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `job_responsibility` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `why_should_apply` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `job_required_skill` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `working_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_logo_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_website` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_working_hour` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_team_size` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `memo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `source_site` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `source_id` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_closed` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 22, 2026 at 07:50 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `church_management_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(100) NOT NULL DEFAULT 'Unknown',
  `full_name` varchar(255) NOT NULL DEFAULT 'Unknown',
  `role` enum('user','admin','superadmin') NOT NULL DEFAULT 'user',
  `action` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','MARK_FINISHED','ADD_PARTICIPANT','REMOVE_PARTICIPANT') NOT NULL,
  `module` varchar(100) NOT NULL COMMENT 'e.g. Members, Events, Calendar, Donations',
  `details` text NOT NULL COMMENT 'Human-readable description of what happened',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IPv4 or IPv6'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `timestamp`, `user_id`, `username`, `full_name`, `role`, `action`, `module`, `details`, `ip_address`) VALUES
(1, '2026-02-20 17:22:35', 1, 'superadmin', 'Super User Admin', 'superadmin', 'ADD_PARTICIPANT', 'Events', 'Added participant: Super User Admin to event ID: 48', '::1'),
(2, '2026-02-20 17:23:35', 1, 'superadmin', 'Super User Admin', 'superadmin', 'EXPORT', 'Audit Logs', 'Exported audit logs to CSV', '::1'),
(3, '2026-02-20 17:25:33', 2, 'admin', 'admin User', 'admin', 'CREATE', 'Calendar', 'Added event: Christmas Fun on 2026-02-20', '::1');

-- --------------------------------------------------------

--
-- Table structure for table `calendar_events`
--

CREATE TABLE `calendar_events` (
  `id` int(11) NOT NULL,
  `event_date` date NOT NULL,
  `event_title` varchar(255) NOT NULL,
  `event_time` time NOT NULL,
  `location` varchar(255) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `attendees` int(11) DEFAULT 0,
  `is_finished` tinyint(1) NOT NULL DEFAULT 0,
  `finished_at` datetime DEFAULT NULL,
  `finished_by` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `calendar_events`
--

INSERT INTO `calendar_events` (`id`, `event_date`, `event_title`, `event_time`, `location`, `event_type`, `attendees`, `is_finished`, `finished_at`, `finished_by`, `created_by`, `created_at`) VALUES
(1, '2025-12-25', 'Christmas Service', '10:00:00', 'Main Sanctuary', 'Service', 200, 0, NULL, NULL, 'superadmin', '2025-12-23 17:54:49'),
(2, '2025-12-31', 'New Year Eve Service', '20:00:00', 'Main Sanctuary', 'Special', 150, 0, NULL, NULL, 'superadmin', '2025-12-23 17:54:49'),
(3, '2025-01-01', 'New Year Service', '10:00:00', 'Main Sanctuary', 'Service', 180, 0, NULL, NULL, 'superadmin', '2025-12-23 17:54:49'),
(42, '2026-01-28', 'Mid Week Service', '17:00:00', 'Parian', 'Fellowship', 50, 0, NULL, NULL, 'Super User Admin', '2026-01-28 15:02:36'),
(45, '2026-02-05', 'Christmas Fun', '21:00:00', 'Kahit saan', 'Prayer Meeting', 13, 0, NULL, NULL, 'Super User Admin', '2026-02-05 17:22:43'),
(46, '2026-02-10', 'Christmas Fun', '09:00:00', 'Kahit saan', 'Prayer Meeting', 4, 0, NULL, NULL, 'Super User Admin', '2026-02-09 16:31:27'),
(48, '2026-02-17', 'Christmas Fun', '09:00:00', 'Kahit saan', 'Other', 20, 0, NULL, NULL, 'Super User Admin', '2026-02-16 18:55:01'),
(49, '2026-02-20', 'Christmas Fun', '09:00:00', 'Kahit saan', 'Bible Study', 3, 0, NULL, NULL, 'admin User', '2026-02-20 17:25:31');

-- --------------------------------------------------------

--
-- Table structure for table `church_users`
--

CREATE TABLE `church_users` (
  `id` int(11) NOT NULL,
  `account_number` varchar(20) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('Male','Female') DEFAULT NULL,
  `marital_status` enum('Single','Married','Widowed') DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `skills` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `zip_code` varchar(20) DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `membership_date` date DEFAULT NULL,
  `baptism_date` date DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `role` enum('user','admin','superadmin') NOT NULL DEFAULT 'user',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `last_seen` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `church_users`
--

INSERT INTO `church_users` (`id`, `account_number`, `username`, `email`, `password`, `first_name`, `middle_name`, `last_name`, `date_of_birth`, `gender`, `marital_status`, `occupation`, `skills`, `phone_number`, `address`, `city`, `zip_code`, `emergency_contact_name`, `emergency_contact_phone`, `department`, `membership_date`, `baptism_date`, `bio`, `profile_picture`, `role`, `status`, `created_at`, `updated_at`, `last_login`, `last_seen`) VALUES
(1, '1120', 'superadmin', 'superadmin@gmail.com', '$2y$10$I6LieoQQk8OurPKAnqCu6..7UJgBrgkcP0y250oPNcqvOYYWQfNGu', 'Super', 'User', 'Admin', NULL, 'Male', 'Single', 'N/A', 'Flying', '', '', '', '', '', '', NULL, NULL, NULL, '', 'Profile_pictures/user_1_1769586778.jpg', 'superadmin', 'active', '2025-12-17 09:29:50', '2026-02-22 06:44:40', '2026-02-22 06:42:34', '2026-02-22 06:44:40'),
(2, NULL, 'admin', 'admin@gmail.com', '$2y$10$i9MV7boaZe81YSOGCdWa7..nikdHRnWS6Z4OTY.j4W3x7loPtqu72', 'admin', '', 'User', NULL, 'Male', NULL, '', '', '', '', '', '', '', '', 'Administration', '2026-01-06', NULL, '', 'Profile_pictures/user_2_1769578552.jpg', 'admin', 'active', '2025-12-17 09:29:50', '2026-02-20 09:34:30', '2026-02-20 09:24:03', '2026-02-20 09:34:30'),
(3, '1121', 'user', 'user@gmail.com', '$2y$10$fxQ6KepnSFhWqhB4H8znXe.YLLBJao8SPpRTn0yxUaWeLcIxcMvjC', 'Brenjo', '', 'Maharlika', NULL, NULL, NULL, '', '', '8-7000', '', '', '', '', '', 'Youth', NULL, NULL, '', 'Profile_pictures/user_3_1769513176.jpg', 'user', 'active', '2025-12-17 09:29:50', '2026-02-11 09:00:41', '2026-02-11 08:03:52', '2026-02-11 09:00:41'),
(4, '1111', 'Ken-Ken', '', '$2y$10$v1D0eyU9tJPgiYAj.9S/ue7T4WMk8w7N6hyBgAl3RqDNU.J1fOpoO', 'Kenji', NULL, 'Bautista', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'user', 'active', '2026-01-06 05:02:38', '2026-01-12 06:14:28', '2026-01-06 07:08:44', NULL),
(18, '1112', 'Rayo', 'user1112@placeholder.local', '$2y$10$z2C1U.hi0YJEnJhw9tulAOxBwN3P3A5J5CJVMw2JTTby.3tRSNJHO', 'Justine', NULL, 'Rayo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'user', 'active', '2026-01-06 07:29:16', '2026-01-12 06:14:28', NULL, NULL),
(19, '1113', 'Tester 1', 'Baldo123@gmail.com', '$2y$10$hTnAf9LD1m8SQ7zClM5ecegsjvkEdCjea0fvgbvybpRxg05h0FWZ.', 'Baldo', 'Mangga', 'Kukutabos', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'user', 'active', '2026-01-12 06:16:31', '2026-01-12 06:20:34', '2026-01-12 06:20:34', NULL),
(20, '1114', 'Chris', 'clb@gmail.com', '$2y$10$yiKMmtR.4QO98lbLiXyWQei7EXWa4C.0NPF7ckyz4gqgULJo4tsFm', 'Chis', 'Light', 'Brown', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'user', 'active', '2026-01-12 12:20:21', '2026-01-13 07:30:43', '2026-01-13 07:30:43', NULL),
(22, '1116', 'CWDOJT', 'jobi@gmail.com', '$2y$10$yFvh1sFDiRjDFIE./iWERu7fdjd8dGOv4BHxW1/WjHYkVcBtcO29u', 'Mark', '', 'Aquino', NULL, NULL, NULL, '', '', '', '', '', '', '', '', NULL, NULL, NULL, '', 'Profile_pictures/user_22_1769514373.jpg', 'user', 'active', '2026-01-23 07:58:57', '2026-02-18 02:30:43', '2026-02-18 01:57:47', '2026-02-18 02:30:43'),
(23, '1117', 'dave', 'calambawaterdistrict.mis@gmail.com', '$2y$10$ObBIKX3DEZCEh5l/GkmgV.vqg/VwdDVKGddksG3Gb3I2lNVqczViK', 'Jonathan Dave', 'Aquino', 'Fajarda', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'user', 'active', '2026-01-28 07:05:23', '2026-01-28 07:21:56', '2026-01-28 07:21:56', NULL),
(24, '1118', 'Jackie', 'Jackie@gmail.com', '$2y$10$mhOE3H7z5QxtWvhqDjtBN.TOYDm0dT37ar6SWpzIJEaRgC2U6gdNa', 'Jackie Manuel', '', 'Esguerra', NULL, NULL, NULL, '', '', '', '', '', '', '', '', NULL, NULL, NULL, '', 'Profile_pictures/user_24_1769695750.jpg', 'user', 'active', '2026-01-29 14:07:16', '2026-01-29 14:09:10', '2026-01-29 14:07:46', NULL),
(25, '1122', 'Justine_Rayo', 'justinrayo@gmail.com', '$2y$10$NBuQfSwn96W7vfuuu6eyYei9XRKgglG4HsTXemRO.pKYo0hRINrZC', 'Justine', 'Esguerra', 'Rayo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'user', 'active', '2026-02-18 01:56:37', '2026-02-18 01:56:37', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `event_participants`
--

CREATE TABLE `event_participants` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `account_number` varchar(20) NOT NULL,
  `participant_name` varchar(255) NOT NULL,
  `attended_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `added_by` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_participants`
--

INSERT INTO `event_participants` (`id`, `event_id`, `user_id`, `account_number`, `participant_name`, `attended_at`, `added_by`, `notes`) VALUES
(2, 15, 19, '1113', 'Baldo Mangga Kukutabos', '2026-01-13 23:35:36', 'superadmin', NULL),
(3, 15, 18, '1112', 'Justine  Rayo', '2026-01-13 23:35:54', 'superadmin', NULL),
(4, 15, 20, '1114', 'Chis Light Brown', '2026-01-13 23:36:16', 'superadmin', NULL),
(5, 18, 21, '1115', 'Shinichi  Kudo', '2026-01-16 03:01:26', 'superadmin', NULL),
(8, 22, 4, '1111', 'Kenji  Bautista', '2026-01-18 12:00:24', 'admin', NULL),
(9, 16, 18, '1112', 'Justine  Rayo', '2026-01-18 12:28:01', 'superadmin', NULL),
(10, 22, 18, '1112', 'Justine  Rayo', '2026-01-18 12:42:40', 'superadmin', NULL),
(11, 18, 4, '1111', 'Kenji  Bautista', '2026-01-18 12:44:22', 'superadmin', NULL),
(13, 14, 4, '1111', 'Kenji  Bautista', '2026-01-18 13:16:58', 'superadmin', NULL),
(14, 14, 19, '1113', 'Baldo Mangga Kukutabos', '2026-01-18 13:17:02', 'superadmin', NULL),
(16, 27, 18, '1112', 'Justine  Rayo', '2026-01-19 05:46:56', 'superadmin', NULL),
(17, 37, 4, '1111', 'Kenji  Bautista', '2026-01-19 06:39:29', 'superadmin', NULL),
(18, 37, 19, '1113', 'Baldo Mangga Kukutabos', '2026-01-19 06:39:34', 'superadmin', NULL),
(19, 18, 18, '1112', 'Justine  Rayo', '2026-01-26 08:55:42', 'superadmin', NULL),
(20, 41, 18, '1112', 'Justine  Rayo', '2026-01-28 06:54:51', 'superadmin', NULL),
(21, 41, 4, '1111', 'Kenji  Bautista', '2026-01-28 06:57:15', 'superadmin', NULL),
(22, 42, 18, '1112', 'Justine  Rayo', '2026-01-28 07:03:22', 'superadmin', NULL),
(23, 42, 4, '1111', 'Kenji  Bautista', '2026-01-28 07:03:38', 'superadmin', NULL),
(24, 42, 23, '1117', 'Jonathan Dave Aquino Fajarda', '2026-01-28 07:06:10', 'dave', NULL),
(25, 42, 20, '1114', 'Chis Light Brown', '2026-02-05 08:35:58', 'superadmin', NULL),
(33, 42, 1, '9999', 'Super User Admin', '2026-02-05 11:40:49', 'superadmin', NULL),
(34, 42, 22, '1116', 'Jobert  Aquino', '2026-02-05 11:41:04', 'superadmin', NULL),
(35, 42, 24, '1118', 'Jackie Manuel  Esguerra', '2026-02-05 11:41:39', 'superadmin', NULL),
(65, 45, 3, '1121', 'Brenjo  Maharlika', '2026-02-09 01:58:11', 'admin', NULL),
(66, 45, 22, '1116', 'Mark  Aquino', '2026-02-09 08:28:37', 'superadmin', NULL),
(68, 46, 22, '1116', 'Mark  Aquino', '2026-02-09 09:03:06', 'superadmin', NULL),
(69, 45, 1, '1120', 'Super User Admin', '2026-02-10 10:09:14', 'superadmin', NULL),
(70, 46, 3, '1121', 'Brenjo  Maharlika', '2026-02-11 05:21:03', 'admin', NULL),
(71, 47, 3, '1121', 'Brenjo  Maharlika', '2026-02-11 06:05:28', 'superadmin', NULL),
(72, 48, 3, '1121', 'Brenjo  Maharlika', '2026-02-18 01:14:52', 'superadmin', NULL),
(73, 48, 1, '1120', 'Super User Admin', '2026-02-20 09:22:35', 'superadmin', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_module` (`module`);

--
-- Indexes for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_date` (`event_date`);

--
-- Indexes for table `church_users`
--
ALTER TABLE `church_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `account_number` (`account_number`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_account_number` (`account_number`),
  ADD KEY `idx_first_name` (`first_name`),
  ADD KEY `idx_last_name` (`last_name`),
  ADD KEY `idx_full_name_search` (`first_name`,`last_name`);

--
-- Indexes for table `event_participants`
--
ALTER TABLE `event_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_event_participant` (`event_id`,`user_id`),
  ADD KEY `idx_event_id` (`event_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_account_number` (`account_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `calendar_events`
--
ALTER TABLE `calendar_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `church_users`
--
ALTER TABLE `church_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `event_participants`
--
ALTER TABLE `event_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

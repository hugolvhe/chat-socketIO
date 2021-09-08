CREATE SCHEMA 'yourdbname';

USE 'yourdbname';

CREATE TABLE `users` (
  `id` int(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(256) UNIQUE DEFAULT NULL,
  `status` varchar(256) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `messages` (
  `id` int(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `content` varchar(256) DEFAULT NULL,
  `user` varchar(256)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

ALTER TABLE `messages`
	ADD CONSTRAINT fk_user
	FOREIGN KEY fk_user(user)
	REFERENCES users(name)
	ON DELETE SET NULL;
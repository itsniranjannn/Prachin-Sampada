-- Hamro Prachin Sampada (हाम्रो प्राचीन सम्पदा): heritage explorer schema (MySQL 8+)

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('explorer','admin') NOT NULL DEFAULT 'explorer',
  interests VARCHAR(255) NOT NULL DEFAULT '',
  rating INT NOT NULL DEFAULT 1000,            -- Elo rating used by the adaptive quiz
  answered INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE monuments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  name_np VARCHAR(120) NOT NULL DEFAULT '',
  city VARCHAR(60) NOT NULL,
  province VARCHAR(20) NOT NULL DEFAULT 'Bagmati',     -- one of Nepal's seven provinces
  district VARCHAR(40) NULL,
  zone_slug VARCHAR(80) NULL,                  -- parent heritage zone (e.g. a Durbar Square)
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  type VARCHAR(20) NOT NULL,                   -- pagoda, stupa, shikhara, palace, square, ...
  religion VARCHAR(20) NOT NULL DEFAULT 'Hindu',
  deity VARCHAR(120) NULL,
  built_year SMALLINT NULL,
  built_text VARCHAR(300) NOT NULL DEFAULT '',
  dynasty VARCHAR(80) NOT NULL DEFAULT 'unknown',
  architecture VARCHAR(400) NOT NULL DEFAULT '',
  unesco TINYINT(1) NOT NULL DEFAULT 0,
  short_text VARCHAR(200) NOT NULL DEFAULT '',
  story TEXT NOT NULL,
  legend TEXT NULL,
  facts JSON NOT NULL,
  open_time CHAR(5) NULL,
  close_time CHAR(5) NULL,
  fee_foreigner INT NULL,
  fee_saarc INT NULL,
  fee_nepali INT NULL,
  visit_minutes SMALLINT NOT NULL DEFAULT 30,
  quake_2015 VARCHAR(400) NULL,
  image_url VARCHAR(500) NOT NULL DEFAULT '',
  image_page VARCHAR(500) NOT NULL DEFAULT '',
  image_credit VARCHAR(255) NOT NULL DEFAULT '',
  tags VARCHAR(255) NOT NULL DEFAULT '',
  sources JSON NULL,
  festivals JSON NULL,                         -- [{name, name_np, month, note}]
  gallery JSON NULL,                           -- extra CC photos [{url, file_page, author, license, caption}]
  model JSON NULL,                             -- 3D model spec: kind, tiers, plinth, features, surroundings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  monument_id INT NOT NULL,
  question VARCHAR(400) NOT NULL,
  options JSON NOT NULL,
  answer_index TINYINT NOT NULL,
  difficulty TINYINT NOT NULL DEFAULT 2,
  rating INT NOT NULL DEFAULT 950,             -- Elo rating, starts from difficulty
  explanation VARCHAR(400) NOT NULL DEFAULT '',
  times_asked INT NOT NULL DEFAULT 0,
  times_correct INT NOT NULL DEFAULT 0,
  FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE clues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  monument_id INT NOT NULL,
  clue VARCHAR(300) NOT NULL,
  FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  correct TINYINT(1) NOT NULL,
  time_ms INT NULL,
  rating_before INT NOT NULL,
  rating_after INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- SM-2 spaced-repetition cards for questions a player missed
CREATE TABLE review_cards (
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  ease DECIMAL(4,2) NOT NULL DEFAULT 2.50,
  interval_days INT NOT NULL DEFAULT 1,
  reps INT NOT NULL DEFAULT 0,
  due_at DATETIME NOT NULL,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Heritage passport: one stamp per monument per explorer
CREATE TABLE visits (
  user_id INT NOT NULL,
  monument_id INT NOT NULL,
  method ENUM('gps','manual','game') NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, monument_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE favorites (
  user_id INT NOT NULL,
  monument_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, monument_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  monument_id INT NOT NULL,
  stars TINYINT NOT NULL,
  comment VARCHAR(600) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rating (user_id, monument_id),
  CHECK (stars BETWEEN 1 AND 5),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  input_json JSON NOT NULL,
  plan_json JSON NOT NULL,
  share_code CHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE game_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  player_name VARCHAR(60) NOT NULL,
  mode ENUM('solo','hunt') NOT NULL,
  points INT NOT NULL,
  rounds TINYINT NOT NULL,
  hunt_code CHAR(6) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE hunts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(6) NOT NULL UNIQUE,
  host_name VARCHAR(60) NOT NULL,
  rounds TINYINT NOT NULL,
  round_seconds SMALLINT NOT NULL,
  players INT NOT NULL DEFAULT 0,
  winner_name VARCHAR(60) NULL,
  results_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE badges (
  user_id INT NOT NULL,
  badge_key VARCHAR(40) NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

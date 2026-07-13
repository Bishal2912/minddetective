-- Tracks: top-level course groupings
CREATE TABLE tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tracks_is_published ON tracks(is_published);

-- Lessons: individual units within a track
CREATE TABLE lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id INTEGER NOT NULL REFERENCES tracks(id),
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  mastery_threshold INTEGER NOT NULL DEFAULT 70 CHECK (mastery_threshold BETWEEN 0 AND 100),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_lessons_track_id ON lessons(track_id);

-- Questions: the quiz content within a lesson
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  type TEXT NOT NULL CHECK (type IN ('mcq', 'scenario', 'rank')),
  prompt TEXT NOT NULL,
  explanation TEXT NOT NULL,
  source_citation TEXT,
  content_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_questions_lesson_id ON questions(lesson_id);

-- Question options: each possible answer, as its own row
CREATE TABLE question_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  label TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_question_options_question_id ON question_options(question_id);

-- User progress: completion/mastery per user, per lesson (one row per attempt)
CREATE TABLE user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  score INTEGER NOT NULL,
  mastered INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_user_progress_user_lesson ON user_progress(user_id, lesson_id);

-- User answers: every single answer ever submitted
CREATE TABLE user_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL REFERENCES questions(id),
  selected_option_id INTEGER NOT NULL REFERENCES question_options(id),
  is_correct INTEGER NOT NULL,
  answered_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_user_correct ON user_answers(user_id, is_correct);

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  age INTEGER,
  weight_kg REAL,
  height_cm REAL,
  gender TEXT CHECK(gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK(activity_level IN ('sedentary','light','moderate','active','very_active')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS macro_goals (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  user_id INTEGER NOT NULL REFERENCES user_profile(id),
  calories REAL NOT NULL,
  protein_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'maintenance' CHECK(goal_type IN ('fat-loss','maintenance','lean-bulk','muscle-gain')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS food (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  calories_per_100g REAL NOT NULL,
  protein_per_100g REAL NOT NULL,
  carbs_per_100g REAL NOT NULL,
  fat_per_100g REAL NOT NULL,
  serving_unit TEXT NOT NULL DEFAULT 'grams' CHECK(serving_unit IN ('grams','count')),
  grams_per_unit REAL,
  serving_label TEXT,
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES user_profile(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  daily_log_id INTEGER NOT NULL REFERENCES daily_log(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(daily_log_id, meal_type)
);

CREATE TABLE IF NOT EXISTS meal_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_id INTEGER NOT NULL REFERENCES meal(id) ON DELETE CASCADE,
  food_id INTEGER NOT NULL REFERENCES food(id),
  quantity_g REAL NOT NULL,
  calories REAL NOT NULL,
  protein_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_meal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES user_profile(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_meal_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  saved_meal_id INTEGER NOT NULL REFERENCES saved_meal(id) ON DELETE CASCADE,
  food_id INTEGER NOT NULL REFERENCES food(id),
  quantity_g REAL NOT NULL
);
`;

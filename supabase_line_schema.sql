-- =============================================
-- LINE Bot 用テーブル
-- Supabase SQL Editorで実行してください
-- =============================================

-- LINE ユーザープロフィール
CREATE TABLE IF NOT EXISTS line_profiles (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id       TEXT UNIQUE NOT NULL,
  nickname           TEXT NOT NULL DEFAULT 'ゲスト',
  email              TEXT,
  role               TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'trainer')),
  goal_type          TEXT NOT NULL DEFAULT 'both'     CHECK (goal_type IN ('diet', 'health', 'both')),
  dream_vision       TEXT,
  start_weight       DECIMAL(5,2),
  target_weight      DECIMAL(5,2),
  current_weight     DECIMAL(5,2),
  onboarding_done    BOOLEAN NOT NULL DEFAULT false,
  conversation_state TEXT NOT NULL DEFAULT 'onboarding_nickname',
  conversation_data  JSONB NOT NULL DEFAULT '{}',
  daily_calorie_goal INTEGER NOT NULL DEFAULT 1600,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 食事記録
CREATE TABLE IF NOT EXISTS line_meal_records (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id    TEXT NOT NULL REFERENCES line_profiles(line_user_id) ON DELETE CASCADE,
  meal_type       TEXT NOT NULL DEFAULT 'lunch' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories  DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_protein   DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_fat       DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_carbs     DECIMAL(8,2) NOT NULL DEFAULT 0,
  photo_url       TEXT,
  photo_analysis  JSONB,
  memo            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 食品アイテム（1食事の内訳）
CREATE TABLE IF NOT EXISTS line_meal_items (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_record_id UUID NOT NULL REFERENCES line_meal_records(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  amount         TEXT,
  calories       DECIMAL(8,2) NOT NULL DEFAULT 0,
  protein        DECIMAL(8,2) NOT NULL DEFAULT 0,
  fat            DECIMAL(8,2) NOT NULL DEFAULT 0,
  carbs          DECIMAL(8,2) NOT NULL DEFAULT 0
);

-- 体重・体型測定
CREATE TABLE IF NOT EXISTS line_body_measurements (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id  TEXT NOT NULL REFERENCES line_profiles(line_user_id) ON DELETE CASCADE,
  weight_kg     DECIMAL(5,2),
  body_fat_pct  DECIMAL(4,2),
  measured_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (line_user_id, measured_date)
);

-- トレーナーフィードバック
CREATE TABLE IF NOT EXISTS line_trainer_feedback (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_record_id         UUID REFERENCES line_meal_records(id) ON DELETE SET NULL,
  customer_line_user_id  TEXT NOT NULL REFERENCES line_profiles(line_user_id) ON DELETE CASCADE,
  trainer_line_user_id   TEXT NOT NULL REFERENCES line_profiles(line_user_id) ON DELETE CASCADE,
  content                TEXT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_line_meal_records_user_date
  ON line_meal_records(line_user_id, meal_date DESC);

CREATE INDEX IF NOT EXISTS idx_line_body_measurements_user_date
  ON line_body_measurements(line_user_id, measured_date DESC);

CREATE INDEX IF NOT EXISTS idx_line_trainer_feedback_customer
  ON line_trainer_feedback(customer_line_user_id, created_at DESC);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON line_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security（サーバーサイドの service_role キーを使うので実質バイパスされますが念のため設定）
ALTER TABLE line_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_meal_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_meal_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_trainer_feedback  ENABLE ROW LEVEL SECURITY;

-- service_role はすべてのテーブルに全アクセス可（デフォルト動作）
-- anon/authenticated ユーザーはアクセス不可（LINE Bot サーバーのみアクセス）

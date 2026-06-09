-- ======================================================
-- 栄養管理・食事指導アプリ Supabase スキーマ
-- ======================================================

-- プロフィールテーブル（ユーザー情報）
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'trainer')),
  full_name TEXT NOT NULL,
  trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- ゴール設定
  goal_type TEXT CHECK (goal_type IN ('diet', 'health', 'both')) DEFAULT 'both',
  dream_vision TEXT,
  start_weight NUMERIC(5,1),
  -- 日々の目標
  daily_calorie_goal INTEGER DEFAULT 1600,
  daily_protein_goal INTEGER DEFAULT 60,
  daily_fat_goal INTEGER DEFAULT 50,
  daily_carbs_goal INTEGER DEFAULT 200,
  target_weight NUMERIC(5,1),
  target_body_fat NUMERIC(4,1),
  -- オンボーディング完了フラグ
  onboarding_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 食事記録テーブル
CREATE TABLE meal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  memo TEXT,
  photo_url TEXT,
  total_calories NUMERIC(7,1) NOT NULL DEFAULT 0,
  total_protein NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 食事アイテムテーブル（各料理・食品）
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_record_id UUID REFERENCES meal_records(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  amount_g NUMERIC(6,1) NOT NULL,
  calories NUMERIC(6,1) NOT NULL,
  protein NUMERIC(5,1) NOT NULL,
  fat NUMERIC(5,1) NOT NULL,
  carbs NUMERIC(5,1) NOT NULL
);

-- 体重・体組成測定テーブル
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  measured_date DATE NOT NULL,
  weight_kg NUMERIC(5,1),
  body_fat_pct NUMERIC(4,1),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, measured_date)
);

-- トレーナーフィードバックテーブル
CREATE TABLE trainer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_record_id UUID REFERENCES meal_records(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- Row Level Security (RLS) ポリシー
-- ======================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_feedback ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のプロフィールは自分で読み書き、トレーナーはお客様のプロフィールを読める
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'trainer'
    )
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- meal_records: 自分のデータ + 担当トレーナーが閲覧可能
CREATE POLICY "meal_records_select" ON meal_records
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles trainer_p
      JOIN profiles customer_p ON customer_p.trainer_id = trainer_p.id
      WHERE trainer_p.user_id = auth.uid()
        AND customer_p.user_id = meal_records.user_id
    )
  );

CREATE POLICY "meal_records_insert" ON meal_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_records_update" ON meal_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "meal_records_delete" ON meal_records
  FOR DELETE USING (auth.uid() = user_id);

-- meal_items: meal_recordsと同じアクセス制御
CREATE POLICY "meal_items_select" ON meal_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meal_records mr
      WHERE mr.id = meal_items.meal_record_id
        AND (
          mr.user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM profiles trainer_p
            JOIN profiles customer_p ON customer_p.trainer_id = trainer_p.id
            WHERE trainer_p.user_id = auth.uid()
              AND customer_p.user_id = mr.user_id
          )
        )
    )
  );

CREATE POLICY "meal_items_insert" ON meal_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_records mr
      WHERE mr.id = meal_items.meal_record_id AND mr.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_items_delete" ON meal_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM meal_records mr
      WHERE mr.id = meal_items.meal_record_id AND mr.user_id = auth.uid()
    )
  );

-- body_measurements
CREATE POLICY "measurements_select" ON body_measurements
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles trainer_p
      JOIN profiles customer_p ON customer_p.trainer_id = trainer_p.id
      WHERE trainer_p.user_id = auth.uid()
        AND customer_p.user_id = body_measurements.user_id
    )
  );

CREATE POLICY "measurements_insert" ON body_measurements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "measurements_update" ON body_measurements
  FOR UPDATE USING (auth.uid() = user_id);

-- trainer_feedback
CREATE POLICY "feedback_select" ON trainer_feedback
  FOR SELECT USING (
    auth.uid() = customer_id OR auth.uid() = trainer_id
  );

CREATE POLICY "feedback_insert" ON trainer_feedback
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

-- ======================================================
-- ストレージ（写真保存用）
-- ======================================================
-- Supabase Dashboardで "meal-photos" バケットを作成してください
-- バケット設定: Public = false, File size limit = 5MB

-- ======================================================
-- updated_at 自動更新トリガー
-- ======================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

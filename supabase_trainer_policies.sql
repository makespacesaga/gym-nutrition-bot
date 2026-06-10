-- =============================================
-- トレーナー管理画面用 読み取りポリシー
-- Webアプリにログインしたトレーナーが LINE データを閲覧できるようにする
-- Supabase SQL Editor で実行してください
-- =============================================

-- 水分記録テーブル（まだ存在しない場合は先に作成）
CREATE TABLE IF NOT EXISTS line_water_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id TEXT NOT NULL REFERENCES line_profiles(line_user_id) ON DELETE CASCADE,
  amount_ml    INTEGER NOT NULL,
  logged_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (line_user_id, logged_date)
);
ALTER TABLE line_water_logs ENABLE ROW LEVEL SECURITY;

-- ログイン済みユーザー（トレーナー）が LINE テーブルを読み取れるようにする
CREATE POLICY "auth_read_line_profiles"
  ON line_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_line_meal_records"
  ON line_meal_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_line_meal_items"
  ON line_meal_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_line_body_measurements"
  ON line_body_measurements FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_line_trainer_feedback"
  ON line_trainer_feedback FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_line_water_logs"
  ON line_water_logs FOR SELECT TO authenticated USING (true);

-- Database schema for ClothesManagerApp

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (connects with Supabase Auth)
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clothing items table
CREATE TABLE clothing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand_id UUID REFERENCES brands(id),
  image_url TEXT,
  wear_count INTEGER DEFAULT 0,
  wash_threshold INTEGER DEFAULT 3,
  last_worn DATE,
  memo TEXT,
  condition TEXT,
  purchase_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wear history table
CREATE TABLE wear_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clothing_item_id UUID REFERENCES clothing_items(id) ON DELETE CASCADE,
  wear_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wash history table
CREATE TABLE wash_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clothing_item_id UUID REFERENCES clothing_items(id) ON DELETE CASCADE,
  wash_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table (optional)
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  name_hiragana TEXT,
  name_english TEXT,
  search_terms TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badge definitions table
CREATE TABLE badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('usage', 'efficiency', 'milestone', 'special')),
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badge conditions table
CREATE TABLE badge_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id TEXT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,
  condition_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User can earn each badge only once
  UNIQUE(user_id, badge_id)
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wear_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Clothing items policies
CREATE POLICY "Users can view their own clothing items" 
  ON clothing_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clothing items" 
  ON clothing_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clothing items" 
  ON clothing_items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clothing items" 
  ON clothing_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Wear history policies
CREATE POLICY "Users can view wear history for their clothing items" 
  ON wear_history FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM clothing_items 
    WHERE clothing_items.id = wear_history.clothing_item_id 
    AND clothing_items.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert wear history for their clothing items" 
  ON wear_history FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM clothing_items 
    WHERE clothing_items.id = wear_history.clothing_item_id 
    AND clothing_items.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete wear history for their clothing items" 
  ON wear_history FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM clothing_items 
    WHERE clothing_items.id = wear_history.clothing_item_id 
    AND clothing_items.user_id = auth.uid()
  ));

-- Wash history policies
CREATE POLICY "Users can view wash history for their clothing items" 
  ON wash_history FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM clothing_items 
    WHERE clothing_items.id = wash_history.clothing_item_id 
    AND clothing_items.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert wash history for their clothing items" 
  ON wash_history FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM clothing_items 
    WHERE clothing_items.id = wash_history.clothing_item_id 
    AND clothing_items.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete wash history for their clothing items" 
  ON wash_history FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM clothing_items 
    WHERE clothing_items.id = wash_history.clothing_item_id 
    AND clothing_items.user_id = auth.uid()
  ));

-- Brands policies (all users can view brands, only admins can modify)
CREATE POLICY "All users can view brands" 
  ON brands FOR SELECT 
  USING (true);

-- Badge definitions policies (all users can view badge definitions)
CREATE POLICY "All users can view badge definitions" 
  ON badge_definitions FOR SELECT 
  USING (true);

-- Badge conditions policies (all users can view badge conditions)
CREATE POLICY "All users can view badge conditions" 
  ON badge_conditions FOR SELECT 
  USING (true);

-- User badges policies
CREATE POLICY "Users can view their own badges" 
  ON user_badges FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
  ON user_badges FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update clothing_items.updated_at when a record is updated
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function when a clothing_items record is updated
CREATE TRIGGER update_clothing_items_updated_at
BEFORE UPDATE ON clothing_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to increment wear_count and update last_worn when a wear record is added
CREATE OR REPLACE FUNCTION increment_wear_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clothing_items
  SET 
    wear_count = wear_count + 1,
    last_worn = NEW.wear_date
  WHERE id = NEW.clothing_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function when a wear_history record is inserted
CREATE TRIGGER increment_wear_count_on_wear
AFTER INSERT ON wear_history
FOR EACH ROW
EXECUTE FUNCTION increment_wear_count();

-- Function to reset wear_count when a wash record is added
CREATE OR REPLACE FUNCTION reset_wear_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clothing_items
  SET wear_count = 0
  WHERE id = NEW.clothing_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function when a wash_history record is inserted
CREATE TRIGGER reset_wear_count_on_wash
AFTER INSERT ON wash_history
FOR EACH ROW
EXECUTE FUNCTION reset_wear_count();

-- Function to automatically create a user record when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when an auth.users record is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create user records for existing auth users
INSERT INTO public.users (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Create indexes for badge tables
CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS badge_conditions_badge_id_idx ON badge_conditions(badge_id);

-- Insert initial badge definitions
INSERT INTO badge_definitions 
  (id, name, description, image_url, category, display_order, is_active) 
VALUES
  ('first-item', '初めてのアイテム登録', '最初のアイテムを登録しました', 'https://example.com/badges/first-item.png', 'usage', 1, true),
  ('first-wear', '初めての着用記録', '最初の着用を記録しました', 'https://example.com/badges/first-wear.png', 'usage', 2, true),
  ('first-wash', '初めての洗濯記録', '最初の洗濯を記録しました', 'https://example.com/badges/first-wash.png', 'usage', 3, true),
  ('item-10-wears', '10回着用達成', '1つのアイテムを10回着用しました', 'https://example.com/badges/10-wears.png', 'milestone', 4, true),
  ('item-30-wears', '30回着用達成', '1つのアイテムを30回着用しました', 'https://example.com/badges/30-wears.png', 'milestone', 5, true),
  ('item-50-wears', '50回着用達成', '1つのアイテムを50回着用しました', 'https://example.com/badges/50-wears.png', 'milestone', 6, true),
  ('wash-reduced-10', '洗濯10回削減', '洗濯回数を10回削減しました', 'https://example.com/badges/wash-10.png', 'efficiency', 7, true),
  ('wash-reduced-50', '洗濯50回削減', '洗濯回数を50回削減しました', 'https://example.com/badges/wash-50.png', 'efficiency', 8, true),
  ('wash-reduced-100', '洗濯100回削減', '洗濯回数を100回削減しました', 'https://example.com/badges/wash-100.png', 'efficiency', 9, true),
  ('category-complete', 'カテゴリコンプリート', '全カテゴリでアイテムを登録しました', 'https://example.com/badges/category-complete.png', 'special', 10, true),
  ('eco-warrior', 'エコウォリアー', '環境貢献度が高いユーザーに贈られるバッジ', 'https://example.com/badges/eco-warrior.png', 'special', 11, true),
  ('efficient-washer', '賢い洗濯', '洗濯閾値の90%以上で洗濯を5回実施', 'https://example.com/badges/efficient-washer.png', 'efficiency', 12, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Insert badge conditions
INSERT INTO badge_conditions
  (badge_id, condition_type, condition_value)
VALUES
  ('first-item', 'total_items', '{"min": 1}'),
  ('first-wear', 'total_wears', '{"min": 1}'),
  ('first-wash', 'total_washes', '{"min": 1}'),
  ('item-10-wears', 'max_item_wears', '{"min": 10}'),
  ('item-30-wears', 'max_item_wears', '{"min": 30}'),
  ('item-50-wears', 'max_item_wears', '{"min": 50}'),
  ('wash-reduced-10', 'washes_reduced', '{"min": 10}'),
  ('wash-reduced-50', 'washes_reduced', '{"min": 50}'),
  ('wash-reduced-100', 'washes_reduced', '{"min": 100}'),
  ('category-complete', 'all_categories', '{"categories": ["トップス", "ボトムス", "アウター", "シューズ", "その他", "小物"]}'),
  ('eco-warrior', 'washes_reduced', '{"min": 30}')
ON CONFLICT DO NOTHING;

-- Note: No conditions for efficient-washer as it has special logic in the code

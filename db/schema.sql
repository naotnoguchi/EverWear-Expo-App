-- Database schema for EverWear

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
  name TEXT,
  category TEXT NOT NULL,
  brand_id UUID REFERENCES brands(id),
  image_path TEXT,
  wear_count INTEGER DEFAULT 0,
  wash_threshold INTEGER DEFAULT 3,
  last_worn DATE,
  last_washed DATE,
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

-- User badges table (バッジ定義はクライアント側で管理)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL, -- 外部キー制約を削除（クライアント側で定義管理）
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User can earn each badge only once
  UNIQUE(user_id, badge_id)
);

-- Subscription management table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  revenue_cat_user_id TEXT NOT NULL,
  subscription_status TEXT NOT NULL CHECK (subscription_status IN ('active', 'expired', 'cancelled', 'grace_period', 'billing_retry')),
  product_id TEXT NOT NULL CHECK (product_id IN ('everwear_premium_monthly_v1', 'everwear_premium_annual_v1')),
  purchase_date TIMESTAMP WITH TIME ZONE,
  expiration_date TIMESTAMP WITH TIME ZONE,
  original_purchase_date TIMESTAMP WITH TIME ZONE,
  revenue_cat_entitlements JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Indexes for subscription table
CREATE INDEX user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX user_subscriptions_status_idx ON user_subscriptions(subscription_status);
CREATE INDEX user_subscriptions_expiration_idx ON user_subscriptions(expiration_date);

-- RLS policies for subscription table
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" 
  ON user_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
  ON user_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
  ON user_subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" 
  ON user_subscriptions FOR ALL 
  USING (auth.role() = 'service_role');

-- Trigger to update updated_at column
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wear_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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

-- User badges policies
CREATE POLICY "Users can view their own badges" 
  ON user_badges FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
  ON user_badges FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users table policies
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
  ON users FOR DELETE 
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage user profiles" 
  ON users FOR ALL 
  USING (auth.role() = 'service_role');

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

-- Create indexes for user badges table
CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON user_badges(badge_id);

-- バッジ定義はクライアント側で管理されるため、DBには初期データを投入しません

-- Function to add a wear record and return the updated item
CREATE OR REPLACE FUNCTION public.add_wear_record_and_return_item(
  item_id_param UUID,
  wear_date_param DATE,
  user_id_param UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  brand_id UUID,
  brand_name TEXT,
  image_path TEXT,
  wear_count INTEGER,
  wash_threshold INTEGER,
  last_worn DATE,
  last_washed DATE,
  memo TEXT,
  condition TEXT,
  purchase_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  wear_history JSONB,
  wash_history JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_exists INTEGER;
  latest_wash_date DATE;
  new_wear_count INTEGER;
  new_last_worn DATE;
BEGIN
  -- Check if the authenticated user matches the user_id parameter
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Access denied: user_id does not match authenticated user';
  END IF;

  -- Verify the item belongs to the user
  SELECT COUNT(*) INTO item_exists
  FROM clothing_items
  WHERE clothing_items.id = item_id_param AND user_id = user_id_param;

  IF item_exists = 0 THEN
    RAISE EXCEPTION 'Item not found or does not belong to the user';
  END IF;

  -- Add wear record
  INSERT INTO wear_history (clothing_item_id, wear_date)
  VALUES (item_id_param, wear_date_param);

  -- Get the latest wash date
  SELECT MAX(wash_date) INTO latest_wash_date
  FROM wash_history
  WHERE clothing_item_id = item_id_param;

  -- Calculate wear count
  IF latest_wash_date IS NOT NULL THEN
    -- Count wears after the latest wash
    SELECT COUNT(*) INTO new_wear_count
    FROM wear_history
    WHERE clothing_item_id = item_id_param
    AND wear_date > latest_wash_date;
  ELSE
    -- Count all wears
    SELECT COUNT(*) INTO new_wear_count
    FROM wear_history
    WHERE clothing_item_id = item_id_param;
  END IF;

  -- Get the latest wear date from history (not the parameter date)
  SELECT MAX(wear_date) INTO new_last_worn
  FROM wear_history
  WHERE clothing_item_id = item_id_param;

  -- Update the clothing item (last_washed is not updated for wear records)
  UPDATE clothing_items
  SET last_worn = new_last_worn,
      wear_count = new_wear_count,
      updated_at = NOW()
  WHERE clothing_items.id = item_id_param;

  -- Return the updated item with history
  RETURN QUERY
  SELECT 
    ci.id,
    ci.name,
    ci.category,
    ci.brand_id,
    b.name as brand_name,
    ci.image_path,
    ci.wear_count,
    ci.wash_threshold,
    ci.last_worn,
    ci.last_washed,
    ci.memo,
    ci.condition,
    ci.purchase_price,
    ci.created_at,
    ci.updated_at,
    (
      SELECT COALESCE(jsonb_agg(wh.wear_date ORDER BY wh.wear_date DESC), '[]'::jsonb)
      FROM wear_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wear_history,
    (
      SELECT COALESCE(jsonb_agg(wh.wash_date ORDER BY wh.wash_date DESC), '[]'::jsonb)
      FROM wash_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wash_history
  FROM 
    clothing_items ci
  LEFT JOIN 
    brands b ON ci.brand_id = b.id
  WHERE 
    ci.id = item_id_param;
END;
$$;

-- Function to delete a wear record and return the updated item
CREATE OR REPLACE FUNCTION public.delete_wear_record_and_return_item(
  item_id_param UUID,
  wear_date_param DATE,
  user_id_param UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  brand_id UUID,
  brand_name TEXT,
  image_path TEXT,
  wear_count INTEGER,
  wash_threshold INTEGER,
  last_worn DATE,
  last_washed DATE,
  memo TEXT,
  condition TEXT,
  purchase_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  wear_history JSONB,
  wash_history JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_exists INTEGER;
  record_exists INTEGER;
  latest_wash_date DATE;
  new_last_worn DATE;
  new_wear_count INTEGER;
BEGIN
  -- Check if the authenticated user matches the user_id parameter
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Access denied: user_id does not match authenticated user';
  END IF;

  -- Verify the item belongs to the user
  SELECT COUNT(*) INTO item_exists
  FROM clothing_items
  WHERE clothing_items.id = item_id_param AND user_id = user_id_param;

  IF item_exists = 0 THEN
    RAISE EXCEPTION 'Item not found or does not belong to the user';
  END IF;

  -- Verify the wear record exists
  SELECT COUNT(*) INTO record_exists
  FROM wear_history
  WHERE clothing_item_id = item_id_param AND wear_date = wear_date_param;

  IF record_exists = 0 THEN
    RAISE EXCEPTION 'Wear record not found for the given clothing item ID and date';
  END IF;

  -- Delete the wear record
  DELETE FROM wear_history
  WHERE clothing_item_id = item_id_param AND wear_date = wear_date_param;

  -- Get the latest wear date after deletion
  SELECT MAX(wear_date) INTO new_last_worn
  FROM wear_history
  WHERE clothing_item_id = item_id_param;

  -- Get the latest wash date
  SELECT MAX(wash_date) INTO latest_wash_date
  FROM wash_history
  WHERE clothing_item_id = item_id_param;

  -- Calculate wear count
  IF latest_wash_date IS NOT NULL THEN
    -- Count wears after the latest wash
    SELECT COUNT(*) INTO new_wear_count
    FROM wear_history
    WHERE clothing_item_id = item_id_param
    AND wear_date > latest_wash_date;
  ELSE
    -- Count all wears
    SELECT COUNT(*) INTO new_wear_count
    FROM wear_history
    WHERE clothing_item_id = item_id_param;
  END IF;

  -- Update the clothing item (last_washed is not updated for wear records)
  UPDATE clothing_items
  SET last_worn = new_last_worn,
      wear_count = new_wear_count,
      updated_at = NOW()
  WHERE clothing_items.id = item_id_param;

  -- Return the updated item with history
  RETURN QUERY
  SELECT 
    ci.id,
    ci.name,
    ci.category,
    ci.brand_id,
    b.name as brand_name,
    ci.image_path,
    ci.wear_count,
    ci.wash_threshold,
    ci.last_worn,
    ci.last_washed,
    ci.memo,
    ci.condition,
    ci.purchase_price,
    ci.created_at,
    ci.updated_at,
    (
      SELECT COALESCE(jsonb_agg(wh.wear_date ORDER BY wh.wear_date DESC), '[]'::jsonb)
      FROM wear_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wear_history,
    (
      SELECT COALESCE(jsonb_agg(wh.wash_date ORDER BY wh.wash_date DESC), '[]'::jsonb)
      FROM wash_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wash_history
  FROM 
    clothing_items ci
  LEFT JOIN 
    brands b ON ci.brand_id = b.id
  WHERE 
    ci.id = item_id_param;
END;
$$;

-- Function to add a wash record and return the updated item
CREATE OR REPLACE FUNCTION public.add_wash_record_and_return_item(
  item_id_param UUID,
  wash_date_param DATE,
  user_id_param UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  brand_id UUID,
  brand_name TEXT,
  image_path TEXT,
  wear_count INTEGER,
  wash_threshold INTEGER,
  last_worn DATE,
  last_washed DATE,
  memo TEXT,
  condition TEXT,
  purchase_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  wear_history JSONB,
  wash_history JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_exists INTEGER;
  new_wear_count INTEGER;
  new_last_worn DATE;
  new_last_washed DATE;
BEGIN
  -- Check if the authenticated user matches the user_id parameter
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Access denied: user_id does not match authenticated user';
  END IF;

  -- Verify the item belongs to the user
  SELECT COUNT(*) INTO item_exists
  FROM clothing_items
  WHERE clothing_items.id = item_id_param AND user_id = user_id_param;

  IF item_exists = 0 THEN
    RAISE EXCEPTION 'Item not found or does not belong to the user';
  END IF;

  -- Add wash record
  INSERT INTO wash_history (clothing_item_id, wash_date)
  VALUES (item_id_param, wash_date_param);

  -- Get the latest wash date from history (after insertion)
  SELECT MAX(wash_date) INTO new_last_washed
  FROM wash_history
  WHERE clothing_item_id = item_id_param;

  -- Calculate wear count (wears after the latest wash)
  IF new_last_washed IS NOT NULL THEN
    SELECT COUNT(*) INTO new_wear_count
    FROM wear_history
    WHERE clothing_item_id = item_id_param
    AND wear_date > new_last_washed;
  ELSE
    SELECT COUNT(*) INTO new_wear_count
    FROM wear_history
    WHERE clothing_item_id = item_id_param;
  END IF;

  -- Get the latest wear date from history
  SELECT MAX(wear_date) INTO new_last_worn
  FROM wear_history
  WHERE clothing_item_id = item_id_param;

  -- Update the clothing item
  UPDATE clothing_items
  SET wear_count = new_wear_count,
      last_worn = new_last_worn,
      last_washed = new_last_washed,
      updated_at = NOW()
  WHERE clothing_items.id = item_id_param;

  -- Return the updated item with history
  RETURN QUERY
  SELECT 
    ci.id,
    ci.name,
    ci.category,
    ci.brand_id,
    b.name as brand_name,
    ci.image_path,
    ci.wear_count,
    ci.wash_threshold,
    ci.last_worn,
    ci.last_washed,
    ci.memo,
    ci.condition,
    ci.purchase_price,
    ci.created_at,
    ci.updated_at,
    (
      SELECT COALESCE(jsonb_agg(wh.wear_date ORDER BY wh.wear_date DESC), '[]'::jsonb)
      FROM wear_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wear_history,
    (
      SELECT COALESCE(jsonb_agg(wh.wash_date ORDER BY wh.wash_date DESC), '[]'::jsonb)
      FROM wash_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wash_history
  FROM 
    clothing_items ci
  LEFT JOIN 
    brands b ON ci.brand_id = b.id
  WHERE 
    ci.id = item_id_param;
END;
$$;

-- Function to delete a wash record and return the updated item
CREATE OR REPLACE FUNCTION public.delete_wash_record_and_return_item(
  item_id_param UUID,
  wash_date_param DATE,
  user_id_param UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  brand_id UUID,
  brand_name TEXT,
  image_path TEXT,
  wear_count INTEGER,
  wash_threshold INTEGER,
  last_worn DATE,
  last_washed DATE,
  memo TEXT,
  condition TEXT,
  purchase_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  wear_history JSONB,
  wash_history JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_exists INTEGER;
  record_exists INTEGER;
  latest_wash_date DATE;
  new_wear_count INTEGER;
  new_last_worn DATE;
  new_last_washed DATE;
BEGIN
  -- Check if the authenticated user matches the user_id parameter
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Access denied: user_id does not match authenticated user';
  END IF;

  -- Verify the item belongs to the user
  SELECT COUNT(*) INTO item_exists
  FROM clothing_items
  WHERE clothing_items.id = item_id_param AND user_id = user_id_param;

  IF item_exists = 0 THEN
    RAISE EXCEPTION 'Item not found or does not belong to the user';
  END IF;

  -- Verify the wash record exists
  SELECT COUNT(*) INTO record_exists
  FROM wash_history
  WHERE clothing_item_id = item_id_param AND wash_date = wash_date_param;

  IF record_exists = 0 THEN
    RAISE EXCEPTION 'Wash record not found for the given clothing item ID and date';
  END IF;

  -- Delete the wash record
  DELETE FROM wash_history
  WHERE clothing_item_id = item_id_param AND wash_date = wash_date_param;

  -- Get the latest wash date after deletion
  SELECT MAX(wash_date) INTO latest_wash_date
  FROM wash_history
  WHERE clothing_item_id = item_id_param;

  -- Calculate wear count
  IF latest_wash_date IS NOT NULL THEN
    -- Count wears after the latest wash
    SELECT COUNT(*) INTO new_wear_count
    FROM wear_history
    WHERE clothing_item_id = item_id_param
    AND wear_date > latest_wash_date;
  ELSE
    -- Count all wears
    SELECT COUNT(*) INTO new_wear_count
    FROM wear_history
    WHERE clothing_item_id = item_id_param;
  END IF;

  -- Get the latest wear date from history
  SELECT MAX(wear_date) INTO new_last_worn
  FROM wear_history
  WHERE clothing_item_id = item_id_param;

  -- Get the latest wash date from history (should be same as latest_wash_date)
  SELECT MAX(wash_date) INTO new_last_washed
  FROM wash_history
  WHERE clothing_item_id = item_id_param;

  -- Update the clothing item
  UPDATE clothing_items
  SET wear_count = new_wear_count,
      last_worn = new_last_worn,
      last_washed = new_last_washed,
      updated_at = NOW()
  WHERE clothing_items.id = item_id_param;

  -- Return the updated item with history
  RETURN QUERY
  SELECT 
    ci.id,
    ci.name,
    ci.category,
    ci.brand_id,
    b.name as brand_name,
    ci.image_path,
    ci.wear_count,
    ci.wash_threshold,
    ci.last_worn,
    ci.last_washed,
    ci.memo,
    ci.condition,
    ci.purchase_price,
    ci.created_at,
    ci.updated_at,
    (
      SELECT COALESCE(jsonb_agg(wh.wear_date ORDER BY wh.wear_date DESC), '[]'::jsonb)
      FROM wear_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wear_history,
    (
      SELECT COALESCE(jsonb_agg(wh.wash_date ORDER BY wh.wash_date DESC), '[]'::jsonb)
      FROM wash_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wash_history
  FROM 
    clothing_items ci
  LEFT JOIN 
    brands b ON ci.brand_id = b.id
  WHERE 
    ci.id = item_id_param;
END;
$$;

-- Function to get clothing items with their history in a single query
CREATE OR REPLACE FUNCTION public.get_clothing_items_with_history(user_id_param UUID)
RETURNS TABLE (
  item_id UUID,
  name TEXT,
  category TEXT,
  brand_id UUID,
  brand_name TEXT,
  image_path TEXT,
  wear_count INTEGER,
  wash_threshold INTEGER,
  last_worn DATE,
  last_washed DATE,
  memo TEXT,
  condition TEXT,
  purchase_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  wear_dates JSONB,
  wash_dates JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the authenticated user matches the user_id parameter
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Access denied: user_id does not match authenticated user';
  END IF;

  RETURN QUERY
  SELECT 
    ci.id as item_id,
    ci.name,
    ci.category,
    ci.brand_id,
    b.name as brand_name,
    ci.image_path,
    ci.wear_count,
    ci.wash_threshold,
    ci.last_worn,
    ci.last_washed,
    ci.memo,
    ci.condition,
    ci.purchase_price,
    ci.created_at,
    ci.updated_at,
    (
      SELECT COALESCE(jsonb_agg(wh.wear_date ORDER BY wh.wear_date DESC), '[]'::jsonb)
      FROM wear_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wear_dates,
    (
      SELECT COALESCE(jsonb_agg(wh.wash_date ORDER BY wh.wash_date DESC), '[]'::jsonb)
      FROM wash_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wash_dates
  FROM 
    clothing_items ci
  LEFT JOIN 
    brands b ON ci.brand_id = b.id
  WHERE 
    ci.user_id = user_id_param;
END;
$$;

-- Function to get a single clothing item with its history by ID
CREATE OR REPLACE FUNCTION public.get_clothing_item_by_id_with_history(
  item_id_param UUID,
  user_id_param UUID
)
RETURNS TABLE (
  item_id UUID,
  name TEXT,
  category TEXT,
  brand_id UUID,
  brand_name TEXT,
  image_path TEXT,
  wear_count INTEGER,
  wash_threshold INTEGER,
  last_worn DATE,
  last_washed DATE,
  memo TEXT,
  condition TEXT,
  purchase_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  wear_dates JSONB,
  wash_dates JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the authenticated user matches the user_id parameter
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Access denied: user_id does not match authenticated user';
  END IF;

  RETURN QUERY
  SELECT 
    ci.id as item_id,
    ci.name,
    ci.category,
    ci.brand_id,
    b.name as brand_name,
    ci.image_path,
    ci.wear_count,
    ci.wash_threshold,
    ci.last_worn,
    ci.last_washed,
    ci.memo,
    ci.condition,
    ci.purchase_price,
    ci.created_at,
    ci.updated_at,
    (
      SELECT COALESCE(jsonb_agg(wh.wear_date ORDER BY wh.wear_date DESC), '[]'::jsonb)
      FROM wear_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wear_dates,
    (
      SELECT COALESCE(jsonb_agg(wh.wash_date ORDER BY wh.wash_date DESC), '[]'::jsonb)
      FROM wash_history wh
      WHERE wh.clothing_item_id = ci.id
    ) as wash_dates
  FROM 
    clothing_items ci
  LEFT JOIN 
    brands b ON ci.brand_id = b.id
  WHERE 
    ci.id = item_id_param AND
    ci.user_id = user_id_param;
END;
$$;

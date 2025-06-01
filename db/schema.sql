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
  brand TEXT,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wear_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

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

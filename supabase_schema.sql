-- 1. Create Foods Table
CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    calories_per_100g REAL NOT NULL,
    protein_per_100g REAL NOT NULL,
    carbs_per_100g REAL NOT NULL,
    fat_per_100g REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read foods
CREATE POLICY "Allow public read access to foods" 
ON foods FOR SELECT 
USING (true);

-- 2. Create Food Logs Table
CREATE TABLE IF NOT EXISTS food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    quantity_grams REAL NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own food logs
CREATE POLICY "Allow users to select their own food logs" 
ON food_logs FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Allow users to insert their own food logs
CREATE POLICY "Allow users to insert their own food logs" 
ON food_logs FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to delete their own food logs
CREATE POLICY "Allow users to delete their own food logs" 
ON food_logs FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 3. Seed Foods Table (30 common staple & Indian foods)
INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES
('Roti (Whole Wheat Chapati)', 260.0, 8.0, 55.0, 1.5),
('Basmati White Rice (Cooked)', 130.0, 2.7, 28.0, 0.3),
('Brown Rice (Cooked)', 111.0, 2.6, 23.0, 0.9),
('Dal Tadka (Cooked Yellow Lentils)', 85.0, 5.0, 14.0, 1.5),
('Chicken Breast (Grilled)', 165.0, 31.0, 0.0, 3.6),
('Whole Egg (Boiled)', 155.0, 13.0, 1.1, 11.0),
('Egg White (Boiled)', 52.0, 11.0, 0.7, 0.2),
('Paneer (Cottage Cheese)', 265.0, 18.3, 1.2, 20.8),
('Whole Milk (3.25% Fat)', 61.0, 3.2, 4.8, 3.3),
('Low Fat Milk (Double Toned)', 43.0, 3.4, 4.9, 1.5),
('Curd / Dahi (Plain Whole)', 63.0, 3.0, 4.0, 3.5),
('Rolled Oats (Raw)', 389.0, 16.9, 66.0, 6.9),
('Banana', 89.0, 1.1, 23.0, 0.3),
('Apple', 52.0, 0.3, 14.0, 0.2),
('Almonds (Badam)', 579.0, 21.0, 22.0, 49.0),
('Walnuts (Akhrot)', 654.0, 15.0, 14.0, 65.0),
('Potato (Boiled)', 87.0, 1.9, 20.0, 0.1),
('Sweet Potato (Boiled)', 76.0, 1.4, 18.0, 0.1),
('Cooked Chickpeas (Chole)', 164.0, 8.9, 27.0, 2.6),
('Cooked Kidney Beans (Rajma)', 127.0, 8.7, 22.8, 0.5),
('Peanut Butter (Creamy)', 588.0, 25.0, 20.0, 50.0),
('White Bread (1 Slice ~25g)', 265.0, 9.0, 49.0, 3.2),
('Brown Bread (1 Slice ~25g)', 250.0, 10.0, 43.0, 3.0),
('Whey Protein Powder', 400.0, 80.0, 6.0, 6.0),
('Samosa (Indian Snack)', 262.0, 4.5, 32.0, 13.0),
('Butter (Salted)', 717.0, 0.9, 0.1, 81.0),
('Ghee (Clarified Butter)', 900.0, 0.0, 0.0, 100.0),
('Idli (Steamed Rice Cake)', 143.0, 3.5, 30.0, 0.5),
('Cooked Rohu / Salmon Fish', 142.0, 20.0, 0.0, 6.3),
('Mixed Salad Vegetables', 20.0, 1.0, 4.0, 0.1)
ON CONFLICT (name) DO UPDATE SET
    calories_per_100g = EXCLUDED.calories_per_100g,
    protein_per_100g = EXCLUDED.protein_per_100g,
    carbs_per_100g = EXCLUDED.carbs_per_100g,
    fat_per_100g = EXCLUDED.fat_per_100g;

-- 4. Alter user_profiles table for onboarding updates
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'));

-- 5. Expand / Create Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    muscle_group TEXT NOT NULL,
    primary_muscle TEXT,
    secondary_muscles TEXT[] DEFAULT '{}',
    instructions TEXT[] DEFAULT '{}',
    form_tips TEXT[] DEFAULT '{}',
    common_mistakes TEXT[] DEFAULT '{}',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to exercises
CREATE POLICY "Allow public read access to exercises" 
ON exercises FOR SELECT 
USING (true);

-- Alter statements in case table already exists
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS primary_muscle TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS form_tips TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS common_mistakes TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Alter workout_sets table to add notes column
ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS notes TEXT;

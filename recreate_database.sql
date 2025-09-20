-- Recreate all tables for Calendar Management App

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  description TEXT,
  color TEXT,
  location TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Graphs table
CREATE TABLE IF NOT EXISTS graphs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  graph_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journals table with expanded structure
CREATE TABLE IF NOT EXISTS journals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  drawings JSONB DEFAULT '[]'::JSONB,
  photos JSONB DEFAULT '[]'::JSONB,
  mood TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Users can insert their own events" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own events" ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON events FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for graphs
CREATE POLICY "Users can insert their own graphs" ON graphs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own graphs" ON graphs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own graphs" ON graphs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own graphs" ON graphs FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for journals
CREATE POLICY "Users can insert their own journals" ON journals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own journals" ON journals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own journals" ON journals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journals" ON journals FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_graphs_updated_at
BEFORE UPDATE ON graphs
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_journals_updated_at
BEFORE UPDATE ON journals
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Create storage buckets if they don't exist
-- Note: This part needs to be done via the Supabase dashboard or CLI separately
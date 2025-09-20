CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  description TEXT
);

CREATE TABLE graphs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  graph_data JSONB NOT NULL
);

CREATE TABLE journals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  entry TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can access their own events" ON events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own graphs" ON graphs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own journals" ON journals
  FOR ALL USING (auth.uid() = user_id);
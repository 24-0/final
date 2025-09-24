-- StudyConnect Database Schema
-- This file contains all the SQL commands needed to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    points INTEGER DEFAULT 0,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    slug TEXT,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT,
    tags TEXT[],
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_resolved BOOLEAN DEFAULT FALSE,
    answer_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    target_type TEXT NOT NULL, -- 'question' or 'answer'
    target_id UUID NOT NULL,
    vote_type TEXT NOT NULL, -- 'up' or 'down'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_memberships table
CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    username TEXT NOT NULL,
    message TEXT,
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_resources table
CREATE TABLE IF NOT EXISTS group_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    resource_url TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_messages table
CREATE TABLE IF NOT EXISTS community_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    username TEXT NOT NULL,
    country TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table (for general resources)
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    uploader_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_posts table (for bookmarks functionality)
CREATE TABLE IF NOT EXISTS saved_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_author_id ON questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
CREATE INDEX IF NOT EXISTS idx_questions_slug ON questions(slug);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_resources_group_id ON group_resources(group_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_question_id ON saved_posts(question_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Questions policies
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create questions" ON questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own questions" ON questions FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own questions" ON questions FOR DELETE USING (auth.uid() = author_id);

-- Answers policies
CREATE POLICY "Anyone can view answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create answers" ON answers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own answers" ON answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own answers" ON answers FOR DELETE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Anyone can view votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create votes" ON votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Anyone can view public groups" ON groups FOR SELECT USING (is_private = false OR auth.uid() IN (SELECT user_id FROM group_memberships WHERE group_id = groups.id));
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Group creators can update groups" ON groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Group creators can delete groups" ON groups FOR DELETE USING (auth.uid() = created_by);

-- Group memberships policies
CREATE POLICY "Group members can view memberships" ON group_memberships FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT created_by FROM groups WHERE id = group_id));
CREATE POLICY "Users can join public groups" ON group_memberships FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (auth.uid() = user_id));
CREATE POLICY "Users can leave groups" ON group_memberships FOR DELETE USING (auth.uid() = user_id);

-- Group messages policies
CREATE POLICY "Group members can view messages" ON group_messages FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM group_memberships WHERE group_id = group_messages.group_id)
);
CREATE POLICY "Group members can create messages" ON group_messages FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() IN (SELECT user_id FROM group_memberships WHERE group_id = group_messages.group_id)
);
CREATE POLICY "Group members can update own messages" ON group_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Group members can delete own messages" ON group_messages FOR DELETE USING (auth.uid() = user_id);

-- Group resources policies
CREATE POLICY "Group members can view resources" ON group_resources FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM group_memberships WHERE group_id = group_resources.group_id)
);
CREATE POLICY "Group members can create resources" ON group_resources FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() IN (SELECT user_id FROM group_memberships WHERE group_id = group_resources.group_id)
);
CREATE POLICY "Group members can update own resources" ON group_resources FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Group members can delete own resources" ON group_resources FOR DELETE USING (auth.uid() = uploaded_by);

-- Resources policies
CREATE POLICY "Anyone can view resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create resources" ON resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own resources" ON resources FOR UPDATE USING (auth.uid() = uploader_id);
CREATE POLICY "Users can delete own resources" ON resources FOR DELETE USING (auth.uid() = uploader_id);

-- Saved posts policies
CREATE POLICY "Users can view own saved posts" ON saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create saved posts" ON saved_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can delete own saved posts" ON saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Functions for updating points
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET points = points + points_to_add
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_points(user_id UUID, points_to_remove INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET points = GREATEST(points - points_to_remove, 0)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update question views
CREATE OR REPLACE FUNCTION increment_question_views(question_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE questions
    SET views = views + 1
    WHERE id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

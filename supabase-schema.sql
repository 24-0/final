-- StudyConnect Database Schema for Supabase
-- This script creates all necessary tables, relationships, and constraints

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    points INTEGER DEFAULT 0,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    slug TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT,
    tags TEXT[],
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_resolved BOOLEAN DEFAULT FALSE,
    answer_limit INTEGER DEFAULT 3 CHECK (answer_limit >= 1 AND answer_limit <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Answers table
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(question_id, user_id) -- One answer per user per question
);

-- Votes table (for questions and answers)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('question', 'answer')),
    target_id UUID NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, target_type, target_id)
);

-- Saved posts (bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, question_id)
);

-- Groups table (for discussion rooms)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Group members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Resources table (for uploads in groups)
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT, -- For file URLs
    file_type TEXT, -- 'pdf', 'image', 'document', etc.
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- AI Answers table
CREATE TABLE IF NOT EXISTS public.ai_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Community messages table
CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    country TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'news', 'update')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- To enforce one message per user per day, create a unique index on user_id and date part of created_at
-- Note: functions in index expressions must be marked IMMUTABLE, but DATE() is not immutable in PostgreSQL
-- Workaround: create a generated column for date and index that column

ALTER TABLE public.community_messages DROP COLUMN IF EXISTS created_date;

ALTER TABLE public.community_messages
ADD COLUMN created_date DATE GENERATED ALWAYS AS ((created_at AT TIME ZONE 'UTC')::date) STORED;

DROP INDEX IF EXISTS idx_community_messages_user_date;
CREATE UNIQUE INDEX idx_community_messages_user_date ON public.community_messages (user_id, created_date);

-- Gifts/Rewards table
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Redeems table (user redemptions)
CREATE TABLE IF NOT EXISTS public.redeems (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    gift_id UUID REFERENCES public.gifts(id) ON DELETE CASCADE NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('answer', 'vote', 'comment', 'group_invite', 'ai_answer', 'points_earned')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID, -- Can reference questions, answers, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User settings table (for account settings)
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_author_id ON public.questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON public.answers(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON public.votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_resources_group_id ON public.resources(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_community_messages_country ON public.community_messages(country, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_questions
    BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_answers
    BEFORE UPDATE ON public.answers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_groups
    BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to award points for answering questions
CREATE OR REPLACE FUNCTION public.award_points_for_answer()
RETURNS TRIGGER AS $$
BEGIN
    -- Award 10 points for posting an answer
    UPDATE public.profiles
    SET points = points + 10
    WHERE id = NEW.user_id;

    -- Create notification
    INSERT INTO public.notifications (user_id, type, message, related_id)
    VALUES (NEW.user_id, 'points_earned', 'You earned 10 points for answering a question!', NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for awarding points on answer creation
CREATE TRIGGER award_points_on_answer
    AFTER INSERT ON public.answers
    FOR EACH ROW EXECUTE FUNCTION public.award_points_for_answer();

-- Function to handle vote updates
CREATE OR REPLACE FUNCTION public.handle_vote()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vote_type = 'up' THEN
        IF NEW.target_type = 'question' THEN
            UPDATE public.questions SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'answer' THEN
            UPDATE public.answers SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
        END IF;
    ELSIF NEW.vote_type = 'down' THEN
        IF NEW.target_type = 'question' THEN
            UPDATE public.questions SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'answer' THEN
            UPDATE public.answers SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote handling
CREATE TRIGGER handle_vote_insert
    AFTER INSERT ON public.votes
    FOR EACH ROW EXECUTE FUNCTION public.handle_vote();

-- Function to generate slug for questions
CREATE OR REPLACE FUNCTION public.generate_question_slug()
RETURNS TRIGGER AS $$
BEGIN
    NEW.slug = LOWER(REPLACE(REPLACE(REPLACE(NEW.title, ' ', '-'), '[^a-zA-Z0-9\-]', ''), '--', '-'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for slug generation
CREATE TRIGGER generate_question_slug_trigger
    BEFORE INSERT ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.generate_question_slug();

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only see/modify their own data)
-- Profiles: Users can view all profiles, but only edit their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Questions: Anyone can view, authenticated users can create
CREATE POLICY "Questions are viewable by everyone" ON public.questions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create questions" ON public.questions
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their questions" ON public.questions
    FOR UPDATE USING (auth.uid() = author_id);

-- Answers: Similar to questions
CREATE POLICY "Answers are viewable by everyone" ON public.answers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create answers" ON public.answers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Answer authors can update their answers" ON public.answers
    FOR UPDATE USING (auth.uid() = user_id);

-- Votes: Users can only vote once per target
CREATE POLICY "Votes are viewable by everyone" ON public.votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saved posts: Private to user
CREATE POLICY "Users can view their own saved posts" ON public.saved_posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts" ON public.saved_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts" ON public.saved_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Groups: Public groups viewable by all, private only by members
CREATE POLICY "Public groups are viewable by everyone" ON public.groups
    FOR SELECT USING (NOT is_private OR EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = groups.id AND user_id = auth.uid()
    ));

CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Group members: Members can view group membership
CREATE POLICY "Group members can view membership" ON public.group_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
    );

CREATE POLICY "Group admins can manage members" ON public.group_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
    );

-- Resources: Group members can view resources
CREATE POLICY "Group members can view resources" ON public.resources
    FOR SELECT USING (
        group_id IS NULL OR
        EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = resources.group_id AND gm.user_id = auth.uid())
    );

-- AI Answers: Public
CREATE POLICY "AI answers are viewable by everyone" ON public.ai_answers
    FOR SELECT USING (true);

-- Community messages: Public
CREATE POLICY "Community messages are viewable by everyone" ON public.community_messages
    FOR SELECT USING (true);

CREATE POLICY "Users can post community messages" ON public.community_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gifts: Public view
CREATE POLICY "Gifts are viewable by everyone" ON public.gifts
    FOR SELECT USING (true);

-- Redeems: Private
CREATE POLICY "Users can view their own redeems" ON public.redeems
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem gifts" ON public.redeems
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: Private
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- User settings: Private
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

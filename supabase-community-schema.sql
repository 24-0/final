-- Supabase schema for community messages table

create table if not exists community_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  username text not null,
  country text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_community_messages_country on community_messages(country);
create index if not exists idx_community_messages_created_at on community_messages(created_at);

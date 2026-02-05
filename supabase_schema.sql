-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  home_location text, -- User's home address/postcode for distance calc
  transport_mode text default 'driving', -- driving, transit, bicycling, walking
  hourly_band_rate numeric, -- Optional override for their band rate
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Uploads table (Tracks screenshot uploads)
create table public.uploads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  file_path text not null, -- Storage path
  status text default 'processing', -- processing, completed, failed
  original_filename text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.uploads enable row level security;

create policy "Users can view own uploads" on public.uploads
  for select using (auth.uid() = user_id);

create policy "Users can upload own files" on public.uploads
  for insert with check (auth.uid() = user_id);

-- Shifts table (Parsed shift data)
create table public.shifts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  upload_id uuid references public.uploads(id),
  hospital_name text,
  ward_name text,
  shift_date date,
  start_time time,
  end_time time,
  pay_rate numeric, -- Hourly rate
  total_pay numeric, -- Calculated total
  travel_time_minutes integer, -- Calculated from Google Maps
  travel_distance_km numeric, -- Calculated from Google Maps
  roi_score numeric, -- Calculated score
  raw_text text, -- Text extracted by OCR for debugging
  status text default 'available', -- available, applied, booked
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.shifts enable row level security;

create policy "Users can view own shifts" on public.shifts
  for select using (auth.uid() = user_id);

create policy "Users can insert own shifts" on public.shifts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own shifts" on public.shifts
  for update using (auth.uid() = user_id);

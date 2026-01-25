-- CVMBS Research Day Platform - Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- ============================================
-- EVENTS TABLE (Multi-year support)
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,

  -- Key dates
  event_date DATE,
  submission_opens_at TIMESTAMPTZ,
  submission_closes_at TIMESTAMPTZ,      -- Deadline for NEW submissions (early December)
  edit_deadline_at TIMESTAMPTZ,           -- Deadline for EDITS to existing submissions (Jan 10)
  judge_signup_opens_at TIMESTAMPTZ,
  judge_signup_closes_at TIMESTAMPTZ,

  -- Event status
  status TEXT DEFAULT 'setup' CHECK (status IN (
    'setup',
    'accepting_submissions',
    'reviewing',
    'assignments',
    'live',
    'archived'
  )),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE (Extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  department TEXT,
  affiliation TEXT,                        -- "CSU", "External Institution"
  phone TEXT,
  avatar_url TEXT,

  -- Role flags (user can have multiple roles)
  is_admin BOOLEAN DEFAULT FALSE,
  is_presenter BOOLEAN DEFAULT FALSE,
  is_judge BOOLEAN DEFAULT FALSE,

  -- Gamification (Phase 2)
  points INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SUBMISSIONS TABLE (Replaces MS Forms)
-- ============================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),

  -- Assigned after acceptance
  presentation_id TEXT,                    -- "U04", "145", etc.

  -- Presenter info (captured at submission)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  classification TEXT,                     -- "PhD Student", "Undergrad", etc.
  department TEXT,

  -- Research info
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  authors TEXT,                            -- All authors as text
  mentors TEXT[],                          -- Array of mentor names
  affiliations TEXT[],                     -- Array of affiliations
  funding TEXT,                            -- Funding acknowledgment
  research_type TEXT CHECK (research_type IN (
    'Foundational Research',
    'Translational Research',
    'Veterinary Clinical Research',
    'Social Sciences/Pedagogy Research'
  )),
  research_stage TEXT CHECK (research_stage IN ('Early', 'Advanced')),

  -- Preferences
  preferred_presentation_type TEXT CHECK (preferred_presentation_type IN (
    'Oral', 'Poster', 'No preference'
  )),

  -- Assigned by admin
  presentation_type TEXT CHECK (presentation_type IN (
    'Oral', 'Poster', 'Undergrad Poster'
  )),
  presentation_time TEXT,                  -- "10:15 - 11:15"
  presentation_location TEXT,              -- "Ballroom A", "Poster #42"

  -- Status workflow
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted',
    'under_review',
    'changes_requested',
    'accepted',
    'rejected',
    'withdrawn'
  )),
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES profiles(id),

  -- Withdrawal tracking (soft delete)
  withdrawn_at TIMESTAMPTZ,
  withdrawn_reason TEXT,
  withdrawn_by UUID REFERENCES profiles(id),

  -- Admin notes
  admin_notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, user_id)                -- One submission per person per event
);

-- Status history for audit trail
CREATE TABLE submission_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JUDGE REGISTRATIONS
-- ============================================
CREATE TABLE judge_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),

  -- Contact (may differ from profile)
  preferred_email TEXT,
  phone TEXT,

  -- Availability
  available_sessions TEXT[],               -- Array: ["10:15 - 11:15", "11:30 - 1:30"]

  -- Expertise for matching
  expertise_areas TEXT[],                  -- Array: ["Foundational", "Translational"]

  -- Preferences
  max_presentations INTEGER DEFAULT 5,
  prefers_oral BOOLEAN DEFAULT TRUE,
  prefers_poster BOOLEAN DEFAULT TRUE,

  -- Conflicts of interest
  conflict_emails TEXT[],                  -- Emails of people they can't judge
  conflict_notes TEXT,                     -- Explanation if needed

  -- Status
  status TEXT DEFAULT 'registered' CHECK (status IN (
    'registered', 'confirmed', 'withdrawn'
  )),
  withdrawn_at TIMESTAMPTZ,
  withdrawn_reason TEXT,

  -- Admin
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, user_id)
);

-- ============================================
-- JUDGE ASSIGNMENTS
-- ============================================
CREATE TABLE judge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES profiles(id),

  assignment_order INTEGER,                -- 1, 2, or 3

  -- Status tracking
  status TEXT DEFAULT 'assigned' CHECK (status IN (
    'assigned', 'notified', 'scoring', 'completed'
  )),
  notified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(submission_id, judge_id)          -- One assignment per judge per submission
);

-- ============================================
-- SCORES
-- ============================================
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES profiles(id),
  assignment_id UUID REFERENCES judge_assignments(id),

  -- Criteria stored as JSONB for flexibility
  criteria JSONB NOT NULL,
  /*
  Example:
  {
    "content_why": 4,
    "content_what_how": 5,
    "content_next_steps": 3,
    "presentation_flow": 4,
    "preparedness": 5,
    "verbal_comm": 4,
    "visual_aids": 4
  }
  */

  weighted_total INTEGER,
  is_no_show BOOLEAN DEFAULT FALSE,

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(submission_id, judge_id)          -- One score per judge per submission
);

-- ============================================
-- WITHDRAWAL REQUESTS
-- ============================================
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  -- Who's withdrawing
  request_type TEXT NOT NULL CHECK (request_type IN ('presenter', 'judge')),
  submission_id UUID REFERENCES submissions(id),
  judge_registration_id UUID REFERENCES judge_registrations(id),
  user_id UUID REFERENCES profiles(id),

  -- Request details
  reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_via TEXT CHECK (requested_via IN ('self_service', 'email', 'phone')),

  -- Processing
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT CONFIGURATION (Reusable Settings)
-- ============================================
CREATE TABLE event_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, config_key)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- Events: Everyone can read, admins can write
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Events are editable by admins" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Submissions: Complex rules based on status and ownership
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all submissions" ON submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Accepted submissions are publicly viewable" ON submissions
  FOR SELECT USING (status = 'accepted');

CREATE POLICY "Users can create own submissions" ON submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft/submitted submissions" ON submissions
  FOR UPDATE USING (
    user_id = auth.uid() AND status IN ('draft', 'submitted', 'changes_requested')
  );

CREATE POLICY "Admins can update any submission" ON submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Scores: Judges can see/edit own, admins see all
CREATE POLICY "Judges can view own scores" ON scores
  FOR SELECT USING (judge_id = auth.uid());

CREATE POLICY "Admins can view all scores" ON scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Judges can insert own scores" ON scores
  FOR INSERT WITH CHECK (judge_id = auth.uid());

CREATE POLICY "Judges can update own scores" ON scores
  FOR UPDATE USING (judge_id = auth.uid());

-- Judge assignments: Judges see own, admins see all
CREATE POLICY "Judges can view own assignments" ON judge_assignments
  FOR SELECT USING (judge_id = auth.uid());

CREATE POLICY "Admins can manage all assignments" ON judge_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_submissions_event_id ON submissions(event_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_judge_assignments_judge_id ON judge_assignments(judge_id);
CREATE INDEX idx_judge_assignments_submission_id ON judge_assignments(submission_id);
CREATE INDEX idx_scores_judge_id ON scores(judge_id);
CREATE INDEX idx_scores_submission_id ON scores(submission_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_judge_registrations_updated_at
  BEFORE UPDATE ON judge_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_config_updated_at
  BEFORE UPDATE ON event_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

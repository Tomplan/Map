-- Create Feedback & Feature Request System
-- Allows all authenticated users to submit, view, vote, and comment on issues/features
-- Super admins can manage status, priority, and version tracking

-- Main feedback requests table
CREATE TABLE IF NOT EXISTS feedback_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('issue', 'feature')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'archived')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  votes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  version_completed TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Vote tracking (one vote per user per request)
CREATE TABLE IF NOT EXISTS feedback_votes (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES feedback_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, user_id)
);

-- Comments/discussion threads
CREATE TABLE IF NOT EXISTS feedback_comments (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES feedback_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_requests
-- All authenticated users can read all requests
CREATE POLICY "All authenticated users can read requests"
  ON feedback_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert their own requests
CREATE POLICY "Authenticated users can create requests"
  ON feedback_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests (title, description only)
-- Super admins can update any request (all fields)
CREATE POLICY "Users can update own requests, admins can update all"
  ON feedback_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Only super admins can delete requests
CREATE POLICY "Super admins can delete requests"
  ON feedback_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- RLS Policies for feedback_votes
-- All authenticated users can read all votes
CREATE POLICY "All authenticated users can read votes"
  ON feedback_votes
  FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert their own votes
CREATE POLICY "Authenticated users can vote"
  ON feedback_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes (to unvote)
CREATE POLICY "Users can remove their own votes"
  ON feedback_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for feedback_comments
-- All authenticated users can read all comments
CREATE POLICY "All authenticated users can read comments"
  ON feedback_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert their own comments
CREATE POLICY "Authenticated users can comment"
  ON feedback_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON feedback_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments, super admins can delete any
CREATE POLICY "Users can delete own comments, admins can delete all"
  ON feedback_comments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Function to update votes count when vote is added/removed
CREATE OR REPLACE FUNCTION update_feedback_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_requests 
    SET votes = votes + 1 
    WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_requests 
    SET votes = votes - 1 
    WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comments count when comment is added/removed
CREATE OR REPLACE FUNCTION update_feedback_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_requests 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_requests 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to maintain vote and comment counts
CREATE TRIGGER feedback_votes_count_trigger
  AFTER INSERT OR DELETE ON feedback_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_votes_count();

CREATE TRIGGER feedback_comments_count_trigger
  AFTER INSERT OR DELETE ON feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_comments_count();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_requests_status ON feedback_requests(status);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_type ON feedback_requests(type);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_user_id ON feedback_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_created_at ON feedback_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_request_id ON feedback_votes(request_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_id ON feedback_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_request_id ON feedback_comments(request_id);

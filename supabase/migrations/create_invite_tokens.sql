CREATE TABLE invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('read', 'write', 'admin')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_invite_tokens_project_id ON invite_tokens(project_id);
CREATE INDEX idx_invite_tokens_expires_at ON invite_tokens(expires_at);
CREATE INDEX idx_invite_tokens_used ON invite_tokens(used);

-- Add RLS policies
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to create invite tokens for projects they have admin access to
CREATE POLICY "Users can create invite tokens for their admin projects" ON invite_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = invite_tokens.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
    )
  );

-- Allow anyone to read non-expired, unused tokens
CREATE POLICY "Anyone can read valid invite tokens" ON invite_tokens
  FOR SELECT USING (
    NOT used AND expires_at > NOW()
  );

-- Allow users to update tokens they created
CREATE POLICY "Users can update their invite tokens" ON invite_tokens
  FOR UPDATE USING (invited_by = auth.uid());

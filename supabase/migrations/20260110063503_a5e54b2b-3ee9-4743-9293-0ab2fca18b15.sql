-- Add 'merged' to the investment_state enum
ALTER TYPE investment_state ADD VALUE IF NOT EXISTS 'merged';

-- Add index for faster queries on multiple investments per user
CREATE INDEX IF NOT EXISTS idx_user_investments_user_state 
ON user_investments(user_id, state);

-- Add index for pending payments lookup
CREATE INDEX IF NOT EXISTS idx_payments_user_status 
ON payments(user_id, status);
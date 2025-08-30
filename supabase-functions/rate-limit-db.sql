-- Create rate limiting table for persistent storage
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  daily_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  daily_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_request TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_client_id ON rate_limits(client_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_daily_reset ON rate_limits(daily_reset);

-- Enable Row Level Security
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage rate limits" ON rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  -- Delete records older than 24 hours
  DELETE FROM rate_limits 
  WHERE updated_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_client_id TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1,
  p_max_daily INTEGER DEFAULT 50
)
RETURNS JSON AS $$
DECLARE
  v_record rate_limits%ROWTYPE;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_daily_start TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_result JSON;
BEGIN
  -- Calculate window boundaries
  v_window_start := v_now - (p_window_minutes || ' minutes')::INTERVAL;
  v_daily_start := DATE_TRUNC('day', v_now);
  
  -- Get or create rate limit record
  SELECT * INTO v_record FROM rate_limits WHERE client_id = p_client_id;
  
  IF NOT FOUND THEN
    -- Create new record
    INSERT INTO rate_limits (client_id, request_count, daily_count, window_start, daily_reset, last_request)
    VALUES (p_client_id, 1, 1, v_now, v_daily_start, v_now)
    RETURNING * INTO v_record;
    
    v_result := json_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'daily_remaining', p_max_daily - 1,
      'reset_time', v_now + (p_window_minutes || ' minutes')::INTERVAL
    );
  ELSE
    -- Reset counters if windows have expired
    IF v_record.window_start < v_window_start THEN
      v_record.request_count := 0;
      v_record.window_start := v_now;
    END IF;
    
    IF v_record.daily_reset < v_daily_start THEN
      v_record.daily_count := 0;
      v_record.daily_reset := v_daily_start;
    END IF;
    
    -- Check limits
    IF v_record.daily_count >= p_max_daily THEN
      v_result := json_build_object(
        'allowed', false,
        'error', 'Daily limit exceeded',
        'reset_time', v_record.daily_reset + INTERVAL '1 day',
        'remaining', 0,
        'daily_remaining', 0
      );
    ELSIF v_record.request_count >= p_max_requests THEN
      v_result := json_build_object(
        'allowed', false,
        'error', 'Rate limit exceeded',
        'reset_time', v_record.window_start + (p_window_minutes || ' minutes')::INTERVAL,
        'remaining', 0,
        'daily_remaining', p_max_daily - v_record.daily_count
      );
    ELSE
      -- Allow request and increment counters
      v_record.request_count := v_record.request_count + 1;
      v_record.daily_count := v_record.daily_count + 1;
      v_record.last_request := v_now;
      v_record.updated_at := v_now;
      
      v_result := json_build_object(
        'allowed', true,
        'remaining', p_max_requests - v_record.request_count,
        'daily_remaining', p_max_daily - v_record.daily_count,
        'reset_time', v_record.window_start + (p_window_minutes || ' minutes')::INTERVAL
      );
    END IF;
    
    -- Update record
    UPDATE rate_limits SET
      request_count = v_record.request_count,
      daily_count = v_record.daily_count,
      window_start = v_record.window_start,
      daily_reset = v_record.daily_reset,
      last_request = v_record.last_request,
      updated_at = v_record.updated_at
    WHERE client_id = p_client_id;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

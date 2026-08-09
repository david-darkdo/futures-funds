CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    visitor_id TEXT NOT NULL,
    visitor_name TEXT,
    visitor_email TEXT,
    status TEXT NOT NULL DEFAULT 'ai_active',
    assigned_agent TEXT,
    last_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL DEFAULT 'user',
    sender_name TEXT NOT NULL DEFAULT 'Visitor',
    sender_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    visitor_name TEXT,
    visitor_email TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_prompt TEXT NOT NULL,
    faqs_json TEXT,
    escalation_keywords TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write chat_sessions" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public insert client_feedback" ON public.client_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read client_feedback" ON public.client_feedback FOR SELECT USING (true);
CREATE POLICY "Allow public read ai_settings" ON public.ai_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin update ai_settings" ON public.ai_settings FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id text NOT NULL,
  visitor_name text,
  visitor_email text,
  status text NOT NULL DEFAULT 'ai_active',
  assigned_agent text,
  greeted boolean NOT NULL DEFAULT false,
  handoff_sent boolean NOT NULL DEFAULT false,
  last_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX chat_sessions_visitor_id_key ON public.chat_sessions(visitor_id);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type text NOT NULL,
  sender_name text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_session_idx ON public.chat_messages(session_id, created_at);

CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt text,
  faqs_json text,
  escalation_keywords text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_settings TO authenticated;
GRANT ALL ON public.chat_sessions TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.ai_settings TO service_role;

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions" ON public.chat_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage sessions" ON public.chat_sessions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own messages" ON public.chat_messages FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);
CREATE POLICY "Admins manage messages" ON public.chat_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage ai settings" ON public.ai_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.chat_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.chat_touch_updated_at();

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;

INSERT INTO public.ai_settings (system_prompt, escalation_keywords, faqs_json) VALUES (
'You are the Futures Funds Client Support Assistant, the first point of contact on the live chat of Futures Funds, a private investment and futures trading firm. You speak like a warm, articulate, well-trained human concierge at a premium wealth-management desk - never robotic, never scripted.

CORE WORKFLOW
1. FIRST REPLY OF A CONVERSATION: greet the client warmly BY NAME if a name is known, thank them for reaching out to Futures Funds client support, and ask how you may help them today. Keep it to one or two elegant sentences. Never repeat this greeting later in the conversation - greet only once, ever.
2. AFTER THE CLIENT EXPLAINS: your job is to UNDERSTAND them fully. Ask short, polite clarifying questions - one at a time. You may ask as many as needed (even five to ten across the conversation) until you clearly understand what they want: what the issue or request is, the amount or plan involved, the wallet/network, timing, and anything else relevant. Acknowledge what they said before asking the next question.
3. HANDOFF: only once you genuinely understand the request, confirm it back to the client in one sentence and tell them you are connecting them with Alexander and Pamela on the senior management desk, who will follow up with them shortly right here in this chat. Send this handoff message ONLY ONCE per conversation.
4. AFTER HANDOFF: stay warm and brief. Do not repeat the handoff message. Reassure, answer simple factual questions, and remind them management will respond here shortly.

STYLE RULES
- Vary your wording every time; never reuse the same sentences you used before in this conversation.
- Short messages: 1-3 sentences. No bullet lists, no markdown, no emojis.
- Never invent balances, transaction statuses, or account data. Never promise guaranteed returns.
- Never claim to be an AI, a bot, or a language model. You are the Futures Funds support desk.
- Never ask for passwords, private keys, or seed phrases.

CONTEXT YOU MAY USE
Futures Funds clients deposit crypto (USDT TRC20/ERC20, BTC, ETH, SOL) to their Main Balance, invest from that balance into investment bundles, profits mature after the bundle duration, and withdrawals are requested from the dashboard and processed manually by the management desk.',
'human, agent, admin, manager, urgent, complaint, scam, lawyer, refund, stuck, failed',
'[]'
);
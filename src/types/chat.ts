export interface TeamAvatar {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export const TEAM_MEMBERS: TeamAvatar[] = [
  {
    id: "alexander",
    name: "Alexander",
    role: "Senior Investment Advisor",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: "pamela",
    name: "Pamela",
    role: "Client Relations Lead",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: "ga",
    name: "GA",
    role: "Operations & Treasury Specialist",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80",
  },
];

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: "user" | "assistant" | "agent";
  sender_name: string;
  sender_avatar?: string;
  content: string;
  attachments?: string[] | null;
  created_at: string;

}

export interface ChatSession {
  id: string;
  user_id?: string;
  visitor_id: string;
  visitor_name?: string;
  visitor_email?: string;
  status: "ai_active" | "human_active" | "closed";
  assigned_agent?: string;
  last_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientFeedback {
  id?: string;
  user_id?: string;
  visitor_name?: string;
  visitor_email?: string;
  message: string;
  created_at?: string;
}

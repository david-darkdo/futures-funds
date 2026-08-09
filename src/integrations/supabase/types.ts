export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          created_at: string
          escalation_keywords: string | null
          faqs_json: string | null
          id: string
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          escalation_keywords?: string | null
          faqs_json?: string | null
          id?: string
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          escalation_keywords?: string | null
          faqs_json?: string | null
          id?: string
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      bundles: {
        Row: {
          active: boolean | null
          created_at: string | null
          daily_growth_rate: number | null
          description: string | null
          features: Json | null
          id: string
          max_invest: number | null
          min_invest: number | null
          name: string
          price_usd: number
          slug: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          daily_growth_rate?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          max_invest?: number | null
          min_invest?: number | null
          name: string
          price_usd: number
          slug: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          daily_growth_rate?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          max_invest?: number | null
          min_invest?: number | null
          name?: string
          price_usd?: number
          slug?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_name: string | null
          sender_type: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_name?: string | null
          sender_type: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_name?: string | null
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          assigned_agent: string | null
          created_at: string
          greeted: boolean
          handoff_sent: boolean
          id: string
          last_message: string | null
          status: string
          updated_at: string
          user_id: string | null
          visitor_email: string | null
          visitor_id: string
          visitor_name: string | null
        }
        Insert: {
          assigned_agent?: string | null
          created_at?: string
          greeted?: boolean
          handoff_sent?: boolean
          id?: string
          last_message?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_id: string
          visitor_name?: string | null
        }
        Update: {
          assigned_agent?: string | null
          created_at?: string
          greeted?: boolean
          handoff_sent?: boolean
          id?: string
          last_message?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_id?: string
          visitor_name?: string | null
        }
        Relationships: []
      }
      client_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      demo_investments: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          initial_amount: number
          user_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          initial_amount?: number
          user_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          initial_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_investments_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_growth_logs: {
        Row: {
          admin_id: string
          admin_note: string | null
          balance_after: number
          balance_before: number
          change_type: string
          created_at: string
          id: string
          investment_id: string
          percentage_change: number
        }
        Insert: {
          admin_id: string
          admin_note?: string | null
          balance_after: number
          balance_before: number
          change_type: string
          created_at?: string
          id?: string
          investment_id: string
          percentage_change: number
        }
        Update: {
          admin_id?: string
          admin_note?: string | null
          balance_after?: number
          balance_before?: number
          change_type?: string
          created_at?: string
          id?: string
          investment_id?: string
          percentage_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "investment_growth_logs_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "user_investments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_id: string | null
          admin_note: string | null
          amount_usd: number | null
          bundle_id: string | null
          created_at: string | null
          crypto_amount: number | null
          crypto_currency: string | null
          id: string
          proof_url: string | null
          status: string | null
          txid: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_note?: string | null
          amount_usd?: number | null
          bundle_id?: string | null
          created_at?: string | null
          crypto_amount?: number | null
          crypto_currency?: string | null
          id?: string
          proof_url?: string | null
          status?: string | null
          txid?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_note?: string | null
          amount_usd?: number | null
          bundle_id?: string | null
          created_at?: string | null
          crypto_amount?: number | null
          crypto_currency?: string | null
          id?: string
          proof_url?: string | null
          status?: string | null
          txid?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          investing_frozen: boolean
          language: string
          last_login_at: string | null
          main_balance: number
          profit_balance: number
          status: string | null
          theme: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          investing_frozen?: boolean
          language?: string
          last_login_at?: string | null
          main_balance?: number
          profit_balance?: number
          status?: string | null
          theme?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          investing_frozen?: boolean
          language?: string
          last_login_at?: string | null
          main_balance?: number
          profit_balance?: number
          status?: string | null
          theme?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          investment_id: string | null
          percentage_change: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          investment_id?: string | null
          percentage_change?: number | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          investment_id?: string | null
          percentage_change?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "user_investments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_investments: {
        Row: {
          admin_note: string | null
          bundle_id: string
          completed_at: string | null
          created_at: string
          current_value: number
          growth_percentage: number
          id: string
          initial_amount: number
          last_updated_by: string | null
          matures_at: string | null
          payment_id: string | null
          state: Database["public"]["Enums"]["investment_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          bundle_id: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          growth_percentage?: number
          id?: string
          initial_amount?: number
          last_updated_by?: string | null
          matures_at?: string | null
          payment_id?: string | null
          state?: Database["public"]["Enums"]["investment_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          bundle_id?: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          growth_percentage?: number
          id?: string
          initial_amount?: number
          last_updated_by?: string | null
          matures_at?: string | null
          payment_id?: string | null
          state?: Database["public"]["Enums"]["investment_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          active: boolean | null
          address: string
          created_at: string | null
          currency: string
          id: string
          label: string | null
          network: string
        }
        Insert: {
          active?: boolean | null
          address: string
          created_at?: string | null
          currency: string
          id?: string
          label?: string | null
          network: string
        }
        Update: {
          active?: boolean | null
          address?: string
          created_at?: string | null
          currency?: string
          id?: string
          label?: string | null
          network?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_id: string | null
          admin_note: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          network: string
          status: string
          txid: string | null
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_id?: string | null
          admin_note?: string | null
          amount: number
          created_at?: string
          currency: string
          id?: string
          network: string
          status?: string
          txid?: string | null
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          admin_id?: string | null
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          network?: string
          status?: string
          txid?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_matured_investments: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invest_from_balance: {
        Args: { _amount: number; _bundle_id: string }
        Returns: string
      }
      mask_email: { Args: { email: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
      investment_state:
        | "no_investment"
        | "pending_payment"
        | "active"
        | "paused"
        | "completed"
        | "merged"
      transaction_type: "deposit" | "growth" | "drawdown" | "withdrawal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      investment_state: [
        "no_investment",
        "pending_payment",
        "active",
        "paused",
        "completed",
        "merged",
      ],
      transaction_type: ["deposit", "growth", "drawdown", "withdrawal"],
    },
  },
} as const

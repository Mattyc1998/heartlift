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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      conversation_analyses: {
        Row: {
          analysis_date: string
          conversation_text: string
          created_at: string
          emotional_tone: Json | null
          id: string
          miscommunication_patterns: Json | null
          suggestions: Json | null
          user_id: string
        }
        Insert: {
          analysis_date?: string
          conversation_text: string
          created_at?: string
          emotional_tone?: Json | null
          id?: string
          miscommunication_patterns?: Json | null
          suggestions?: Json | null
          user_id: string
        }
        Update: {
          analysis_date?: string
          conversation_text?: string
          created_at?: string
          emotional_tone?: Json | null
          id?: string
          miscommunication_patterns?: Json | null
          suggestions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_history: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          message_content: string
          sender: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          message_content: string
          sender: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          message_content?: string
          sender?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_affirmations: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          text: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          text: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          text?: string
        }
        Relationships: []
      }
      guided_program_modules: {
        Row: {
          created_at: string
          id: string
          module_number: number
          program_id: string
          reflection_prompt: string
          teaching_content: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_number: number
          program_id: string
          reflection_prompt: string
          teaching_content: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          module_number?: number
          program_id?: string
          reflection_prompt?: string
          teaching_content?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "guided_program_modules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "guided_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      guided_programs: {
        Row: {
          created_at: string
          description: string
          emoji: string | null
          id: string
          program_key: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          emoji?: string | null
          id?: string
          program_key: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          emoji?: string | null
          id?: string
          program_key?: string
          title?: string
        }
        Relationships: []
      }
      healing_kit_purchases: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          purchased_at: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          purchased_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          purchased_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      healing_plan_days: {
        Row: {
          action_item: string | null
          challenge: string | null
          content: string
          created_at: string | null
          day_number: number
          id: string
          mindset_reframe: string | null
          prompt: string | null
          title: string
        }
        Insert: {
          action_item?: string | null
          challenge?: string | null
          content: string
          created_at?: string | null
          day_number: number
          id?: string
          mindset_reframe?: string | null
          prompt?: string | null
          title: string
        }
        Update: {
          action_item?: string | null
          challenge?: string | null
          content?: string
          created_at?: string | null
          day_number?: number
          id?: string
          mindset_reframe?: string | null
          prompt?: string | null
          title?: string
        }
        Relationships: []
      }
      journal_prompts: {
        Row: {
          category: string | null
          created_at: string | null
          emotional_theme: string | null
          id: string
          prompt: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          emotional_theme?: string | null
          id?: string
          prompt: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          emotional_theme?: string | null
          id?: string
          prompt?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          message_received: string | null
          mood_emoji: string
          mood_label: string
          mood_level: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          message_received?: string | null
          mood_emoji: string
          mood_label: string
          mood_level: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          message_received?: string | null
          mood_emoji?: string
          mood_label?: string
          mood_level?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_features_usage: {
        Row: {
          created_at: string
          feature_name: string
          id: string
          last_used: string | null
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          id?: string
          last_used?: string | null
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          id?: string
          last_used?: string | null
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email_address: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_address?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_address?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recovery_milestones: {
        Row: {
          badge_name: string | null
          celebration_message: string | null
          created_at: string | null
          day_number: number
          description: string | null
          id: string
          reward_content: Json | null
          reward_description: string | null
          reward_type: string | null
          title: string
          unlock_message: string | null
        }
        Insert: {
          badge_name?: string | null
          celebration_message?: string | null
          created_at?: string | null
          day_number: number
          description?: string | null
          id?: string
          reward_content?: Json | null
          reward_description?: string | null
          reward_type?: string | null
          title: string
          unlock_message?: string | null
        }
        Update: {
          badge_name?: string | null
          celebration_message?: string | null
          created_at?: string | null
          day_number?: number
          description?: string | null
          id?: string
          reward_content?: Json | null
          reward_description?: string | null
          reward_type?: string | null
          title?: string
          unlock_message?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          last_used_premium_feature: string | null
          payment_status: string | null
          plan_type: string | null
          premium_start_date: string | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_used_premium_feature?: string | null
          payment_status?: string | null
          plan_type?: string | null
          premium_start_date?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_used_premium_feature?: string | null
          payment_status?: string | null
          plan_type?: string | null
          premium_start_date?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_attachment_results: {
        Row: {
          attachment_style: string
          coping_techniques: Json | null
          created_at: string
          detailed_breakdown: Json | null
          healing_path: string | null
          id: string
          quiz_date: string
          triggers: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_style: string
          coping_techniques?: Json | null
          created_at?: string
          detailed_breakdown?: Json | null
          healing_path?: string | null
          id?: string
          quiz_date?: string
          triggers?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_style?: string
          coping_techniques?: Json | null
          created_at?: string
          detailed_breakdown?: Json | null
          healing_path?: string | null
          id?: string
          quiz_date?: string
          triggers?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_guided_program_progress: {
        Row: {
          completed_at: string | null
          completed_modules: number[] | null
          created_at: string
          current_module: number | null
          id: string
          program_completed: boolean | null
          program_id: string
          reflection_answers: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_modules?: number[] | null
          created_at?: string
          current_module?: number | null
          id?: string
          program_completed?: boolean | null
          program_id: string
          reflection_answers?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_modules?: number[] | null
          created_at?: string
          current_module?: number | null
          id?: string
          program_completed?: boolean | null
          program_id?: string
          reflection_answers?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_guided_program_progress_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "guided_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_healing_progress: {
        Row: {
          completed_days: number[] | null
          completed_milestones: number[] | null
          created_at: string | null
          current_day: number | null
          id: string
          journal_entries: Json | null
          last_contact_date: string | null
          no_contact_start_date: string | null
          no_contact_streak_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_days?: number[] | null
          completed_milestones?: number[] | null
          created_at?: string | null
          current_day?: number | null
          id?: string
          journal_entries?: Json | null
          last_contact_date?: string | null
          no_contact_start_date?: string | null
          no_contact_streak_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_days?: number[] | null
          completed_milestones?: number[] | null
          created_at?: string | null
          current_day?: number | null
          id?: string
          journal_entries?: Json | null
          last_contact_date?: string | null
          no_contact_start_date?: string | null
          no_contact_streak_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_insights_reports: {
        Row: {
          analysis_period_end: string | null
          analysis_period_start: string | null
          attachment_style: string | null
          conversation_count: number | null
          created_at: string
          healing_progress_score: number | null
          id: string
          insights: Json
          key_patterns: Json | null
          mood_entries_analyzed: number | null
          recommendations: Json | null
          report_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          attachment_style?: string | null
          conversation_count?: number | null
          created_at?: string
          healing_progress_score?: number | null
          id?: string
          insights?: Json
          key_patterns?: Json | null
          mood_entries_analyzed?: number | null
          recommendations?: Json | null
          report_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          attachment_style?: string | null
          conversation_count?: number | null
          created_at?: string
          healing_progress_score?: number | null
          id?: string
          insights?: Json
          key_patterns?: Json | null
          mood_entries_analyzed?: number | null
          recommendations?: Json | null
          report_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_milestone_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          milestone_id: string
          reward_claimed: boolean | null
          reward_claimed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_id: string
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_id?: string
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestone_progress_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "recovery_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_usage: {
        Row: {
          coach_id: string | null
          created_at: string
          date: string
          id: string
          last_message_at: string | null
          message_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          date?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          date?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_visualisation_progress: {
        Row: {
          completed_at: string
          created_at: string
          exercise_id: string
          id: string
          reflection_notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          exercise_id: string
          id?: string
          reflection_notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          exercise_id?: string
          id?: string
          reflection_notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_visualisation_progress_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "visualisation_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          created_at: string
          email_address: string | null
          id: number
          Name: string | null
        }
        Insert: {
          created_at?: string
          email_address?: string | null
          id?: number
          Name?: string | null
        }
        Update: {
          created_at?: string
          email_address?: string | null
          id?: number
          Name?: string | null
        }
        Relationships: []
      }
      visualisation_exercises: {
        Row: {
          category: string
          created_at: string
          description: string
          duration_minutes: number
          id: string
          reflection_prompts: string[]
          steps: string[]
          title: string
          updated_at: string
          variation_number: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          duration_minutes?: number
          id?: string
          reflection_prompts: string[]
          steps: string[]
          title: string
          updated_at?: string
          variation_number?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          reflection_prompts?: string[]
          steps?: string[]
          title?: string
          updated_at?: string
          variation_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_daily_usage: {
        Args: { coach_id?: string; user_uuid: string }
        Returns: {
          can_send_message: boolean
          hours_until_reset: number
          last_message_at: string
          message_count: number
        }[]
      }
      increment_user_usage: {
        Args: { input_coach_id?: string; user_uuid: string }
        Returns: boolean
      }
      track_premium_feature_usage: {
        Args: { feature_name: string; user_uuid: string }
        Returns: undefined
      }
      user_has_healing_kit: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      user_has_premium_access: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

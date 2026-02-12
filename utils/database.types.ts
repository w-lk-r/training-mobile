export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          category: string | null
          created_at: string | null
          deleted: boolean | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      max_lifts: {
        Row: {
          created_at: string | null
          date_recorded: string | null
          deleted: boolean | null
          exercise_id: string
          id: string
          updated_at: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          date_recorded?: string | null
          deleted?: boolean | null
          exercise_id: string
          id?: string
          updated_at?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          date_recorded?: string | null
          deleted?: boolean | null
          exercise_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "max_lifts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      program_weeks: {
        Row: {
          created_at: string | null
          deleted: boolean | null
          id: string
          program_id: string
          updated_at: string | null
          user_id: string
          week_number: number
        }
        Insert: {
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          program_id: string
          updated_at?: string | null
          user_id: string
          week_number: number
        }
        Update: {
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          program_id?: string
          updated_at?: string | null
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string | null
          current_week: number | null
          deleted: boolean | null
          description: string | null
          id: string
          name: string
          program_type: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string
          weeks_count: number | null
          wizard_config: Json | null
        }
        Insert: {
          created_at?: string | null
          current_week?: number | null
          deleted?: boolean | null
          description?: string | null
          id?: string
          name: string
          program_type?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
          weeks_count?: number | null
          wizard_config?: Json | null
        }
        Update: {
          created_at?: string | null
          current_week?: number | null
          deleted?: boolean | null
          description?: string | null
          id?: string
          name?: string
          program_type?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
          weeks_count?: number | null
          wizard_config?: Json | null
        }
        Relationships: []
      }
      session_workout_days: {
        Row: {
          created_at: string | null
          deleted: boolean | null
          id: string
          session_id: string
          sort_order: number
          updated_at: string | null
          user_id: string
          workout_day_id: string
        }
        Insert: {
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          session_id: string
          sort_order?: number
          updated_at?: string | null
          user_id: string
          workout_day_id: string
        }
        Update: {
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          session_id?: string
          sort_order?: number
          updated_at?: string | null
          user_id?: string
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_workout_days_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_workout_days_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          created_at: string | null
          deleted: boolean | null
          exercise_id: string
          id: string
          reps_completed: number
          rpe: number | null
          updated_at: string | null
          user_id: string
          weight_kg: number
          workout_session_id: string
          workout_set_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted?: boolean | null
          exercise_id: string
          id?: string
          reps_completed: number
          rpe?: number | null
          updated_at?: string | null
          user_id: string
          weight_kg: number
          workout_session_id: string
          workout_set_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted?: boolean | null
          exercise_id?: string
          id?: string
          reps_completed?: number
          rpe?: number | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number
          workout_session_id?: string
          workout_set_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_workout_set_id_fkey"
            columns: ["workout_set_id"]
            isOneToOne: false
            referencedRelation: "workout_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      template_items: {
        Row: {
          created_at: string | null
          deleted: boolean | null
          exercise_id: string
          id: string
          percentage_of_max: number | null
          reps: number
          rpe: number | null
          sort_order: number
          template_id: string
          updated_at: string | null
          user_id: string
          workout_day_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted?: boolean | null
          exercise_id: string
          id?: string
          percentage_of_max?: number | null
          reps: number
          rpe?: number | null
          sort_order?: number
          template_id: string
          updated_at?: string | null
          user_id: string
          workout_day_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted?: boolean | null
          exercise_id?: string
          id?: string
          percentage_of_max?: number | null
          reps?: number
          rpe?: number | null
          sort_order?: number
          template_id?: string
          updated_at?: string | null
          user_id?: string
          workout_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_days: {
        Row: {
          created_at: string | null
          day_number: number
          deleted: boolean | null
          id: string
          name: string | null
          program_week_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_number: number
          deleted?: boolean | null
          id?: string
          name?: string | null
          program_week_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_number?: number
          deleted?: boolean | null
          id?: string
          name?: string | null
          program_week_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_program_week_id_fkey"
            columns: ["program_week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          deleted: boolean | null
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          created_at: string | null
          deleted: boolean | null
          exercise_id: string
          id: string
          percentage_of_max: number | null
          reps: number
          rpe: number | null
          set_number: number
          updated_at: string | null
          user_id: string
          workout_day_id: string
        }
        Insert: {
          created_at?: string | null
          deleted?: boolean | null
          exercise_id: string
          id?: string
          percentage_of_max?: number | null
          reps: number
          rpe?: number | null
          set_number: number
          updated_at?: string | null
          user_id: string
          workout_day_id: string
        }
        Update: {
          created_at?: string | null
          deleted?: boolean | null
          exercise_id?: string
          id?: string
          percentage_of_max?: number | null
          reps?: number
          rpe?: number | null
          set_number?: number
          updated_at?: string | null
          user_id?: string
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string | null
          deleted: boolean | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const


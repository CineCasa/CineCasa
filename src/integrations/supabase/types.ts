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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cinema: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: number
          poster: string | null
          rating: string | null
          titulo: string
          tmdb_id: string | null
          trailer: string | null
          type: string | null
          url: string | null
          year: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: never
          poster?: string | null
          rating?: string | null
          titulo: string
          tmdb_id?: string | null
          trailer?: string | null
          type?: string | null
          url?: string | null
          year?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: never
          poster?: string | null
          rating?: string | null
          titulo?: string
          tmdb_id?: string | null
          trailer?: string | null
          type?: string | null
          url?: string | null
          year?: string | null
        }
        Relationships: []
      }
      filmes_kids: {
        Row: {
          created_at: string | null
          description: string | null
          genero: string | null
          id: number
          poster: string | null
          rating: string | null
          titulo: string
          type: string | null
          url: string | null
          year: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          genero?: string | null
          id?: never
          poster?: string | null
          rating?: string | null
          titulo: string
          type?: string | null
          url?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          genero?: string | null
          id?: never
          poster?: string | null
          rating?: string | null
          titulo?: string
          type?: string | null
          url?: string | null
          year?: string | null
        }
        Relationships: []
      }
      series: {
        Row: {
          created_at: string | null
          id: number
          identificador_archive: string | null
          titulo: string
          tmdb_id: string | null
          trailer: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          identificador_archive?: string | null
          titulo: string
          tmdb_id?: string | null
          trailer?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          identificador_archive?: string | null
          titulo?: string
          tmdb_id?: string | null
          trailer?: string | null
          type?: string | null
        }
        Relationships: []
      }
      series_kids: {
        Row: {
          created_at: string | null
          description: string | null
          genero: string | null
          id: number
          identificador_archive: string | null
          poster: string | null
          rating: string | null
          titulo: string
          type: string | null
          year: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          genero?: string | null
          id?: never
          identificador_archive?: string | null
          poster?: string | null
          rating?: string | null
          titulo: string
          type?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          genero?: string | null
          id?: never
          identificador_archive?: string | null
          poster?: string | null
          rating?: string | null
          titulo?: string
          type?: string | null
          year?: string | null
        }
        Relationships: []
      }
      tv_ao_vivo: {
        Row: {
          created_at: string | null
          grupo: string | null
          id: number
          logo: string | null
          nome: string
          url: string
        }
        Insert: {
          created_at?: string | null
          grupo?: string | null
          id?: never
          logo?: string | null
          nome: string
          url: string
        }
        Update: {
          created_at?: string | null
          grupo?: string | null
          id?: never
          logo?: string | null
          nome?: string
          url?: string
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
  public: {
    Enums: {},
  },
} as const

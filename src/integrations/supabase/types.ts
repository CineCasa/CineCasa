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
      series: {
        Row: {
          id_n: number
          tmdb_id: string | null
          titulo: string
          descricao: string | null
          ano: string | null
          capa: string | null
          banner: string | null
          trailer: string | null
          genero: string | null
        }
        Insert: {
          id_n?: number
          tmdb_id?: string | null
          titulo: string
          descricao?: string | null
          ano?: string | null
          capa?: string | null
          banner?: string | null
          trailer?: string | null
          genero?: string | null
        }
        Update: {
          id_n?: number
          tmdb_id?: string | null
          titulo?: string
          descricao?: string | null
          ano?: string | null
          capa?: string | null
          banner?: string | null
          trailer?: string | null
          genero?: string | null
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
      profiles: {
        Row: {
          approved: boolean | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          plan: string | null
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          email?: string | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          plan?: string | null
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          plan?: string | null
          updated_at?: string | null
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
      tmdb_low_rated_cache: {
        Row: {
          id: string
          data: Json | null
          updated_at: string | null
        }
        Insert: {
          id: string
          data?: Json | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      episodios: {
        Row: {
          id_n: number
          temporada_id: number
          numero_episodio: number
          titulo: string
          descricao: string | null
          duracao: string | null
          arquivo: string | null
          imagem_185: string | null
          imagem_342: string | null
          imagem_500: string | null
          banner: string | null
          trailer: string | null
        }
        Insert: {
          id_n?: number
          temporada_id: number
          numero_episodio: number
          titulo: string
          descricao?: string | null
          duracao?: string | null
          arquivo?: string | null
          imagem_185?: string | null
          imagem_342?: string | null
          imagem_500?: string | null
          banner?: string | null
          trailer?: string | null
        }
        Update: {
          id_n?: number
          temporada_id?: number
          numero_episodio?: number
          titulo?: string
          descricao?: string | null
          duracao?: string | null
          arquivo?: string | null
          imagem_185?: string | null
          imagem_342?: string | null
          imagem_500?: string | null
          banner?: string | null
          trailer?: string | null
        }
        Relationships: []
      }
      temporadas: {
        Row: {
          id_n: number
          serie_id: number
          numero_temporada: number
          titulo: string | null
          capa: string | null
          banner: string | null
        }
        Insert: {
          id_n?: number
          serie_id: number
          numero_temporada: number
          titulo?: string | null
          capa?: string | null
          banner?: string | null
        }
        Update: {
          id_n?: number
          serie_id?: number
          numero_temporada?: number
          titulo?: string | null
          capa?: string | null
          banner?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          content_id: number
          content_type: string
          titulo: string | null
          poster: string | null
          banner: string | null
          rating: string | null
          year: string | null
          genero: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          content_id: number
          content_type: string
          titulo?: string | null
          poster?: string | null
          banner?: string | null
          rating?: string | null
          year?: string | null
          genero?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: number
          content_type?: string
          titulo?: string | null
          poster?: string | null
          banner?: string | null
          rating?: string | null
          year?: string | null
          genero?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      watch_progress: {
        Row: {
          id: string
          user_id: string
          content_type: string
          cinema_id: number | null
          serie_id: number | null
          episodio_id: number | null
          season_number: number | null
          current_time: number
          duration: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: string
          cinema_id?: number | null
          serie_id?: number | null
          episodio_id?: number | null
          season_number?: number | null
          current_time: number
          duration: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: string
          cinema_id?: number | null
          serie_id?: number | null
          episodio_id?: number | null
          season_number?: number | null
          current_time?: number
          duration?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      watch_history: {
        Row: {
          id: string
          profile_id: string
          content_id: string
          content_type: string
          titulo: string
          poster: string | null
          progress: number
          duration: number
          last_watched: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          content_id: string
          content_type?: string
          titulo?: string
          poster?: string | null
          progress?: number
          duration?: number
          last_watched?: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          content_id?: string
          content_type?: string
          titulo?: string
          poster?: string | null
          progress?: number
          duration?: number
          last_watched?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ratings: {
        Row: {
          id: string
          user_id: string
          content_id: string
          content_type: string
          titulo: string
          poster: string | null
          banner: string | null
          rating: string
          rating_type: 'like' | 'dislike'
          rating_value: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          content_type: string
          titulo: string
          poster?: string | null
          banner?: string | null
          rating: string
          rating_type: 'like' | 'dislike'
          rating_value?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          content_type?: string
          titulo?: string
          poster?: string | null
          banner?: string | null
          rating?: string
          rating_type?: 'like' | 'dislike'
          rating_value?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          content_id: string
          content_type: string
          current_time: number
          progress: number
          duration: number
          last_watched: string
          episode_id: string | null
          season_number: number | null
          episode_number: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          content_type: string
          current_time?: number
          progress?: number
          duration?: number
          last_watched?: string
          episode_id?: string | null
          season_number?: number | null
          episode_number?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          content_type?: string
          current_time?: number
          progress?: number
          duration?: number
          last_watched?: string
          episode_id?: string | null
          season_number?: number | null
          episode_number?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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

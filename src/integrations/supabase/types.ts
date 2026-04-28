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
          progress_pct: number
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
          progress_pct?: number
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
          progress_pct?: number
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
      user_genre_preferences: {
        Row: {
          id: number
          user_id: string
          genre: string
          score: number
          updated_at: string | null
        }
        Insert: {
          id?: never
          user_id: string
          genre: string
          score?: number
          updated_at?: string | null
        }
        Update: {
          id?: never
          user_id?: string
          genre?: string
          score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_genre_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_devices: {
        Row: {
          id: string
          user_id: string
          device_id: string
          device_name: string | null
          device_type: string | null
          location: string | null
          last_active: string | null
          is_current: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          ip_address: string | null
          user_agent: string | null
          os: string | null
          browser: string | null
          screen_resolution: string | null
          timezone: string | null
          language: string | null
          fingerprint: string | null
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          device_name?: string | null
          device_type?: string | null
          location?: string | null
          last_active?: string | null
          is_current?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          os?: string | null
          browser?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          language?: string | null
          fingerprint?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          location?: string | null
          last_active?: string | null
          is_current?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          os?: string | null
          browser?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          language?: string | null
          fingerprint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
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
          rating: number | null
          review: string | null
          created_at: string | null
          updated_at: string | null
          helpful_count: number | null
          contains_spoilers: boolean | null
          status: string | null
          metadata: Json | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          content_type: string
          rating?: number | null
          review?: string | null
          created_at?: string | null
          updated_at?: string | null
          helpful_count?: number | null
          contains_spoilers?: boolean | null
          status?: string | null
          metadata?: Json | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          content_type?: string
          rating?: number | null
          review?: string | null
          created_at?: string | null
          updated_at?: string | null
          helpful_count?: number | null
          contains_spoilers?: boolean | null
          status?: string | null
          metadata?: Json | null
          deleted_at?: string | null
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
      genre_weights: {
        Row: {
          id: number
          genre: string
          weight: number
          retention_rate: number | null
          abandonment_rate: number | null
          avg_rating: number | null
          total_interactions: number | null
          last_calculated_at: string | null
          created_at: string | null
          updated_at: string | null
          completion_rate: number | null
          trending_score: number | null
          growth_rate: number | null
          engagement_score: number | null
          avg_watch_time: number | null
          metadata: Json | null
          popularity_score: number | null
          quality_score: number | null
          total_ratings: number | null
          avg_user_rating: number | null
        }
        Insert: {
          id?: never
          genre: string
          weight?: number
          retention_rate?: number | null
          abandonment_rate?: number | null
          avg_rating?: number | null
          total_interactions?: number | null
          last_calculated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          completion_rate?: number | null
          trending_score?: number | null
          growth_rate?: number | null
          engagement_score?: number | null
          avg_watch_time?: number | null
          metadata?: Json | null
          popularity_score?: number | null
          quality_score?: number | null
          total_ratings?: number | null
          avg_user_rating?: number | null
        }
        Update: {
          id?: never
          genre?: string
          weight?: number
          retention_rate?: number | null
          abandonment_rate?: number | null
          avg_rating?: number | null
          total_interactions?: number | null
          last_calculated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          completion_rate?: number | null
          trending_score?: number | null
          growth_rate?: number | null
          engagement_score?: number | null
          avg_watch_time?: number | null
          metadata?: Json | null
          popularity_score?: number | null
          quality_score?: number | null
          total_ratings?: number | null
          avg_user_rating?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_genre_preferences: {
        Args: {
          p_user_id: string
          p_genres: string[]
          p_score_delta: number
        }
        Returns: undefined
      }
      get_user_favorite_genres: {
        Args: {
          p_user_id: string
          p_limit?: number
        }
        Returns: {
          genre: string
          score: number
        }[]
      }
      get_content_by_genre_preferences: {
        Args: {
          p_user_id: string
          p_content_type?: string
          p_limit?: number
          p_exclude_watched?: boolean
        }
        Returns: {
          id: number
          content_type: string
          title: string
          poster: string
          year: string
          rating: string
          genre: string
          genre_match_score: number
        }[]
      }
      reset_genre_preferences: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      register_device: {
        Args: {
          p_user_id: string
          p_device_id: string
          p_device_name: string | null
          p_device_type: string | null
          p_location: string | null
          p_ip_address: string | null
          p_user_agent: string | null
          p_os: string | null
          p_browser: string | null
          p_screen_resolution: string | null
          p_timezone: string | null
          p_language: string | null
          p_fingerprint: string | null
        }
        Returns: string
      }
      update_device_activity: {
        Args: {
          p_device_id: string
          p_user_id: string | null
        }
        Returns: boolean
      }
      get_user_devices: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          device_id: string
          device_name: string | null
          device_type: string | null
          location: string | null
          last_active: string | null
          is_current: boolean | null
          is_active: boolean | null
          created_at: string | null
          ip_address: string | null
          os: string | null
          browser: string | null
          screen_resolution: string | null
          timezone: string | null
        }[]
      }
      remove_device: {
        Args: {
          p_device_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      mark_current_device: {
        Args: {
          p_device_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      logout_other_devices: {
        Args: {
          p_current_device_id: string
          p_user_id: string
        }
        Returns: number
      }
      count_active_devices: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      create_or_update_rating: {
        Args: {
          p_user_id: string
          p_content_id: string
          p_content_type: string
          p_rating: number
          p_review?: string
          p_contains_spoilers?: boolean
        }
        Returns: string
      }
      delete_rating: {
        Args: {
          p_user_id: string
          p_content_id: string
        }
        Returns: boolean
      }
      get_user_rating: {
        Args: {
          p_user_id: string
          p_content_id: string
        }
        Returns: {
          id: string
          rating: number
          review: string | null
          contains_spoilers: boolean
          created_at: string
          updated_at: string
        }[]
      }
      get_content_average_rating: {
        Args: {
          p_content_id: string
        }
        Returns: {
          average_rating: number
          total_reviews: number
          rating_1_count: number
          rating_2_count: number
          rating_3_count: number
          rating_4_count: number
          rating_5_count: number
        }[]
      }
      get_content_reviews: {
        Args: {
          p_content_id: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          user_id: string
          rating: number
          review: string | null
          contains_spoilers: boolean
          helpful_count: number
          created_at: string
          username: string | null
          avatar_url: string | null
        }[]
      }
      get_user_recent_ratings: {
        Args: {
          p_user_id: string
          p_limit?: number
        }
        Returns: {
          id: string
          content_id: string
          content_type: string
          rating: number
          review: string | null
          created_at: string
        }[]
      }
      get_top_rated_contents: {
        Args: {
          p_content_type?: string
          p_limit?: number
          p_min_reviews?: number
        }
        Returns: {
          content_id: string
          content_type: string
          average_rating: number
          total_reviews: number
        }[]
      }
      increment_helpful_count: {
        Args: {
          p_rating_id: string
        }
        Returns: boolean
      }
      count_user_ratings: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      calculate_genre_weight: {
        Args: {
          p_retention?: number
          p_abandon?: number
          p_rating?: number
          p_interactions?: number
          p_completion?: number
          p_engagement?: number
        }
        Returns: number
      }
      update_genre_metrics: {
        Args: {
          p_genre: string
        }
        Returns: boolean
      }
      recalculate_all_genre_weights: {
        Args: Record<string, never>
        Returns: {
          genre: string
          weight: number
        }[]
      }
      get_trending_genres: {
        Args: {
          p_limit?: number
        }
        Returns: {
          genre: string
          weight: number
          trending_score: number
          engagement_score: number
        }[]
      }
      get_personalized_genres: {
        Args: {
          p_user_id: string
          p_limit?: number
        }
        Returns: {
          genre: string
          user_score: number
          global_weight: number
          combined_score: number
        }[]
      }
      calculate_content_recommendation_score: {
        Args: {
          p_content_id: string
          p_user_id: string
        }
        Returns: number
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

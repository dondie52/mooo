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
      alerts: {
        Row: {
          alert_id: string
          alert_type: Database["public"]["Enums"]["alert_type"]
          animal_id: string | null
          created_at: string
          email_sent: boolean
          is_read: boolean
          message: string
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          user_id: string
        }
        Insert: {
          alert_id?: string
          alert_type: Database["public"]["Enums"]["alert_type"]
          animal_id?: string | null
          created_at?: string
          email_sent?: boolean
          is_read?: boolean
          message?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          user_id: string
        }
        Update: {
          alert_id?: string
          alert_type?: Database["public"]["Enums"]["alert_type"]
          animal_id?: string | null
          created_at?: string
          email_sent?: boolean
          is_read?: boolean
          message?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          acquired_date: string
          acquired_how: Database["public"]["Enums"]["acquired_how"]
          animal_id: string
          animal_type: Database["public"]["Enums"]["animal_type"]
          breed: string
          colour: string | null
          created_at: string
          date_of_birth: string | null
          gender: Database["public"]["Enums"]["gender"]
          lits_tag: string | null
          location: string | null
          notes: string | null
          owner_id: string
          status: Database["public"]["Enums"]["animal_status"]
          tag_number: string
          updated_at: string
        }
        Insert: {
          acquired_date?: string
          acquired_how?: Database["public"]["Enums"]["acquired_how"]
          animal_id?: string
          animal_type?: Database["public"]["Enums"]["animal_type"]
          breed?: string
          colour?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender: Database["public"]["Enums"]["gender"]
          lits_tag?: string | null
          location?: string | null
          notes?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["animal_status"]
          tag_number: string
          updated_at?: string
        }
        Update: {
          acquired_date?: string
          acquired_how?: Database["public"]["Enums"]["acquired_how"]
          animal_id?: string
          animal_type?: Database["public"]["Enums"]["animal_type"]
          breed?: string
          colour?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: Database["public"]["Enums"]["gender"]
          lits_tag?: string | null
          location?: string | null
          notes?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["animal_status"]
          tag_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "animals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          log_id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          log_id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          log_id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      breeding_records: {
        Row: {
          animal_id: string
          breeding_id: string
          created_at: string
          event_date: string
          event_type: Database["public"]["Enums"]["breeding_event_type"]
          logged_by: string
          mate_tag: string | null
          notes: string | null
          sire_breed: string | null
        }
        Insert: {
          animal_id: string
          breeding_id?: string
          created_at?: string
          event_date?: string
          event_type: Database["public"]["Enums"]["breeding_event_type"]
          logged_by: string
          mate_tag?: string | null
          notes?: string | null
          sire_breed?: string | null
        }
        Update: {
          animal_id?: string
          breeding_id?: string
          created_at?: string
          event_date?: string
          event_type?: Database["public"]["Enums"]["breeding_event_type"]
          logged_by?: string
          mate_tag?: string | null
          notes?: string | null
          sire_breed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breeding_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "breeding_records_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_events: {
        Row: {
          animal_id: string
          condition_name: string | null
          created_at: string
          event_date: string
          event_id: string
          event_type: Database["public"]["Enums"]["event_type"]
          followup_date: string | null
          logged_by: string
          notes: string | null
          outcome: Database["public"]["Enums"]["outcome"] | null
          severity: Database["public"]["Enums"]["severity"] | null
          symptoms: string | null
          treatment_given: string | null
          vet_name: string | null
        }
        Insert: {
          animal_id: string
          condition_name?: string | null
          created_at?: string
          event_date?: string
          event_id?: string
          event_type: Database["public"]["Enums"]["event_type"]
          followup_date?: string | null
          logged_by: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["outcome"] | null
          severity?: Database["public"]["Enums"]["severity"] | null
          symptoms?: string | null
          treatment_given?: string | null
          vet_name?: string | null
        }
        Update: {
          animal_id?: string
          condition_name?: string | null
          created_at?: string
          event_date?: string
          event_id?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          followup_date?: string | null
          logged_by?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["outcome"] | null
          severity?: Database["public"]["Enums"]["severity"] | null
          symptoms?: string | null
          treatment_given?: string | null
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "health_events_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          animal_id: string
          created_at: string
          from_location: string | null
          logged_by: string
          movement_date: string
          movement_id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          permit_number: string | null
          to_location: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          from_location?: string | null
          logged_by: string
          movement_date?: string
          movement_id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          permit_number?: string | null
          to_location?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          from_location?: string | null
          logged_by?: string
          movement_date?: string
          movement_id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          permit_number?: string | null
          to_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movements_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "movements_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          district: string | null
          farm_name: string | null
          full_name: string
          id: string
          is_active: boolean
          last_login: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          farm_name?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          district?: string | null
          farm_name?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      vaccinations: {
        Row: {
          animal_id: string
          batch_number: string | null
          cert_status: Database["public"]["Enums"]["vaccination_cert_status"]
          certified_at: string | null
          certified_by: string | null
          created_at: string
          date_given: string
          logged_by: string
          next_due_date: string | null
          notes: string | null
          reminder_sent: boolean
          vacc_id: string
          vaccine_name: string
          vet_name: string | null
          vet_notes: string | null
        }
        Insert: {
          animal_id: string
          batch_number?: string | null
          cert_status?: Database["public"]["Enums"]["vaccination_cert_status"]
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          date_given?: string
          logged_by: string
          next_due_date?: string | null
          notes?: string | null
          reminder_sent?: boolean
          vacc_id?: string
          vaccine_name: string
          vet_name?: string | null
          vet_notes?: string | null
        }
        Update: {
          animal_id?: string
          batch_number?: string | null
          cert_status?: Database["public"]["Enums"]["vaccination_cert_status"]
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          date_given?: string
          logged_by?: string
          next_due_date?: string | null
          notes?: string | null
          reminder_sent?: boolean
          vacc_id?: string
          vaccine_name?: string
          vet_name?: string | null
          vet_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["animal_id"]
          },
          {
            foreignKeyName: "vaccinations_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_certified_by_fkey"
            columns: ["certified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_assignments: {
        Row: {
          assigned_at: string
          assignment_id: string
          farmer_id: string
          is_active: boolean
          vet_id: string
        }
        Insert: {
          assigned_at?: string
          assignment_id?: string
          farmer_id: string
          is_active?: boolean
          vet_id: string
        }
        Update: {
          assigned_at?: string
          assignment_id?: string
          farmer_id?: string
          is_active?: boolean
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_assignments_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_assignments_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_disease_frequency: {
        Args: never
        Returns: {
          condition_name: string
          count: number
        }[]
      }
      get_herd_composition: {
        Args: never
        Returns: {
          breed: string
          count: number
        }[]
      }
      get_predictive_risk: {
        Args: never
        Returns: {
          animal_id: string
          breed: string
          reason: string
          risk_level: string
          tag_number: string
        }[]
      }
      get_upcoming_calvings: {
        Args: { days?: number }
        Returns: {
          animal_id: string
          expected_date: string
          tag_number: string
        }[]
      }
      get_vaccination_coverage_trend: {
        Args: { months?: number }
        Returns: {
          coverage_pct: number
          month: string
        }[]
      }
      get_vet_assigned_farmers: {
        Args: { vet_uuid: string }
        Returns: {
          farmer_id: string
          full_name: string
          farm_name: string | null
          district: string | null
          animal_count: number
          coverage_pct: number
          overdue_count: number
          last_visit_date: string | null
        }[]
      }
      get_vet_active_cases: {
        Args: { vet_uuid: string }
        Returns: {
          event_id: string
          animal_id: string
          tag_number: string
          condition_name: string | null
          severity: string | null
          event_date: string
          farmer_name: string
          outcome: string
        }[]
      }
      get_vet_upcoming_vaccinations: {
        Args: { vet_uuid: string; days?: number }
        Returns: {
          vacc_id: string
          animal_id: string
          tag_number: string
          vaccine_name: string
          next_due_date: string
          farmer_name: string
        }[]
      }
      get_vet_disease_frequency: {
        Args: { vet_uuid: string }
        Returns: {
          condition_name: string
          count: number
        }[]
      }
      get_admin_system_stats: {
        Args: never
        Returns: {
          total_users: number
          total_farmers: number
          total_vets: number
          total_animals: number
          avg_coverage_pct: number
          active_alerts_7d: number
        }[]
      }
      get_admin_all_farms: {
        Args: never
        Returns: {
          farmer_id: string
          full_name: string
          farm_name: string | null
          district: string | null
          animal_count: number
          coverage_pct: number
          overdue_count: number
          assigned_vet_name: string | null
          is_active: boolean
        }[]
      }
      get_admin_vet_workload: {
        Args: never
        Returns: {
          vet_id: string
          full_name: string
          farmer_count: number
          animal_count: number
        }[]
      }
      get_admin_recent_activity: {
        Args: { lim?: number }
        Returns: {
          log_id: string
          user_name: string | null
          action: string
          table_name: string | null
          created_at: string
        }[]
      }
      log_audit_entry: {
        Args: {
          p_action: string
          p_table_name: string | null
          p_record_id: string | null
          p_old_data: Json | null
          p_new_data: Json | null
        }
        Returns: undefined
      }
      get_pending_vaccinations_for_vet: {
        Args: never
        Returns: {
          vacc_id: string
          animal_id: string
          tag_number: string
          breed: string
          vaccine_name: string
          date_given: string
          next_due_date: string | null
          batch_number: string | null
          notes: string | null
          farmer_id: string
          farmer_name: string
          logged_at: string
        }[]
      }
      certify_vaccination: {
        Args: { p_vacc_id: string; p_vet_notes?: string | null }
        Returns: undefined
      }
      reject_vaccination: {
        Args: { p_vacc_id: string; p_reason: string }
        Returns: undefined
      }
      revoke_vaccination_cert: {
        Args: { p_vacc_id: string; p_reason: string }
        Returns: undefined
      }
    }
    Enums: {
      acquired_how: "born" | "purchased" | "donated" | "inherited" | "other"
      alert_severity: "info" | "warning" | "critical"
      alert_type:
        | "vaccination_due"
        | "vaccination_overdue"
        | "disease_risk"
        | "health_event"
        | "outbreak"
        | "system"
      animal_status: "active" | "sold" | "deceased" | "missing"
      animal_type: "cattle" | "goat" | "sheep"
      breeding_event_type:
        | "mating"
        | "ai"
        | "pregnant"
        | "calving"
        | "abortion"
        | "weaning"
      event_type:
        | "disease"
        | "injury"
        | "treatment"
        | "vaccination"
        | "checkup"
        | "other"
      gender: "male" | "female"
      movement_type: "transfer" | "sale" | "purchase" | "import" | "export"
      outcome: "recovering" | "recovered" | "ongoing" | "referred" | "deceased"
      severity: "mild" | "moderate" | "severe" | "critical"
      user_role: "farmer" | "vet" | "admin"
      vaccination_cert_status: "pending" | "certified" | "rejected"
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
    Enums: {
      acquired_how: ["born", "purchased", "donated", "inherited", "other"],
      alert_severity: ["info", "warning", "critical"],
      alert_type: [
        "vaccination_due",
        "vaccination_overdue",
        "disease_risk",
        "health_event",
        "outbreak",
        "system",
        "vaccination_certification_pending",
      ],
      animal_status: ["active", "sold", "deceased", "missing"],
      animal_type: ["cattle", "goat", "sheep"],
      breeding_event_type: [
        "mating",
        "ai",
        "pregnant",
        "calving",
        "abortion",
        "weaning",
      ],
      event_type: [
        "disease",
        "injury",
        "treatment",
        "vaccination",
        "checkup",
        "other",
      ],
      gender: ["male", "female"],
      movement_type: ["transfer", "sale", "purchase", "import", "export"],
      outcome: ["recovering", "recovered", "ongoing", "referred", "deceased"],
      severity: ["mild", "moderate", "severe", "critical"],
      user_role: ["farmer", "vet", "admin"],
      vaccination_cert_status: ["pending", "certified", "rejected"],
    },
  },
} as const

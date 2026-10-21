export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      events: {
        Row: {
          actor_id: string | null;
          actor_type: string;
          created_at: string;
          id: number;
          name: string;
          org_id: string;
          props: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          actor_type: string;
          created_at?: string;
          id?: never;
          name: string;
          org_id: string;
          props?: NonNullable<Json>;
        };
        Update: {
          actor_id?: string | null;
          actor_type?: string;
          created_at?: string;
          id?: never;
          name?: string;
          org_id?: string;
          props?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          org_id: string;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          org_id: string;
          role: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          org_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          late_cancel_hours: number;
          name: string;
          payment_alias: string | null;
          payment_link: string | null;
          slug: string;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          currency?: string;
          id?: string;
          late_cancel_hours?: number;
          name: string;
          payment_alias?: string | null;
          payment_link?: string | null;
          slug: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          late_cancel_hours?: number;
          name?: string;
          payment_alias?: string | null;
          payment_link?: string | null;
          slug?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      price_plans: {
        Row: {
          amount: number;
          billing_day: number | null;
          created_at: string;
          ended_on: string | null;
          id: string;
          lessons_per_package: number | null;
          mode: string;
          org_id: string;
          starts_on: string;
          student_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          billing_day?: number | null;
          created_at?: string;
          ended_on?: string | null;
          id?: string;
          lessons_per_package?: number | null;
          mode: string;
          org_id: string;
          starts_on: string;
          student_id: string;
        };
        Update: {
          amount?: number;
          billing_day?: number | null;
          created_at?: string;
          ended_on?: string | null;
          id?: string;
          lessons_per_package?: number | null;
          mode?: string;
          org_id?: string;
          starts_on?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_plans_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_plans_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      student_access: {
        Row: {
          created_at: string;
          id: string;
          last_seen_at: string | null;
          org_id: string;
          revoked_at: string | null;
          student_id: string;
          token_hash: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          last_seen_at?: string | null;
          org_id: string;
          revoked_at?: string | null;
          student_id: string;
          token_hash: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_seen_at?: string | null;
          org_id?: string;
          revoked_at?: string | null;
          student_id?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_access_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_access_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      student_contacts: {
        Row: {
          created_at: string;
          email: string | null;
          gets_reports: boolean;
          id: string;
          is_payer: boolean;
          name: string;
          org_id: string;
          phone: string | null;
          relation: string | null;
          student_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          gets_reports?: boolean;
          id?: string;
          is_payer?: boolean;
          name: string;
          org_id: string;
          phone?: string | null;
          relation?: string | null;
          student_id: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          gets_reports?: boolean;
          id?: string;
          is_payer?: boolean;
          name?: string;
          org_id?: string;
          phone?: string | null;
          relation?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_contacts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_contacts_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          archived_at: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          level: string | null;
          notes: string | null;
          org_id: string;
          phone: string | null;
          status: string;
          subject: string | null;
          teacher_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          level?: string | null;
          notes?: string | null;
          org_id: string;
          phone?: string | null;
          status?: string;
          subject?: string | null;
          teacher_id: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          level?: string | null;
          notes?: string | null;
          org_id?: string;
          phone?: string | null;
          status?: string;
          subject?: string | null;
          teacher_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      teacher_profiles: {
        Row: {
          bio: string | null;
          created_at: string;
          display_name: string;
          id: string;
          is_public: boolean;
          levels: string[];
          org_id: string;
          phone: string | null;
          public_slug: string | null;
          subjects: string[];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          bio?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          is_public?: boolean;
          levels?: string[];
          org_id: string;
          phone?: string | null;
          public_slug?: string | null;
          subjects?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_public?: boolean;
          levels?: string[];
          org_id?: string;
          phone?: string | null;
          public_slug?: string | null;
          subjects?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_student: {
        Args: {
          p_amount?: number;
          p_billing_day?: number;
          p_email?: string;
          p_full_name: string;
          p_lessons_per_package?: number;
          p_level?: string;
          p_mode?: string;
          p_notes?: string;
          p_payer_email?: string;
          p_payer_name?: string;
          p_payer_phone?: string;
          p_payer_relation?: string;
          p_phone?: string;
          p_subject?: string;
        };
        Returns: {
          student_id: string;
          token: string;
        }[];
      };
      create_workspace: {
        Args: {
          p_display_name: string;
          p_late_cancel_hours?: number;
          p_levels?: string[];
          p_name: string;
          p_payment_alias?: string;
          p_payment_link?: string;
          p_subjects?: string[];
        };
        Returns: string;
      };
      issue_student_link: { Args: { p_student_id: string }; Returns: string };
      set_price_plan: {
        Args: {
          p_amount?: number;
          p_billing_day?: number;
          p_lessons_per_package?: number;
          p_mode?: string;
          p_student_id: string;
        };
        Returns: string;
      };
      student_by_token: {
        Args: { p_token: string };
        Returns: {
          org_name: string;
          student_name: string;
          teacher_name: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;

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
      areas: {
        Row: {
          code: string;
          color: string;
          id: string;
          name: string;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          color: string;
          id?: string;
          name: string;
          position: number;
        };
        Update: {
          code?: string;
          color?: string;
          id?: string;
          name?: string;
          position?: number;
        };
        Relationships: [];
      };
      charges: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          due_on: string;
          id: string;
          lesson_id: string | null;
          org_id: string;
          period: string | null;
          source: string;
          status: string;
          student_id: string;
          voided_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          due_on: string;
          id?: string;
          lesson_id?: string | null;
          org_id: string;
          period?: string | null;
          source: string;
          status?: string;
          student_id: string;
          voided_at?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          due_on?: string;
          id?: string;
          lesson_id?: string | null;
          org_id?: string;
          period?: string | null;
          source?: string;
          status?: string;
          student_id?: string;
          voided_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "charges_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
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
      legal_acceptances: {
        Row: {
          accepted_at: string;
          document: string;
          id: string;
          user_id: string;
          version: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string;
          document: string;
          id?: string;
          user_id: string;
          version: string;
        };
        Update: {
          accepted_at?: string;
          document?: string;
          id?: string;
          user_id?: string;
          version?: string;
        };
        Relationships: [];
      };
      lesson_attendees: {
        Row: {
          attendance: string | null;
          billable: boolean;
          lesson_id: string;
          marked_at: string | null;
          org_id: string;
          reminded_at: string | null;
          student_id: string;
        };
        ComputedFields: never;
        Insert: {
          attendance?: string | null;
          billable?: boolean;
          lesson_id: string;
          marked_at?: string | null;
          org_id: string;
          reminded_at?: string | null;
          student_id: string;
        };
        Update: {
          attendance?: string | null;
          billable?: boolean;
          lesson_id?: string;
          marked_at?: string | null;
          org_id?: string;
          reminded_at?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_attendees_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_attendees_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_attendees_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_notes: {
        Row: {
          body: string;
          id: string;
          lesson_id: string;
          org_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string;
          id?: string;
          lesson_id: string;
          org_id: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          id?: string;
          lesson_id?: string;
          org_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: true;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_notes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_series: {
        Row: {
          archived_at: string | null;
          created_at: string;
          duration_min: number;
          ends_on: string | null;
          id: string;
          meeting_url: string | null;
          org_id: string;
          start_time: string;
          starts_on: string;
          teacher_id: string;
          updated_at: string;
          weekday: number;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          duration_min: number;
          ends_on?: string | null;
          id?: string;
          meeting_url?: string | null;
          org_id: string;
          start_time: string;
          starts_on: string;
          teacher_id: string;
          updated_at?: string;
          weekday: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          duration_min?: number;
          ends_on?: string | null;
          id?: string;
          meeting_url?: string | null;
          org_id?: string;
          start_time?: string;
          starts_on?: string;
          teacher_id?: string;
          updated_at?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_series_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          archived_at: string | null;
          cancel_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          created_at: string;
          ends_at: string;
          id: string;
          meeting_url: string | null;
          org_id: string;
          series_date: string | null;
          series_id: string | null;
          shared_notes: string | null;
          starts_at: string;
          status: string;
          teacher_id: string;
          topic: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          ends_at: string;
          id?: string;
          meeting_url?: string | null;
          org_id: string;
          series_date?: string | null;
          series_id?: string | null;
          shared_notes?: string | null;
          starts_at: string;
          status?: string;
          teacher_id: string;
          topic?: string | null;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          ends_at?: string;
          id?: string;
          meeting_url?: string | null;
          org_id?: string;
          series_date?: string | null;
          series_id?: string | null;
          shared_notes?: string | null;
          starts_at?: string;
          status?: string;
          teacher_id?: string;
          topic?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lessons_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "lesson_series";
            referencedColumns: ["id"];
          },
        ];
      };
      levels: {
        Row: {
          area_id: string;
          code: string;
          id: string;
          name: string;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          area_id: string;
          code: string;
          id?: string;
          name: string;
          position: number;
        };
        Update: {
          area_id?: string;
          code?: string;
          id?: string;
          name?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "levels_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
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
      minor_consents: {
        Row: {
          contact_id: string;
          created_at: string;
          expires_at: string;
          given_at: string | null;
          id: string;
          legal_version: string | null;
          minor_email: string | null;
          org_id: string;
          revoked_at: string | null;
          student_id: string;
          token_hash: string;
        };
        ComputedFields: never;
        Insert: {
          contact_id: string;
          created_at?: string;
          expires_at: string;
          given_at?: string | null;
          id?: string;
          legal_version?: string | null;
          minor_email?: string | null;
          org_id: string;
          revoked_at?: string | null;
          student_id: string;
          token_hash: string;
        };
        Update: {
          contact_id?: string;
          created_at?: string;
          expires_at?: string;
          given_at?: string | null;
          id?: string;
          legal_version?: string | null;
          minor_email?: string | null;
          org_id?: string;
          revoked_at?: string | null;
          student_id?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "minor_consents_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "student_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "minor_consents_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "minor_consents_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
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
      package_ledger: {
        Row: {
          charge_id: string | null;
          created_at: string;
          delta: number;
          id: string;
          lesson_id: string | null;
          org_id: string;
          reason: string;
          student_id: string;
        };
        ComputedFields: never;
        Insert: {
          charge_id?: string | null;
          created_at?: string;
          delta: number;
          id?: string;
          lesson_id?: string | null;
          org_id: string;
          reason: string;
          student_id: string;
        };
        Update: {
          charge_id?: string | null;
          created_at?: string;
          delta?: number;
          id?: string;
          lesson_id?: string | null;
          org_id?: string;
          reason?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "package_ledger_charge_id_fkey";
            columns: ["charge_id"];
            isOneToOne: false;
            referencedRelation: "charge_balances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_ledger_charge_id_fkey";
            columns: ["charge_id"];
            isOneToOne: false;
            referencedRelation: "charges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_ledger_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_ledger_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_ledger_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_allocations: {
        Row: {
          amount: number;
          charge_id: string;
          created_at: string;
          id: string;
          org_id: string;
          payment_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          charge_id: string;
          created_at?: string;
          id?: string;
          org_id: string;
          payment_id: string;
        };
        Update: {
          amount?: number;
          charge_id?: string;
          created_at?: string;
          id?: string;
          org_id?: string;
          payment_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_allocations_charge_id_fkey";
            columns: ["charge_id"];
            isOneToOne: false;
            referencedRelation: "charge_balances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_allocations_charge_id_fkey";
            columns: ["charge_id"];
            isOneToOne: false;
            referencedRelation: "charges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_allocations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payment_balances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          method: string;
          org_id: string;
          paid_on: string;
          recorded_by: string;
          reference: string | null;
          student_id: string;
          voided_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          method: string;
          org_id: string;
          paid_on: string;
          recorded_by: string;
          reference?: string | null;
          student_id: string;
          voided_at?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          method?: string;
          org_id?: string;
          paid_on?: string;
          recorded_by?: string;
          reference?: string | null;
          student_id?: string;
          voided_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
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
      series_students: {
        Row: {
          org_id: string;
          series_id: string;
          student_id: string;
        };
        ComputedFields: never;
        Insert: {
          org_id: string;
          series_id: string;
          student_id: string;
        };
        Update: {
          org_id?: string;
          series_id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "series_students_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "series_students_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "lesson_series";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "series_students_student_id_fkey";
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
      student_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          org_id: string;
          revoked_at: string | null;
          student_id: string;
          token_hash: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          org_id: string;
          revoked_at?: string | null;
          student_id: string;
          token_hash: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          org_id?: string;
          revoked_at?: string | null;
          student_id?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_invitations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_invitations_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      student_notes: {
        Row: {
          body: string;
          id: string;
          org_id: string;
          student_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string;
          id?: string;
          org_id: string;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          id?: string;
          org_id?: string;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_notes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_notes_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: true;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      student_profiles: {
        Row: {
          created_at: string;
          display_name: string;
          phone: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name: string;
          phone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          phone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          archived_at: string | null;
          area_id: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          is_minor: boolean;
          level_id: string | null;
          linked_at: string | null;
          minor_13_plus: boolean | null;
          org_id: string;
          phone: string | null;
          status: string;
          subject: string | null;
          subject_id: string | null;
          teacher_id: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          area_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          is_minor?: boolean;
          level_id?: string | null;
          linked_at?: string | null;
          minor_13_plus?: boolean | null;
          org_id: string;
          phone?: string | null;
          status?: string;
          subject?: string | null;
          subject_id?: string | null;
          teacher_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          archived_at?: string | null;
          area_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_minor?: boolean;
          level_id?: string | null;
          linked_at?: string | null;
          minor_13_plus?: boolean | null;
          org_id?: string;
          phone?: string | null;
          status?: string;
          subject?: string | null;
          subject_id?: string | null;
          teacher_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_level_area_fk";
            columns: ["level_id", "area_id"];
            isOneToOne: false;
            referencedRelation: "levels";
            referencedColumns: ["id", "area_id"];
          },
          {
            foreignKeyName: "students_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_subject_area_fk";
            columns: ["subject_id", "area_id"];
            isOneToOne: false;
            referencedRelation: "subject_areas";
            referencedColumns: ["subject_id", "area_id"];
          },
          {
            foreignKeyName: "students_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      subject_areas: {
        Row: {
          area_id: string;
          subject_id: string;
        };
        ComputedFields: never;
        Insert: {
          area_id: string;
          subject_id: string;
        };
        Update: {
          area_id?: string;
          subject_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subject_areas_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subject_areas_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          code: string;
          id: string;
          name: string;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          id?: string;
          name: string;
          position: number;
        };
        Update: {
          code?: string;
          id?: string;
          name?: string;
          position?: number;
        };
        Relationships: [];
      };
      teacher_profiles: {
        Row: {
          bio: string | null;
          created_at: string;
          display_name: string;
          id: string;
          main_area_id: string | null;
          org_id: string;
          phone: string | null;
          photo_path: string | null;
          slug: string | null;
          subject_ids: string[];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          bio?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          main_area_id?: string | null;
          org_id: string;
          phone?: string | null;
          photo_path?: string | null;
          slug?: string | null;
          subject_ids?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          main_area_id?: string | null;
          org_id?: string;
          phone?: string | null;
          photo_path?: string | null;
          slug?: string | null;
          subject_ids?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_main_area_id_fkey";
            columns: ["main_area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
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
      charge_balances: {
        Row: {
          amount: number | null;
          created_at: string | null;
          description: string | null;
          due_on: string | null;
          id: string | null;
          lesson_id: string | null;
          org_id: string | null;
          paid: number | null;
          period: string | null;
          remaining: number | null;
          source: string | null;
          status: string | null;
          student_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "charges_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_balances: {
        Row: {
          amount: number | null;
          created_at: string | null;
          id: string | null;
          method: string | null;
          org_id: string | null;
          paid_on: string | null;
          reference: string | null;
          student_id: string | null;
          unallocated: number | null;
          voided_at: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "payments_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      accept_legal: { Args: { p_version: string }; Returns: undefined };
      accept_student_invitation: { Args: { p_token: string }; Returns: string };
      apply_price_changes: { Args: { p_changes: Json }; Returns: number };
      cancel_lesson: {
        Args: { p_by: string; p_lesson_id: string; p_reason?: string };
        Returns: undefined;
      };
      consent_by_token: {
        Args: { p_token: string };
        Returns: {
          given_at: string;
          payer_name: string;
          status: string;
          student_name: string;
          teacher_name: string;
        }[];
      };
      create_charge: {
        Args: { p_amount: number; p_description: string; p_due_on: string; p_student_id: string };
        Returns: string;
      };
      create_lesson: {
        Args: {
          p_date: string;
          p_duration_min: number;
          p_meeting_url?: string;
          p_start: string;
          p_student_ids: string[];
          p_topic?: string;
        };
        Returns: string;
      };
      create_lesson_series: {
        Args: {
          p_duration_min: number;
          p_ends_on?: string;
          p_meeting_url?: string;
          p_start: string;
          p_starts_on: string;
          p_student_ids: string[];
          p_weekday: number;
        };
        Returns: string;
      };
      create_student: {
        Args: {
          p_amount?: number;
          p_area_id?: string;
          p_billing_day?: number;
          p_email?: string;
          p_full_name: string;
          p_is_minor?: boolean;
          p_lessons_per_package?: number;
          p_level_id?: string;
          p_minor_13_plus?: boolean;
          p_mode?: string;
          p_notes?: string;
          p_payer_email?: string;
          p_payer_name?: string;
          p_payer_phone?: string;
          p_payer_relation?: string;
          p_phone?: string;
          p_subject?: string;
          p_subject_id?: string;
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
          p_name: string;
          p_payment_alias?: string;
          p_payment_link?: string;
          p_subject_ids?: string[];
        };
        Returns: string;
      };
      end_lesson_series: { Args: { p_series_id: string }; Returns: undefined };
      ensure_student_profile: { Args: Record<PropertyKey, never>; Returns: undefined };
      extend_lesson_series: { Args: Record<PropertyKey, never>; Returns: number };
      generate_monthly_charges: { Args: Record<PropertyKey, never>; Returns: number };
      give_minor_consent: {
        Args: { p_legal_version: string; p_minor_email?: string; p_token: string };
        Returns: undefined;
      };
      invitation_by_token: {
        Args: { p_token: string };
        Returns: {
          org_name: string;
          status: string;
          student_name: string;
          teacher_name: string;
        }[];
      };
      issue_student_invitation: { Args: { p_student_id: string }; Returns: string };
      mark_charge_paid: {
        Args: { p_charge_id: string; p_method: string; p_paid_on: string };
        Returns: string;
      };
      move_lesson: {
        Args: { p_date: string; p_duration_min?: number; p_lesson_id: string; p_start: string };
        Returns: undefined;
      };
      my_student_links: {
        Args: Record<PropertyKey, never>;
        Returns: {
          archived: boolean;
          late_cancel_hours: number;
          org_name: string;
          payment_alias: string;
          payment_link: string;
          student_id: string;
          student_name: string;
          teacher_name: string;
          timezone: string;
        }[];
      };
      record_payment: {
        Args: {
          p_amount: number;
          p_charge_id?: string;
          p_method: string;
          p_paid_on: string;
          p_reference?: string;
          p_student_id: string;
        };
        Returns: string;
      };
      renew_package: { Args: { p_student_id: string }; Returns: undefined };
      request_minor_consent: { Args: { p_student_id: string }; Returns: string };
      restore_lesson: { Args: { p_lesson_id: string }; Returns: undefined };
      revoke_minor_consent: { Args: { p_token: string }; Returns: undefined };
      set_attendance: {
        Args: {
          p_attendance?: string;
          p_billable?: boolean;
          p_lesson_id: string;
          p_student_id: string;
        };
        Returns: boolean;
      };
      set_lesson_students: {
        Args: { p_lesson_id: string; p_student_ids: string[] };
        Returns: undefined;
      };
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
      student_consent_info: {
        Args: { p_student_id: string };
        Returns: {
          consent_status: string;
          expires_at: string;
          given_at: string;
          is_minor: boolean;
          minor_13_plus: boolean;
          payer_name: string;
        }[];
      };
      student_link_info: {
        Args: { p_student_id: string };
        Returns: {
          linked_at: string;
          linked_email: string;
          pending_expires_at: string;
        }[];
      };
      unlink_student: { Args: { p_student_id: string }; Returns: undefined };
      void_charge: { Args: { p_charge_id: string }; Returns: undefined };
      void_payment: { Args: { p_payment_id: string }; Returns: undefined };
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

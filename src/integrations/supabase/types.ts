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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_semesters: {
        Row: {
          academic_year: string
          created_at: string
          created_by: string
          cumulative_target_hours: number | null
          end_date: string
          id: string
          is_active: boolean | null
          is_schedule_open: boolean | null
          name: string
          schedule_closed_at: string | null
          schedule_closed_by: string | null
          semester_number: number
          start_date: string
          target_volunteer_hours: number | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          created_by: string
          cumulative_target_hours?: number | null
          end_date: string
          id?: string
          is_active?: boolean | null
          is_schedule_open?: boolean | null
          name: string
          schedule_closed_at?: string | null
          schedule_closed_by?: string | null
          semester_number: number
          start_date: string
          target_volunteer_hours?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          created_by?: string
          cumulative_target_hours?: number | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          is_schedule_open?: boolean | null
          name?: string
          schedule_closed_at?: string | null
          schedule_closed_by?: string | null
          semester_number?: number
          start_date?: string
          target_volunteer_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      achievement_badges: {
        Row: {
          badge_type: string
          created_at: string
          earned_at: string
          hours_at_achievement: number | null
          id: string
          semester_id: string | null
          volunteer_id: string
        }
        Insert: {
          badge_type: string
          created_at?: string
          earned_at?: string
          hours_at_achievement?: number | null
          id?: string
          semester_id?: string | null
          volunteer_id: string
        }
        Update: {
          badge_type?: string
          created_at?: string
          earned_at?: string
          hours_at_achievement?: number | null
          id?: string
          semester_id?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_badges_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "academic_semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_badges_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_certificates: {
        Row: {
          achievement_type: string
          badge_id: string
          certificate_number: string
          hours_achieved: number
          id: string
          issued_at: string
          volunteer_id: string
        }
        Insert: {
          achievement_type: string
          badge_id: string
          certificate_number: string
          hours_achieved: number
          id?: string
          issued_at?: string
          volunteer_id: string
        }
        Update: {
          achievement_type?: string
          badge_id?: string
          certificate_number?: string
          hours_achieved?: number
          id?: string
          issued_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_certificates_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "achievement_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_certificates_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          priority: string | null
          target_audience: string | null
          target_faculty_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          priority?: string | null
          target_audience?: string | null
          target_faculty_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          priority?: string | null
          target_audience?: string | null
          target_faculty_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_target_faculty_id_fkey"
            columns: ["target_faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          created_at: string
          created_by: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type?: string
          created_at?: string
          created_by: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          created_at?: string
          created_by?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in_method: string | null
          check_in_time: string
          check_out_time: string | null
          id: string
          manual_token: string | null
          opportunity_id: string
          recorded_by: string | null
          registration_id: string
          volunteer_id: string
        }
        Insert: {
          check_in_method?: string | null
          check_in_time?: string
          check_out_time?: string | null
          id?: string
          manual_token?: string | null
          opportunity_id: string
          recorded_by?: string | null
          registration_id: string
          volunteer_id: string
        }
        Update: {
          check_in_method?: string | null
          check_in_time?: string
          check_out_time?: string | null
          id?: string
          manual_token?: string | null
          opportunity_id?: string
          recorded_by?: string | null
          registration_id?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "opportunity_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_transactions: {
        Row: {
          checkout_code: string
          checkout_condition: string | null
          checkout_confirmed_at: string | null
          checkout_confirmed_by: string | null
          checkout_time: string | null
          created_at: string
          id: string
          notes: string | null
          opportunity_id: string
          registration_id: string
          return_code: string | null
          return_condition: string | null
          return_confirmed_at: string | null
          return_confirmed_by: string | null
          return_time: string | null
          status: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          checkout_code: string
          checkout_condition?: string | null
          checkout_confirmed_at?: string | null
          checkout_confirmed_by?: string | null
          checkout_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id: string
          registration_id: string
          return_code?: string | null
          return_condition?: string | null
          return_confirmed_at?: string | null
          return_confirmed_by?: string | null
          return_time?: string | null
          status?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          checkout_code?: string
          checkout_condition?: string | null
          checkout_confirmed_at?: string | null
          checkout_confirmed_by?: string | null
          checkout_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id?: string
          registration_id?: string
          return_code?: string | null
          return_condition?: string | null
          return_confirmed_at?: string | null
          return_confirmed_by?: string | null
          return_time?: string | null
          status?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_transactions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_transactions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "opportunity_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_transactions_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          template_html: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_html: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_html?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificate_verifications: {
        Row: {
          certificate_id: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          verified_at: string
        }
        Insert: {
          certificate_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          verified_at?: string
        }
        Update: {
          certificate_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_verifications_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          certificate_type: string
          date_range_end: string | null
          date_range_start: string | null
          disability_assignments_count: number | null
          disability_hours: number | null
          disability_students_helped: number | null
          hours: number
          id: string
          issued_at: string
          opportunity_id: string | null
          template_id: string | null
          volunteer_id: string
        }
        Insert: {
          certificate_number: string
          certificate_type?: string
          date_range_end?: string | null
          date_range_start?: string | null
          disability_assignments_count?: number | null
          disability_hours?: number | null
          disability_students_helped?: number | null
          hours: number
          id?: string
          issued_at?: string
          opportunity_id?: string | null
          template_id?: string | null
          volunteer_id: string
        }
        Update: {
          certificate_number?: string
          certificate_type?: string
          date_range_end?: string | null
          date_range_start?: string | null
          disability_assignments_count?: number | null
          disability_hours?: number | null
          disability_students_helped?: number | null
          hours?: number
          id?: string
          issued_at?: string
          opportunity_id?: string | null
          template_id?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          opportunity_id: string | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          opportunity_id?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          opportunity_id?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      disability_exam_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assigned_role: Database["public"]["Enums"]["special_need_type"]
          completed_at: string | null
          confirmed_at: string | null
          exam_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["disability_exam_status"]
          volunteer_id: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
          withdrawn_by: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assigned_role: Database["public"]["Enums"]["special_need_type"]
          completed_at?: string | null
          confirmed_at?: string | null
          exam_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["disability_exam_status"]
          volunteer_id: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assigned_role?: Database["public"]["Enums"]["special_need_type"]
          completed_at?: string | null
          confirmed_at?: string | null
          exam_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["disability_exam_status"]
          volunteer_id?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disability_exam_assignments_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "disability_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disability_exam_assignments_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      disability_exam_logs: {
        Row: {
          action: string
          assignment_id: string | null
          exam_id: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          performed_at: string
          performed_by: string
        }
        Insert: {
          action: string
          assignment_id?: string | null
          exam_id?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_at?: string
          performed_by: string
        }
        Update: {
          action?: string
          assignment_id?: string | null
          exam_id?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_at?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "disability_exam_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "disability_exam_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disability_exam_logs_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "disability_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      disability_exams: {
        Row: {
          course_code: string | null
          course_name: string
          created_at: string
          created_by: string
          duration_minutes: number
          end_time: string
          exam_date: string
          extra_time_minutes: number | null
          id: string
          location: string | null
          semester_id: string | null
          special_needs:
            | Database["public"]["Enums"]["special_need_type"][]
            | null
          special_needs_notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["disability_exam_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          course_code?: string | null
          course_name: string
          created_at?: string
          created_by: string
          duration_minutes: number
          end_time: string
          exam_date: string
          extra_time_minutes?: number | null
          id?: string
          location?: string | null
          semester_id?: string | null
          special_needs?:
            | Database["public"]["Enums"]["special_need_type"][]
            | null
          special_needs_notes?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["disability_exam_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          course_code?: string | null
          course_name?: string
          created_at?: string
          created_by?: string
          duration_minutes?: number
          end_time?: string
          exam_date?: string
          extra_time_minutes?: number | null
          id?: string
          location?: string | null
          semester_id?: string | null
          special_needs?:
            | Database["public"]["Enums"]["special_need_type"][]
            | null
          special_needs_notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["disability_exam_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disability_exams_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "academic_semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disability_exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "disability_students"
            referencedColumns: ["id"]
          },
        ]
      }
      disability_student_exam_submissions: {
        Row: {
          course_code: string | null
          course_name: string
          duration_minutes: number
          end_time: string
          exam_date: string
          id: string
          is_processed: boolean | null
          location: string | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          start_time: string
          status: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          course_code?: string | null
          course_name: string
          duration_minutes?: number
          end_time: string
          exam_date: string
          id?: string
          is_processed?: boolean | null
          location?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          start_time: string
          status?: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          course_code?: string | null
          course_name?: string
          duration_minutes?: number
          end_time?: string
          exam_date?: string
          id?: string
          is_processed?: boolean | null
          location?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          start_time?: string
          status?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disability_student_exam_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "disability_students"
            referencedColumns: ["id"]
          },
        ]
      }
      disability_students: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          disability_code: string | null
          disability_type: string | null
          id: string
          is_active: boolean | null
          national_id: string | null
          notes: string | null
          special_needs:
            | Database["public"]["Enums"]["special_need_type"][]
            | null
          student_name: string
          university_id: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          disability_code?: string | null
          disability_type?: string | null
          id?: string
          is_active?: boolean | null
          national_id?: string | null
          notes?: string | null
          special_needs?:
            | Database["public"]["Enums"]["special_need_type"][]
            | null
          student_name: string
          university_id: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          disability_code?: string | null
          disability_type?: string | null
          id?: string
          is_active?: boolean | null
          national_id?: string | null
          notes?: string | null
          special_needs?:
            | Database["public"]["Enums"]["special_need_type"][]
            | null
          student_name?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      emr_audit_trail: {
        Row: {
          action: string
          created_at: string
          encounter_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          patient_id: string
          performed_by: string
          performed_by_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          encounter_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          patient_id: string
          performed_by: string
          performed_by_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          encounter_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          patient_id?: string
          performed_by?: string
          performed_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emr_audit_trail_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emr_audit_trail_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      emr_therapy_sessions: {
        Row: {
          assessment: string | null
          created_at: string
          encounter_id: string | null
          functional_status_score: number | null
          homework_assigned: string | null
          id: string
          objective: string | null
          patient_id: string
          plan: string | null
          provider_id: string
          response_to_intervention: string | null
          session_date: string
          session_number: number
          subjective: string | null
          updated_at: string
        }
        Insert: {
          assessment?: string | null
          created_at?: string
          encounter_id?: string | null
          functional_status_score?: number | null
          homework_assigned?: string | null
          id?: string
          objective?: string | null
          patient_id: string
          plan?: string | null
          provider_id: string
          response_to_intervention?: string | null
          session_date?: string
          session_number?: number
          subjective?: string | null
          updated_at?: string
        }
        Update: {
          assessment?: string | null
          created_at?: string
          encounter_id?: string | null
          functional_status_score?: number | null
          homework_assigned?: string | null
          id?: string
          objective?: string | null
          patient_id?: string
          plan?: string | null
          provider_id?: string
          response_to_intervention?: string | null
          session_date?: string
          session_number?: number
          subjective?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emr_therapy_sessions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emr_therapy_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_addendums: {
        Row: {
          content: string
          created_at: string
          created_by: string
          created_by_name: string
          encounter_id: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          created_by_name: string
          encounter_id: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          created_by_name?: string
          encounter_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounter_addendums_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_histories: {
        Row: {
          content: Json
          created_at: string
          encounter_id: string
          history_type: string
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          encounter_id: string
          history_type: string
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          encounter_id?: string
          history_type?: string
          id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounter_histories_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_histories_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_treatment_plans: {
        Row: {
          created_at: string
          created_by: string
          duration: string | null
          encounter_id: string
          frequency: string | null
          id: string
          notes: string | null
          patient_id: string
          smart_goals: Json | null
          status: string
          therapy_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duration?: string | null
          encounter_id: string
          frequency?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          smart_goals?: Json | null
          status?: string
          therapy_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duration?: string | null
          encounter_id?: string
          frequency?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          smart_goals?: Json | null
          status?: string
          therapy_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounter_treatment_plans_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounter_treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          chief_complaint: string | null
          clinic_type: string
          created_at: string
          encounter_date: string
          encounter_number: number
          id: string
          location: string | null
          patient_id: string
          provider_id: string
          provider_name: string
          signed_at: string | null
          signed_by: string | null
          status: string
          updated_at: string
          visit_type: string
        }
        Insert: {
          chief_complaint?: string | null
          clinic_type?: string
          created_at?: string
          encounter_date?: string
          encounter_number?: number
          id?: string
          location?: string | null
          patient_id: string
          provider_id: string
          provider_name: string
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Update: {
          chief_complaint?: string | null
          clinic_type?: string
          created_at?: string
          encounter_date?: string
          encounter_number?: number
          id?: string
          location?: string | null
          patient_id?: string
          provider_id?: string
          provider_name?: string
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          comments: string | null
          created_at: string
          created_by: string | null
          id: string
          opportunity_id: string
          ratings: Json
          type: string
          volunteer_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          opportunity_id: string
          ratings?: Json
          type: string
          volunteer_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          opportunity_id?: string
          ratings?: Json
          type?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          course_id: string
          created_at: string
          end_time: string
          exam_date: string
          exam_type: string
          id: string
          location: string | null
          semester_id: string
          start_time: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          end_time: string
          exam_date: string
          exam_type: string
          id?: string
          location?: string | null
          semester_id: string
          start_time: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          end_time?: string
          exam_date?: string
          exam_type?: string
          id?: string
          location?: string | null
          semester_id?: string
          start_time?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "volunteer_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "academic_semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      icd_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string
          id: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description: string
          id?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      intervention_logs: {
        Row: {
          created_at: string
          id: string
          intervention_date: string
          intervention_type: string
          notes: string | null
          outcome: string | null
          performed_by: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intervention_date?: string
          intervention_type: string
          notes?: string | null
          outcome?: string | null
          performed_by: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intervention_date?: string
          intervention_type?: string
          notes?: string | null
          outcome?: string | null
          performed_by?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "psychological_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          created_at: string
          encounter_id: string | null
          id: string
          is_abnormal: boolean | null
          notes: string | null
          ordered_by: string
          patient_id: string
          reference_range: string | null
          result_value: string | null
          test_category: string | null
          test_date: string
          test_name: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          encounter_id?: string | null
          id?: string
          is_abnormal?: boolean | null
          notes?: string | null
          ordered_by: string
          patient_id: string
          reference_range?: string | null
          result_value?: string | null
          test_category?: string | null
          test_date?: string
          test_name: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          encounter_id?: string | null
          id?: string
          is_abnormal?: boolean | null
          notes?: string | null
          ordered_by?: string
          patient_id?: string
          reference_range?: string | null
          result_value?: string | null
          test_category?: string | null
          test_date?: string
          test_name?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      majors: {
        Row: {
          created_at: string
          faculty_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          faculty_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          faculty_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "majors_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_catalog: {
        Row: {
          brand_name: string | null
          contraindications: string | null
          created_at: string
          drug_class: string
          generic_name: string
          id: string
          interaction_group: string | null
          route: string | null
          typical_dose: string | null
        }
        Insert: {
          brand_name?: string | null
          contraindications?: string | null
          created_at?: string
          drug_class: string
          generic_name: string
          id?: string
          interaction_group?: string | null
          route?: string | null
          typical_dose?: string | null
        }
        Update: {
          brand_name?: string | null
          contraindications?: string | null
          created_at?: string
          drug_class?: string
          generic_name?: string
          id?: string
          interaction_group?: string | null
          route?: string | null
          typical_dose?: string | null
        }
        Relationships: []
      }
      mental_status_exams: {
        Row: {
          affect: string | null
          affect_notes: string | null
          appearance: string | null
          appearance_notes: string | null
          behavior: string | null
          behavior_notes: string | null
          cognitive_screening: string | null
          cognitive_screening_notes: string | null
          created_at: string
          encounter_id: string
          id: string
          insight: string | null
          insight_notes: string | null
          judgment: string | null
          judgment_notes: string | null
          mood: string | null
          mood_notes: string | null
          perception: string | null
          perception_notes: string | null
          thought_content: string | null
          thought_content_notes: string | null
          thought_process: string | null
          thought_process_notes: string | null
          updated_at: string
        }
        Insert: {
          affect?: string | null
          affect_notes?: string | null
          appearance?: string | null
          appearance_notes?: string | null
          behavior?: string | null
          behavior_notes?: string | null
          cognitive_screening?: string | null
          cognitive_screening_notes?: string | null
          created_at?: string
          encounter_id: string
          id?: string
          insight?: string | null
          insight_notes?: string | null
          judgment?: string | null
          judgment_notes?: string | null
          mood?: string | null
          mood_notes?: string | null
          perception?: string | null
          perception_notes?: string | null
          thought_content?: string | null
          thought_content_notes?: string | null
          thought_process?: string | null
          thought_process_notes?: string | null
          updated_at?: string
        }
        Update: {
          affect?: string | null
          affect_notes?: string | null
          appearance?: string | null
          appearance_notes?: string | null
          behavior?: string | null
          behavior_notes?: string | null
          cognitive_screening?: string | null
          cognitive_screening_notes?: string | null
          created_at?: string
          encounter_id?: string
          id?: string
          insight?: string | null
          insight_notes?: string | null
          judgment?: string | null
          judgment_notes?: string | null
          mood?: string | null
          mood_notes?: string | null
          perception?: string | null
          perception_notes?: string | null
          thought_content?: string | null
          thought_content_notes?: string | null
          thought_process?: string | null
          thought_process_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mental_status_exams_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_edited: boolean | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          access_password: string | null
          access_password_set_at: string | null
          access_password_set_by: string | null
          created_at: string
          created_by: string
          date: string
          description: string
          end_time: string
          faculty_restriction: string | null
          id: string
          location: string
          qr_closed_at: string | null
          qr_closed_by: string | null
          qr_code_active: boolean | null
          qr_code_token: string | null
          qr_reopen_reason: string | null
          required_volunteers: number
          start_time: string
          status: Database["public"]["Enums"]["opportunity_status"]
          supervisor_id: string | null
          target_interests: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          access_password?: string | null
          access_password_set_at?: string | null
          access_password_set_by?: string | null
          created_at?: string
          created_by: string
          date: string
          description: string
          end_time: string
          faculty_restriction?: string | null
          id?: string
          location: string
          qr_closed_at?: string | null
          qr_closed_by?: string | null
          qr_code_active?: boolean | null
          qr_code_token?: string | null
          qr_reopen_reason?: string | null
          required_volunteers?: number
          start_time: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          supervisor_id?: string | null
          target_interests?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          access_password?: string | null
          access_password_set_at?: string | null
          access_password_set_by?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          end_time?: string
          faculty_restriction?: string | null
          id?: string
          location?: string
          qr_closed_at?: string | null
          qr_closed_by?: string | null
          qr_code_active?: boolean | null
          qr_code_token?: string | null
          qr_reopen_reason?: string | null
          required_volunteers?: number
          start_time?: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          supervisor_id?: string | null
          target_interests?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_faculty_restriction_fkey"
            columns: ["faculty_restriction"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_registrations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_approved: boolean | null
          id: string
          opportunity_id: string
          registered_at: string
          status: Database["public"]["Enums"]["application_status"]
          volunteer_id: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_approved?: boolean | null
          id?: string
          opportunity_id: string
          registered_at?: string
          status?: Database["public"]["Enums"]["application_status"]
          volunteer_id: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_approved?: boolean | null
          id?: string
          opportunity_id?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["application_status"]
          volunteer_id?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_registrations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_registrations_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_alerts: {
        Row: {
          alert_type: string
          created_at: string
          created_by: string
          description: string
          id: string
          is_active: boolean
          patient_id: string
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          is_active?: boolean
          patient_id: string
          severity?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_active?: boolean
          patient_id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_diagnoses: {
        Row: {
          created_at: string
          created_by: string
          diagnosis_type: string
          encounter_id: string | null
          icd_code: string
          icd_description: string
          id: string
          notes: string | null
          onset_date: string | null
          patient_id: string
          resolved_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          diagnosis_type?: string
          encounter_id?: string | null
          icd_code: string
          icd_description: string
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id: string
          resolved_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          diagnosis_type?: string
          encounter_id?: string | null
          icd_code?: string
          icd_description?: string
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id?: string
          resolved_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_diagnoses_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          created_at: string
          document_type: string
          encounter_id: string | null
          file_name: string | null
          file_url: string | null
          id: string
          notes: string | null
          patient_id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: string
          encounter_id?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string
          encounter_id?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_medications: {
        Row: {
          created_at: string
          dose: string
          duration: string | null
          encounter_id: string | null
          end_date: string | null
          frequency: string
          id: string
          interaction_group: string | null
          medication_name: string
          notes: string | null
          patient_id: string
          prescribed_by: string
          refill_count: number | null
          route: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dose: string
          duration?: string | null
          encounter_id?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          interaction_group?: string | null
          medication_name: string
          notes?: string | null
          patient_id: string
          prescribed_by: string
          refill_count?: number | null
          route?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dose?: string
          duration?: string | null
          encounter_id?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          interaction_group?: string | null
          medication_name?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string
          refill_count?: number | null
          route?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_provider_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          is_active: boolean
          patient_id: string
          provider_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          is_active?: boolean
          patient_id: string
          provider_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          is_active?: boolean
          patient_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_provider_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          encounter_id: string | null
          id: string
          patient_id: string
          reason: string
          referral_type: string
          referred_by: string
          referred_to: string
          result_notes: string | null
          specialty: string | null
          status: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          patient_id: string
          reason: string
          referral_type?: string
          referred_by: string
          referred_to?: string
          result_notes?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          encounter_id?: string | null
          id?: string
          patient_id?: string
          reason?: string
          referral_type?: string
          referred_by?: string
          referred_to?: string
          result_notes?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_referrals_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_referrals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allergies: string[] | null
          assigned_provider_id: string | null
          chronic_problems: string[] | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          file_number: string
          full_name: string
          gender: string | null
          id: string
          marital_status: string | null
          national_id: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          assigned_provider_id?: string | null
          chronic_problems?: string[] | null
          created_at?: string
          created_by: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          file_number?: string
          full_name: string
          gender?: string | null
          id?: string
          marital_status?: string | null
          national_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          assigned_provider_id?: string | null
          chronic_problems?: string[] | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          file_number?: string
          full_name?: string
          gender?: string | null
          id?: string
          marital_status?: string | null
          national_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          emr_password: string | null
          faculty_id: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          emr_password?: string | null
          faculty_id?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          emr_password?: string | null
          faculty_id?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_assessments: {
        Row: {
          assessed_at: string
          assessed_by: string
          assessment_scale: string | null
          assessment_score: number | null
          id: string
          main_symptoms: string | null
          medication_history: string | null
          problem_duration: string | null
          profile_id: string
          psychiatric_history: string | null
          reason_for_visit: string | null
          risk_level: string | null
          updated_at: string
        }
        Insert: {
          assessed_at?: string
          assessed_by: string
          assessment_scale?: string | null
          assessment_score?: number | null
          id?: string
          main_symptoms?: string | null
          medication_history?: string | null
          problem_duration?: string | null
          profile_id: string
          psychiatric_history?: string | null
          reason_for_visit?: string | null
          risk_level?: string | null
          updated_at?: string
        }
        Update: {
          assessed_at?: string
          assessed_by?: string
          assessment_scale?: string | null
          assessment_score?: number | null
          id?: string
          main_symptoms?: string | null
          medication_history?: string | null
          problem_duration?: string | null
          profile_id?: string
          psychiatric_history?: string | null
          reason_for_visit?: string | null
          risk_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychological_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "psychological_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_attachments: {
        Row: {
          file_name: string
          file_type: string
          file_url: string
          id: string
          profile_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_type: string
          file_url: string
          id?: string
          profile_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          profile_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychological_attachments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "psychological_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          performed_at: string
          performed_by: string
          profile_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by: string
          profile_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psychological_audit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "psychological_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_profiles: {
        Row: {
          academic_year: string | null
          created_at: string
          created_by: string
          disability_type: string | null
          faculty: string | null
          id: string
          phone: string | null
          referral_source: string | null
          status: string
          student_name: string
          university_id: string
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          created_by: string
          disability_type?: string | null
          faculty?: string | null
          id?: string
          phone?: string | null
          referral_source?: string | null
          status?: string
          student_name: string
          university_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          created_by?: string
          disability_type?: string | null
          faculty?: string | null
          id?: string
          phone?: string | null
          referral_source?: string | null
          status?: string
          student_name?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      psychological_sessions: {
        Row: {
          created_at: string
          created_by: string
          duration_minutes: number
          homework: string | null
          id: string
          improvement_rating: number | null
          private_notes: string | null
          profile_id: string
          session_date: string
          session_type: string
          summary: string | null
          techniques_used: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duration_minutes?: number
          homework?: string | null
          id?: string
          improvement_rating?: number | null
          private_notes?: string | null
          profile_id: string
          session_date: string
          session_type?: string
          summary?: string | null
          techniques_used?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duration_minutes?: number
          homework?: string | null
          id?: string
          improvement_rating?: number | null
          private_notes?: string | null
          profile_id?: string
          session_date?: string
          session_type?: string
          summary?: string | null
          techniques_used?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychological_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "psychological_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          assessed_at: string
          assessed_by: string
          created_at: string
          encounter_id: string | null
          id: string
          notes: string | null
          patient_id: string
          previous_attempts: number | null
          risk_level: string
          safety_plan_details: string | null
          safety_plan_documented: boolean | null
          suicidal_ideation: boolean | null
          suicide_intent: boolean | null
          suicide_means: boolean | null
          suicide_plan: boolean | null
          violence_risk: string | null
        }
        Insert: {
          assessed_at?: string
          assessed_by: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          previous_attempts?: number | null
          risk_level?: string
          safety_plan_details?: string | null
          safety_plan_documented?: boolean | null
          suicidal_ideation?: boolean | null
          suicide_intent?: boolean | null
          suicide_means?: boolean | null
          suicide_plan?: boolean | null
          violence_risk?: string | null
        }
        Update: {
          assessed_at?: string
          assessed_by?: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          previous_attempts?: number | null
          risk_level?: string
          safety_plan_details?: string | null
          safety_plan_documented?: boolean | null
          suicidal_ideation?: boolean | null
          suicide_intent?: boolean | null
          suicide_means?: boolean | null
          suicide_plan?: boolean | null
          violence_risk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      therapist_availability_slots: {
        Row: {
          booking_window_days: number
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          provider_id: string
          slot_duration_minutes: number
          start_time: string
          updated_at: string
        }
        Insert: {
          booking_window_days?: number
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          provider_id: string
          slot_duration_minutes?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          booking_window_days?: number
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          provider_id?: string
          slot_duration_minutes?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      therapist_leaves: {
        Row: {
          created_at: string
          end_date: string
          id: string
          provider_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          provider_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          provider_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: []
      }
      training_content: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          order_index: number | null
          title: string
          type: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          order_index?: number | null
          title: string
          type: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_required: boolean | null
          order_index: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          options: Json
          order_index: number | null
          points: number | null
          question: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          options?: Json
          order_index?: number | null
          points?: number | null
          question: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          options?: Json
          order_index?: number | null
          points?: number | null
          question?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "training_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean | null
          max_attempts: number | null
          order_index: number | null
          passing_score: number
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          max_attempts?: number | null
          order_index?: number | null
          passing_score?: number
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          max_attempts?: number | null
          order_index?: number | null
          passing_score?: number
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          created_at: string
          created_by: string
          expected_sessions: number | null
          id: string
          long_term_goals: string | null
          plan_status: string
          preliminary_diagnosis: string | null
          profile_id: string
          short_term_goals: string | null
          therapeutic_approach: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expected_sessions?: number | null
          id?: string
          long_term_goals?: string | null
          plan_status?: string
          preliminary_diagnosis?: string | null
          profile_id: string
          short_term_goals?: string | null
          therapeutic_approach?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expected_sessions?: number | null
          id?: string
          long_term_goals?: string | null
          plan_status?: string
          preliminary_diagnosis?: string | null
          profile_id?: string
          short_term_goals?: string | null
          therapeutic_approach?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "psychological_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_applications: {
        Row: {
          academic_year: string
          availability: Json | null
          created_at: string
          emergency_contact_name: string
          emergency_contact_phone: string
          faculty_id: string
          family_name: string
          father_name: string
          first_name: string
          grandfather_name: string
          id: string
          interests: string[] | null
          major_id: string
          motivation: string
          phone_number: string
          previous_experience: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills: string[] | null
          status: Database["public"]["Enums"]["application_status"]
          university_email: string
          university_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year: string
          availability?: Json | null
          created_at?: string
          emergency_contact_name: string
          emergency_contact_phone: string
          faculty_id: string
          family_name: string
          father_name: string
          first_name: string
          grandfather_name: string
          id?: string
          interests?: string[] | null
          major_id: string
          motivation: string
          phone_number: string
          previous_experience?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["application_status"]
          university_email: string
          university_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_year?: string
          availability?: Json | null
          created_at?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          faculty_id?: string
          family_name?: string
          father_name?: string
          first_name?: string
          grandfather_name?: string
          id?: string
          interests?: string[] | null
          major_id?: string
          motivation?: string
          phone_number?: string
          previous_experience?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["application_status"]
          university_email?: string
          university_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_applications_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_courses: {
        Row: {
          course_code: string
          course_name: string
          created_at: string
          day_of_week: string
          end_time: string
          id: string
          location: string | null
          semester_id: string
          start_time: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          course_code: string
          course_name: string
          created_at?: string
          day_of_week: string
          end_time: string
          id?: string
          location?: string | null
          semester_id: string
          start_time: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          course_code?: string
          course_name?: string
          created_at?: string
          day_of_week?: string
          end_time?: string
          id?: string
          location?: string | null
          semester_id?: string
          start_time?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_courses_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "academic_semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_courses_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string
          volunteer_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          started_at?: string
          volunteer_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "training_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_quiz_attempts_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_training_progress: {
        Row: {
          completed_at: string
          content_id: string | null
          course_id: string
          id: string
          volunteer_id: string
        }
        Insert: {
          completed_at?: string
          content_id?: string | null
          course_id: string
          id?: string
          volunteer_id: string
        }
        Update: {
          completed_at?: string
          content_id?: string | null
          course_id?: string
          id?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_training_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "training_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_training_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_training_progress_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          application_id: string
          created_at: string
          id: string
          is_active: boolean | null
          opportunities_completed: number | null
          rating: number | null
          schedule_submitted_at: string | null
          schedule_submitted_for_semester: string | null
          total_hours: number | null
          updated_at: string
          user_id: string
          volunteer_type: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          opportunities_completed?: number | null
          rating?: number | null
          schedule_submitted_at?: string | null
          schedule_submitted_for_semester?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id: string
          volunteer_type?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          opportunities_completed?: number | null
          rating?: number | null
          schedule_submitted_at?: string | null
          schedule_submitted_for_semester?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id?: string
          volunteer_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "volunteer_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteers_schedule_submitted_for_semester_fkey"
            columns: ["schedule_submitted_for_semester"]
            isOneToOne: false
            referencedRelation: "academic_semesters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_assign_all_pending_exams: {
        Args: { _assigned_by: string }
        Returns: Json
      }
      auto_assign_volunteer_for_exam: {
        Args: { _assigned_by: string; _assigned_role: string; _exam_id: string }
        Returns: Json
      }
      check_volunteer_exam_conflict: {
        Args: {
          _end_time: string
          _exam_date: string
          _exclude_assignment_id?: string
          _start_time: string
          _volunteer_id: string
        }
        Returns: boolean
      }
      generate_achievement_cert_number: { Args: never; Returns: string }
      generate_badge_code: { Args: never; Returns: string }
      generate_certificate_number: { Args: never; Returns: string }
      generate_file_number:
        | { Args: never; Returns: string }
        | {
            Args: { _first_letter?: string; _semester?: number; _year?: string }
            Returns: string
          }
      get_application_faculty_id: {
        Args: { _application_id: string }
        Returns: string
      }
      get_available_volunteers_for_exam: {
        Args: { _end_time: string; _exam_date: string; _start_time: string }
        Returns: {
          availability_score: number
          full_name: string
          user_id: string
          volunteer_id: string
          volunteer_type: string
        }[]
      }
      get_user_faculty_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_volunteer_faculty_id: {
        Args: { _volunteer_id: string }
        Returns: string
      }
      get_volunteer_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clinic_coordinator: { Args: { _user_id: string }; Returns: boolean }
      is_disability_coordinator: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_faculty_coordinator: {
        Args: { _faculty_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      application_status: "pending" | "approved" | "rejected" | "waitlisted"
      disability_exam_status:
        | "pending"
        | "assigned"
        | "confirmed"
        | "completed"
        | "cancelled"
      opportunity_status: "draft" | "published" | "completed"
      special_need_type:
        | "reader"
        | "extra_time"
        | "companion"
        | "scribe"
        | "separate_room"
        | "assistive_technology"
        | "other"
      time_slot: "morning" | "afternoon" | "evening"
      user_role:
        | "admin"
        | "supervisor"
        | "volunteer"
        | "disability_coordinator"
        | "psychologist"
        | "clinic_coordinator"
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
      application_status: ["pending", "approved", "rejected", "waitlisted"],
      disability_exam_status: [
        "pending",
        "assigned",
        "confirmed",
        "completed",
        "cancelled",
      ],
      opportunity_status: ["draft", "published", "completed"],
      special_need_type: [
        "reader",
        "extra_time",
        "companion",
        "scribe",
        "separate_room",
        "assistive_technology",
        "other",
      ],
      time_slot: ["morning", "afternoon", "evening"],
      user_role: [
        "admin",
        "supervisor",
        "volunteer",
        "disability_coordinator",
        "psychologist",
        "clinic_coordinator",
      ],
    },
  },
} as const

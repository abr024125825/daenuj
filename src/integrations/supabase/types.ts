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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
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
      user_role: "admin" | "supervisor" | "volunteer" | "disability_coordinator"
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
      user_role: ["admin", "supervisor", "volunteer", "disability_coordinator"],
    },
  },
} as const

/**
 * Database type definitions for Supabase
 *
 * This file will be auto-generated once we run `supabase gen types typescript`
 * For now, we define the structure manually based on our schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          year: number
          name: string
          event_date: string | null
          submission_opens_at: string | null
          submission_closes_at: string | null
          edit_deadline_at: string | null
          judge_signup_opens_at: string | null
          judge_signup_closes_at: string | null
          status: 'setup' | 'accepting_submissions' | 'reviewing' | 'assignments' | 'live' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          year: number
          name: string
          event_date?: string | null
          submission_opens_at?: string | null
          submission_closes_at?: string | null
          edit_deadline_at?: string | null
          judge_signup_opens_at?: string | null
          judge_signup_closes_at?: string | null
          status?: 'setup' | 'accepting_submissions' | 'reviewing' | 'assignments' | 'live' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          year?: number
          name?: string
          event_date?: string | null
          submission_opens_at?: string | null
          submission_closes_at?: string | null
          edit_deadline_at?: string | null
          judge_signup_opens_at?: string | null
          judge_signup_closes_at?: string | null
          status?: 'setup' | 'accepting_submissions' | 'reviewing' | 'assignments' | 'live' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          department: string | null
          affiliation: string | null
          phone: string | null
          avatar_url: string | null
          is_admin: boolean
          is_presenter: boolean
          is_judge: boolean
          points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          department?: string | null
          affiliation?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_presenter?: boolean
          is_judge?: boolean
          points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          department?: string | null
          affiliation?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_presenter?: boolean
          is_judge?: boolean
          points?: number
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          event_id: string
          user_id: string | null
          presentation_id: string | null
          first_name: string
          last_name: string
          email: string
          classification: string | null
          department: string | null
          title: string
          abstract: string
          authors: string | null
          mentors: string[] | null
          affiliations: string[] | null
          funding: string | null
          research_type: 'Foundational Research' | 'Translational Research' | 'Veterinary Clinical Research' | 'Social Sciences/Pedagogy Research' | null
          research_stage: 'Early' | 'Advanced' | null
          preferred_presentation_type: 'Oral' | 'Poster' | 'No preference' | null
          presentation_type: 'Oral' | 'Poster' | 'Undergrad Poster' | null
          presentation_time: string | null
          presentation_location: string | null
          status: 'draft' | 'submitted' | 'under_review' | 'changes_requested' | 'accepted' | 'rejected' | 'withdrawn'
          status_changed_at: string | null
          status_changed_by: string | null
          withdrawn_at: string | null
          withdrawn_reason: string | null
          withdrawn_by: string | null
          admin_notes: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id?: string | null
          presentation_id?: string | null
          first_name: string
          last_name: string
          email: string
          classification?: string | null
          department?: string | null
          title: string
          abstract: string
          authors?: string | null
          mentors?: string[] | null
          affiliations?: string[] | null
          funding?: string | null
          research_type?: 'Foundational Research' | 'Translational Research' | 'Veterinary Clinical Research' | 'Social Sciences/Pedagogy Research' | null
          research_stage?: 'Early' | 'Advanced' | null
          preferred_presentation_type?: 'Oral' | 'Poster' | 'No preference' | null
          presentation_type?: 'Oral' | 'Poster' | 'Undergrad Poster' | null
          presentation_time?: string | null
          presentation_location?: string | null
          status?: 'draft' | 'submitted' | 'under_review' | 'changes_requested' | 'accepted' | 'rejected' | 'withdrawn'
          status_changed_at?: string | null
          status_changed_by?: string | null
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
          withdrawn_by?: string | null
          admin_notes?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string | null
          presentation_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          classification?: string | null
          department?: string | null
          title?: string
          abstract?: string
          authors?: string | null
          mentors?: string[] | null
          affiliations?: string[] | null
          funding?: string | null
          research_type?: 'Foundational Research' | 'Translational Research' | 'Veterinary Clinical Research' | 'Social Sciences/Pedagogy Research' | null
          research_stage?: 'Early' | 'Advanced' | null
          preferred_presentation_type?: 'Oral' | 'Poster' | 'No preference' | null
          presentation_type?: 'Oral' | 'Poster' | 'Undergrad Poster' | null
          presentation_time?: string | null
          presentation_location?: string | null
          status?: 'draft' | 'submitted' | 'under_review' | 'changes_requested' | 'accepted' | 'rejected' | 'withdrawn'
          status_changed_at?: string | null
          status_changed_by?: string | null
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
          withdrawn_by?: string | null
          admin_notes?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      judge_registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string
          preferred_email: string | null
          phone: string | null
          available_sessions: string[] | null
          expertise_areas: string[] | null
          max_presentations: number
          prefers_oral: boolean
          prefers_poster: boolean
          conflict_emails: string[] | null
          conflict_notes: string | null
          status: 'registered' | 'confirmed' | 'withdrawn'
          withdrawn_at: string | null
          withdrawn_reason: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          preferred_email?: string | null
          phone?: string | null
          available_sessions?: string[] | null
          expertise_areas?: string[] | null
          max_presentations?: number
          prefers_oral?: boolean
          prefers_poster?: boolean
          conflict_emails?: string[] | null
          conflict_notes?: string | null
          status?: 'registered' | 'confirmed' | 'withdrawn'
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          preferred_email?: string | null
          phone?: string | null
          available_sessions?: string[] | null
          expertise_areas?: string[] | null
          max_presentations?: number
          prefers_oral?: boolean
          prefers_poster?: boolean
          conflict_emails?: string[] | null
          conflict_notes?: string | null
          status?: 'registered' | 'confirmed' | 'withdrawn'
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      judge_assignments: {
        Row: {
          id: string
          event_id: string
          submission_id: string
          judge_id: string
          assignment_order: number | null
          status: 'assigned' | 'notified' | 'scoring' | 'completed'
          notified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          submission_id: string
          judge_id: string
          assignment_order?: number | null
          status?: 'assigned' | 'notified' | 'scoring' | 'completed'
          notified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          submission_id?: string
          judge_id?: string
          assignment_order?: number | null
          status?: 'assigned' | 'notified' | 'scoring' | 'completed'
          notified_at?: string | null
          created_at?: string
        }
      }
      scores: {
        Row: {
          id: string
          event_id: string
          submission_id: string
          judge_id: string
          assignment_id: string | null
          criteria: Json
          weighted_total: number | null
          is_no_show: boolean
          submitted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          submission_id: string
          judge_id: string
          assignment_id?: string | null
          criteria: Json
          weighted_total?: number | null
          is_no_show?: boolean
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          submission_id?: string
          judge_id?: string
          assignment_id?: string | null
          criteria?: Json
          weighted_total?: number | null
          is_no_show?: boolean
          submitted_at?: string
          updated_at?: string
        }
      }
      withdrawal_requests: {
        Row: {
          id: string
          event_id: string
          request_type: 'presenter' | 'judge'
          submission_id: string | null
          judge_registration_id: string | null
          user_id: string | null
          reason: string | null
          requested_at: string
          requested_via: 'self_service' | 'email' | 'phone' | null
          status: 'pending' | 'approved' | 'denied'
          processed_by: string | null
          processed_at: string | null
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          request_type: 'presenter' | 'judge'
          submission_id?: string | null
          judge_registration_id?: string | null
          user_id?: string | null
          reason?: string | null
          requested_at?: string
          requested_via?: 'self_service' | 'email' | 'phone' | null
          status?: 'pending' | 'approved' | 'denied'
          processed_by?: string | null
          processed_at?: string | null
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          request_type?: 'presenter' | 'judge'
          submission_id?: string | null
          judge_registration_id?: string | null
          user_id?: string | null
          reason?: string | null
          requested_at?: string
          requested_via?: 'self_service' | 'email' | 'phone' | null
          status?: 'pending' | 'approved' | 'denied'
          processed_by?: string | null
          processed_at?: string | null
          admin_notes?: string | null
          created_at?: string
        }
      }
      event_config: {
        Row: {
          id: string
          event_id: string
          config_key: string
          config_value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          config_key: string
          config_value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          config_key?: string
          config_value?: Json
          created_at?: string
          updated_at?: string
        }
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
  }
}

// Convenience types
export type Event = Database['public']['Tables']['events']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Submission = Database['public']['Tables']['submissions']['Row']
export type JudgeRegistration = Database['public']['Tables']['judge_registrations']['Row']
export type JudgeAssignment = Database['public']['Tables']['judge_assignments']['Row']
export type Score = Database['public']['Tables']['scores']['Row']
export type WithdrawalRequest = Database['public']['Tables']['withdrawal_requests']['Row']
export type EventConfig = Database['public']['Tables']['event_config']['Row']

// Insert types
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type SubmissionInsert = Database['public']['Tables']['submissions']['Insert']
export type JudgeRegistrationInsert = Database['public']['Tables']['judge_registrations']['Insert']
export type JudgeAssignmentInsert = Database['public']['Tables']['judge_assignments']['Insert']
export type ScoreInsert = Database['public']['Tables']['scores']['Insert']
export type WithdrawalRequestInsert = Database['public']['Tables']['withdrawal_requests']['Insert']
export type EventConfigInsert = Database['public']['Tables']['event_config']['Insert']

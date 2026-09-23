/**
 * Database type definitions for Supabase.
 *
 * Kept in sync manually with `supabase/schema.sql`. Regenerate with
 * `supabase gen types typescript` once we're wired to the Supabase CLI.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole =
  | 'submitter'
  | 'mentor'
  | 'judge'
  | 'admin'
  | 'volunteer'

export type SubmissionStatus = 'draft' | 'submitted' | 'finalized' | 'withdrawn'

export type PreferredPresentationType =
  | 'Oral only'
  | 'Prefer oral'
  | 'Poster only'
  | 'No preference'

export type SessionPreference = 'Early' | 'Late' | 'No preference'

export type Database = {
  // Required by @supabase/supabase-js v2 for schema-aware typing.
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          short_name: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          short_name?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          short_name?: string | null
          sort_order?: number
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          department_id: string | null
          classification: string | null
          phone: string | null
          is_green_labs_ambassador: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          department_id?: string | null
          classification?: string | null
          phone?: string | null
          is_green_labs_ambassador?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          department_id?: string | null
          classification?: string | null
          phone?: string | null
          is_green_labs_ambassador?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      faculty: {
        Row: {
          id: string
          full_name: string
          email: string | null
          department_id: string | null
          my_green_labs_certified: boolean
          green_paw_certified: boolean
          is_active: boolean
          profile_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email?: string | null
          department_id?: string | null
          my_green_labs_certified?: boolean
          green_paw_certified?: boolean
          is_active?: boolean
          profile_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          department_id?: string | null
          my_green_labs_certified?: boolean
          green_paw_certified?: boolean
          is_active?: boolean
          profile_id?: string | null
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role: UserRole
          granted_at: string
          granted_by: string | null
        }
        Insert: {
          user_id: string
          role: UserRole
          granted_at?: string
          granted_by?: string | null
        }
        Update: {
          user_id?: string
          role?: UserRole
          granted_at?: string
          granted_by?: string | null
        }
      }
      events: {
        Row: {
          id: string
          year: number
          name: string
          event_date: string | null
          submission_opens_at: string | null
          submission_closes_at: string | null
          finalize_deadline_at: string | null
          is_active: boolean
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
          finalize_deadline_at?: string | null
          is_active?: boolean
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
          finalize_deadline_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          event_id: string
          submitter_id: string
          classification: string | null
          department_id: string | null
          title: string
          abstract: string
          research_type: string | null
          research_stage: string | null
          funding: string | null
          affiliations: string[] | null
          preferred_presentation_type: PreferredPresentationType | null
          session_preference: SessionPreference | null
          previously_presented: boolean | null
          previous_format: 'Oral' | 'Poster' | null
          status: SubmissionStatus
          submitted_at: string | null
          finalized_at: string | null
          withdrawn_at: string | null
          withdrawn_reason: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          submitter_id: string
          classification?: string | null
          department_id?: string | null
          title?: string
          abstract?: string
          research_type?: string | null
          research_stage?: string | null
          funding?: string | null
          affiliations?: string[] | null
          preferred_presentation_type?: PreferredPresentationType | null
          session_preference?: SessionPreference | null
          previously_presented?: boolean | null
          previous_format?: 'Oral' | 'Poster' | null
          status?: SubmissionStatus
          submitted_at?: string | null
          finalized_at?: string | null
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          submitter_id?: string
          classification?: string | null
          department_id?: string | null
          title?: string
          abstract?: string
          research_type?: string | null
          research_stage?: string | null
          funding?: string | null
          affiliations?: string[] | null
          preferred_presentation_type?: PreferredPresentationType | null
          session_preference?: SessionPreference | null
          previously_presented?: boolean | null
          previous_format?: 'Oral' | 'Poster' | null
          status?: SubmissionStatus
          submitted_at?: string | null
          finalized_at?: string | null
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      submission_authors: {
        Row: {
          id: string
          submission_id: string
          position: number
          profile_id: string | null
          faculty_id: string | null
          display_name: string | null
          is_presenter: boolean
          is_mentor: boolean
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          position: number
          profile_id?: string | null
          faculty_id?: string | null
          display_name?: string | null
          is_presenter?: boolean
          is_mentor?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          position?: number
          profile_id?: string | null
          faculty_id?: string | null
          display_name?: string | null
          is_presenter?: boolean
          is_mentor?: boolean
          created_at?: string
        }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}

// Convenience row types
export type Department       = Database['public']['Tables']['departments']['Row']
export type Profile          = Database['public']['Tables']['profiles']['Row']
export type Faculty          = Database['public']['Tables']['faculty']['Row']
export type UserRoleRow      = Database['public']['Tables']['user_roles']['Row']
export type Event            = Database['public']['Tables']['events']['Row']
export type Submission       = Database['public']['Tables']['submissions']['Row']
export type SubmissionAuthor = Database['public']['Tables']['submission_authors']['Row']

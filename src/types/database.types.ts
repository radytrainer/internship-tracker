export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'admin' | 'career_staff' | 'trainer' | 'student' | 'education_team' | 'ero_team'
export type Gender = 'Male' | 'Female'
export type StudentStatus =
  | 'Studying'
  | 'Looking For Internship'
  | 'Internship Applied'
  | 'Interview Scheduled'
  | 'Internship Accepted'
  | 'Internship Active'
  | 'Internship Completed'
  | 'Looking For Job'
  | 'Employed'
export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Interview Scheduled'
  | 'Interview Passed'
  | 'Interview Failed'
  | 'Accepted'
  | 'Rejected'
export type InterviewType = 'Online' | 'On Site'
export type InterviewResult = 'Pending' | 'Passed' | 'Failed'
export type InternshipStatus = 'Active' | 'Completed' | 'Terminated'
export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract'
export type EmploymentStatus = 'Active' | 'Resigned' | 'Terminated'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  student_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Generation {
  id: string
  name: string
  year: number
  created_at: string
}

export interface Class {
  id: string
  name: string
  generation_id: string | null
  trainer_id: string | null
  education_staff_id: string | null
  created_at: string
  // joined
  generation?: Generation
  trainer?: Profile
  education_staff?: Profile
}

export interface Student {
  id: string
  student_code: string
  first_name: string
  last_name: string
  gender: Gender
  phone: string | null
  email: string | null
  class_id: string | null
  generation_id: string | null
  status: StudentStatus
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  class?: Class
  generation?: Generation
}

export type OutreachStatus = 'not_contacted' | 'contacted' | 'follow_up' | 'confirmed' | 'declined'

export interface Company {
  id: string
  company_name: string
  industry: string | null
  address: string | null
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  max_students_per_company: number
  is_visible: boolean
  has_mou: boolean
  is_blacklisted: boolean
  outreach_status: OutreachStatus
  last_contacted_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // computed
  _position_count?: number
  _application_count?: number
}

export type PositionType = 'Internship' | 'Full-Time Job'

export interface CompanyPosition {
  id: string
  company_id: string
  position_name: string
  position_type: PositionType
  max_students: number
  intake_date: string | null
  description: string | null
  is_active: boolean
  created_at: string
  // joined
  company?: Company
  // computed
  _current_applications?: number
}

export interface InternshipApplication {
  id: string
  student_id: string
  company_id: string
  position_id: string
  application_date: string
  application_status: ApplicationStatus
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  student?: Student
  company?: Company
  position?: CompanyPosition
  interview?: Interview
}

export interface Interview {
  id: string
  application_id: string
  interview_date: string
  interview_time: string | null
  interview_type: InterviewType
  location: string | null
  result: InterviewResult
  feedback: string | null
  interviewer: string | null
  created_at: string
  updated_at: string
  // joined
  application?: InternshipApplication
}

export interface Internship {
  id: string
  student_id: string
  company_id: string
  position: string
  allowance: number | null
  start_date: string | null
  end_date: string | null
  agreement_signed: boolean
  agreement_signed_date: string | null
  agreement_file_url: string | null
  supervisor: string | null
  supervisor_phone: string | null
  supervisor_email: string | null
  tutor: string | null
  internship_status: InternshipStatus
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  student?: Student
  company?: Company
}

export interface EmploymentRecord {
  id: string
  student_id: string
  company_name: string
  position: string
  employment_type: EmploymentType
  salary: number | null
  start_date: string | null
  end_date: string | null
  employment_status: EmploymentStatus
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  student?: Student
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'

export interface StudentLeave {
  id: string
  student_id: string
  internship_id: string | null
  start_date: string
  end_date: string
  reason: string | null
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  student?: Student
  internship?: Internship
  reviewer?: Profile
}

export interface AllowancePayment {
  id: string
  student_id: string
  internship_id: string | null
  amount: number
  payment_date: string
  payment_time: string | null
  confirmed_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  student?: Student
  internship?: Internship
  confirmer?: Profile
}

export interface DashboardKPIs {
  total_students: number
  looking_for_internship: number
  internship_applied: number
  interview_scheduled: number
  internship_accepted: number
  internship_active: number
  internship_completed: number
  employed: number
  total_companies: number
  total_applications: number
  interviews_scheduled: number
  interviews_passed: number
}

export interface CapacityCheck {
  max_students: number
  current_count: number
  is_full: boolean
  available_slots: number
}

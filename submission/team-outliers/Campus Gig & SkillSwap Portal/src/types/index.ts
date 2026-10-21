export type GigCategory = 'Programming' | 'Design' | 'Writing' | 'Tutoring';

export type GigType = 'Offering' | 'Requesting';

export type PaymentType = 'Paid' | 'SkillSwap' | 'Free';

export type GigStatus = 'Open' | 'In Progress' | 'Completed' | 'Expired' | 'Cancelled';

export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected';

export interface User {
  id: string;
  name: string;
  major: string;
  semester: string;
  bio: string;
  skills: string[];
  avatarUrl?: string;
  createdAt?: string;
}

export interface Gig {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: GigType;
  category: GigCategory;
  payment_type: PaymentType;
  budget: number | null;
  deadline: string; // ISO date string
  status: GigStatus;
  accepted_applicant_id: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  gig_id: string;
  applicant_id: string;
  message: string;
  status: ApplicationStatus;
  created_at: string;
}

export interface Review {
  id: string;
  gig_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number; // 1-5
  comment: string;
  created_at?: string;
}

export interface UserStats {
  gigsPosted: number;
  gigsCompleted: number;
  averageRating: number | null;
  reviewCount: number;
}

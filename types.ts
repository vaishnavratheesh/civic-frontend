
export enum Role {
  CITIZEN = 'citizen',
  OFFICER = 'officer',
  COUNCILLOR = 'councillor',
  ADMIN = 'admin',
}

export enum ComplaintStatus {
  PENDING = 'Pending',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  REJECTED = 'Rejected',
}

export enum ApplicationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  ward: number;
  approved: boolean;
  token?: string;
  panchayath?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  ward: number;
  imageURL: string;
  issueType: string;
  description: string;
  location: { lat: number; lng: number };
  priorityScore: number;
  status: ComplaintStatus;
  assignedTo?: string;
  officerName?: string;
  source: 'user' | 'iot';
  createdAt: string;
  resolvedAt?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

export interface WelfareScheme {
  id: string;
  title: string;
  description: string;
  postedBy: string;
  ward: number;
  totalItems: number;
  createdAt: string;
}

export interface WelfareApplication {
  id: string;
  schemeId: string;
  schemeTitle: string;
  userId: string;
  userName: string;
  address: string;
  phoneNumber: string;
  rationCardNumber: string;
  aadharNumber: string;
  ward: number;
  reason: string;
  isHandicapped: boolean;
  isSingleWoman: boolean;
  familyIncome: number;
  dependents: number;
  status: ApplicationStatus;
  createdAt: string;
  score?: number;
  justification?: string;
}

export interface ForecastData {
  ward: number;
  date: string;
  complaintCount: number;
  predictedCount: number;
}
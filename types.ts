
export enum Role {
  CITIZEN = 'citizen',
  OFFICER = 'officer',
  COUNCILLOR = 'councillor',
  ADMIN = 'admin',
  PRESIDENT = 'president',
}

export enum ComplaintStatus {
  PENDING = 'Pending',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  REJECTED = 'Rejected',
}

export enum ApplicationStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  PENDING = 'Pending',
  UNDER_REVIEW = 'Under Review',
  VERIFIED = 'Verified',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  COMPLETED = 'Completed',
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
  address?: string;
  contactNumber?: string;
  location?: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
  };
  profilePicture?: string;
  registrationSource?: 'manual' | 'google';
  isVerified?: boolean;
  idProof?: {
    type?: 'aadhar' | 'voter_id' | 'driving_license' | 'ration_card' | 'passport';
    fileUrl?: string;
    uploadedAt?: string;
  };
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  ward: number;
  imageURL?: string;
  issueType: string;
  description: string;
  location: { lat: number; lng: number; address?: string };
  priorityScore: number;
  credibilityScore?: number;
  flags?: string[];
  status: ComplaintStatus;
  assignedTo?: string;
  officerName?: string;
  source: 'user' | 'iot';
  audit?: { submittedAt?: string; ip?: string; device?: string };
  createdAt: string;
  resolvedAt?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  duplicateGroupId?: string;
  duplicateCount?: number;
  attachments?: Array<{ url: string; type?: string }>;
}

export interface WelfareScheme {
  id: string;
  title: string;
  description: string;
  postedBy: string;
  ward: number;
  totalItems: number;
  // Additional optional fields used in UI
  creatorName?: string;
  availableSlots?: number;
  createdAt: string;
  // Additional properties for scheme management
  status?: 'active' | 'draft' | 'completed' | 'expired';
  totalSlots?: number;
  startDate?: string;
  endDate?: string;
  applicationDeadline?: string;
  requiredDocuments?: Array<{
    name: string;
    type: string;
    formats: string[];
  }>;
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
  documents?: Array<{
    name: string;
    url: string;
  }>;
}

export interface ForecastData {
  ward: number;
  date: string;
  complaintCount: number;
  predictedCount: number;
}

// Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: any) => google.maps.Map;
        Marker: new (options: any) => google.maps.Marker;
        Geocoder: new () => google.maps.Geocoder;
        places: {
          SearchBox: new (input: HTMLInputElement) => google.maps.places.SearchBox;
        };
        MapMouseEvent: any;
        LatLng: new (lat: number, lng: number) => google.maps.LatLng;
      };
    };
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: any);
      setCenter(latLng: LatLng): void;
      addListener(event: string, handler: Function): void;
    }
    
    class Marker {
      constructor(options: any);
      setPosition(latLng: LatLng): void;
      addListener(event: string, handler: Function): void;
    }
    
    class Geocoder {
      geocode(request: any): Promise<GeocoderResult>;
    }
    
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    
    interface GeocoderResult {
      results: Array<{
        formatted_address: string;
        geometry: {
          location: LatLng;
        };
      }>;
    }
    
    namespace places {
      class SearchBox {
        constructor(input: HTMLInputElement);
        addListener(event: string, handler: Function): void;
        getPlaces(): Array<{
          geometry?: {
            location?: LatLng;
          };
        }>;
      }
    }
  }
}
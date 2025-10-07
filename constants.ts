
import { ComplaintStatus, ApplicationStatus } from './types';

export const STATUS_COLORS: { [key in ComplaintStatus | ApplicationStatus]: string } = {
  // Complaint Status Colors
  [ComplaintStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ComplaintStatus.ASSIGNED]: 'bg-blue-100 text-blue-800',
  [ComplaintStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800',
  [ComplaintStatus.RESOLVED]: 'bg-green-100 text-green-800',
  [ComplaintStatus.REJECTED]: 'bg-red-100 text-red-800',

  // Application Status Colors
  [ApplicationStatus.DRAFT]: 'bg-gray-500 text-gray-800',
  [ApplicationStatus.SUBMITTED]: 'bg-blue-600 text-white',
  [ApplicationStatus.UNDER_REVIEW]: 'bg-yellow-600 text-white',
  [ApplicationStatus.VERIFIED]: 'bg-purple-600 text-white',
  [ApplicationStatus.APPROVED]: 'bg-green-600 text-white',
  [ApplicationStatus.COMPLETED]: 'bg-green-700 text-white',
  [ApplicationStatus.REJECTED]: 'bg-red-600 text-white',
};


export const ISSUE_TYPES = [
  'Waste Management',
  'Road Repair',
  'Streetlight Outage',
  'Water Leakage',
  'Public Nuisance',
  'Illegal Construction',
  'Other',
];

// Erumeli Panchayath has 23 wards
export const WARD_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

// Only Erumeli Panchayath data
export const PANCHAYATH_DATA = {
  'Erumeli Panchayath': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
};

export const PANCHAYATH_NAMES = Object.keys(PANCHAYATH_DATA);

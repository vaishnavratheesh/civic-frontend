
import { ComplaintStatus, ApplicationStatus } from './types';

export const STATUS_COLORS: { [key in ComplaintStatus | ApplicationStatus]: string } = {
  [ComplaintStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ComplaintStatus.ASSIGNED]: 'bg-blue-100 text-blue-800',
  [ComplaintStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800',
  [ComplaintStatus.RESOLVED]: 'bg-green-100 text-green-800',
  [ComplaintStatus.REJECTED]: 'bg-red-100 text-red-800',
  [ApplicationStatus.APPROVED]: 'bg-green-100 text-green-800',
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

export const WARD_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Panchayath/Municipality data with their corresponding wards
export const PANCHAYATH_DATA = {
  'Thiruvananthapuram Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Kochi Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  'Kozhikode Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  'Thrissur Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  'Kollam Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Alappuzha Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Palakkad Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Kannur Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Kottayam Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Malappuram Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Pathanamthitta Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Idukki Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Wayanad Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'Kasaragod Municipality': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

export const PANCHAYATH_NAMES = Object.keys(PANCHAYATH_DATA);

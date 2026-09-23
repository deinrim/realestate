export interface CurrentUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  roleCode: string;
  organizationId: number | null;
  isSystemAdmin: boolean;
  status: string;
}

export interface Organization {
  id: number;
  code: string;
  companyName: string;
  legalName: string;
  logoUrl?: string;
  website?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  gstin?: string;
  pan?: string;
  contactPerson: string;
  status: 'active' | 'suspended' | 'deactivated';
  subscriptionPlan: string;
  brandPrimaryColor?: string;
  brandAccentColor?: string;
  createdAt: string;
  stats?: {
    users: number;
    projects: number;
    units: number;
    bookings: number;
  };
}

export interface OrganizationSettings {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timezone: string;
  taxRateGst?: string;
  leadPrefix: string;
  bookingPrefix: string;
  receiptPrefix: string;
  customerPrefix: string;
  projectPrefix: string;
  invoiceHeader?: string;
  emailSignature?: string;
}

export interface Project {
  id: number;
  organizationId: number;
  name: string;
  code: string;
  projectType: string;
  address: string;
  city: string;
  state: string;
  location: string;
  description?: string;
  status: string;
  startDate?: string;
  expectedCompletion?: string;
  reraNumber?: string;
  reraDate?: string;
  developerDetails?: string;
  logoUrl?: string;
  towersCount?: number;
  totalUnits?: number;
  availableUnits?: number;
}

export interface Unit {
  id: number;
  unitNumber: string;
  unitType: string;
  floorNumber: number;
  bedrooms: number;
  bathrooms: number;
  balcony: number;
  parking: number;
  carpetArea: string;
  superBuiltUpArea: string;
  facing: string;
  basePrice: string;
  pricePerSqft: string;
  otherCharges: string;
  totalPrice: string;
  status: 'Available' | 'Enquiry' | 'Hold' | 'Blocked' | 'Negotiation' | 'Booked' | 'Agreement' | 'Registered' | 'Sold' | 'Cancelled' | 'Possession' | 'Handover';
  projectId: number;
  projectName?: string;
  towerId: number;
  towerName?: string;
}

export interface Lead {
  id: number;
  leadCode: string;
  name: string;
  mobile: string;
  email?: string;
  location?: string;
  source: string;
  campaign?: string;
  unitPreference?: string;
  budget?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Site Visit Scheduled' | 'Site Visit Completed' | 'Negotiation' | 'Booking' | 'Lost' | 'Converted';
  score: number;
  remarks?: string;
  projectId?: number;
  projectName?: string;
  assignedUserId?: number;
  assignedUserName?: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  customerCode: string;
  name: string;
  mobile: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  pan?: string;
  gstin?: string;
  occupation?: string;
  communicationPreference: string;
  bookingsCount?: number;
  totalPaid?: number;
  createdAt: string;
}

export interface Booking {
  id: number;
  bookingNumber: string;
  bookingDate: string;
  bookingAmount: string;
  totalConsideration: string;
  agreementValue: string;
  discountAmount: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Confirmed' | 'Cancelled';
  currentApprovalStep: number;
  customerName: string;
  customerMobile: string;
  projectName: string;
  unitNumber: string;
  unitType: string;
  salesUserName: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  receiptNumber: string;
  amount: string;
  paymentDate: string;
  paymentMode: string;
  referenceNumber?: string;
  bankName?: string;
  status: string;
  remarks?: string;
  customerName: string;
  bookingNumber: string;
  projectName: string;
  unitNumber: string;
  receivedByName?: string;
}

export interface SiteVisit {
  id: number;
  visitDate: string;
  visitTime: string;
  status: string;
  numberOfVisitors: number;
  transportRequired: boolean;
  feedback?: string;
  nextAction?: string;
  leadName?: string;
  leadMobile?: string;
  projectName: string;
  executiveName?: string;
}

export interface Complaint {
  id: number;
  ticketNumber: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  slaDays: number;
  resolution?: string;
  customerName: string;
  customerMobile: string;
  unitNumber?: string;
  projectName?: string;
  assignedUserName?: string;
  createdAt: string;
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  assignedUserName?: string;
  projectName?: string;
  createdAt: string;
}

export interface ChannelPartner {
  id: number;
  partnerCode: string;
  name: string;
  companyName?: string;
  mobile: string;
  email?: string;
  address?: string;
  pan?: string;
  gstin?: string;
  reraNumber?: string;
  commissionRate: string;
  status: string;
}

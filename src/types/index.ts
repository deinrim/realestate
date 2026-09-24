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

export interface MarketingCampaign {
  id: number;
  name: string;
  platform: 'Meta Ads' | 'Google Ads' | 'WhatsApp' | 'Instagram' | 'YouTube' | 'Website' | 'Hoardings';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Draft';
  leadsGenerated: number;
  qualifiedLeads: number;
  siteVisits: number;
  bookingsCount: number;
  revenueGenerated: number;
  cpl: number;
  roi: number;
  projectName: string;
}

export interface FinanceTransaction {
  id: number;
  type: 'Income' | 'Expense';
  category: string; // 'Customer Booking', 'Installment', 'Vendor Payout', 'Civil Material', 'Architect/Legal', 'Marketing Spend', 'Site Utilities'
  amount: number;
  date: string;
  referenceNumber: string;
  paymentMode: string;
  projectName: string;
  payeeOrPayer: string;
  status: 'Cleared' | 'Pending' | 'Reconciled';
  description?: string;
}

export interface Vendor {
  id: number;
  vendorCode: string;
  name: string;
  category: 'Steel & Cement' | 'Electrical & Plumbing' | 'RMC & Aggregates' | 'Tiles & Sanitary' | 'Elevators & MEP' | 'Safety & Tools';
  contactPerson: string;
  mobile: string;
  email: string;
  gstin: string;
  pan: string;
  address: string;
  bankDetails: string;
  rating: number;
  status: 'Active' | 'Under Review' | 'Blacklisted';
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendorName: string;
  projectName: string;
  orderDate: string;
  deliveryDueDate: string;
  totalAmount: number;
  status: 'Draft' | 'Requested' | 'Approved' | 'PO Issued' | 'Goods Received (GRN)' | 'Invoiced' | 'Paid';
  itemsCount: number;
  itemsSummary: string;
}

export interface MaterialInventoryItem {
  id: number;
  itemCode: string;
  name: string;
  category: 'Cement' | 'Steel' | 'Sand & Aggregates' | 'Bricks & Blocks' | 'Tiles & Marble' | 'Electrical & Conduit' | 'Plumbing & PVC' | 'Paint & Primer';
  unitOfMeasure: 'Bags' | 'MT' | 'CFT' | 'Nos' | 'Sq.Ft' | 'Meters' | 'Liters';
  currentStock: number;
  minimumStock: number;
  reorderQuantity: number;
  unitCost: number;
  totalValuation: number;
  location: string;
  projectName: string;
  status: 'In Stock' | 'Low Stock' | 'Critical Reorder';
}

export interface Employee {
  id: number;
  empCode: string;
  name: string;
  department: 'Sales & CRM' | 'Civil Engineering' | 'Accounts & Finance' | 'Legal & Liaison' | 'Architecture' | 'Site Quality' | 'HR & Admin';
  designation: string;
  mobile: string;
  email: string;
  joiningDate: string;
  monthlySalary: number;
  attendanceRate: number;
  status: 'Active' | 'On Leave' | 'Resigned';
}

export interface AttendanceRecord {
  id: number;
  empCode: string;
  empName: string;
  date: string;
  status: 'Present' | 'Late' | 'Half Day' | 'On Leave' | 'Absent';
  checkInTime?: string;
  checkOutTime?: string;
  siteOrOffice: string;
}

export interface ConstructionMilestone {
  id: number;
  stageName: 'Foundation & Plinth' | 'Basement & Podium' | 'RCC Slab Casting' | 'Brickwork & Plastering' | 'Electrical & Plumbing MEP' | 'Flooring & Tiling' | 'Finishing & Painting' | 'Occupancy Certificate (OC)' | 'Handover & Possession';
  order: number;
  projectName: string;
  towerName: string;
  plannedCompletionDate: string;
  actualCompletionDate?: string;
  progressPercentage: number;
  status: 'Completed' | 'In Progress' | 'Upcoming' | 'Delayed';
  architectCertificateNo?: string;
  photoUrl?: string;
}

export interface DailySiteReport {
  id: number;
  reportDate: string;
  projectName: string;
  siteEngineer: string;
  weather: 'Clear' | 'Rainy' | 'Overcast';
  workforceCount: number;
  concretePouredCubicMeters: number;
  activitiesCompleted: string;
  safetyIncidents: number;
  equipmentActive: string;
  photoCount: number;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  triggerEvent: string;
  templateText: string;
  variables: string[];
}


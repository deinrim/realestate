import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core';

// -------------------------------------------------------------
// 1. ORGANIZATIONS & SETTINGS (MULTI-TENANCY)
// -------------------------------------------------------------
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. "SRIJAN", "ORGA", etc.
  companyName: text('company_name').notNull(),
  legalName: text('legal_name').notNull(),
  logoUrl: text('logo_url'),
  website: text('website'),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  country: text('country').notNull().default('India'),
  gstin: text('gstin'),
  pan: text('pan'),
  contactPerson: text('contact_person').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'suspended' | 'deactivated'
  subscriptionPlan: text('subscription_plan').notNull().default('Enterprise'),
  brandPrimaryColor: text('brand_primary_color').default('#0f172a'),
  brandAccentColor: text('brand_accent_color').default('#0284c7'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organizationSettings = pgTable('organization_settings', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  currency: text('currency').default('INR').notNull(),
  currencySymbol: text('currency_symbol').default('₹').notNull(),
  dateFormat: text('date_format').default('DD/MM/YYYY').notNull(),
  timezone: text('timezone').default('Asia/Kolkata').notNull(),
  taxRateGst: numeric('tax_rate_gst', { precision: 5, scale: 2 }).default('5.00'),
  leadPrefix: text('lead_prefix').default('LEAD-').notNull(),
  bookingPrefix: text('booking_prefix').default('BK-').notNull(),
  receiptPrefix: text('receipt_prefix').default('RCT-').notNull(),
  customerPrefix: text('customer_prefix').default('CUS-').notNull(),
  projectPrefix: text('project_prefix').default('PRJ-').notNull(),
  invoiceHeader: text('invoice_header'),
  emailSignature: text('email_signature'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  phone: text('phone'),
  email: text('email'),
  isHeadOffice: boolean('is_head_office').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 2. ROLES, PERMISSIONS & USERS
// -------------------------------------------------------------
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id), // Nullable for system-wide roles
  name: text('name').notNull(),
  code: text('code').notNull(), // 'system_admin' | 'org_admin' | 'management' | 'sales_manager' | 'sales_executive' | 'crm_manager' | 'accounts' | 'legal' | 'project_manager' | 'reception' | 'channel_partner_manager' | custom
  description: text('description'),
  isSystemRole: boolean('is_system_role').default(false),
  permissions: jsonb('permissions').$type<string[]>().default([]), // array of permission keys e.g. ["leads:view", "leads:create", "bookings:approve"]
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or system seed uid
  organizationId: integer('organization_id').references(() => organizations.id), // Nullable for global System Administrator
  name: text('name').notNull(),
  email: text('email').notNull(),
  mobile: text('mobile'),
  employeeId: text('employee_id'),
  roleId: integer('role_id').references(() => roles.id),
  roleCode: text('role_code').notNull().default('sales_executive'),
  departmentId: integer('department_id').references(() => departments.id),
  branchId: integer('branch_id').references(() => branches.id),
  designation: text('designation'),
  managerId: integer('manager_id'),
  profilePhotoUrl: text('profile_photo_url'),
  status: text('status').notNull().default('active'), // 'active' | 'inactive' | 'suspended'
  isSystemAdmin: boolean('is_system_admin').default(false),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 3. PROJECTS & INVENTORY
// -------------------------------------------------------------
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  projectType: text('project_type').notNull().default('Residential'), // Residential | Commercial | Plotted | Mixed
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  location: text('location').notNull(),
  description: text('description'),
  status: text('status').notNull().default('Under Construction'), // Planning | Pre-launch | Launch | Under Construction | Ready for Possession | Completed | On Hold | Closed
  startDate: text('start_date'),
  expectedCompletion: text('expected_completion'),
  reraNumber: text('rera_number'),
  reraDate: text('rera_date'),
  developerDetails: text('developer_details'),
  logoUrl: text('logo_url'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectPhases = pgTable('project_phases', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  status: text('status').default('Active'),
  completionDate: text('completion_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const towers = pgTable('towers', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  phaseId: integer('phase_id').references(() => projectPhases.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  totalFloors: integer('total_floors').default(1),
  totalUnits: integer('total_units').default(0),
  status: text('status').default('Active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const floors = pgTable('floors', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  towerId: integer('tower_id')
    .references(() => towers.id)
    .notNull(),
  floorNumber: integer('floor_number').notNull(),
  floorName: text('floor_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  towerId: integer('tower_id')
    .references(() => towers.id)
    .notNull(),
  floorId: integer('floor_id')
    .references(() => floors.id)
    .notNull(),
  unitNumber: text('unit_number').notNull(),
  unitType: text('unit_type').notNull(), // Apartment | Flat | Plot | Villa | Shop | Office | Commercial unit | Parking
  floorNumber: integer('floor_number').notNull(),
  bedrooms: integer('bedrooms').default(2),
  bathrooms: integer('bathrooms').default(2),
  balcony: integer('balcony').default(1),
  parking: integer('parking').default(1),
  carpetArea: numeric('carpet_area', { precision: 10, scale: 2 }).notNull(),
  builtUpArea: numeric('built_up_area', { precision: 10, scale: 2 }),
  superBuiltUpArea: numeric('super_built_up_area', { precision: 10, scale: 2 }).notNull(),
  facing: text('facing').default('East'),
  basePrice: numeric('base_price', { precision: 14, scale: 2 }).notNull(),
  pricePerSqft: numeric('price_per_sqft', { precision: 10, scale: 2 }).notNull(),
  otherCharges: numeric('other_charges', { precision: 12, scale: 2 }).default('0'),
  totalPrice: numeric('total_price', { precision: 14, scale: 2 }).notNull(),
  status: text('status').notNull().default('Available'), // Available | Enquiry | Hold | Blocked | Negotiation | Booked | Agreement | Registered | Sold | Cancelled | Possession | Handover
  lockedByLeadId: integer('locked_by_lead_id'),
  lockedUntil: timestamp('locked_until'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 4. CHANNEL PARTNERS / BROKERS
// -------------------------------------------------------------
export const channelPartners = pgTable('channel_partners', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  partnerCode: text('partner_code').notNull(),
  name: text('name').notNull(),
  companyName: text('company_name'),
  mobile: text('mobile').notNull(),
  email: text('email'),
  address: text('address'),
  pan: text('pan'),
  gstin: text('gstin'),
  reraNumber: text('rera_number'),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).default('2.00'), // %
  status: text('status').notNull().default('active'), // active | inactive | blacklisted
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 5. CRM, LEADS & ACTIVITIES
// -------------------------------------------------------------
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  leadCode: text('lead_code').notNull(),
  projectId: integer('project_id').references(() => projects.id),
  name: text('name').notNull(),
  mobile: text('mobile').notNull(),
  email: text('email'),
  location: text('location'),
  source: text('source').notNull().default('Website'), // Website | Google Ads | Meta Ads | Property portal | Referral | Broker | Walk-in | Phone | WhatsApp | Campaign | Other
  campaign: text('campaign'),
  unitPreference: text('unit_preference'), // e.g. "3 BHK, 1400 sqft"
  budget: text('budget'), // e.g. "75 Lakhs - 1 Crore"
  status: text('status').notNull().default('New'), // New | Contacted | Qualified | Site Visit Scheduled | Site Visit Completed | Negotiation | Booking | Lost | Converted
  assignedUserId: integer('assigned_user_id').references(() => users.id),
  channelPartnerId: integer('channel_partner_id').references(() => channelPartners.id),
  lastContact: timestamp('last_contact'),
  nextFollowUp: timestamp('next_follow_up'),
  remarks: text('remarks'),
  score: integer('score').default(50),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leadActivities = pgTable('lead_activities', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  leadId: integer('lead_id').references(() => leads.id),
  customerId: integer('customer_id'),
  activityType: text('activity_type').notNull(), // Call | WhatsApp | Email | Meeting | Site visit | Reminder | Note
  subject: text('subject').notNull(),
  details: text('details').notNull(),
  result: text('result'),
  nextAction: text('next_action'),
  nextFollowUpDate: timestamp('next_follow_up_date'),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const siteVisits = pgTable('site_visits', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  leadId: integer('lead_id').references(() => leads.id),
  customerId: integer('customer_id'),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  salesExecutiveId: integer('sales_executive_id').references(() => users.id),
  visitDate: text('visit_date').notNull(), // YYYY-MM-DD
  visitTime: text('visit_time').notNull(), // HH:MM
  numberOfVisitors: integer('number_of_visitors').default(1),
  transportRequired: boolean('transport_required').default(false),
  status: text('status').notNull().default('Scheduled'), // Scheduled | Confirmed | Completed | Rescheduled | Cancelled | No Show
  feedback: text('feedback'),
  nextAction: text('next_action'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 6. CUSTOMERS
// -------------------------------------------------------------
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  customerCode: text('customer_code').notNull(),
  name: text('name').notNull(),
  mobile: text('mobile').notNull(),
  email: text('email').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country').default('India'),
  pan: text('pan'),
  gstin: text('gstin'),
  dob: text('dob'),
  occupation: text('occupation'),
  communicationPreference: text('communication_preference').default('WhatsApp'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 7. BOOKINGS & WORKFLOW APPROVALS
// -------------------------------------------------------------
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  bookingNumber: text('booking_number').notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id)
    .notNull(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  unitId: integer('unit_id')
    .references(() => units.id)
    .notNull(),
  salesUserId: integer('sales_user_id')
    .references(() => users.id)
    .notNull(),
  channelPartnerId: integer('channel_partner_id').references(() => channelPartners.id),
  bookingDate: text('booking_date').notNull(), // YYYY-MM-DD
  bookingAmount: numeric('booking_amount', { precision: 14, scale: 2 }).notNull(),
  totalConsideration: numeric('total_consideration', { precision: 14, scale: 2 }).notNull(),
  agreementValue: numeric('agreement_value', { precision: 14, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  additionalCharges: numeric('additional_charges', { precision: 12, scale: 2 }).default('0'),
  taxes: numeric('taxes', { precision: 12, scale: 2 }).default('0'),
  paymentPlan: text('payment_plan').notNull().default('Construction Linked Plan'),
  status: text('status').notNull().default('Draft'), // Draft | Pending Approval | Approved | Confirmed | Cancelled
  currentApprovalStep: integer('current_approval_step').default(1),
  rejectionReason: text('rejection_reason'),
  cancellationDate: text('cancellation_date'),
  cancellationRemarks: text('cancellation_remarks'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workflows = pgTable('workflows', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: text('name').notNull(),
  module: text('module').notNull(), // 'booking' | 'discount' | 'possession'
  isActive: boolean('is_active').default(true),
  stepsJson: jsonb('steps_json')
    .$type<Array<{ stepNumber: number; roleCode: string; stepName: string; required: boolean }>>()
    .default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workflowApprovals = pgTable('workflow_approvals', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  bookingId: integer('booking_id')
    .references(() => bookings.id)
    .notNull(),
  stepNumber: integer('step_number').notNull(),
  stepName: text('step_name').notNull(),
  roleCode: text('role_code').notNull(),
  approverUserId: integer('approver_user_id').references(() => users.id),
  status: text('status').notNull().default('Pending'), // Pending | Approved | Rejected
  comments: text('comments'),
  actionAt: timestamp('action_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 8. PAYMENT SCHEDULES & RECEIPTS
// -------------------------------------------------------------
export const paymentSchedules = pgTable('payment_schedules', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  bookingId: integer('booking_id')
    .references(() => bookings.id)
    .notNull(),
  milestoneName: text('milestone_name').notNull(),
  installmentNumber: integer('installment_number').notNull(),
  dueDate: text('due_date').notNull(), // YYYY-MM-DD
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 12, scale: 2 }).default('0'),
  total: numeric('total', { precision: 14, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).default('0'),
  status: text('status').notNull().default('Upcoming'), // Upcoming | Due | Partially Paid | Paid | Overdue | Waived
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  receiptNumber: text('receipt_number').notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id)
    .notNull(),
  bookingId: integer('booking_id')
    .references(() => bookings.id)
    .notNull(),
  paymentScheduleId: integer('payment_schedule_id').references(() => paymentSchedules.id),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  paymentDate: text('payment_date').notNull(), // YYYY-MM-DD
  paymentMode: text('payment_mode').notNull().default('Bank Transfer'), // Cash | Cheque | Bank Transfer | NEFT | RTGS | IMPS | UPI | Card | Other
  referenceNumber: text('reference_number'),
  bankName: text('bank_name'),
  status: text('status').notNull().default('Cleared'), // Pending Clearance | Cleared | Bounced | Refunded
  remarks: text('remarks'),
  receivedByUserId: integer('received_by_user_id').references(() => users.id),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const partnerCommissions = pgTable('partner_commissions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  channelPartnerId: integer('channel_partner_id')
    .references(() => channelPartners.id)
    .notNull(),
  bookingId: integer('booking_id')
    .references(() => bookings.id)
    .notNull(),
  totalSaleValue: numeric('total_sale_value', { precision: 14, scale: 2 }).notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 14, scale: 2 }).notNull(),
  status: text('status').notNull().default('Accrued'), // Accrued | Approved | Paid | Cancelled
  paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).default('0'),
  paidDate: text('paid_date'),
  referenceNumber: text('reference_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 9. DOCUMENTS
// -------------------------------------------------------------
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(), // KYC | PAN | Aadhaar | Booking form | Agreement | Payment receipt | Legal | Project approvals | RERA | Customer doc | Possession doc | Other
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  entityType: text('entity_type'), // project | unit | lead | customer | booking | channel_partner
  entityId: integer('entity_id'),
  version: integer('version').default(1),
  status: text('status').default('Valid'), // Valid | Expired | Under Review | Rejected
  expiryDate: text('expiry_date'),
  uploadedByUserId: integer('uploaded_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 10. COMPLAINTS & SERVICE
// -------------------------------------------------------------
export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  ticketNumber: text('ticket_number').notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id)
    .notNull(),
  bookingId: integer('booking_id').references(() => bookings.id),
  projectId: integer('project_id').references(() => projects.id),
  unitId: integer('unit_id').references(() => units.id),
  category: text('category').notNull().default('Maintenance'), // Construction Quality | Delay | Billing | Amenities | Documentation | Possession | Maintenance | Other
  priority: text('priority').notNull().default('Medium'), // Low | Medium | High | Urgent
  description: text('description').notNull(),
  assignedUserId: integer('assigned_user_id').references(() => users.id),
  status: text('status').notNull().default('Open'), // Open | Assigned | In Progress | Waiting | Resolved | Closed
  slaDays: integer('sla_days').default(3),
  resolution: text('resolution'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 11. POSSESSION & HANDOVER
// -------------------------------------------------------------
export const possessionRecords = pgTable('possession_records', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  bookingId: integer('booking_id')
    .references(() => bookings.id)
    .notNull(),
  unitId: integer('unit_id')
    .references(() => units.id)
    .notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id)
    .notNull(),
  targetDate: text('target_date'),
  actualDate: text('actual_date'),
  status: text('status').notNull().default('Inspection Scheduled'), // Inspection Scheduled | Snagging In Progress | Snagging Cleared | Docs Pending | Ready For Handover | Handed Over
  handoverChecklistJson: jsonb('handover_checklist_json').$type<Array<{ item: string; checked: boolean }>>().default([]),
  customerAcceptance: boolean('customer_acceptance').default(false),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 12. TASKS
// -------------------------------------------------------------
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  assignedUserId: integer('assigned_user_id').references(() => users.id),
  departmentId: integer('department_id').references(() => departments.id),
  projectId: integer('project_id').references(() => projects.id),
  customerId: integer('customer_id').references(() => customers.id),
  dueDate: text('due_date'), // YYYY-MM-DD
  priority: text('priority').notNull().default('Medium'), // Low | Medium | High | Urgent
  status: text('status').notNull().default('Pending'), // Pending | In Progress | Completed | Cancelled
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 13. CUSTOM FIELDS
// -------------------------------------------------------------
export const customFields = pgTable('custom_fields', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  entityType: text('entity_type').notNull(), // leads | customers | projects | units | bookings | channel_partners | complaints | employees
  fieldName: text('field_name').notNull(),
  fieldLabel: text('field_label').notNull(),
  fieldType: text('field_type').notNull(), // text | long_text | number | currency | date | datetime | dropdown | checkbox
  options: jsonb('options').$type<string[]>().default([]),
  isRequired: boolean('is_required').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customFieldValues = pgTable('custom_field_values', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  fieldId: integer('field_id')
    .references(() => customFields.id)
    .notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  fieldValue: text('field_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 14. AUDIT LOGS & NOTIFICATIONS
// -------------------------------------------------------------
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: integer('user_id'),
  userEmail: text('user_email'),
  action: text('action').notNull(), // CREATE | UPDATE | DELETE | LOGIN | LOGOUT | APPROVE | REJECT | BOOK | CANCEL | PAYMENT
  module: text('module').notNull(),
  recordId: text('record_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('system'), // lead | site_visit | payment | booking | task | complaint | system
  linkUrl: text('link_url'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// RELATIONS
// -------------------------------------------------------------
export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  settings: one(organizationSettings),
  users: many(users),
  projects: many(projects),
  branches: many(branches),
  departments: many(departments),
  customers: many(customers),
  leads: many(leads),
  bookings: many(bookings),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  leads: many(leads),
  bookings: many(bookings),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  phases: many(projectPhases),
  towers: many(towers),
  units: many(units),
  bookings: many(bookings),
}));

export const towersRelations = relations(towers, ({ one, many }) => ({
  project: one(projects, {
    fields: [towers.projectId],
    references: [projects.id],
  }),
  floors: many(floors),
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  project: one(projects, {
    fields: [units.projectId],
    references: [projects.id],
  }),
  tower: one(towers, {
    fields: [units.towerId],
    references: [towers.id],
  }),
  floor: one(floors, {
    fields: [units.floorId],
    references: [floors.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  project: one(projects, {
    fields: [leads.projectId],
    references: [projects.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedUserId],
    references: [users.id],
  }),
  channelPartner: one(channelPartners, {
    fields: [leads.channelPartnerId],
    references: [channelPartners.id],
  }),
  activities: many(leadActivities),
  siteVisits: many(siteVisits),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [bookings.projectId],
    references: [projects.id],
  }),
  unit: one(units, {
    fields: [bookings.unitId],
    references: [units.id],
  }),
  salesUser: one(users, {
    fields: [bookings.salesUserId],
    references: [users.id],
  }),
  channelPartner: one(channelPartners, {
    fields: [bookings.channelPartnerId],
    references: [channelPartners.id],
  }),
  paymentSchedules: many(paymentSchedules),
  payments: many(payments),
  approvals: many(workflowApprovals),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  schedule: one(paymentSchedules, {
    fields: [payments.paymentScheduleId],
    references: [paymentSchedules.id],
  }),
}));

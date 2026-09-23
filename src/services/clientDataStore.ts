import {
  Organization,
  OrganizationSettings,
  CurrentUser,
  Project,
  Unit,
  Lead,
  SiteVisit,
  Booking,
  Payment,
  ChannelPartner,
  Customer,
  Complaint,
  TaskItem,
} from '../types/index.ts';

const DB_STORAGE_KEY = 'auraestate_local_db_v1';

const safeGetItem = (key: string): string | null => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
};

const safeSetItem = (key: string, val: string): void => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(key, val);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
};

export interface LocalDatabase {
  organization: Organization;
  settings: OrganizationSettings;
  personas: CurrentUser[];
  projects: Project[];
  units: Unit[];
  leads: Lead[];
  siteVisits: SiteVisit[];
  bookings: Booking[];
  payments: Payment[];
  channelPartners: ChannelPartner[];
  customers: Customer[];
  complaints: Complaint[];
  tasks: TaskItem[];
  documents: Array<{
    id: number;
    title: string;
    documentType: string;
    fileUrl: string;
    fileSize: string;
    projectName: string;
    uploadedAt: string;
  }>;
}

export const INITIAL_DEMO_DATABASE: LocalDatabase = {
  organization: {
    id: 1,
    code: 'SRIJAN',
    companyName: 'Srijan Demo Realty',
    legalName: 'Srijan Realty Private Limited',
    logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=200&auto=format&fit=crop&q=60',
    website: 'https://srijanrealty.demo',
    email: 'info@srijanrealty.demo',
    phone: '+91 33 4040 2020',
    address: '36/1A, Elgin Road, Srijan House',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    gstin: '19AAECS1234F1Z5',
    pan: 'AAECS1234F',
    contactPerson: 'Arun Agarwal',
    status: 'active',
    subscriptionPlan: 'Enterprise Tier',
    brandPrimaryColor: '#0f172a',
    brandAccentColor: '#0284c7',
    createdAt: '2026-01-01T00:00:00Z',
  },
  settings: {
    currency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata',
    taxRateGst: '5.00',
    leadPrefix: 'SRJ-LD-',
    bookingPrefix: 'SRJ-BK-',
    receiptPrefix: 'SRJ-RCT-',
    customerPrefix: 'SRJ-CUS-',
    projectPrefix: 'SRJ-PRJ-',
    invoiceHeader: 'Srijan Realty Private Limited • CIN: U70109WB1996PTC081234',
    emailSignature: 'Warm regards,\nSrijan Realty Client Relations Team\nhttps://srijanrealty.demo',
  },
  personas: [
    {
      id: 1,
      uid: 'user_srj_admin_001',
      email: 'arun.agarwal@srijanrealty.demo',
      name: 'Arun Agarwal',
      roleCode: 'company_admin',
      organizationId: 1,
      isSystemAdmin: false,
      status: 'active',
    },
    {
      id: 2,
      uid: 'user_srj_sm_001',
      email: 'sneha.roy@srijanrealty.demo',
      name: 'Sneha Roy',
      roleCode: 'sales_manager',
      organizationId: 1,
      isSystemAdmin: false,
      status: 'active',
    },
    {
      id: 3,
      uid: 'user_srj_se_001',
      email: 'priya.banerjee@srijanrealty.demo',
      name: 'Priya Banerjee',
      roleCode: 'sales_executive',
      organizationId: 1,
      isSystemAdmin: false,
      status: 'active',
    },
    {
      id: 4,
      uid: 'user_srj_crm_001',
      email: 'amit.ganguly@srijanrealty.demo',
      name: 'Amit Ganguly',
      roleCode: 'crm_executive',
      organizationId: 1,
      isSystemAdmin: false,
      status: 'active',
    },
    {
      id: 5,
      uid: 'user_sys_admin_001',
      email: 'system.admin@auraestate.io',
      name: 'Dev System Admin',
      roleCode: 'system_admin',
      organizationId: 1,
      isSystemAdmin: true,
      status: 'active',
    },
  ],
  projects: [
    {
      id: 1,
      organizationId: 1,
      name: 'Srijan Solus',
      code: 'SRJ-SOL',
      projectType: 'Residential',
      address: '104/1, EM Bypass Road, Opp. Metro Cash & Carry',
      city: 'Kolkata',
      state: 'West Bengal',
      location: 'EM Bypass / Ruby Corridor',
      description: 'Premium 3 & 4 BHK sky residences with 50,000 sq.ft. modern clubhouse, infinity sky pool, and panoramic city vistas.',
      status: 'Under Construction',
      startDate: '2023-03-01',
      expectedCompletion: '2027-06-30',
      reraNumber: 'WBRERA/P/KOL/2023/000214',
      reraDate: '2023-02-15',
      developerDetails: 'Srijan Realty Consortium',
      logoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
      towersCount: 2,
      totalUnits: 10,
      availableUnits: 4,
    },
    {
      id: 2,
      organizationId: 1,
      name: 'Srijan Eternia',
      code: 'SRJ-ETE',
      projectType: 'Mixed',
      address: 'Plot IIF-12, Action Area II, New Town',
      city: 'Kolkata',
      state: 'West Bengal',
      location: 'New Town Financial Hub',
      description: 'Integrated mixed-use development comprising Grade-A boutique commercial offices and sustainable 2 & 3 BHK eco-residences.',
      status: 'Launch',
      startDate: '2024-01-15',
      expectedCompletion: '2028-12-31',
      reraNumber: 'WBRERA/P/NOR/2023/000582',
      reraDate: '2023-11-20',
      developerDetails: 'Srijan & Partner Developers',
      logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
      towersCount: 0,
      totalUnits: 0,
      availableUnits: 0,
    },
  ],
  units: [
    {
      id: 1,
      unitNumber: 'A-101',
      unitType: 'Apartment',
      floorNumber: 1,
      bedrooms: 3,
      bathrooms: 3,
      balcony: 2,
      parking: 1,
      carpetArea: '1350.00',
      superBuiltUpArea: '1820.00',
      facing: 'North-East',
      basePrice: '13650000.00',
      pricePerSqft: '7500.00',
      otherCharges: '650000.00',
      totalPrice: '14300000.00',
      status: 'Available',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
    {
      id: 2,
      unitNumber: 'A-102',
      unitType: 'Apartment',
      floorNumber: 1,
      bedrooms: 3,
      bathrooms: 3,
      balcony: 2,
      parking: 1,
      carpetArea: '1350.00',
      superBuiltUpArea: '1820.00',
      facing: 'East',
      basePrice: '13650000.00',
      pricePerSqft: '7500.00',
      otherCharges: '650000.00',
      totalPrice: '14300000.00',
      status: 'Booked',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
    {
      id: 3,
      unitNumber: 'A-103',
      unitType: 'Apartment',
      floorNumber: 1,
      bedrooms: 2,
      bathrooms: 2,
      balcony: 1,
      parking: 1,
      carpetArea: '980.00',
      superBuiltUpArea: '1320.00',
      facing: 'South',
      basePrice: '9900000.00',
      pricePerSqft: '7500.00',
      otherCharges: '500000.00',
      totalPrice: '10400000.00',
      status: 'Hold',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
    {
      id: 4,
      unitNumber: 'A-104',
      unitType: 'Apartment',
      floorNumber: 1,
      bedrooms: 4,
      bathrooms: 4,
      balcony: 3,
      parking: 2,
      carpetArea: '1920.00',
      superBuiltUpArea: '2580.00',
      facing: 'East',
      basePrice: '19350000.00',
      pricePerSqft: '7500.00',
      otherCharges: '950000.00',
      totalPrice: '20300000.00',
      status: 'Available',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
    {
      id: 5,
      unitNumber: 'A-201',
      unitType: 'Apartment',
      floorNumber: 2,
      bedrooms: 3,
      bathrooms: 3,
      balcony: 2,
      parking: 1,
      carpetArea: '1350.00',
      superBuiltUpArea: '1820.00',
      facing: 'North-East',
      basePrice: '13741000.00',
      pricePerSqft: '7550.00',
      otherCharges: '650000.00',
      totalPrice: '14391000.00',
      status: 'Enquiry',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
    {
      id: 6,
      unitNumber: 'A-202',
      unitType: 'Apartment',
      floorNumber: 2,
      bedrooms: 3,
      bathrooms: 3,
      balcony: 2,
      parking: 1,
      carpetArea: '1350.00',
      superBuiltUpArea: '1820.00',
      facing: 'East',
      basePrice: '13741000.00',
      pricePerSqft: '7550.00',
      otherCharges: '650000.00',
      totalPrice: '14391000.00',
      status: 'Negotiation',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
    {
      id: 7,
      unitNumber: 'A-203',
      unitType: 'Apartment',
      floorNumber: 2,
      bedrooms: 2,
      bathrooms: 2,
      balcony: 1,
      parking: 1,
      carpetArea: '980.00',
      superBuiltUpArea: '1320.00',
      facing: 'South',
      basePrice: '9966000.00',
      pricePerSqft: '7550.00',
      otherCharges: '500000.00',
      totalPrice: '10466000.00',
      status: 'Sold',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
    {
      id: 8,
      unitNumber: 'A-204',
      unitType: 'Apartment',
      floorNumber: 2,
      bedrooms: 4,
      bathrooms: 4,
      balcony: 3,
      parking: 2,
      carpetArea: '1920.00',
      superBuiltUpArea: '2580.00',
      facing: 'East',
      basePrice: '19479000.00',
      pricePerSqft: '7550.00',
      otherCharges: '950000.00',
      totalPrice: '20429000.00',
      status: 'Available',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
    {
      id: 9,
      unitNumber: 'A-301',
      unitType: 'Apartment',
      floorNumber: 3,
      bedrooms: 3,
      bathrooms: 3,
      balcony: 2,
      parking: 1,
      carpetArea: '1350.00',
      superBuiltUpArea: '1820.00',
      facing: 'North-East',
      basePrice: '13832000.00',
      pricePerSqft: '7600.00',
      otherCharges: '650000.00',
      totalPrice: '14482000.00',
      status: 'Agreement',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
    {
      id: 10,
      unitNumber: 'A-302',
      unitType: 'Apartment',
      floorNumber: 3,
      bedrooms: 3,
      bathrooms: 3,
      balcony: 2,
      parking: 1,
      carpetArea: '1350.00',
      superBuiltUpArea: '1820.00',
      facing: 'East',
      basePrice: '13832000.00',
      pricePerSqft: '7600.00',
      otherCharges: '650000.00',
      totalPrice: '14482000.00',
      status: 'Available',
      projectId: 1,
      projectName: 'Srijan Solus',
      towerId: 1,
      towerName: 'Tower Aurum (A)',
    },
  ],
  leads: [
    {
      id: 1,
      leadCode: 'SRJ-LD-2026-0001',
      name: 'Rohan Bose',
      mobile: '+91 98301 23456',
      email: 'rohan.bose@gmail.com',
      source: 'Google Ads',
      budget: '₹1.2 - ₹1.5 Cr',
      unitPreference: '3 BHK',
      status: 'New',
      score: 85,
      projectId: 1,
      projectName: 'Srijan Solus',
      assignedUserName: 'Priya Banerjee',
      remarks: 'Looking for high floor with open east view. Working in IT sector at Salt Lake Sector V.',
      createdAt: '2026-09-20T10:00:00Z',
    },
    {
      id: 2,
      leadCode: 'SRJ-LD-2026-0002',
      name: 'Ananya Ghosh',
      mobile: '+91 98310 98765',
      email: 'ananya.ghosh@outlook.com',
      source: 'Meta Ads',
      budget: '₹1.8 - ₹2.2 Cr',
      unitPreference: '4 BHK',
      status: 'Site Visit Scheduled',
      score: 92,
      projectId: 1,
      projectName: 'Srijan Solus',
      assignedUserName: 'Priya Banerjee',
      remarks: 'Family visit scheduled for Sunday. Doctor couple at Peerless Hospital.',
      createdAt: '2026-09-18T14:30:00Z',
    },
    {
      id: 3,
      leadCode: 'SRJ-LD-2026-0003',
      name: 'Kaushik Sen',
      mobile: '+91 98305 55443',
      email: 'kaushik.sen@tcs.com',
      source: 'Walk-in',
      budget: '₹95 L - ₹1.1 Cr',
      unitPreference: '2 BHK',
      status: 'Negotiation',
      score: 78,
      projectId: 1,
      projectName: 'Srijan Solus',
      assignedUserName: 'Sneha Roy',
      remarks: 'Comparing with adjacent project. Offered 2% festive waiver on floor rise charges.',
      createdAt: '2026-09-15T11:15:00Z',
    },
    {
      id: 4,
      leadCode: 'SRJ-LD-2026-0004',
      name: 'Pooja Agarwal',
      mobile: '+91 98308 77665',
      email: 'pooja.agarwal@business.in',
      source: 'Website',
      budget: '₹1.3 - ₹1.6 Cr',
      unitPreference: '3 BHK',
      status: 'Site Visit Completed',
      score: 88,
      projectId: 1,
      projectName: 'Srijan Solus',
      assignedUserName: 'Sneha Roy',
      remarks: 'Liked sample flat in Tower A. Requested draft payment schedule and home loan pre-approval.',
      createdAt: '2026-09-12T09:45:00Z',
    },
  ],
  siteVisits: [
    {
      id: 1,
      visitDate: '2026-09-27',
      visitTime: '11:30 AM',
      leadName: 'Ananya Ghosh',
      leadMobile: '+91 98310 98765',
      projectName: 'Srijan Solus',
      executiveName: 'Priya Banerjee',
      status: 'Scheduled',
      numberOfVisitors: 3,
      transportRequired: true,
      feedback: 'Interested in Tower A, 4 BHK duplex view.',
    },
    {
      id: 2,
      visitDate: '2026-09-19',
      visitTime: '03:00 PM',
      leadName: 'Pooja Agarwal',
      leadMobile: '+91 98308 77665',
      projectName: 'Srijan Solus',
      executiveName: 'Sneha Roy',
      status: 'Completed',
      numberOfVisitors: 2,
      transportRequired: false,
      feedback: 'Very positive response to clubhouse and children play area.',
    },
  ],
  bookings: [
    {
      id: 1,
      bookingNumber: 'SRJ-BK-2026-0042',
      customerName: 'Vikramjit Chakraborty',
      customerMobile: '+91 98302 44332',
      projectName: 'Srijan Solus',
      unitNumber: 'A-102',
      unitType: '3 BHK Apartment',
      bookingDate: '2026-08-15',
      totalConsideration: '14300000.00',
      bookingAmount: '1000000.00',
      agreementValue: '13650000.00',
      discountAmount: '0.00',
      status: 'Confirmed',
      currentApprovalStep: 2,
      salesUserName: 'Sneha Roy',
      createdAt: '2026-08-15T12:00:00Z',
    },
  ],
  payments: [
    {
      id: 1,
      receiptNumber: 'SRJ-RCT-2026-0001',
      bookingNumber: 'SRJ-BK-2026-0042',
      customerName: 'Vikramjit Chakraborty',
      unitNumber: 'A-102',
      projectName: 'Srijan Solus',
      amount: '1000000.00',
      paymentMode: 'NEFT',
      referenceNumber: 'HDFC0001928374',
      bankName: 'HDFC Bank',
      paymentDate: '2026-08-15',
      status: 'Verified',
      remarks: 'Initial Booking Token Advance (5%)',
    },
    {
      id: 2,
      receiptNumber: 'SRJ-RCT-2026-0002',
      bookingNumber: 'SRJ-BK-2026-0042',
      customerName: 'Vikramjit Chakraborty',
      unitNumber: 'A-102',
      projectName: 'Srijan Solus',
      amount: '1866500.00',
      paymentMode: 'Cheque',
      referenceNumber: 'CHQ-882190',
      bankName: 'State Bank of India',
      paymentDate: '2026-09-10',
      status: 'Verified',
      remarks: 'Allotment & Agreement Execution Milestone (10% + GST)',
    },
  ],
  channelPartners: [
    {
      id: 1,
      partnerCode: 'SRJ-CP-001',
      name: 'Debasish Mukherjee',
      companyName: 'Prime Realty Advisory',
      mobile: '+91 98311 00223',
      email: 'debasish@primerealty.in',
      reraNumber: 'WBRERA/A/KOL/2023/000109',
      commissionRate: '2.00',
      status: 'Approved',
    },
    {
      id: 2,
      partnerCode: 'SRJ-CP-002',
      name: 'Sandeep Khaitan',
      companyName: 'Metro Assets Group',
      mobile: '+91 98300 99887',
      email: 'sandeep@metroassets.com',
      reraNumber: 'WBRERA/A/NOR/2023/000244',
      commissionRate: '2.25',
      status: 'Approved',
    },
  ],
  customers: [
    {
      id: 1,
      customerCode: 'SRJ-CUS-001',
      name: 'Vikramjit Chakraborty',
      mobile: '+91 98302 44332',
      email: 'vikramjit.c@tcs.com',
      pan: 'ABCDE1234F',
      address: 'Flat 4B, Silver Oak Residency, Jadavpur',
      city: 'Kolkata',
      state: 'West Bengal',
      communicationPreference: 'WhatsApp',
      bookingsCount: 1,
      totalPaid: 2866500,
      createdAt: '2026-08-15T12:00:00Z',
    },
  ],
  complaints: [
    {
      id: 1,
      ticketNumber: 'SRJ-TCK-001',
      customerName: 'Vikramjit Chakraborty',
      customerMobile: '+91 98302 44332',
      unitNumber: 'A-102',
      projectName: 'Srijan Solus',
      category: 'Finishing / Snag',
      description: 'The anodized sliding door on the living room balcony sticks halfway during closing.',
      priority: 'Medium',
      status: 'In Progress',
      slaDays: 7,
      assignedUserName: 'Rajesh Sharma (Site Quality Eng.)',
      createdAt: '2026-09-18T10:00:00Z',
    },
  ],
  tasks: [
    {
      id: 1,
      title: 'Complete Site Visit Walkthrough for Ananya Ghosh',
      description: 'Coordinate with site engineer for Tower A hard hat inspection and show sample flat on 1st floor.',
      assignedUserName: 'Priya Banerjee',
      dueDate: '2026-09-27',
      priority: 'High',
      status: 'Pending',
      projectName: 'Srijan Solus',
      createdAt: '2026-09-20T10:00:00Z',
    },
    {
      id: 2,
      title: 'Follow-up with Kaushik Sen on Diwali waiver approval',
      description: 'Check if MD approved special 2% floor waiver on unit A-103.',
      assignedUserName: 'Sneha Roy',
      dueDate: '2026-09-24',
      priority: 'Urgent',
      status: 'Pending',
      projectName: 'Srijan Solus',
      createdAt: '2026-09-21T10:00:00Z',
    },
  ],
  documents: [
    {
      id: 1,
      title: 'Srijan Solus Master Layout & Club Brochure',
      documentType: 'Marketing Brochure',
      fileUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      fileSize: '4.8 MB',
      projectName: 'Srijan Solus',
      uploadedAt: '2026-08-01',
    },
    {
      id: 2,
      title: 'WBRERA Sanctioned Tower A Floor Plans (1-18)',
      documentType: 'Legal / Sanction Plan',
      fileUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      fileSize: '12.4 MB',
      projectName: 'Srijan Solus',
      uploadedAt: '2026-08-10',
    },
  ],
};

class ClientDataStore {
  private db: LocalDatabase;

  constructor() {
    this.db = this.loadFromStorage();
  }

  private loadFromStorage(): LocalDatabase {
    try {
      const stored = safeGetItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.units && parsed.projects && parsed.leads) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse local store, re-seeding:', e);
    }
    // Seed initial database
    this.saveToStorage(INITIAL_DEMO_DATABASE);
    return JSON.parse(JSON.stringify(INITIAL_DEMO_DATABASE));
  }

  private saveToStorage(db: LocalDatabase) {
    try {
      safeSetItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }

  public resetToDefault(): LocalDatabase {
    this.db = JSON.parse(JSON.stringify(INITIAL_DEMO_DATABASE));
    this.saveToStorage(this.db);
    return this.db;
  }

  public getDatabase(): LocalDatabase {
    return this.db;
  }

  // Session & Auth
  public getSession(personaUid?: string) {
    const activeUid = personaUid || safeGetItem('auraestate_active_persona') || 'user_srj_admin_001';
    const user = this.db.personas.find((p) => p.uid === activeUid) || this.db.personas[0];
    return {
      user,
      organization: this.db.organization,
      settings: this.db.settings,
    };
  }

  public getPersonas() {
    return this.db.personas;
  }

  // Dashboard Stats
  public getDashboard() {
    const totalProjects = this.db.projects.length;
    const totalUnits = this.db.units.length;
    const availableUnits = this.db.units.filter((u) => u.status === 'Available').length;
    const bookedUnits = this.db.units.filter((u) => ['Booked', 'Agreement', 'Sold'].includes(u.status)).length;
    const totalLeads = this.db.leads.length;
    const newLeads = this.db.leads.filter((l) => l.status === 'New').length;
    const siteVisits = this.db.siteVisits.length;
    const totalBookings = this.db.bookings.length;

    const totalSalesValue = this.db.bookings.reduce(
      (sum, b) => sum + (Number(b.totalConsideration) || 0),
      0
    );
    const totalCollected = this.db.payments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
    const outstanding = Math.max(0, totalSalesValue - totalCollected);

    return {
      metrics: {
        totalProjects,
        totalUnits,
        availableUnits,
        bookedUnits,
        totalLeads,
        newLeads,
        siteVisits,
        totalBookings,
        totalSalesValue,
        totalCollected,
        outstanding,
        openComplaints: this.db.complaints.filter((c) => c.status !== 'Resolved').length,
      },
      leadSources: [
        { source: 'Google Ads', count: '1' },
        { source: 'Meta Ads', count: '1' },
        { source: 'Walk-in', count: '1' },
        { source: 'Website', count: '1' },
      ],
      recentBookings: this.db.bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        bookingDate: b.bookingDate,
        amount: b.bookingAmount,
        total: b.totalConsideration,
        status: b.status,
        customerName: b.customerName,
        projectName: b.projectName,
        unitNumber: b.unitNumber,
      })),
      pendingTasks: this.db.tasks,
    };
  }

  // Projects
  public getProjects() {
    return this.db.projects.map((p) => {
      const pUnits = this.db.units.filter((u) => u.projectId === p.id);
      return {
        ...p,
        totalUnits: pUnits.length,
        availableUnits: pUnits.filter((u) => u.status === 'Available').length,
      };
    });
  }

  public getProject(id: number) {
    const proj = this.db.projects.find((p) => p.id === id);
    if (!proj) return null;
    return proj;
  }

  // Units
  public getUnits(projectId?: number, towerId?: number) {
    let result = [...this.db.units];
    if (projectId) result = result.filter((u) => u.projectId === projectId);
    if (towerId) result = result.filter((u) => u.towerId === towerId);
    return result;
  }

  public updateUnitStatus(id: number, status: string) {
    const unit = this.db.units.find((u) => u.id === id);
    if (unit) {
      unit.status = status as any;
      this.saveToStorage(this.db);
    }
    return unit;
  }

  // Leads
  public getLeads() {
    return [...this.db.leads];
  }

  public addLead(leadData: any) {
    const newId = this.db.leads.length ? Math.max(...this.db.leads.map((l) => l.id)) + 1 : 1;
    const newLead: Lead = {
      id: newId,
      leadCode: `SRJ-LD-2026-${String(newId).padStart(4, '0')}`,
      name: leadData.name || 'New Prospect',
      mobile: leadData.mobile || '+91 98000 00000',
      email: leadData.email || '',
      source: leadData.source || 'Website',
      budget: leadData.budget || '₹1.0 - ₹1.5 Cr',
      unitPreference: leadData.unitPreference || '3 BHK',
      status: (leadData.status as any) || 'New',
      score: 75,
      projectId: leadData.projectId || 1,
      projectName: leadData.projectName || 'Srijan Solus',
      assignedUserName: leadData.assignedUserName || 'Sneha Roy',
      remarks: leadData.remarks || leadData.notes || '',
      createdAt: new Date().toISOString(),
    };
    this.db.leads.unshift(newLead);
    this.saveToStorage(this.db);
    return newLead;
  }

  public updateLead(id: number, updateData: any) {
    const lead = this.db.leads.find((l) => l.id === id);
    if (lead) {
      Object.assign(lead, updateData);
      this.saveToStorage(this.db);
    }
    return lead;
  }

  // Bookings
  public getBookings() {
    return [...this.db.bookings];
  }

  public addBooking(bookingData: any) {
    const newId = this.db.bookings.length ? Math.max(...this.db.bookings.map((b) => b.id)) + 1 : 1;
    const newBooking: Booking = {
      id: newId,
      bookingNumber: `SRJ-BK-2026-${String(newId).padStart(4, '0')}`,
      customerName: bookingData.customerName || 'Allottee Customer',
      customerMobile: bookingData.customerMobile || '+91 98300 00000',
      projectName: bookingData.projectName || 'Srijan Solus',
      unitNumber: bookingData.unitNumber || 'A-101',
      unitType: bookingData.unitType || 'Apartment',
      bookingDate: new Date().toISOString().split('T')[0],
      totalConsideration: bookingData.totalConsideration || '14300000.00',
      bookingAmount: bookingData.bookingAmount || '1000000.00',
      agreementValue: bookingData.basePrice || bookingData.agreementValue || '13650000.00',
      discountAmount: '0.00',
      status: 'Pending Approval',
      currentApprovalStep: 1,
      salesUserName: bookingData.assignedAgent || 'Sneha Roy',
      createdAt: new Date().toISOString(),
    };
    this.db.bookings.unshift(newBooking);

    // Also update unit status to Booked
    if (bookingData.unitId) {
      this.updateUnitStatus(Number(bookingData.unitId), 'Booked');
    }

    this.saveToStorage(this.db);
    return newBooking;
  }

  public updateBooking(id: number, updateData: any) {
    const booking = this.db.bookings.find((b) => b.id === id);
    if (booking) {
      Object.assign(booking, updateData);
      this.saveToStorage(this.db);
    }
    return booking;
  }

  // Payments
  public getPayments() {
    return [...this.db.payments];
  }

  public addPayment(paymentData: any) {
    const newId = this.db.payments.length ? Math.max(...this.db.payments.map((p) => p.id)) + 1 : 1;
    const newPayment: Payment = {
      id: newId,
      receiptNumber: `SRJ-RCT-2026-${String(newId).padStart(4, '0')}`,
      bookingNumber: paymentData.bookingNumber || 'SRJ-BK-2026-0042',
      customerName: paymentData.customerName || 'Customer',
      unitNumber: paymentData.unitNumber || 'A-102',
      projectName: paymentData.projectName || 'Srijan Solus',
      amount: paymentData.amount || '500000.00',
      paymentMode: paymentData.paymentMode || 'NEFT',
      referenceNumber: paymentData.transactionReference || paymentData.referenceNumber || 'REF' + Date.now(),
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Verified',
      remarks: paymentData.remarks || 'Direct payment collection',
    };
    this.db.payments.unshift(newPayment);
    this.saveToStorage(this.db);
    return newPayment;
  }

  // Customers
  public getCustomers() {
    return [...this.db.customers];
  }

  // Channel Partners
  public getChannelPartners() {
    return [...this.db.channelPartners];
  }

  // Site Visits
  public getSiteVisits() {
    return [...this.db.siteVisits];
  }

  // Complaints
  public getComplaints() {
    return [...this.db.complaints];
  }

  // Tasks
  public getTasks() {
    return [...this.db.tasks];
  }

  // Documents
  public getDocuments() {
    return [...this.db.documents];
  }
}

export const clientDataStore = new ClientDataStore();

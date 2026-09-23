import { db } from './index.ts';
import {
  organizations,
  organizationSettings,
  branches,
  departments,
  roles,
  users,
  projects,
  projectPhases,
  towers,
  floors,
  units,
  channelPartners,
  leads,
  leadActivities,
  siteVisits,
  customers,
  bookings,
  workflowApprovals,
  paymentSchedules,
  payments,
  partnerCommissions,
  complaints,
  possessionRecords,
  tasks,
  auditLogs,
  workflows,
} from './schema.ts';
import { count } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    const existingOrgs = await db.select({ count: count() }).from(organizations);
    if (existingOrgs[0]?.count && existingOrgs[0].count > 0) {
      console.log('Database already contains organizations. Skipping seed.');
      return;
    }

    console.log('Seeding initial Multi-Tenant Real Estate Platform data...');

    // 1. System Roles
    const systemRole = await db
      .insert(roles)
      .values([
        {
          name: 'System Administrator',
          code: 'system_admin',
          description: 'Global SaaS platform administrator',
          isSystemRole: true,
          permissions: ['*'],
        },
        {
          name: 'Organization Administrator',
          code: 'org_admin',
          description: 'Full administrative access within organization',
          isSystemRole: true,
          permissions: [
            'org:manage',
            'users:manage',
            'projects:manage',
            'inventory:manage',
            'leads:manage',
            'customers:manage',
            'bookings:manage',
            'payments:manage',
            'reports:view',
            'settings:manage',
          ],
        },
        {
          name: 'Management',
          code: 'management',
          description: 'Executive dashboard, financial summaries, and approval rights',
          isSystemRole: true,
          permissions: [
            'dashboard:view',
            'projects:view',
            'bookings:approve',
            'discounts:approve',
            'reports:view',
          ],
        },
        {
          name: 'Sales Manager',
          code: 'sales_manager',
          description: 'Leads pipeline, sales team allocation, booking approvals',
          isSystemRole: true,
          permissions: [
            'leads:manage',
            'customers:manage',
            'inventory:view',
            'bookings:create',
            'bookings:approve',
            'reports:sales',
          ],
        },
        {
          name: 'Sales Executive',
          code: 'sales_executive',
          description: 'Lead follow-ups, customer meetings, site visits, booking requests',
          isSystemRole: true,
          permissions: [
            'leads:view_assigned',
            'leads:edit_assigned',
            'site_visits:manage',
            'bookings:create',
          ],
        },
        {
          name: 'Accounts & Finance',
          code: 'accounts',
          description: 'Collections, payment entries, receipts, milestone tracking',
          isSystemRole: true,
          permissions: [
            'payments:manage',
            'receipts:create',
            'schedules:manage',
            'bookings:verify',
            'reports:accounts',
          ],
        },
        {
          name: 'CRM Manager',
          code: 'crm_manager',
          description: 'Customer service, complaints, communications, follow-ups',
          isSystemRole: true,
          permissions: [
            'customers:manage',
            'complaints:manage',
            'tasks:manage',
            'possession:view',
          ],
        },
      ])
      .returning();

    // 2. Organization 1: Srijan Demo Realty
    const [srijanOrg] = await db
      .insert(organizations)
      .values({
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
      })
      .returning();

    // Organization 1 Settings
    await db.insert(organizationSettings).values({
      organizationId: srijanOrg.id,
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
    });

    // Branches for Srijan
    const [branch1, branch2] = await db
      .insert(branches)
      .values([
        {
          organizationId: srijanOrg.id,
          name: 'Srijan Corporate HQ (Elgin Road)',
          code: 'BR-ELG',
          address: '36/1A, Elgin Road, 5th Floor',
          city: 'Kolkata',
          state: 'West Bengal',
          phone: '+91 33 4040 2020',
          email: 'corp@srijanrealty.demo',
          isHeadOffice: true,
        },
        {
          organizationId: srijanOrg.id,
          name: 'New Town Regional Hub',
          code: 'BR-NTN',
          address: 'Action Area II, Major Arterial Road',
          city: 'Kolkata',
          state: 'West Bengal',
          phone: '+91 33 4040 2030',
          email: 'newtown@srijanrealty.demo',
          isHeadOffice: false,
        },
      ])
      .returning();

    // Departments for Srijan
    const [deptSales, deptCRM, deptAccounts, deptProjects] = await db
      .insert(departments)
      .values([
        { organizationId: srijanOrg.id, name: 'Sales & Marketing', code: 'DEPT-SALES', description: 'Lead acquisition, conversions, site visits' },
        { organizationId: srijanOrg.id, name: 'Customer Relationship Management', code: 'DEPT-CRM', description: 'Post-sales, onboarding, complaint resolution' },
        { organizationId: srijanOrg.id, name: 'Accounts & Collections', code: 'DEPT-ACC', description: 'Payment milestones, invoices, reconciliation' },
        { organizationId: srijanOrg.id, name: 'Projects & Engineering', code: 'DEPT-ENG', description: 'Site construction, tower schedules, handover' },
      ])
      .returning();

    // 3. Organization 2: Skyline Developers (To demonstrate multi-tenant isolation!)
    const [skylineOrg] = await db
      .insert(organizations)
      .values({
        code: 'SKYLINE',
        companyName: 'Skyline Landmark Developers',
        legalName: 'Skyline Infrastructure LLP',
        logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=60',
        website: 'https://skylinedev.demo',
        email: 'contact@skylinedev.demo',
        phone: '+91 80 2500 7800',
        address: 'Skyline Towers, Outer Ring Road, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        gstin: '29AABCS5432B1Z8',
        pan: 'AABCS5432B',
        contactPerson: 'Vikram Malhotra',
        status: 'active',
        subscriptionPlan: 'Growth Tier',
        brandPrimaryColor: '#1e1b4b',
        brandAccentColor: '#4f46e5',
      })
      .returning();

    await db.insert(organizationSettings).values({
      organizationId: skylineOrg.id,
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Asia/Kolkata',
      taxRateGst: '5.00',
      leadPrefix: 'SKY-LD-',
      bookingPrefix: 'SKY-BK-',
      receiptPrefix: 'SKY-RCT-',
      customerPrefix: 'SKY-CUS-',
      projectPrefix: 'SKY-PRJ-',
    });

    // 4. Seed Users
    // System Administrator (Global)
    await db.insert(users).values({
      uid: 'user_sys_admin_001',
      organizationId: null, // Global
      name: 'Dev System Admin',
      email: 'system.admin@auraestate.io',
      mobile: '+91 98300 00001',
      employeeId: 'SYS-001',
      roleCode: 'system_admin',
      designation: 'Principal Platform Architect',
      isSystemAdmin: true,
      status: 'active',
    });

    // Srijan Users
    const [srijanAdmin, salesMgr, salesExec, accountsUser, crmUser] = await db
      .insert(users)
      .values([
        {
          uid: 'user_srj_admin_001',
          organizationId: srijanOrg.id,
          name: 'Rajesh Srijan (Admin)',
          email: 'admin@srijanrealty.demo',
          mobile: '+91 98301 11001',
          employeeId: 'SRJ-001',
          roleCode: 'org_admin',
          departmentId: deptSales.id,
          branchId: branch1.id,
          designation: 'Director & Managing Partner',
          status: 'active',
        },
        {
          uid: 'user_srj_salesmgr_001',
          organizationId: srijanOrg.id,
          name: 'Sunita Banerjee',
          email: 'sales.head@srijanrealty.demo',
          mobile: '+91 98301 11002',
          employeeId: 'SRJ-014',
          roleCode: 'sales_manager',
          departmentId: deptSales.id,
          branchId: branch1.id,
          designation: 'AVP - Sales Strategy',
          status: 'active',
        },
        {
          uid: 'user_srj_salesexec_001',
          organizationId: srijanOrg.id,
          name: 'Amit Mukherjee',
          email: 'sales.exec@srijanrealty.demo',
          mobile: '+91 98301 11003',
          employeeId: 'SRJ-028',
          roleCode: 'sales_executive',
          departmentId: deptSales.id,
          branchId: branch2.id,
          designation: 'Senior Sales Specialist',
          status: 'active',
        },
        {
          uid: 'user_srj_acc_001',
          organizationId: srijanOrg.id,
          name: 'Priyanka Sen',
          email: 'accounts@srijanrealty.demo',
          mobile: '+91 98301 11004',
          employeeId: 'SRJ-008',
          roleCode: 'accounts',
          departmentId: deptAccounts.id,
          branchId: branch1.id,
          designation: 'Lead Finance Controller',
          status: 'active',
        },
        {
          uid: 'user_srj_crm_001',
          organizationId: srijanOrg.id,
          name: 'Debashis Ray',
          email: 'crm.lead@srijanrealty.demo',
          mobile: '+91 98301 11005',
          employeeId: 'SRJ-035',
          roleCode: 'crm_manager',
          departmentId: deptCRM.id,
          branchId: branch1.id,
          designation: 'Head of Customer Experience',
          status: 'active',
        },
      ])
      .returning();

    // Skyline User
    await db.insert(users).values({
      uid: 'user_sky_admin_001',
      organizationId: skylineOrg.id,
      name: 'Kavita Reddy',
      email: 'admin@skylinedev.demo',
      mobile: '+91 98450 22001',
      employeeId: 'SKY-001',
      roleCode: 'org_admin',
      designation: 'VP of Development',
      status: 'active',
    });

    // 5. Workflows for Srijan
    await db.insert(workflows).values([
      {
        organizationId: srijanOrg.id,
        name: 'Standard Residential Booking Approval',
        module: 'booking',
        isActive: true,
        stepsJson: [
          { stepNumber: 1, roleCode: 'sales_manager', stepName: 'Sales Manager Approval', required: true },
          { stepNumber: 2, roleCode: 'accounts', stepName: 'Accounts Payment Verification', required: true },
          { stepNumber: 3, roleCode: 'org_admin', stepName: 'Executive Management Signoff', required: true },
        ],
      },
    ]);

    // 6. Channel Partners for Srijan
    const [cp1, cp2] = await db
      .insert(channelPartners)
      .values([
        {
          organizationId: srijanOrg.id,
          partnerCode: 'CP-101',
          name: 'Anirudh Roy',
          companyName: 'Apex Prime Realty Advisory',
          mobile: '+91 98310 99881',
          email: 'apex@realtyadvisor.demo',
          address: 'Salt Lake Sector V, Kolkata',
          pan: 'AAPCA9988K',
          gstin: '19AAPCA9988K1Z3',
          reraNumber: 'WBRERA/A/KOL/2023/000045',
          commissionRate: '2.50',
          status: 'active',
        },
        {
          organizationId: srijanOrg.id,
          partnerCode: 'CP-102',
          name: 'Subroto Ghosh',
          companyName: 'Metro Square Associates',
          mobile: '+91 98310 77442',
          email: 'metrosquare@kolkatarealty.demo',
          address: 'Rashbehari Avenue, Kolkata',
          pan: 'AAMCS7744M',
          gstin: '19AAMCS7744M1Z2',
          reraNumber: 'WBRERA/A/KOL/2023/000078',
          commissionRate: '2.00',
          status: 'active',
        },
      ])
      .returning();

    // 7. Projects for Srijan
    const [projSolus, projEternia] = await db
      .insert(projects)
      .values([
        {
          organizationId: srijanOrg.id,
          name: 'Srijan Solus',
          code: 'SRJ-SOL',
          projectType: 'Residential',
          address: '104/1, EM Bypass Road, Opp. Metro Cash & Carry',
          city: 'Kolkata',
          state: 'West Bengal',
          location: 'EM Bypass / Ruby Corridor',
          description:
            'Premium 3 & 4 BHK sky residences with 50,000 sq.ft. modern clubhouse, infinity sky pool, and panoramic city vistas.',
          status: 'Under Construction',
          startDate: '2023-03-01',
          expectedCompletion: '2027-06-30',
          reraNumber: 'WBRERA/P/KOL/2023/000214',
          reraDate: '2023-02-15',
          developerDetails: 'Srijan Realty Consortium',
          logoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
        },
        {
          organizationId: srijanOrg.id,
          name: 'Srijan Eternia',
          code: 'SRJ-ETE',
          projectType: 'Mixed',
          address: 'Plot IIF-12, Action Area II, New Town',
          city: 'Kolkata',
          state: 'West Bengal',
          location: 'New Town Financial Hub',
          description:
            'Integrated mixed-use development comprising Grade-A boutique commercial offices and sustainable 2 & 3 BHK eco-residences.',
          status: 'Launch',
          startDate: '2024-01-15',
          expectedCompletion: '2028-12-31',
          reraNumber: 'WBRERA/P/NOR/2023/000582',
          reraDate: '2023-11-20',
          developerDetails: 'Srijan & Partner Developers',
          logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
        },
      ])
      .returning();

    // Skyline Project (for tenant isolation test)
    await db.insert(projects).values({
      organizationId: skylineOrg.id,
      name: 'Skyline Pinnacle',
      code: 'SKY-PIN',
      projectType: 'Residential',
      address: 'ITPB Main Road, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      location: 'Whitefield Tech Corridor',
      description: 'Ultra-luxury high-rise penthouses and condominiums in Whitefield.',
      status: 'Under Construction',
      startDate: '2023-05-10',
      expectedCompletion: '2027-10-15',
      reraNumber: 'PRM/KA/RERA/1251/446/PR/230412/005860',
    });

    // 8. Towers & Floors for Srijan Solus
    const [phase1] = await db
      .insert(projectPhases)
      .values({
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        name: 'Phase I - High Rise Towers',
        code: 'SOL-PH1',
        description: 'Towers A & B residential structures',
        status: 'Under Construction',
        completionDate: '2027-06-30',
      })
      .returning();

    const [towerA, towerB] = await db
      .insert(towers)
      .values([
        {
          organizationId: srijanOrg.id,
          projectId: projSolus.id,
          phaseId: phase1.id,
          name: 'Tower Aurum (A)',
          code: 'TWR-A',
          totalFloors: 18,
          totalUnits: 72,
          status: 'Active',
        },
        {
          organizationId: srijanOrg.id,
          projectId: projSolus.id,
          phaseId: phase1.id,
          name: 'Tower Celestia (B)',
          code: 'TWR-B',
          totalFloors: 18,
          totalUnits: 72,
          status: 'Active',
        },
      ])
      .returning();

    // Create Floors for Tower A
    const floorList = [];
    for (let f = 1; f <= 5; f++) {
      floorList.push({
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorNumber: f,
        floorName: `Floor ${f}`,
      });
    }
    const createdFloors = await db.insert(floors).values(floorList).returning();

    // 9. Units for Srijan Solus (Visual Inventory!)
    const unitsToInsert = [
      // Floor 1
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[0].id,
        floorNumber: 1,
        unitNumber: 'A-101',
        unitType: 'Apartment',
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        parking: 1,
        carpetArea: '1350.00',
        builtUpArea: '1580.00',
        superBuiltUpArea: '1820.00',
        facing: 'North-East',
        basePrice: '13650000.00',
        pricePerSqft: '7500.00',
        otherCharges: '650000.00',
        totalPrice: '14300000.00',
        status: 'Available',
      },
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[0].id,
        floorNumber: 1,
        unitNumber: 'A-102',
        unitType: 'Apartment',
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        parking: 1,
        carpetArea: '1350.00',
        builtUpArea: '1580.00',
        superBuiltUpArea: '1820.00',
        facing: 'East',
        basePrice: '13650000.00',
        pricePerSqft: '7500.00',
        otherCharges: '650000.00',
        totalPrice: '14300000.00',
        status: 'Booked',
      },
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[0].id,
        floorNumber: 1,
        unitNumber: 'A-103',
        unitType: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        balcony: 1,
        parking: 1,
        carpetArea: '980.00',
        builtUpArea: '1150.00',
        superBuiltUpArea: '1320.00',
        facing: 'South',
        basePrice: '9900000.00',
        pricePerSqft: '7500.00',
        otherCharges: '500000.00',
        totalPrice: '10400000.00',
        status: 'Hold',
      },
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[0].id,
        floorNumber: 1,
        unitNumber: 'A-104',
        unitType: 'Apartment',
        bedrooms: 4,
        bathrooms: 4,
        balcony: 3,
        parking: 2,
        carpetArea: '1920.00',
        builtUpArea: '2250.00',
        superBuiltUpArea: '2580.00',
        facing: 'East',
        basePrice: '19350000.00',
        pricePerSqft: '7500.00',
        otherCharges: '950000.00',
        totalPrice: '20300000.00',
        status: 'Available',
      },
      // Floor 2
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[1].id,
        floorNumber: 2,
        unitNumber: 'A-201',
        unitType: 'Apartment',
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        parking: 1,
        carpetArea: '1350.00',
        builtUpArea: '1580.00',
        superBuiltUpArea: '1820.00',
        facing: 'North-East',
        basePrice: '13741000.00',
        pricePerSqft: '7550.00',
        otherCharges: '650000.00',
        totalPrice: '14391000.00',
        status: 'Enquiry',
      },
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[1].id,
        floorNumber: 2,
        unitNumber: 'A-202',
        unitType: 'Apartment',
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        parking: 1,
        carpetArea: '1350.00',
        builtUpArea: '1580.00',
        superBuiltUpArea: '1820.00',
        facing: 'East',
        basePrice: '13741000.00',
        pricePerSqft: '7550.00',
        otherCharges: '650000.00',
        totalPrice: '14391000.00',
        status: 'Negotiation',
      },
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[1].id,
        floorNumber: 2,
        unitNumber: 'A-203',
        unitType: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        balcony: 1,
        parking: 1,
        carpetArea: '980.00',
        builtUpArea: '1150.00',
        superBuiltUpArea: '1320.00',
        facing: 'South',
        basePrice: '9966000.00',
        pricePerSqft: '7550.00',
        otherCharges: '500000.00',
        totalPrice: '10466000.00',
        status: 'Sold',
      },
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[1].id,
        floorNumber: 2,
        unitNumber: 'A-204',
        unitType: 'Apartment',
        bedrooms: 4,
        bathrooms: 4,
        balcony: 3,
        parking: 2,
        carpetArea: '1920.00',
        builtUpArea: '2250.00',
        superBuiltUpArea: '2580.00',
        facing: 'East',
        basePrice: '19479000.00',
        pricePerSqft: '7550.00',
        otherCharges: '950000.00',
        totalPrice: '20429000.00',
        status: 'Available',
      },
      // Floor 3
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[2].id,
        floorNumber: 3,
        unitNumber: 'A-301',
        unitType: 'Apartment',
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        parking: 1,
        carpetArea: '1350.00',
        builtUpArea: '1580.00',
        superBuiltUpArea: '1820.00',
        facing: 'North-East',
        basePrice: '13832000.00',
        pricePerSqft: '7600.00',
        otherCharges: '650000.00',
        totalPrice: '14482000.00',
        status: 'Agreement',
      },
      {
        organizationId: srijanOrg.id,
        projectId: projSolus.id,
        towerId: towerA.id,
        floorId: createdFloors[2].id,
        floorNumber: 3,
        unitNumber: 'A-302',
        unitType: 'Apartment',
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        parking: 1,
        carpetArea: '1350.00',
        builtUpArea: '1580.00',
        superBuiltUpArea: '1820.00',
        facing: 'East',
        basePrice: '13832000.00',
        pricePerSqft: '7600.00',
        otherCharges: '650000.00',
        totalPrice: '14482000.00',
        status: 'Available',
      },
    ];

    const insertedUnits = await db.insert(units).values(unitsToInsert).returning();

    // 10. Customers for Srijan
    const [cust1, cust2, cust3] = await db
      .insert(customers)
      .values([
        {
          organizationId: srijanOrg.id,
          customerCode: 'SRJ-CUS-001',
          name: 'Vikramjit Chakraborty',
          mobile: '+91 98305 44321',
          email: 'vikramjit.c@gmail.com',
          address: 'Flat 4B, Silver Oak, Alipore',
          city: 'Kolkata',
          state: 'West Bengal',
          pan: 'ABCPC1234D',
          occupation: 'Managing Director, FinTech Solutions',
          communicationPreference: 'WhatsApp',
        },
        {
          organizationId: srijanOrg.id,
          customerCode: 'SRJ-CUS-002',
          name: 'Meenakshi Iyer',
          mobile: '+91 98311 88765',
          email: 'meenakshi.iyer@consultancy.com',
          address: 'B-12, Greenwood Park, New Town',
          city: 'Kolkata',
          state: 'West Bengal',
          pan: 'BNMPI9876E',
          occupation: 'Principal Consultant, Tech Advisory',
          communicationPreference: 'Email',
        },
        {
          organizationId: srijanOrg.id,
          customerCode: 'SRJ-CUS-003',
          name: 'Sourav Ganguly & Tanushree Roy',
          mobile: '+91 98319 33221',
          email: 'sourav.tanushree@gmail.com',
          address: '77 Lake Gardens',
          city: 'Kolkata',
          state: 'West Bengal',
          pan: 'ABTPG4567H',
          occupation: 'Surgeon & Architect Couple',
          communicationPreference: 'Call',
        },
      ])
      .returning();

    // 11. Leads for Srijan
    const [lead1, lead2, lead3, lead4] = await db
      .insert(leads)
      .values([
        {
          organizationId: srijanOrg.id,
          leadCode: 'SRJ-LD-1001',
          projectId: projSolus.id,
          name: 'Rohan Bose',
          mobile: '+91 98302 33445',
          email: 'rohan.bose@tcs.com',
          location: 'Gariahat, Kolkata',
          source: 'Website',
          campaign: 'Solus Monsoon Luxury Campaign',
          unitPreference: '3 BHK, Higher floor facing East',
          budget: '₹1.3 Cr - ₹1.5 Cr',
          status: 'Qualified',
          assignedUserId: salesExec.id,
          channelPartnerId: cp1.id,
          remarks: 'Looking for prompt possession by early 2027. Wife is interested in clubhouse amenities.',
          score: 85,
        },
        {
          organizationId: srijanOrg.id,
          leadCode: 'SRJ-LD-1002',
          projectId: projSolus.id,
          name: 'Ananya Ghosh',
          mobile: '+91 98304 99882',
          email: 'ananya.ghosh@pwc.com',
          location: 'Salt Lake, Sector II',
          source: 'Google Ads',
          campaign: 'EM Bypass Premium Homes',
          unitPreference: '2 BHK or compact 3 BHK',
          budget: '₹1.0 Cr - ₹1.2 Cr',
          status: 'Site Visit Scheduled',
          assignedUserId: salesExec.id,
          remarks: 'Scheduled site visit this Saturday at 11:30 AM.',
          score: 75,
        },
        {
          organizationId: srijanOrg.id,
          leadCode: 'SRJ-LD-1003',
          projectId: projEternia.id,
          name: 'Kaushik Sen',
          mobile: '+91 98312 66778',
          email: 'ksen@senenterprises.in',
          location: 'Rajarhat, Kolkata',
          source: 'Walk-in',
          campaign: 'New Town Direct Office Enquiries',
          unitPreference: 'Commercial Office 1800 sqft',
          budget: '₹1.8 Cr - ₹2.2 Cr',
          status: 'Negotiation',
          assignedUserId: salesMgr.id,
          remarks: 'Wants bespoke payment terms aligned to milestones.',
          score: 90,
        },
        {
          organizationId: srijanOrg.id,
          leadCode: 'SRJ-LD-1004',
          projectId: projSolus.id,
          name: 'Pooja Agarwal',
          mobile: '+91 98307 12121',
          email: 'pooja.a@gmail.com',
          location: 'Howrah',
          source: 'Meta Ads',
          campaign: 'Facebook Lead Gen 2026',
          unitPreference: '4 BHK Luxury with 2 Car Parks',
          budget: '₹2.0 Cr+',
          status: 'New',
          assignedUserId: salesExec.id,
          remarks: 'Inbound lead received today morning.',
          score: 60,
        },
      ])
      .returning();

    // Lead Activities / Follow-up Timeline
    await db.insert(leadActivities).values([
      {
        organizationId: srijanOrg.id,
        leadId: lead1.id,
        activityType: 'Call',
        subject: 'Introductory Discovery Call',
        details: 'Discussed layout plans for Unit A-101 and A-201. Customer liked the 3-balcony configuration.',
        result: 'Interested in site inspection',
        nextAction: 'Schedule Site Visit on weekend',
        createdByUserId: salesExec.id,
      },
      {
        organizationId: srijanOrg.id,
        leadId: lead1.id,
        activityType: 'WhatsApp',
        subject: 'Shared E-Brochure & Pricing Sheet',
        details: 'Sent comprehensive PDF brochure of Srijan Solus with tower elevations and payment breakdown.',
        result: 'Customer acknowledged receipt',
        nextAction: 'Follow up regarding visit timings',
        createdByUserId: salesExec.id,
      },
    ]);

    // Site Visits
    await db.insert(siteVisits).values([
      {
        organizationId: srijanOrg.id,
        leadId: lead2.id,
        projectId: projSolus.id,
        salesExecutiveId: salesExec.id,
        visitDate: '2026-09-27',
        visitTime: '11:30',
        numberOfVisitors: 3,
        transportRequired: true,
        status: 'Scheduled',
        feedback: 'Awaiting site walkthrough',
        nextAction: 'Coordinate cab pickup from Salt Lake',
      },
    ]);

    // 12. Bookings (Unit A-102 booked for Vikramjit Chakraborty)
    const bookedUnit = insertedUnits.find((u) => u.unitNumber === 'A-102')!;
    const [booking1] = await db
      .insert(bookings)
      .values({
        organizationId: srijanOrg.id,
        bookingNumber: 'SRJ-BK-2026-0042',
        customerId: cust1.id,
        projectId: projSolus.id,
        unitId: bookedUnit.id,
        salesUserId: salesExec.id,
        channelPartnerId: cp1.id,
        bookingDate: '2026-08-15',
        bookingAmount: '1000000.00',
        totalConsideration: '14300000.00',
        agreementValue: '13650000.00',
        discountAmount: '150000.00',
        additionalCharges: '650000.00',
        taxes: '682500.00',
        paymentPlan: 'Construction Linked Milestone Plan',
        status: 'Confirmed',
        currentApprovalStep: 3,
      })
      .returning();

    // Workflow approvals for booking
    await db.insert(workflowApprovals).values([
      {
        organizationId: srijanOrg.id,
        bookingId: booking1.id,
        stepNumber: 1,
        stepName: 'Sales Manager Approval',
        roleCode: 'sales_manager',
        approverUserId: salesMgr.id,
        status: 'Approved',
        comments: 'Verified customer KYC and discount terms within authorization matrix.',
      },
      {
        organizationId: srijanOrg.id,
        bookingId: booking1.id,
        stepNumber: 2,
        stepName: 'Accounts Payment Verification',
        roleCode: 'accounts',
        approverUserId: accountsUser.id,
        status: 'Approved',
        comments: 'Received initial token of ₹10,00,000 via RTGS. Cleared in HDFC escrow account.',
      },
      {
        organizationId: srijanOrg.id,
        bookingId: booking1.id,
        stepNumber: 3,
        stepName: 'Executive Management Signoff',
        roleCode: 'org_admin',
        approverUserId: srijanAdmin.id,
        status: 'Approved',
        comments: 'Final booking approved. Welcome to Srijan Solus.',
      },
    ]);

    // 13. Payment Schedules for Booking
    const [sched1, sched2, sched3, sched4] = await db
      .insert(paymentSchedules)
      .values([
        {
          organizationId: srijanOrg.id,
          bookingId: booking1.id,
          milestoneName: 'Booking Token (10%)',
          installmentNumber: 1,
          dueDate: '2026-08-15',
          amount: '1365000.00',
          tax: '68250.00',
          total: '1433250.00',
          paidAmount: '1433250.00',
          status: 'Paid',
        },
        {
          organizationId: srijanOrg.id,
          bookingId: booking1.id,
          milestoneName: 'Execution of Agreement (10%)',
          installmentNumber: 2,
          dueDate: '2026-09-15',
          amount: '1365000.00',
          tax: '68250.00',
          total: '1433250.00',
          paidAmount: '1433250.00',
          status: 'Paid',
        },
        {
          organizationId: srijanOrg.id,
          bookingId: booking1.id,
          milestoneName: 'Completion of 5th Floor Slab (15%)',
          installmentNumber: 3,
          dueDate: '2026-11-30',
          amount: '2047500.00',
          tax: '102375.00',
          total: '2149875.00',
          paidAmount: '0.00',
          status: 'Upcoming',
        },
        {
          organizationId: srijanOrg.id,
          bookingId: booking1.id,
          milestoneName: 'Completion of Superstructure (20%)',
          installmentNumber: 4,
          dueDate: '2027-04-15',
          amount: '2730000.00',
          tax: '136500.00',
          total: '2866500.00',
          paidAmount: '0.00',
          status: 'Upcoming',
        },
      ])
      .returning();

    // Payments / Receipts
    await db.insert(payments).values([
      {
        organizationId: srijanOrg.id,
        receiptNumber: 'SRJ-RCT-2026-0089',
        customerId: cust1.id,
        bookingId: booking1.id,
        paymentScheduleId: sched1.id,
        amount: '1433250.00',
        paymentDate: '2026-08-15',
        paymentMode: 'RTGS',
        referenceNumber: 'HDFCR52026081500098',
        bankName: 'HDFC Bank',
        status: 'Cleared',
        remarks: 'Booking initial token consideration received',
        receivedByUserId: accountsUser.id,
      },
      {
        organizationId: srijanOrg.id,
        receiptNumber: 'SRJ-RCT-2026-0112',
        customerId: cust1.id,
        bookingId: booking1.id,
        paymentScheduleId: sched2.id,
        amount: '1433250.00',
        paymentDate: '2026-09-14',
        paymentMode: 'Bank Transfer',
        referenceNumber: 'ICIC00010992348',
        bankName: 'ICICI Bank',
        status: 'Cleared',
        remarks: 'Agreement execution milestone cleared',
        receivedByUserId: accountsUser.id,
      },
    ]);

    // Partner Commission
    await db.insert(partnerCommissions).values({
      organizationId: srijanOrg.id,
      channelPartnerId: cp1.id,
      bookingId: booking1.id,
      totalSaleValue: '13650000.00',
      commissionRate: '2.50',
      commissionAmount: '341250.00',
      status: 'Approved',
      paidAmount: '100000.00',
      paidDate: '2026-09-01',
      referenceNumber: 'PAY-CP-8831',
    });

    // 14. Complaints / Customer Service
    await db.insert(complaints).values([
      {
        organizationId: srijanOrg.id,
        ticketNumber: 'SRJ-SRV-2026-0012',
        customerId: cust1.id,
        bookingId: booking1.id,
        projectId: projSolus.id,
        unitId: bookedUnit.id,
        category: 'Documentation',
        priority: 'Medium',
        description: 'Requesting certified hardcopy of RERA sanctioned building plan and architect stamp for home loan file.',
        assignedUserId: crmUser.id,
        status: 'In Progress',
        slaDays: 3,
        resolution: 'Docket dispatched via courier on 22 Sep. Tracking: BLUEDART9923184.',
      },
    ]);

    // 15. Tasks
    await db.insert(tasks).values([
      {
        organizationId: srijanOrg.id,
        title: 'Complete Site Visit Walkthrough for Ananya Ghosh',
        description: 'Coordinate with site engineer for Tower A hard hat inspection and show sample flat on 1st floor.',
        assignedUserId: salesExec.id,
        departmentId: deptSales.id,
        projectId: projSolus.id,
        dueDate: '2026-09-27',
        priority: 'High',
        status: 'Pending',
        createdByUserId: salesMgr.id,
      },
      {
        organizationId: srijanOrg.id,
        title: 'Reconcile Q2 Escrow Bank Receipts with GST Filings',
        description: 'Prepare input tax credit and tax collected report for Solus Phase 1 accounts.',
        assignedUserId: accountsUser.id,
        departmentId: deptAccounts.id,
        projectId: projSolus.id,
        dueDate: '2026-09-30',
        priority: 'High',
        status: 'In Progress',
        createdByUserId: srijanAdmin.id,
      },
    ]);

    // 16. Audit Log
    await db.insert(auditLogs).values([
      {
        organizationId: srijanOrg.id,
        userId: srijanAdmin.id,
        userEmail: 'admin@srijanrealty.demo',
        action: 'CREATE',
        module: 'ORGANIZATION',
        recordId: `${srijanOrg.id}`,
        details: { action: 'Organization Profile & Settings initialized' },
        ipAddress: '127.0.0.1',
      },
      {
        organizationId: srijanOrg.id,
        userId: salesMgr.id,
        userEmail: 'sales.head@srijanrealty.demo',
        action: 'BOOK',
        module: 'BOOKING',
        recordId: `${booking1.id}`,
        details: { bookingNumber: booking1.bookingNumber, unit: 'A-102', customer: 'Vikramjit Chakraborty' },
        ipAddress: '127.0.0.1',
      },
    ]);

    console.log('Successfully seeded Srijan Demo Realty & multi-tenant isolation fixtures!');
  } catch (error) {
    console.error('Error during database seed:', error);
  }
}

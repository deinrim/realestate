import { Router, Response } from 'express';
import { db } from '../db/index.ts';
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
  documents,
  customFields,
} from '../db/schema.ts';
import { eq, and, desc, sql, inArray, ilike, or } from 'drizzle-orm';
import { AuthRequest, authenticate, enforceTenantIsolation, requireRole } from '../middleware/auth.ts';

export const apiRouter = Router();

// Apply base authentication to all API routes
apiRouter.use(authenticate);

// -------------------------------------------------------------
// 1. AUTH & PERSONA SWITCHER
// -------------------------------------------------------------
apiRouter.get('/auth/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let organizationData = null;
    let settingsData = null;

    const orgIdToLoad = req.user.organizationId || req.organizationId || 1;
    if (orgIdToLoad) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgIdToLoad))
        .limit(1);
      organizationData = org || null;

      const [sett] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, orgIdToLoad))
        .limit(1);
      settingsData = sett || null;
    }

    res.json({
      user: req.user,
      organization: organizationData,
      settings: settingsData,
    });
  } catch (error: any) {
    console.error('Error in /auth/me:', error);
    res.status(500).json({ error: 'Failed to fetch current user profile' });
  }
});

// List demo personas for quick switching in evaluation/testing
apiRouter.get('/auth/personas', async (req: AuthRequest, res: Response) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        uid: users.uid,
        name: users.name,
        email: users.email,
        roleCode: users.roleCode,
        designation: users.designation,
        isSystemAdmin: users.isSystemAdmin,
        organizationId: users.organizationId,
        status: users.status,
      })
      .from(users);

    const allOrgs = await db.select().from(organizations);
    const orgMap = new Map(allOrgs.map((o) => [o.id, o.companyName]));

    const personas = allUsers.map((u) => ({
      ...u,
      organizationName: u.organizationId ? orgMap.get(u.organizationId) || 'Unknown' : 'Global (System)',
    }));

    res.json(personas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch personas' });
  }
});

// -------------------------------------------------------------
// 2. SYSTEM ADMIN APIS (Global Multi-Tenant Management)
// -------------------------------------------------------------
apiRouter.get('/system/organizations', requireRole(['system_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));

    // Aggregate stats per organization
    const orgStats = await Promise.all(
      orgs.map(async (org) => {
        const [uCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.organizationId, org.id));
        const [pCount] = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.organizationId, org.id));
        const [unitCount] = await db.select({ count: sql<number>`count(*)` }).from(units).where(eq(units.organizationId, org.id));
        const [bCount] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.organizationId, org.id));

        return {
          ...org,
          stats: {
            users: Number(uCount?.count || 0),
            projects: Number(pCount?.count || 0),
            units: Number(unitCount?.count || 0),
            bookings: Number(bCount?.count || 0),
          },
        };
      })
    );

    res.json(orgStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

apiRouter.post('/system/organizations', requireRole(['system_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      code,
      companyName,
      legalName,
      logoUrl,
      website,
      email,
      phone,
      address,
      city,
      state,
      country = 'India',
      gstin,
      pan,
      contactPerson,
      subscriptionPlan = 'Growth Tier',
      brandPrimaryColor = '#0f172a',
      brandAccentColor = '#0284c7',
      adminName,
      adminEmail,
      adminMobile,
    } = req.body;

    if (!code || !companyName || !legalName || !email || !phone || !address || !city || !state || !contactPerson) {
      return res.status(400).json({ error: 'Missing mandatory organization fields' });
    }

    const [newOrg] = await db
      .insert(organizations)
      .values({
        code: code.toUpperCase().trim(),
        companyName,
        legalName,
        logoUrl: logoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=200&auto=format&fit=crop&q=60',
        website,
        email,
        phone,
        address,
        city,
        state,
        country,
        gstin,
        pan,
        contactPerson,
        subscriptionPlan,
        brandPrimaryColor,
        brandAccentColor,
        status: 'active',
      })
      .returning();

    // Default settings
    await db.insert(organizationSettings).values({
      organizationId: newOrg.id,
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Asia/Kolkata',
      leadPrefix: `${newOrg.code}-LD-`,
      bookingPrefix: `${newOrg.code}-BK-`,
      receiptPrefix: `${newOrg.code}-RCT-`,
      customerPrefix: `${newOrg.code}-CUS-`,
      projectPrefix: `${newOrg.code}-PRJ-`,
    });

    // Default Head Office Branch
    const [ho] = await db
      .insert(branches)
      .values({
        organizationId: newOrg.id,
        name: `${companyName} Corporate Office`,
        code: 'HQ-01',
        address,
        city,
        state,
        phone,
        email,
        isHeadOffice: true,
      })
      .returning();

    // Default Departments
    await db.insert(departments).values([
      { organizationId: newOrg.id, name: 'Sales & Marketing', code: 'SALES' },
      { organizationId: newOrg.id, name: 'Accounts & Finance', code: 'FINANCE' },
      { organizationId: newOrg.id, name: 'CRM & Client Services', code: 'CRM' },
    ]);

    // Initial Org Admin User
    if (adminEmail) {
      await db.insert(users).values({
        uid: `user_org_admin_${newOrg.id}_${Date.now()}`,
        organizationId: newOrg.id,
        name: adminName || contactPerson,
        email: adminEmail,
        mobile: adminMobile || phone,
        employeeId: `${newOrg.code}-001`,
        roleCode: 'org_admin',
        branchId: ho.id,
        designation: 'Managing Director',
        status: 'active',
      });
    }

    // Default Workflow
    await db.insert(workflows).values({
      organizationId: newOrg.id,
      name: 'Standard Booking Approval Workflow',
      module: 'booking',
      isActive: true,
      stepsJson: [
        { stepNumber: 1, roleCode: 'sales_manager', stepName: 'Sales Manager Review', required: true },
        { stepNumber: 2, roleCode: 'accounts', stepName: 'Accounts Token Verification', required: true },
        { stepNumber: 3, roleCode: 'org_admin', stepName: 'Management Final Approval', required: true },
      ],
    });

    res.status(201).json(newOrg);
  } catch (error: any) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: error.message || 'Failed to create organization' });
  }
});

apiRouter.put('/system/organizations/:id', requireRole(['system_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = Number(req.params.id);
    const { status, subscriptionPlan, companyName, phone, email, contactPerson } = req.body;

    const [updated] = await db
      .update(organizations)
      .set({
        status,
        subscriptionPlan,
        companyName,
        phone,
        email,
        contactPerson,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update organization status' });
  }
});

apiRouter.get('/system/dashboard', requireRole(['system_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const [totalOrgs] = await db.select({ count: sql<number>`count(*)` }).from(organizations);
    const [activeOrgs] = await db.select({ count: sql<number>`count(*)` }).from(organizations).where(eq(organizations.status, 'active'));
    const [suspendedOrgs] = await db.select({ count: sql<number>`count(*)` }).from(organizations).where(eq(organizations.status, 'suspended'));
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalProjects] = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const [totalUnits] = await db.select({ count: sql<number>`count(*)` }).from(units);
    const [totalBookings] = await db.select({ count: sql<number>`count(*)` }).from(bookings);
    const [totalCustomers] = await db.select({ count: sql<number>`count(*)` }).from(customers);

    const recentOrgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt)).limit(5);

    res.json({
      metrics: {
        totalOrganizations: Number(totalOrgs.count || 0),
        activeOrganizations: Number(activeOrgs.count || 0),
        suspendedOrganizations: Number(suspendedOrgs.count || 0),
        totalUsers: Number(totalUsers.count || 0),
        totalProjects: Number(totalProjects.count || 0),
        totalUnits: Number(totalUnits.count || 0),
        totalBookings: Number(totalBookings.count || 0),
        totalCustomers: Number(totalCustomers.count || 0),
      },
      recentOrganizations: recentOrgs,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load system dashboard' });
  }
});

// -------------------------------------------------------------
// 3. TENANT-ISOLATED CORE MODULES (Enforce Tenant Security)
// -------------------------------------------------------------
apiRouter.use(enforceTenantIsolation);

// DASHBOARD
apiRouter.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;

    // 1. Projects & Inventory Metrics
    const [projCount] = await db.select({ count: sql<number>`count(*)` }).from(projects).where(and(eq(projects.organizationId, orgId), eq(projects.isDeleted, false)));
    const [unitCount] = await db.select({ count: sql<number>`count(*)` }).from(units).where(and(eq(units.organizationId, orgId), eq(units.isDeleted, false)));
    const [availUnits] = await db.select({ count: sql<number>`count(*)` }).from(units).where(and(eq(units.organizationId, orgId), eq(units.status, 'Available'), eq(units.isDeleted, false)));
    const [bookedUnits] = await db.select({ count: sql<number>`count(*)` }).from(units).where(and(eq(units.organizationId, orgId), or(eq(units.status, 'Booked'), eq(units.status, 'Agreement'), eq(units.status, 'Sold')), eq(units.isDeleted, false)));

    // 2. Leads & CRM Metrics
    const [leadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.organizationId, orgId), eq(leads.isDeleted, false)));
    const [newLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.organizationId, orgId), eq(leads.status, 'New'), eq(leads.isDeleted, false)));
    const [visitsCount] = await db.select({ count: sql<number>`count(*)` }).from(siteVisits).where(eq(siteVisits.organizationId, orgId));

    // 3. Financial & Collections Metrics
    const [bookingStats] = await db
      .select({
        count: sql<number>`count(*)`,
        totalSalesValue: sql<string>`coalesce(sum(total_consideration), 0)`,
      })
      .from(bookings)
      .where(and(eq(bookings.organizationId, orgId), eq(bookings.isDeleted, false)));

    const [paymentStats] = await db
      .select({
        totalCollected: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(payments)
      .where(and(eq(payments.organizationId, orgId), eq(payments.status, 'Cleared'), eq(payments.isDeleted, false)));

    const [complaintStats] = await db
      .select({
        openComplaints: sql<number>`count(*)`,
      })
      .from(complaints)
      .where(and(eq(complaints.organizationId, orgId), or(eq(complaints.status, 'Open'), eq(complaints.status, 'In Progress'))));

    // Lead Sources breakdown
    const leadSources = await db
      .select({
        source: leads.source,
        count: sql<number>`count(*)`,
      })
      .from(leads)
      .where(and(eq(leads.organizationId, orgId), eq(leads.isDeleted, false)))
      .groupBy(leads.source);

    // Recent Bookings
    const recentBookings = await db
      .select({
        id: bookings.id,
        bookingNumber: bookings.bookingNumber,
        bookingDate: bookings.bookingDate,
        amount: bookings.bookingAmount,
        total: bookings.totalConsideration,
        status: bookings.status,
        customerName: customers.name,
        projectName: projects.name,
        unitNumber: units.unitNumber,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(projects, eq(bookings.projectId, projects.id))
      .innerJoin(units, eq(bookings.unitId, units.id))
      .where(and(eq(bookings.organizationId, orgId), eq(bookings.isDeleted, false)))
      .orderBy(desc(bookings.createdAt))
      .limit(5);

    // Pending Tasks
    const pendingTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.organizationId, orgId), eq(tasks.status, 'Pending')))
      .orderBy(desc(tasks.priority))
      .limit(5);

    const totalSales = Number(bookingStats?.totalSalesValue || 0);
    const totalCollected = Number(paymentStats?.totalCollected || 0);
    const outstanding = Math.max(0, totalSales - totalCollected);

    res.json({
      metrics: {
        totalProjects: Number(projCount?.count || 0),
        totalUnits: Number(unitCount?.count || 0),
        availableUnits: Number(availUnits?.count || 0),
        bookedUnits: Number(bookedUnits?.count || 0),
        totalLeads: Number(leadCount?.count || 0),
        newLeads: Number(newLeads?.count || 0),
        siteVisits: Number(visitsCount?.count || 0),
        totalBookings: Number(bookingStats?.count || 0),
        totalSalesValue: totalSales,
        totalCollected,
        outstanding,
        openComplaints: Number(complaintStats?.openComplaints || 0),
      },
      leadSources,
      recentBookings,
      pendingTasks,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

// SALES SUMMARY & MOBILE REPORTING
apiRouter.get('/reports/sales-summary', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const [bookingStats] = await db
      .select({
        totalBookings: sql<number>`count(*)`,
        totalSalesValue: sql<string>`coalesce(sum(total_consideration), 0)`,
      })
      .from(bookings)
      .where(and(eq(bookings.organizationId, orgId), eq(bookings.isDeleted, false)));

    const [paymentStats] = await db
      .select({
        totalCollected: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(payments)
      .where(eq(payments.organizationId, orgId));

    const [unitCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(units)
      .where(and(eq(units.organizationId, orgId), eq(units.isDeleted, false)));

    const [availUnits] = await db
      .select({ count: sql<number>`count(*)` })
      .from(units)
      .where(and(eq(units.organizationId, orgId), eq(units.status, 'Available'), eq(units.isDeleted, false)));

    const [bookedUnits] = await db
      .select({ count: sql<number>`count(*)` })
      .from(units)
      .where(and(eq(units.organizationId, orgId), or(eq(units.status, 'Booked'), eq(units.status, 'Agreement'), eq(units.status, 'Sold')), eq(units.isDeleted, false)));

    const [leadStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.organizationId, orgId), eq(leads.isDeleted, false)));

    const totalSales = Number(bookingStats?.totalSalesValue || 0);
    const totalCollected = Number(paymentStats?.totalCollected || 0);
    const outstanding = Math.max(0, totalSales - totalCollected);

    res.json({
      totalBookings: Number(bookingStats?.totalBookings || 0),
      totalSalesValue: totalSales,
      totalCollected,
      outstanding,
      totalUnits: Number(unitCount?.count || 0),
      availableUnits: Number(availUnits?.count || 0),
      bookedUnits: Number(bookedUnits?.count || 0),
      totalLeads: Number(leadStats?.count || 0),
    });
  } catch (err: any) {
    console.error('Error fetching sales summary:', err);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
});

// ORGANIZATION SETTINGS & PROFILE
apiRouter.get('/organization/profile', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    const [settings] = await db.select().from(organizationSettings).where(eq(organizationSettings.organizationId, orgId));
    const orgBranches = await db.select().from(branches).where(eq(branches.organizationId, orgId));
    const orgDepts = await db.select().from(departments).where(eq(departments.organizationId, orgId));

    res.json({
      organization: org,
      settings: settings || {},
      branches: orgBranches,
      departments: orgDepts,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch organization profile' });
  }
});

apiRouter.put('/organization/profile', requireRole(['org_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { companyName, legalName, logoUrl, website, email, phone, address, city, state, gstin, pan, contactPerson, brandPrimaryColor, brandAccentColor } = req.body;

    const [updated] = await db
      .update(organizations)
      .set({
        companyName,
        legalName,
        logoUrl,
        website,
        email,
        phone,
        address,
        city,
        state,
        gstin,
        pan,
        contactPerson,
        brandPrimaryColor,
        brandAccentColor,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update organization profile' });
  }
});

apiRouter.put('/organization/settings', requireRole(['org_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { currency, currencySymbol, dateFormat, timezone, taxRateGst, leadPrefix, bookingPrefix, receiptPrefix, customerPrefix, projectPrefix, invoiceHeader, emailSignature } = req.body;

    const [updated] = await db
      .update(organizationSettings)
      .set({
        currency,
        currencySymbol,
        dateFormat,
        timezone,
        taxRateGst,
        leadPrefix,
        bookingPrefix,
        receiptPrefix,
        customerPrefix,
        projectPrefix,
        invoiceHeader,
        emailSignature,
        updatedAt: new Date(),
      })
      .where(eq(organizationSettings.organizationId, orgId))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update organization settings' });
  }
});

// USERS & ROLES
apiRouter.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const userList = await db
      .select({
        id: users.id,
        uid: users.uid,
        name: users.name,
        email: users.email,
        mobile: users.mobile,
        employeeId: users.employeeId,
        roleCode: users.roleCode,
        designation: users.designation,
        status: users.status,
        departmentId: users.departmentId,
        branchId: users.branchId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.organizationId, orgId))
      .orderBy(desc(users.createdAt));

    res.json(userList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

apiRouter.post('/users', requireRole(['org_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { name, email, mobile, employeeId, roleCode, designation, departmentId, branchId } = req.body;

    if (!name || !email || !roleCode) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    const [newUser] = await db
      .insert(users)
      .values({
        uid: `user_${orgId}_${Date.now()}`,
        organizationId: orgId,
        name,
        email,
        mobile,
        employeeId,
        roleCode,
        designation,
        departmentId: departmentId ? Number(departmentId) : null,
        branchId: branchId ? Number(branchId) : null,
        status: 'active',
      })
      .returning();

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

// PROJECTS
apiRouter.get('/projects', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const projectList = await db
      .select()
      .from(projects)
      .where(and(eq(projects.organizationId, orgId), eq(projects.isDeleted, false)))
      .orderBy(desc(projects.createdAt));

    const enriched = await Promise.all(
      projectList.map(async (p) => {
        const [tCount] = await db.select({ count: sql<number>`count(*)` }).from(towers).where(eq(towers.projectId, p.id));
        const [uCount] = await db.select({ count: sql<number>`count(*)` }).from(units).where(and(eq(units.projectId, p.id), eq(units.isDeleted, false)));
        const [availCount] = await db.select({ count: sql<number>`count(*)` }).from(units).where(and(eq(units.projectId, p.id), eq(units.status, 'Available'), eq(units.isDeleted, false)));

        return {
          ...p,
          towersCount: Number(tCount?.count || 0),
          totalUnits: Number(uCount?.count || 0),
          availableUnits: Number(availCount?.count || 0),
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

apiRouter.get('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const projId = Number(req.params.id);

    const [proj] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projId), eq(projects.organizationId, orgId), eq(projects.isDeleted, false)));

    if (!proj) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const phases = await db.select().from(projectPhases).where(eq(projectPhases.projectId, projId));
    const projectTowers = await db.select().from(towers).where(eq(towers.projectId, projId));
    const projectUnits = await db.select().from(units).where(and(eq(units.projectId, projId), eq(units.isDeleted, false)));

    res.json({
      project: proj,
      phases,
      towers: projectTowers,
      units: projectUnits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

apiRouter.post('/projects', requireRole(['org_admin', 'project_manager']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { name, code, projectType, address, city, state, location, description, status, startDate, expectedCompletion, reraNumber, reraDate, developerDetails, logoUrl } = req.body;

    if (!name || !code || !location || !city || !state) {
      return res.status(400).json({ error: 'Project name, code, location, city, and state are required' });
    }

    const [newProj] = await db
      .insert(projects)
      .values({
        organizationId: orgId,
        name,
        code: code.toUpperCase().trim(),
        projectType: projectType || 'Residential',
        address: address || location,
        city,
        state,
        location,
        description,
        status: status || 'Planning',
        startDate,
        expectedCompletion,
        reraNumber,
        reraDate,
        developerDetails,
        logoUrl,
      })
      .returning();

    // Create a default Tower A
    const [twr] = await db
      .insert(towers)
      .values({
        organizationId: orgId,
        projectId: newProj.id,
        name: 'Tower A',
        code: 'TWR-A',
        totalFloors: 10,
        totalUnits: 40,
      })
      .returning();

    // Create Floor 1
    const [flr] = await db
      .insert(floors)
      .values({
        organizationId: orgId,
        projectId: newProj.id,
        towerId: twr.id,
        floorNumber: 1,
        floorName: 'Floor 1',
      })
      .returning();

    // Create 4 initial units
    await db.insert(units).values([
      {
        organizationId: orgId,
        projectId: newProj.id,
        towerId: twr.id,
        floorId: flr.id,
        floorNumber: 1,
        unitNumber: 'A-101',
        unitType: 'Apartment',
        bedrooms: 3,
        bathrooms: 2,
        carpetArea: '1200.00',
        superBuiltUpArea: '1500.00',
        basePrice: '9000000.00',
        pricePerSqft: '6000.00',
        totalPrice: '9500000.00',
        status: 'Available',
      },
      {
        organizationId: orgId,
        projectId: newProj.id,
        towerId: twr.id,
        floorId: flr.id,
        floorNumber: 1,
        unitNumber: 'A-102',
        unitType: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        carpetArea: '950.00',
        superBuiltUpArea: '1200.00',
        basePrice: '7200000.00',
        pricePerSqft: '6000.00',
        totalPrice: '7600000.00',
        status: 'Available',
      },
    ]);

    res.status(201).json(newProj);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

// INVENTORY & UNITS
apiRouter.get('/inventory/units', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { projectId, towerId, status, unitType, bedrooms } = req.query;

    let conditions = [eq(units.organizationId, orgId), eq(units.isDeleted, false)];

    if (projectId) conditions.push(eq(units.projectId, Number(projectId)));
    if (towerId) conditions.push(eq(units.towerId, Number(towerId)));
    if (status) conditions.push(eq(units.status, String(status)));
    if (unitType) conditions.push(eq(units.unitType, String(unitType)));
    if (bedrooms) conditions.push(eq(units.bedrooms, Number(bedrooms)));

    const unitList = await db
      .select({
        id: units.id,
        unitNumber: units.unitNumber,
        unitType: units.unitType,
        floorNumber: units.floorNumber,
        bedrooms: units.bedrooms,
        bathrooms: units.bathrooms,
        balcony: units.balcony,
        parking: units.parking,
        carpetArea: units.carpetArea,
        superBuiltUpArea: units.superBuiltUpArea,
        facing: units.facing,
        basePrice: units.basePrice,
        pricePerSqft: units.pricePerSqft,
        otherCharges: units.otherCharges,
        totalPrice: units.totalPrice,
        status: units.status,
        projectId: units.projectId,
        projectName: projects.name,
        towerId: units.towerId,
        towerName: towers.name,
      })
      .from(units)
      .innerJoin(projects, eq(units.projectId, projects.id))
      .innerJoin(towers, eq(units.towerId, towers.id))
      .where(and(...conditions))
      .orderBy(units.floorNumber, units.unitNumber);

    res.json(unitList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory units' });
  }
});

apiRouter.put('/inventory/units/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const unitId = Number(req.params.id);
    const { status, leadId } = req.body;

    const [updated] = await db
      .update(units)
      .set({
        status,
        lockedByLeadId: leadId ? Number(leadId) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(units.id, unitId), eq(units.organizationId, orgId)))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update unit status' });
  }
});

// LEADS & CRM
apiRouter.get('/leads', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { status, projectId, search } = req.query;

    let conditions = [eq(leads.organizationId, orgId), eq(leads.isDeleted, false)];

    if (status) conditions.push(eq(leads.status, String(status)));
    if (projectId) conditions.push(eq(leads.projectId, Number(projectId)));
    if (search) {
      conditions.push(
        or(
          ilike(leads.name, `%${search}%`),
          ilike(leads.mobile, `%${search}%`),
          ilike(leads.leadCode, `%${search}%`)
        )!
      );
    }

    const leadList = await db
      .select({
        id: leads.id,
        leadCode: leads.leadCode,
        name: leads.name,
        mobile: leads.mobile,
        email: leads.email,
        location: leads.location,
        source: leads.source,
        campaign: leads.campaign,
        unitPreference: leads.unitPreference,
        budget: leads.budget,
        status: leads.status,
        score: leads.score,
        remarks: leads.remarks,
        projectId: leads.projectId,
        projectName: projects.name,
        assignedUserId: leads.assignedUserId,
        assignedUserName: users.name,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .leftJoin(projects, eq(leads.projectId, projects.id))
      .leftJoin(users, eq(leads.assignedUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(leads.createdAt));

    res.json(leadList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

apiRouter.post('/leads', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { name, mobile, email, location, source, campaign, unitPreference, budget, projectId, assignedUserId, remarks } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile number are required' });
    }

    // Lead code generation
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.organizationId, orgId));
    const nextNum = (Number(countRow?.count || 0) + 1).toString().padStart(4, '0');
    const leadCode = `LD-${nextNum}`;

    const [newLead] = await db
      .insert(leads)
      .values({
        organizationId: orgId,
        leadCode,
        name,
        mobile,
        email,
        location,
        source: source || 'Website',
        campaign,
        unitPreference,
        budget,
        projectId: projectId ? Number(projectId) : null,
        assignedUserId: assignedUserId ? Number(assignedUserId) : req.user?.id,
        remarks,
        status: 'New',
        score: 60,
      })
      .returning();

    // Log initial activity
    await db.insert(leadActivities).values({
      organizationId: orgId,
      leadId: newLead.id,
      activityType: 'Note',
      subject: 'Lead Created',
      details: `Inbound lead captured via ${source || 'Website'}.`,
      createdByUserId: req.user?.id,
    });

    res.status(201).json(newLead);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create lead' });
  }
});

apiRouter.get('/leads/:id', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const leadId = Number(req.params.id);

    const [lead] = await db
      .select({
        id: leads.id,
        leadCode: leads.leadCode,
        name: leads.name,
        mobile: leads.mobile,
        email: leads.email,
        location: leads.location,
        source: leads.source,
        campaign: leads.campaign,
        unitPreference: leads.unitPreference,
        budget: leads.budget,
        status: leads.status,
        score: leads.score,
        remarks: leads.remarks,
        projectId: leads.projectId,
        projectName: projects.name,
        assignedUserId: leads.assignedUserId,
        assignedUserName: users.name,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .leftJoin(projects, eq(leads.projectId, projects.id))
      .leftJoin(users, eq(leads.assignedUserId, users.id))
      .where(and(eq(leads.id, leadId), eq(leads.organizationId, orgId), eq(leads.isDeleted, false)));

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const activities = await db
      .select({
        id: leadActivities.id,
        activityType: leadActivities.activityType,
        subject: leadActivities.subject,
        details: leadActivities.details,
        result: leadActivities.result,
        nextAction: leadActivities.nextAction,
        createdAt: leadActivities.createdAt,
        createdByName: users.name,
      })
      .from(leadActivities)
      .leftJoin(users, eq(leadActivities.createdByUserId, users.id))
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));

    const visits = await db
      .select()
      .from(siteVisits)
      .where(eq(siteVisits.leadId, leadId))
      .orderBy(desc(siteVisits.createdAt));

    res.json({
      lead,
      activities,
      siteVisits: visits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead details' });
  }
});

apiRouter.post('/leads/:id/activities', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const leadId = Number(req.params.id);
    const { activityType, subject, details, result, nextAction, nextFollowUpDate } = req.body;

    if (!activityType || !subject || !details) {
      return res.status(400).json({ error: 'Activity type, subject, and details are required' });
    }

    const [act] = await db
      .insert(leadActivities)
      .values({
        organizationId: orgId,
        leadId,
        activityType,
        subject,
        details,
        result,
        nextAction,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        createdByUserId: req.user?.id,
      })
      .returning();

    // Update lead last contact
    await db
      .update(leads)
      .set({
        lastContact: new Date(),
        nextFollowUp: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    res.status(201).json(act);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record activity' });
  }
});

apiRouter.put('/leads/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const leadId = Number(req.params.id);
    const { status, remarks } = req.body;

    const [updated] = await db
      .update(leads)
      .set({
        status,
        remarks: remarks || undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(leads.id, leadId), eq(leads.organizationId, orgId)))
      .returning();

    // Log status change activity
    await db.insert(leadActivities).values({
      organizationId: orgId,
      leadId,
      activityType: 'Note',
      subject: `Status changed to ${status}`,
      details: remarks || `Pipeline stage progressed to ${status}`,
      createdByUserId: req.user?.id,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// SITE VISITS
apiRouter.get('/site-visits', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const visits = await db
      .select({
        id: siteVisits.id,
        visitDate: siteVisits.visitDate,
        visitTime: siteVisits.visitTime,
        status: siteVisits.status,
        numberOfVisitors: siteVisits.numberOfVisitors,
        transportRequired: siteVisits.transportRequired,
        feedback: siteVisits.feedback,
        nextAction: siteVisits.nextAction,
        leadName: leads.name,
        leadMobile: leads.mobile,
        projectName: projects.name,
        executiveName: users.name,
      })
      .from(siteVisits)
      .innerJoin(projects, eq(siteVisits.projectId, projects.id))
      .leftJoin(leads, eq(siteVisits.leadId, leads.id))
      .leftJoin(users, eq(siteVisits.salesExecutiveId, users.id))
      .where(eq(siteVisits.organizationId, orgId))
      .orderBy(desc(siteVisits.visitDate));

    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch site visits' });
  }
});

apiRouter.post('/site-visits', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { leadId, projectId, visitDate, visitTime, numberOfVisitors, transportRequired, salesExecutiveId } = req.body;

    if (!projectId || !visitDate || !visitTime) {
      return res.status(400).json({ error: 'Project, visit date, and time are required' });
    }

    const [visit] = await db
      .insert(siteVisits)
      .values({
        organizationId: orgId,
        leadId: leadId ? Number(leadId) : null,
        projectId: Number(projectId),
        visitDate,
        visitTime,
        numberOfVisitors: numberOfVisitors ? Number(numberOfVisitors) : 1,
        transportRequired: Boolean(transportRequired),
        salesExecutiveId: salesExecutiveId ? Number(salesExecutiveId) : req.user?.id,
        status: 'Scheduled',
      })
      .returning();

    // If lead exists, update status to Site Visit Scheduled
    if (leadId) {
      await db
        .update(leads)
        .set({ status: 'Site Visit Scheduled', updatedAt: new Date() })
        .where(eq(leads.id, Number(leadId)));
    }

    res.status(201).json(visit);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to schedule site visit' });
  }
});

// CUSTOMERS
apiRouter.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { search } = req.query;

    let conditions = [eq(customers.organizationId, orgId), eq(customers.isDeleted, false)];
    if (search) {
      conditions.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.mobile, `%${search}%`),
          ilike(customers.customerCode, `%${search}%`)
        )!
      );
    }

    const customerList = await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.createdAt));

    // Enhance with booking count & paid amounts
    const enriched = await Promise.all(
      customerList.map(async (c) => {
        const [bCount] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(and(eq(bookings.customerId, c.id), eq(bookings.isDeleted, false)));
        const [pSum] = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(payments).where(and(eq(payments.customerId, c.id), eq(payments.status, 'Cleared')));

        return {
          ...c,
          bookingsCount: Number(bCount?.count || 0),
          totalPaid: Number(pSum?.total || 0),
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

apiRouter.post('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { name, mobile, email, address, city, state, pan, gstin, occupation, communicationPreference } = req.body;

    if (!name || !mobile || !email) {
      return res.status(400).json({ error: 'Name, mobile, and email are required' });
    }

    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.organizationId, orgId));
    const nextNum = (Number(countRow?.count || 0) + 1).toString().padStart(4, '0');
    const customerCode = `CUS-${nextNum}`;

    const [newCust] = await db
      .insert(customers)
      .values({
        organizationId: orgId,
        customerCode,
        name,
        mobile,
        email,
        address,
        city,
        state,
        pan,
        gstin,
        occupation,
        communicationPreference: communicationPreference || 'WhatsApp',
      })
      .returning();

    res.status(201).json(newCust);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create customer' });
  }
});

apiRouter.get('/customers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const custId = Number(req.params.id);

    const [cust] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, custId), eq(customers.organizationId, orgId), eq(customers.isDeleted, false)));

    if (!cust) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Customer Bookings
    const customerBookings = await db
      .select({
        id: bookings.id,
        bookingNumber: bookings.bookingNumber,
        bookingDate: bookings.bookingDate,
        totalConsideration: bookings.totalConsideration,
        bookingAmount: bookings.bookingAmount,
        status: bookings.status,
        projectName: projects.name,
        unitNumber: units.unitNumber,
        unitType: units.unitType,
      })
      .from(bookings)
      .innerJoin(projects, eq(bookings.projectId, projects.id))
      .innerJoin(units, eq(bookings.unitId, units.id))
      .where(and(eq(bookings.customerId, custId), eq(bookings.isDeleted, false)));

    // Customer Payments
    const customerPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.customerId, custId), eq(payments.isDeleted, false)))
      .orderBy(desc(payments.paymentDate));

    // Customer Complaints
    const customerComplaints = await db
      .select()
      .from(complaints)
      .where(eq(complaints.customerId, custId))
      .orderBy(desc(complaints.createdAt));

    res.json({
      customer: cust,
      bookings: customerBookings,
      payments: customerPayments,
      complaints: customerComplaints,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer 360 profile' });
  }
});

// BOOKINGS & SALES PIPELINE (WITH STRICT DOUBLE-BOOKING PREVENTION!)
apiRouter.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const bookingList = await db
      .select({
        id: bookings.id,
        bookingNumber: bookings.bookingNumber,
        bookingDate: bookings.bookingDate,
        bookingAmount: bookings.bookingAmount,
        totalConsideration: bookings.totalConsideration,
        agreementValue: bookings.agreementValue,
        discountAmount: bookings.discountAmount,
        status: bookings.status,
        currentApprovalStep: bookings.currentApprovalStep,
        customerName: customers.name,
        customerMobile: customers.mobile,
        projectName: projects.name,
        unitNumber: units.unitNumber,
        unitType: units.unitType,
        salesUserName: users.name,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(projects, eq(bookings.projectId, projects.id))
      .innerJoin(units, eq(bookings.unitId, units.id))
      .innerJoin(users, eq(bookings.salesUserId, users.id))
      .where(and(eq(bookings.organizationId, orgId), eq(bookings.isDeleted, false)))
      .orderBy(desc(bookings.createdAt));

    res.json(bookingList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

apiRouter.post('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const {
      customerId,
      projectId,
      unitId,
      bookingAmount,
      totalConsideration,
      agreementValue,
      discountAmount = 0,
      paymentPlan = 'Construction Linked Plan',
      channelPartnerId,
    } = req.body;

    if (!customerId || !projectId || !unitId || !bookingAmount || !totalConsideration) {
      return res.status(400).json({ error: 'Customer, project, unit, and monetary amounts are required' });
    }

    // CRITICAL: Double-booking prevention check
    const [targetUnit] = await db
      .select()
      .from(units)
      .where(and(eq(units.id, Number(unitId)), eq(units.organizationId, orgId)));

    if (!targetUnit) {
      return res.status(404).json({ error: 'Selected inventory unit not found' });
    }

    if (['Booked', 'Agreement', 'Sold', 'Registered', 'Handover'].includes(targetUnit.status)) {
      return res.status(409).json({
        error: `Unit ${targetUnit.unitNumber} is already ${targetUnit.status}. Double booking is strictly prevented.`,
      });
    }

    // Generate Booking Number
    const [bCount] = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.organizationId, orgId));
    const nextNum = (Number(bCount?.count || 0) + 1).toString().padStart(4, '0');
    const bookingNumber = `BK-${new Date().getFullYear()}-${nextNum}`;

    const todayDate = new Date().toISOString().split('T')[0];

    // Create Booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        organizationId: orgId,
        bookingNumber,
        customerId: Number(customerId),
        projectId: Number(projectId),
        unitId: Number(unitId),
        salesUserId: req.user?.id || 1,
        channelPartnerId: channelPartnerId ? Number(channelPartnerId) : null,
        bookingDate: todayDate,
        bookingAmount: String(bookingAmount),
        totalConsideration: String(totalConsideration),
        agreementValue: String(agreementValue || totalConsideration),
        discountAmount: String(discountAmount),
        paymentPlan,
        status: 'Pending Approval',
        currentApprovalStep: 1,
      })
      .returning();

    // Lock unit to Booked
    await db
      .update(units)
      .set({ status: 'Booked', updatedAt: new Date() })
      .where(eq(units.id, Number(unitId)));

    // Generate standard milestone payment schedules
    const total = Number(totalConsideration);
    const tokenAmount = Number(bookingAmount);
    const agreementDue = Math.round(total * 0.1);
    const plinthDue = Math.round(total * 0.15);
    const slab5Due = Math.round(total * 0.2);
    const structureDue = Math.round(total * 0.25);
    const possessionDue = Math.max(0, total - (tokenAmount + agreementDue + plinthDue + slab5Due + structureDue));

    await db.insert(paymentSchedules).values([
      {
        organizationId: orgId,
        bookingId: newBooking.id,
        milestoneName: 'Booking Token',
        installmentNumber: 1,
        dueDate: todayDate,
        amount: String(tokenAmount),
        total: String(tokenAmount),
        paidAmount: String(tokenAmount),
        status: 'Paid',
      },
      {
        organizationId: orgId,
        bookingId: newBooking.id,
        milestoneName: 'Agreement Signing (10%)',
        installmentNumber: 2,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        amount: String(agreementDue),
        total: String(agreementDue),
        status: 'Upcoming',
      },
      {
        organizationId: orgId,
        bookingId: newBooking.id,
        milestoneName: 'Plinth Level Completion (15%)',
        installmentNumber: 3,
        dueDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        amount: String(plinthDue),
        total: String(plinthDue),
        status: 'Upcoming',
      },
      {
        organizationId: orgId,
        bookingId: newBooking.id,
        milestoneName: '5th Floor Slab Casting (20%)',
        installmentNumber: 4,
        dueDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        amount: String(slab5Due),
        total: String(slab5Due),
        status: 'Upcoming',
      },
      {
        organizationId: orgId,
        bookingId: newBooking.id,
        milestoneName: 'Superstructure Completion (25%)',
        installmentNumber: 5,
        dueDate: new Date(Date.now() + 270 * 86400000).toISOString().split('T')[0],
        amount: String(structureDue),
        total: String(structureDue),
        status: 'Upcoming',
      },
      {
        organizationId: orgId,
        bookingId: newBooking.id,
        milestoneName: 'Notice of Possession & Handover',
        installmentNumber: 6,
        dueDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        amount: String(possessionDue),
        total: String(possessionDue),
        status: 'Upcoming',
      },
    ]);

    // Create Initial Payment Receipt for token
    const [pCount] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.organizationId, orgId));
    const receiptNumber = `RCT-${new Date().getFullYear()}-${(Number(pCount?.count || 0) + 1).toString().padStart(4, '0')}`;

    await db.insert(payments).values({
      organizationId: orgId,
      receiptNumber,
      customerId: Number(customerId),
      bookingId: newBooking.id,
      amount: String(bookingAmount),
      paymentDate: todayDate,
      paymentMode: 'Bank Transfer',
      status: 'Cleared',
      remarks: `Booking token confirmation for Unit ${targetUnit.unitNumber}`,
      receivedByUserId: req.user?.id,
    });

    // Seed Workflow Approval Steps
    await db.insert(workflowApprovals).values([
      {
        organizationId: orgId,
        bookingId: newBooking.id,
        stepNumber: 1,
        stepName: 'Sales Manager Approval',
        roleCode: 'sales_manager',
        status: 'Approved',
        approverUserId: req.user?.id,
        comments: 'Verified KYC & terms',
        actionAt: new Date(),
      },
      {
        organizationId: orgId,
        bookingId: newBooking.id,
        stepNumber: 2,
        stepName: 'Accounts Payment Verification',
        roleCode: 'accounts',
        status: 'Pending',
      },
      {
        organizationId: orgId,
        bookingId: newBooking.id,
        stepNumber: 3,
        stepName: 'Executive Management Signoff',
        roleCode: 'org_admin',
        status: 'Pending',
      },
    ]);

    // Audit Log
    await db.insert(auditLogs).values({
      organizationId: orgId,
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'BOOK',
      module: 'BOOKINGS',
      recordId: `${newBooking.id}`,
      details: { bookingNumber, unitNumber: targetUnit.unitNumber, amount: bookingAmount },
    });

    res.status(201).json(newBooking);
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
});

apiRouter.post('/bookings/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const bookingId = Number(req.params.id);
    const { comments } = req.body;

    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.organizationId, orgId)));

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check next approval step
    const currentStep = booking.currentApprovalStep || 1;
    await db
      .update(workflowApprovals)
      .set({
        status: 'Approved',
        approverUserId: req.user?.id,
        comments: comments || 'Approved',
        actionAt: new Date(),
      })
      .where(
        and(
          eq(workflowApprovals.bookingId, bookingId),
          eq(workflowApprovals.stepNumber, currentStep)
        )
      );

    const nextStep = currentStep + 1;
    const isFinal = nextStep > 3;

    const [updated] = await db
      .update(bookings)
      .set({
        currentApprovalStep: nextStep,
        status: isFinal ? 'Confirmed' : 'Pending Approval',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

// PAYMENTS & RECEIPTS
apiRouter.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const paymentList = await db
      .select({
        id: payments.id,
        receiptNumber: payments.receiptNumber,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        paymentMode: payments.paymentMode,
        referenceNumber: payments.referenceNumber,
        bankName: payments.bankName,
        status: payments.status,
        remarks: payments.remarks,
        customerName: customers.name,
        bookingNumber: bookings.bookingNumber,
        projectName: projects.name,
        unitNumber: units.unitNumber,
        receivedByName: users.name,
      })
      .from(payments)
      .innerJoin(customers, eq(payments.customerId, customers.id))
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(projects, eq(bookings.projectId, projects.id))
      .innerJoin(units, eq(bookings.unitId, units.id))
      .leftJoin(users, eq(payments.receivedByUserId, users.id))
      .where(and(eq(payments.organizationId, orgId), eq(payments.isDeleted, false)))
      .orderBy(desc(payments.paymentDate));

    res.json(paymentList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

apiRouter.post('/payments', requireRole(['org_admin', 'accounts']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { bookingId, amount, paymentDate, paymentMode, referenceNumber, bankName, remarks, paymentScheduleId } = req.body;

    if (!bookingId || !amount || !paymentDate) {
      return res.status(400).json({ error: 'Booking, amount, and payment date are required' });
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, Number(bookingId)), eq(bookings.organizationId, orgId)));

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const [pCount] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.organizationId, orgId));
    const receiptNumber = `RCT-${new Date().getFullYear()}-${(Number(pCount?.count || 0) + 1).toString().padStart(4, '0')}`;

    const [newPayment] = await db
      .insert(payments)
      .values({
        organizationId: orgId,
        receiptNumber,
        customerId: booking.customerId,
        bookingId: Number(bookingId),
        paymentScheduleId: paymentScheduleId ? Number(paymentScheduleId) : null,
        amount: String(amount),
        paymentDate,
        paymentMode: paymentMode || 'Bank Transfer',
        referenceNumber,
        bankName,
        status: 'Cleared',
        remarks,
        receivedByUserId: req.user?.id,
      })
      .returning();

    // If linked to a milestone schedule, update schedule paidAmount
    if (paymentScheduleId) {
      const [sched] = await db.select().from(paymentSchedules).where(eq(paymentSchedules.id, Number(paymentScheduleId)));
      if (sched) {
        const newPaid = Number(sched.paidAmount || 0) + Number(amount);
        const isFull = newPaid >= Number(sched.total);
        await db
          .update(paymentSchedules)
          .set({
            paidAmount: String(newPaid),
            status: isFull ? 'Paid' : 'Partially Paid',
            updatedAt: new Date(),
          })
          .where(eq(paymentSchedules.id, sched.id));
      }
    }

    // Audit log
    await db.insert(auditLogs).values({
      organizationId: orgId,
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'PAYMENT',
      module: 'COLLECTIONS',
      recordId: `${newPayment.id}`,
      details: { receiptNumber, amount, bookingNumber: booking.bookingNumber },
    });

    res.status(201).json(newPayment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record payment' });
  }
});

// CHANNEL PARTNERS / BROKERS
apiRouter.get('/channel-partners', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const partners = await db
      .select()
      .from(channelPartners)
      .where(eq(channelPartners.organizationId, orgId))
      .orderBy(desc(channelPartners.createdAt));

    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channel partners' });
  }
});

apiRouter.post('/channel-partners', requireRole(['org_admin', 'sales_manager']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { name, companyName, mobile, email, address, pan, gstin, reraNumber, commissionRate } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile number are required' });
    }

    const [cpCount] = await db.select({ count: sql<number>`count(*)` }).from(channelPartners).where(eq(channelPartners.organizationId, orgId));
    const partnerCode = `CP-${(Number(cpCount?.count || 0) + 101)}`;

    const [partner] = await db
      .insert(channelPartners)
      .values({
        organizationId: orgId,
        partnerCode,
        name,
        companyName,
        mobile,
        email,
        address,
        pan,
        gstin,
        reraNumber,
        commissionRate: commissionRate ? String(commissionRate) : '2.00',
        status: 'active',
      })
      .returning();

    res.status(201).json(partner);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create channel partner' });
  }
});

// COMPLAINTS / CUSTOMER SERVICE
apiRouter.get('/complaints', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const ticketList = await db
      .select({
        id: complaints.id,
        ticketNumber: complaints.ticketNumber,
        category: complaints.category,
        priority: complaints.priority,
        description: complaints.description,
        status: complaints.status,
        slaDays: complaints.slaDays,
        resolution: complaints.resolution,
        customerName: customers.name,
        customerMobile: customers.mobile,
        unitNumber: units.unitNumber,
        projectName: projects.name,
        assignedUserName: users.name,
        createdAt: complaints.createdAt,
      })
      .from(complaints)
      .innerJoin(customers, eq(complaints.customerId, customers.id))
      .leftJoin(units, eq(complaints.unitId, units.id))
      .leftJoin(projects, eq(complaints.projectId, projects.id))
      .leftJoin(users, eq(complaints.assignedUserId, users.id))
      .where(eq(complaints.organizationId, orgId))
      .orderBy(desc(complaints.createdAt));

    res.json(ticketList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

apiRouter.post('/complaints', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { customerId, bookingId, projectId, unitId, category, priority, description, assignedUserId } = req.body;

    if (!customerId || !description) {
      return res.status(400).json({ error: 'Customer and issue description are required' });
    }

    const [cCount] = await db.select({ count: sql<number>`count(*)` }).from(complaints).where(eq(complaints.organizationId, orgId));
    const ticketNumber = `SRV-${new Date().getFullYear()}-${(Number(cCount?.count || 0) + 1).toString().padStart(4, '0')}`;

    const [ticket] = await db
      .insert(complaints)
      .values({
        organizationId: orgId,
        ticketNumber,
        customerId: Number(customerId),
        bookingId: bookingId ? Number(bookingId) : null,
        projectId: projectId ? Number(projectId) : null,
        unitId: unitId ? Number(unitId) : null,
        category: category || 'Maintenance',
        priority: priority || 'Medium',
        description,
        assignedUserId: assignedUserId ? Number(assignedUserId) : req.user?.id,
        status: 'Open',
      })
      .returning();

    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create complaint' });
  }
});

apiRouter.put('/complaints/:id', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const ticketId = Number(req.params.id);
    const { status, resolution } = req.body;

    const isClosed = status === 'Resolved' || status === 'Closed';

    const [updated] = await db
      .update(complaints)
      .set({
        status,
        resolution,
        closedAt: isClosed ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(complaints.id, ticketId), eq(complaints.organizationId, orgId)))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// TASKS & FOLLOW-UPS
apiRouter.get('/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const taskList = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        status: tasks.status,
        assignedUserName: users.name,
        projectName: projects.name,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedUserId, users.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.organizationId, orgId))
      .orderBy(desc(tasks.createdAt));

    res.json(taskList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

apiRouter.post('/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { title, description, assignedUserId, projectId, dueDate, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const [newTask] = await db
      .insert(tasks)
      .values({
        organizationId: orgId,
        title,
        description,
        assignedUserId: assignedUserId ? Number(assignedUserId) : req.user?.id,
        projectId: projectId ? Number(projectId) : null,
        dueDate,
        priority: priority || 'Medium',
        status: 'Pending',
        createdByUserId: req.user?.id,
      })
      .returning();

    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

apiRouter.put('/tasks/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const taskId = Number(req.params.id);
    const { status } = req.body;

    const [updated] = await db
      .update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.organizationId, orgId)))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// DOCUMENTS REPOSITORY
apiRouter.get('/documents', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.organizationId, orgId))
      .orderBy(desc(documents.createdAt));

    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

apiRouter.post('/documents', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const { title, category, fileName, fileUrl, fileSize, mimeType, entityType, entityId } = req.body;

    if (!title || !category || !fileName) {
      return res.status(400).json({ error: 'Title, category, and file name are required' });
    }

    const [newDoc] = await db
      .insert(documents)
      .values({
        organizationId: orgId,
        title,
        category,
        fileName,
        fileUrl: fileUrl || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80',
        fileSize: fileSize || 1024 * 450,
        mimeType: mimeType || 'application/pdf',
        entityType,
        entityId: entityId ? Number(entityId) : null,
        uploadedByUserId: req.user?.id,
      })
      .returning();

    res.status(201).json(newDoc);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
});

// POSSESSION & HANDOVER
apiRouter.get('/possession', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const records = await db
      .select({
        id: possessionRecords.id,
        targetDate: possessionRecords.targetDate,
        actualDate: possessionRecords.actualDate,
        status: possessionRecords.status,
        customerAcceptance: possessionRecords.customerAcceptance,
        remarks: possessionRecords.remarks,
        bookingNumber: bookings.bookingNumber,
        unitNumber: units.unitNumber,
        customerName: customers.name,
      })
      .from(possessionRecords)
      .innerJoin(bookings, eq(possessionRecords.bookingId, bookings.id))
      .innerJoin(units, eq(possessionRecords.unitId, units.id))
      .innerJoin(customers, eq(possessionRecords.customerId, customers.id))
      .where(eq(possessionRecords.organizationId, orgId))
      .orderBy(desc(possessionRecords.createdAt));

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch possession records' });
  }
});

// AUDIT LOGS
apiRouter.get('/audit-logs', requireRole(['org_admin', 'management']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, orgId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GLOBAL SEARCH (TENANT-ISOLATED)
apiRouter.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId || 1;
    const q = String(req.query.q || '').trim();

    if (!q || q.length < 2) {
      return res.json({ leads: [], customers: [], projects: [], units: [], bookings: [] });
    }

    const matchedLeads = await db
      .select({ id: leads.id, title: leads.name, subtitle: leads.leadCode, type: sql`'lead'` })
      .from(leads)
      .where(and(eq(leads.organizationId, orgId), or(ilike(leads.name, `%${q}%`), ilike(leads.mobile, `%${q}%`))))
      .limit(5);

    const matchedCustomers = await db
      .select({ id: customers.id, title: customers.name, subtitle: customers.customerCode, type: sql`'customer'` })
      .from(customers)
      .where(and(eq(customers.organizationId, orgId), or(ilike(customers.name, `%${q}%`), ilike(customers.mobile, `%${q}%`))))
      .limit(5);

    const matchedProjects = await db
      .select({ id: projects.id, title: projects.name, subtitle: projects.code, type: sql`'project'` })
      .from(projects)
      .where(and(eq(projects.organizationId, orgId), ilike(projects.name, `%${q}%`)))
      .limit(5);

    const matchedUnits = await db
      .select({ id: units.id, title: units.unitNumber, subtitle: units.status, type: sql`'unit'` })
      .from(units)
      .where(and(eq(units.organizationId, orgId), ilike(units.unitNumber, `%${q}%`)))
      .limit(5);

    const matchedBookings = await db
      .select({ id: bookings.id, title: bookings.bookingNumber, subtitle: bookings.status, type: sql`'booking'` })
      .from(bookings)
      .where(and(eq(bookings.organizationId, orgId), ilike(bookings.bookingNumber, `%${q}%`)))
      .limit(5);

    res.json({
      leads: matchedLeads,
      customers: matchedCustomers,
      projects: matchedProjects,
      units: matchedUnits,
      bookings: matchedBookings,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute global search' });
  }
});

// -------------------------------------------------------------
// 15. MARKETING CAMPAIGNS & AD ANALYTICS
// -------------------------------------------------------------
const defaultMarketingCampaigns = [
  {
    id: 1,
    name: 'Srijan Solus Festive Luxury Campaign',
    platform: 'Meta Ads',
    budget: 450000,
    spent: 320000,
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    status: 'Active',
    leadsGenerated: 218,
    qualifiedLeads: 86,
    siteVisits: 44,
    bookingsCount: 8,
    revenueGenerated: 114400000,
    cpl: 1468,
    roi: 357.5,
    projectName: 'Srijan Solus',
  },
  {
    id: 2,
    name: 'Google Search High-Intent 3BHK Kolkata',
    platform: 'Google Ads',
    budget: 600000,
    spent: 490000,
    startDate: '2026-07-15',
    endDate: '2026-11-15',
    status: 'Active',
    leadsGenerated: 195,
    qualifiedLeads: 92,
    siteVisits: 51,
    bookingsCount: 11,
    revenueGenerated: 157300000,
    cpl: 2512,
    roi: 321.0,
    projectName: 'Srijan Solus',
  },
  {
    id: 3,
    name: 'WhatsApp Drip Sourcing - NRI Buyers',
    platform: 'WhatsApp',
    budget: 150000,
    spent: 85000,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    status: 'Active',
    leadsGenerated: 112,
    qualifiedLeads: 48,
    siteVisits: 22,
    bookingsCount: 4,
    revenueGenerated: 57200000,
    cpl: 759,
    roi: 672.9,
    projectName: 'Botanica Green Township',
  },
  {
    id: 4,
    name: 'Instagram Luxury Architecture Reels',
    platform: 'Instagram',
    budget: 200000,
    spent: 180000,
    startDate: '2026-06-01',
    endDate: '2026-09-30',
    status: 'Completed',
    leadsGenerated: 140,
    qualifiedLeads: 42,
    siteVisits: 18,
    bookingsCount: 3,
    revenueGenerated: 42900000,
    cpl: 1285,
    roi: 238.3,
    projectName: 'Srijan Solus',
  },
];

let marketingCampaignsStore = [...defaultMarketingCampaigns];

apiRouter.get('/marketing/campaigns', (req: AuthRequest, res: Response) => {
  res.json(marketingCampaignsStore);
});

apiRouter.post('/marketing/campaigns', (req: AuthRequest, res: Response) => {
  const { name, platform, budget, startDate, endDate, projectName } = req.body;
  const newCamp = {
    id: marketingCampaignsStore.length + 1,
    name: name || 'New Property Campaign',
    platform: platform || 'Meta Ads',
    budget: Number(budget) || 100000,
    spent: 0,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || '2026-12-31',
    status: 'Active',
    leadsGenerated: 0,
    qualifiedLeads: 0,
    siteVisits: 0,
    bookingsCount: 0,
    revenueGenerated: 0,
    cpl: 0,
    roi: 0,
    projectName: projectName || 'Srijan Solus',
  };
  marketingCampaignsStore.unshift(newCamp);
  res.status(201).json(newCamp);
});

// -------------------------------------------------------------
// 16. FINANCE & ACCOUNTS MODULE
// -------------------------------------------------------------
const defaultFinanceTransactions = [
  {
    id: 1,
    type: 'Income',
    category: 'Installment Collection (70% Escrow)',
    amount: 1003275,
    date: '2026-09-20',
    referenceNumber: 'HDFCR9202609200088',
    paymentMode: 'RTGS',
    projectName: 'Srijan Solus',
    payeeOrPayer: 'Vikramjit Chakraborty (Unit A-102)',
    status: 'Cleared',
    description: '3rd Floor Roof Slab Casting Installment remittance to SBI RERA Escrow A/C',
  },
  {
    id: 2,
    type: 'Income',
    category: 'Booking Token Token Receipt',
    amount: 500000,
    date: '2026-09-18',
    referenceNumber: 'SBIN002938102',
    paymentMode: 'NEFT',
    projectName: 'Srijan Solus',
    payeeOrPayer: 'Ananya Sen (Unit B-504)',
    status: 'Cleared',
    description: 'Booking token advance against Sale Agreement draft',
  },
  {
    id: 3,
    type: 'Expense',
    category: 'Civil Material - TMT Steel Procurement',
    amount: 1850000,
    date: '2026-09-15',
    referenceNumber: 'TXN-STEEL-2026-09',
    paymentMode: 'Bank Transfer',
    projectName: 'Srijan Solus',
    payeeOrPayer: 'Tata Tiscon Infra Distributors',
    status: 'Cleared',
    description: '50 MT Fe 550D TMT Rebars for Tower A 4th-5th Floor Columns',
  },
  {
    id: 4,
    type: 'Expense',
    category: 'Ready Mix Concrete (RMC)',
    amount: 920000,
    date: '2026-09-12',
    referenceNumber: 'TXN-RMC-2026-08',
    paymentMode: 'RTGS',
    projectName: 'Srijan Solus',
    payeeOrPayer: 'UltraTech Concrete Solutions',
    status: 'Cleared',
    description: '180 Cu.m M35 Grade Concrete for Slab Pouring',
  },
  {
    id: 5,
    type: 'Expense',
    category: 'Architectural & Structural Consultancy',
    amount: 350000,
    date: '2026-09-10',
    referenceNumber: 'ARCH-FEE-2026-Q3',
    paymentMode: 'NEFT',
    projectName: 'Srijan Solus',
    payeeOrPayer: 'Mukherjee & Associates Architects',
    status: 'Cleared',
    description: 'Stage 3 structural inspection and statutory compliance sign-off',
  },
  {
    id: 6,
    type: 'Expense',
    category: 'Digital Performance Marketing',
    amount: 250000,
    date: '2026-09-05',
    referenceNumber: 'AD-META-2026-09',
    paymentMode: 'Credit Card',
    projectName: 'Srijan Solus',
    payeeOrPayer: 'Meta Platforms Ireland Ltd',
    status: 'Cleared',
    description: 'Pre-Puja High Intent Lead Generation Ads',
  },
];

let financeTransactionsStore = [...defaultFinanceTransactions];

apiRouter.get('/finance/overview', (req: AuthRequest, res: Response) => {
  const totalIncome = financeTransactionsStore
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = financeTransactionsStore
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  res.json({
    totalIncome,
    totalExpense,
    netOperatingCash: totalIncome - totalExpense,
    totalReceivables: 42800000, // Upcoming milestone CLP demand dues
    totalPayables: 6100000, // Pending vendor PO bills
    escrowLockedBalance: 18450000, // 70% statutory escrow account balance
    gstInputTaxCredit: 485000,
  });
});

apiRouter.get('/finance/transactions', (req: AuthRequest, res: Response) => {
  res.json(financeTransactionsStore);
});

apiRouter.post('/finance/transactions', (req: AuthRequest, res: Response) => {
  const { type, category, amount, referenceNumber, paymentMode, projectName, payeeOrPayer, description } = req.body;
  const newTx = {
    id: financeTransactionsStore.length + 1,
    type: type || 'Expense',
    category: category || 'Miscellaneous Site Expense',
    amount: Number(amount) || 0,
    date: new Date().toISOString().split('T')[0],
    referenceNumber: referenceNumber || `TXN-${Date.now().toString().slice(-6)}`,
    paymentMode: paymentMode || 'Bank Transfer',
    projectName: projectName || 'Srijan Solus',
    payeeOrPayer: payeeOrPayer || 'Vendor / Contractor',
    status: 'Cleared',
    description: description || '',
  };
  financeTransactionsStore.unshift(newTx);
  res.status(201).json(newTx);
});

// -------------------------------------------------------------
// 17. VENDORS & PROCUREMENT / PURCHASE ORDERS
// -------------------------------------------------------------
const defaultVendors = [
  {
    id: 1,
    vendorCode: 'VND-STL-001',
    name: 'Tata Tiscon Infra Distributors',
    category: 'Steel & Cement',
    contactPerson: 'Arun K. Singhania',
    mobile: '+91 98300 12890',
    email: 'infra.sales@tatatisconkol.com',
    gstin: '19AAACT1928B1Z2',
    pan: 'AAACT1928B',
    address: '14 Strand Road, Burrabazar, Kolkata - 700001',
    bankDetails: 'State Bank of India A/C #3091823901 (IFSC: SBIN0000001)',
    rating: 4.8,
    status: 'Active',
  },
  {
    id: 2,
    vendorCode: 'VND-RMC-002',
    name: 'UltraTech Concrete Solutions (Aditya Birla)',
    category: 'RMC & Aggregates',
    contactPerson: 'Sandeep Ghosh',
    mobile: '+91 98311 94821',
    email: 'kolkata.rmc@ultratechcement.com',
    gstin: '19AAACU0928A1Z5',
    pan: 'AAACU0928A',
    address: 'Plot II-E, New Town Action Area II, Kolkata - 700156',
    bankDetails: 'HDFC Bank A/C #5020001928301 (IFSC: HDFC0000014)',
    rating: 4.9,
    status: 'Active',
  },
  {
    id: 3,
    vendorCode: 'VND-ELC-003',
    name: 'Havells & Schneider Commercial Electricals',
    category: 'Electrical & Plumbing',
    contactPerson: 'P. C. Banerjee',
    mobile: '+91 98302 44332',
    email: 'projects@banerjee-electricals.com',
    gstin: '19AAAPB8472M1ZQ',
    pan: 'AAPB8472M',
    address: '8 Brabourne Road, Central Kolkata - 700001',
    bankDetails: 'ICICI Bank A/C #000605001298 (IFSC: ICIC0000006)',
    rating: 4.6,
    status: 'Active',
  },
  {
    id: 4,
    vendorCode: 'VND-SAN-004',
    name: 'Kohler & Jaquar Luxury Sanitaryware Emporium',
    category: 'Tiles & Sanitary',
    contactPerson: 'Raman Aggarwal',
    mobile: '+91 98305 11299',
    email: 'projects@aggarwalsanitary.com',
    gstin: '19AAAPA4928C1Z8',
    pan: 'AAPA4928C',
    address: '68 Chowringhee Road, Kolkata - 700020',
    bankDetails: 'Axis Bank A/C #9140200192847 (IFSC: UTIB0000005)',
    rating: 4.7,
    status: 'Active',
  },
];

const defaultPurchaseOrders = [
  {
    id: 1,
    poNumber: 'PO-SRJ-2026-0048',
    vendorName: 'Tata Tiscon Infra Distributors',
    projectName: 'Srijan Solus',
    orderDate: '2026-09-14',
    deliveryDueDate: '2026-09-22',
    totalAmount: 1850000,
    status: 'Goods Received (GRN)',
    itemsCount: 3,
    itemsSummary: '50 MT Fe 550D TMT (12mm, 16mm, 20mm)',
  },
  {
    id: 2,
    poNumber: 'PO-SRJ-2026-0049',
    vendorName: 'UltraTech Concrete Solutions (Aditya Birla)',
    projectName: 'Srijan Solus',
    orderDate: '2026-09-10',
    deliveryDueDate: '2026-09-13',
    totalAmount: 920000,
    status: 'Paid',
    itemsCount: 1,
    itemsSummary: '180 Cu.M M35 Ready Mix Concrete with Retarder',
  },
  {
    id: 3,
    poNumber: 'PO-SRJ-2026-0050',
    vendorName: 'Havells & Schneider Commercial Electricals',
    projectName: 'Srijan Solus',
    orderDate: '2026-09-18',
    deliveryDueDate: '2026-09-28',
    totalAmount: 640000,
    status: 'PO Issued',
    itemsCount: 5,
    itemsSummary: 'FRLS Copper Armoured Cable 4-core & Modular DB Boxes',
  },
];

let vendorsStore = [...defaultVendors];
let purchaseOrdersStore = [...defaultPurchaseOrders];

apiRouter.get('/vendors', (req: AuthRequest, res: Response) => {
  res.json(vendorsStore);
});

apiRouter.post('/vendors', (req: AuthRequest, res: Response) => {
  const { name, category, contactPerson, mobile, email, gstin, pan, address, bankDetails } = req.body;
  const newV = {
    id: vendorsStore.length + 1,
    vendorCode: `VND-${String(vendorsStore.length + 1).padStart(3, '0')}`,
    name: name || 'New Construction Vendor',
    category: category || 'Steel & Cement',
    contactPerson: contactPerson || 'Authorized Representative',
    mobile: mobile || '+91 98000 00000',
    email: email || 'vendor@example.com',
    gstin: gstin || '19AAAAA0000A1Z5',
    pan: pan || 'AAAAA0000A',
    address: address || 'Kolkata, WB',
    bankDetails: bankDetails || 'HDFC Bank Escrow',
    rating: 5.0,
    status: 'Active',
  };
  vendorsStore.unshift(newV);
  res.status(201).json(newV);
});

apiRouter.get('/purchase/orders', (req: AuthRequest, res: Response) => {
  res.json(purchaseOrdersStore);
});

apiRouter.post('/purchase/orders', (req: AuthRequest, res: Response) => {
  const { vendorName, projectName, totalAmount, itemsSummary, deliveryDueDate } = req.body;
  const newPo = {
    id: purchaseOrdersStore.length + 1,
    poNumber: `PO-SRJ-2026-${String(purchaseOrdersStore.length + 50).padStart(4, '0')}`,
    vendorName: vendorName || 'Tata Tiscon Infra Distributors',
    projectName: projectName || 'Srijan Solus',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDueDate: deliveryDueDate || '2026-10-15',
    totalAmount: Number(totalAmount) || 250000,
    status: 'Requested',
    itemsCount: 2,
    itemsSummary: itemsSummary || 'Standard Civil Construction Procurement',
  };
  purchaseOrdersStore.unshift(newPo);
  res.status(201).json(newPo);
});

apiRouter.patch('/purchase/orders/:id/status', (req: AuthRequest, res: Response) => {
  const poId = Number(req.params.id);
  const { status } = req.body;
  const po = purchaseOrdersStore.find((p) => p.id === poId);
  if (po && status) {
    po.status = status;
    return res.json(po);
  }
  res.status(404).json({ error: 'Purchase order not found' });
});

// -------------------------------------------------------------
// 18. MATERIAL & CONSTRUCTION INVENTORY
// -------------------------------------------------------------
const defaultMaterials = [
  {
    id: 1,
    itemCode: 'MAT-CMT-001',
    name: 'OPC 53 Grade Cement (UltraTech / Ambuja)',
    category: 'Cement',
    unitOfMeasure: 'Bags',
    currentStock: 1420,
    minimumStock: 400,
    reorderQuantity: 600,
    unitCost: 395,
    totalValuation: 560900,
    location: 'Site Godown #1 (Moisture Controlled)',
    projectName: 'Srijan Solus',
    status: 'In Stock',
  },
  {
    id: 2,
    itemCode: 'MAT-STL-002',
    name: '16mm Fe 550D High Ductility TMT Rebars',
    category: 'Steel',
    unitOfMeasure: 'MT',
    currentStock: 32,
    minimumStock: 15,
    reorderQuantity: 25,
    unitCost: 59000,
    totalValuation: 1888000,
    location: 'Yard A Fabrication Area',
    projectName: 'Srijan Solus',
    status: 'In Stock',
  },
  {
    id: 3,
    itemCode: 'MAT-SND-003',
    name: 'Coarse River Sand (Zone II Silt Verified)',
    category: 'Sand & Aggregates',
    unitOfMeasure: 'CFT',
    currentStock: 1850,
    minimumStock: 2500,
    reorderQuantity: 3000,
    unitCost: 58,
    totalValuation: 107300,
    location: 'Open Aggregate Bay #3',
    projectName: 'Srijan Solus',
    status: 'Low Stock',
  },
  {
    id: 4,
    itemCode: 'MAT-BRK-004',
    name: 'AAC Lightweight Autoclaved Blocks (600x200x150mm)',
    category: 'Bricks & Blocks',
    unitOfMeasure: 'Nos',
    currentStock: 4200,
    minimumStock: 1000,
    reorderQuantity: 2000,
    unitCost: 62,
    totalValuation: 260400,
    location: 'Tower A Ground Stacking Area',
    projectName: 'Srijan Solus',
    status: 'In Stock',
  },
  {
    id: 5,
    itemCode: 'MAT-PVC-005',
    name: '110mm SWR Drainage Pipes (Supreme / Astral)',
    category: 'Plumbing & PVC',
    unitOfMeasure: 'Meters',
    currentStock: 80,
    minimumStock: 200,
    reorderQuantity: 300,
    unitCost: 480,
    totalValuation: 38400,
    location: 'MEP Stores B-Level',
    projectName: 'Srijan Solus',
    status: 'Critical Reorder',
  },
];

let materialsStore = [...defaultMaterials];

apiRouter.get('/materials/inventory', (req: AuthRequest, res: Response) => {
  res.json(materialsStore);
});

apiRouter.post('/materials/inventory', (req: AuthRequest, res: Response) => {
  const { name, category, unitOfMeasure, currentStock, minimumStock, unitCost, location, projectName } = req.body;
  const newMat = {
    id: materialsStore.length + 1,
    itemCode: `MAT-${String(materialsStore.length + 1).padStart(3, '0')}`,
    name: name || 'Construction Material',
    category: category || 'Cement',
    unitOfMeasure: unitOfMeasure || 'Bags',
    currentStock: Number(currentStock) || 100,
    minimumStock: Number(minimumStock) || 50,
    reorderQuantity: 100,
    unitCost: Number(unitCost) || 500,
    totalValuation: (Number(currentStock) || 100) * (Number(unitCost) || 500),
    location: location || 'Site Store',
    projectName: projectName || 'Srijan Solus',
    status: Number(currentStock) <= Number(minimumStock) ? 'Low Stock' : 'In Stock',
  };
  materialsStore.unshift(newMat);
  res.status(201).json(newMat);
});

// -------------------------------------------------------------
// 19. HR & ATTENDANCE MANAGEMENT
// -------------------------------------------------------------
const defaultEmployees = [
  {
    id: 1,
    empCode: 'EMP-SRJ-010',
    name: 'Debapriya Chatterjee',
    department: 'Sales & CRM',
    designation: 'Senior Sales Executive & CRM Lead',
    mobile: '+91 98301 22891',
    email: 'debapriya.c@srijanrealty.com',
    joiningDate: '2022-03-15',
    monthlySalary: 75000,
    attendanceRate: 98,
    status: 'Active',
  },
  {
    id: 2,
    empCode: 'EMP-SRJ-014',
    name: 'Somnath Mukherjee',
    department: 'Civil Engineering',
    designation: 'Chief Project Engineer',
    mobile: '+91 98310 99421',
    email: 'somnath.m@srijanrealty.com',
    joiningDate: '2021-08-01',
    monthlySalary: 110000,
    attendanceRate: 96,
    status: 'Active',
  },
  {
    id: 3,
    empCode: 'EMP-SRJ-018',
    name: 'Anirban Mitra',
    department: 'Accounts & Finance',
    designation: 'Senior Accounts Officer (RERA Escrow)',
    mobile: '+91 98305 77610',
    email: 'anirban.m@srijanrealty.com',
    joiningDate: '2023-01-10',
    monthlySalary: 68000,
    attendanceRate: 100,
    status: 'Active',
  },
  {
    id: 4,
    empCode: 'EMP-SRJ-022',
    name: 'Riya Sengupta',
    department: 'Legal & Liaison',
    designation: 'Legal Officer & Conveyance Executive',
    mobile: '+91 98308 33112',
    email: 'riya.s@srijanrealty.com',
    joiningDate: '2023-07-20',
    monthlySalary: 55000,
    attendanceRate: 94,
    status: 'Active',
  },
];

const defaultAttendance = [
  {
    id: 1,
    empCode: 'EMP-SRJ-010',
    empName: 'Debapriya Chatterjee',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkInTime: '09:28 AM',
    checkOutTime: '06:45 PM',
    siteOrOffice: 'Solus Marketing Site Office',
  },
  {
    id: 2,
    empCode: 'EMP-SRJ-014',
    empName: 'Somnath Mukherjee',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkInTime: '08:45 AM',
    checkOutTime: '06:30 PM',
    siteOrOffice: 'Tower A Site Engineering Cabin',
  },
  {
    id: 3,
    empCode: 'EMP-SRJ-018',
    empName: 'Anirban Mitra',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkInTime: '09:40 AM',
    checkOutTime: '06:15 PM',
    siteOrOffice: 'Corporate Head Office (Wood Street)',
  },
  {
    id: 4,
    empCode: 'EMP-SRJ-022',
    empName: 'Riya Sengupta',
    date: new Date().toISOString().split('T')[0],
    status: 'On Leave',
    siteOrOffice: 'Corporate Head Office',
  },
];

let employeesStore = [...defaultEmployees];
let attendanceStore = [...defaultAttendance];

apiRouter.get('/hr/employees', (req: AuthRequest, res: Response) => {
  res.json(employeesStore);
});

apiRouter.post('/hr/employees', (req: AuthRequest, res: Response) => {
  const { name, department, designation, mobile, email, monthlySalary } = req.body;
  const newEmp = {
    id: employeesStore.length + 1,
    empCode: `EMP-SRJ-${String(employeesStore.length + 25).padStart(3, '0')}`,
    name: name || 'New Real Estate Staff',
    department: department || 'Sales & CRM',
    designation: designation || 'Executive',
    mobile: mobile || '+91 98000 00000',
    email: email || 'staff@srijanrealty.com',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlySalary: Number(monthlySalary) || 45000,
    attendanceRate: 100,
    status: 'Active',
  };
  employeesStore.unshift(newEmp);
  res.status(201).json(newEmp);
});

apiRouter.get('/hr/attendance', (req: AuthRequest, res: Response) => {
  res.json(attendanceStore);
});

apiRouter.post('/hr/attendance', (req: AuthRequest, res: Response) => {
  const { empName, status, siteOrOffice } = req.body;
  const newAtt = {
    id: attendanceStore.length + 1,
    empCode: `EMP-${Date.now().toString().slice(-4)}`,
    empName: empName || 'Employee',
    date: new Date().toISOString().split('T')[0],
    status: status || 'Present',
    checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    checkOutTime: 'Pending',
    siteOrOffice: siteOrOffice || 'Solus Site Office',
  };
  attendanceStore.unshift(newAtt);
  res.status(201).json(newAtt);
});

// -------------------------------------------------------------
// 20. PROJECT OPERATIONS & CONSTRUCTION MILESTONES
// -------------------------------------------------------------
const defaultMilestones = [
  {
    id: 1,
    stageName: 'Foundation & Plinth',
    order: 1,
    projectName: 'Srijan Solus',
    towerName: 'Tower A',
    plannedCompletionDate: '2025-10-31',
    actualCompletionDate: '2025-10-24',
    progressPercentage: 100,
    status: 'Completed',
    architectCertificateNo: 'ARC/SOL/PLINTH-01 (Ar. S. Mukherjee)',
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800&auto=format&fit=crop',
  },
  {
    id: 2,
    stageName: 'Basement & Podium',
    order: 2,
    projectName: 'Srijan Solus',
    towerName: 'Tower A',
    plannedCompletionDate: '2026-02-28',
    actualCompletionDate: '2026-02-18',
    progressPercentage: 100,
    status: 'Completed',
    architectCertificateNo: 'ARC/SOL/PODIUM-02 (Ar. S. Mukherjee)',
    photoUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop',
  },
  {
    id: 3,
    stageName: 'RCC Slab Casting',
    order: 3,
    projectName: 'Srijan Solus',
    towerName: 'Tower A',
    plannedCompletionDate: '2026-10-30',
    progressPercentage: 80,
    status: 'In Progress',
    architectCertificateNo: 'ARC/SOL/SLAB-03 (Ar. S. Mukherjee)',
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop',
  },
  {
    id: 4,
    stageName: 'Brickwork & Plastering',
    order: 4,
    projectName: 'Srijan Solus',
    towerName: 'Tower A',
    plannedCompletionDate: '2027-04-30',
    progressPercentage: 25,
    status: 'In Progress',
    architectCertificateNo: 'Under Verification',
    photoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop',
  },
  {
    id: 5,
    stageName: 'Electrical & Plumbing MEP',
    order: 5,
    projectName: 'Srijan Solus',
    towerName: 'Tower A',
    plannedCompletionDate: '2027-09-30',
    progressPercentage: 10,
    status: 'Upcoming',
    architectCertificateNo: 'Pending Stage',
    photoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop',
  },
  {
    id: 6,
    stageName: 'Handover & Possession',
    order: 6,
    projectName: 'Srijan Solus',
    towerName: 'Tower A',
    plannedCompletionDate: '2028-06-30',
    progressPercentage: 0,
    status: 'Upcoming',
    architectCertificateNo: 'RERA Declared Date: June 2028',
    photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
  },
];

const defaultDailyReports = [
  {
    id: 1,
    reportDate: '2026-09-23',
    projectName: 'Srijan Solus',
    siteEngineer: 'Er. Somnath Mukherjee',
    weather: 'Clear',
    workforceCount: 142,
    concretePouredCubicMeters: 64,
    activitiesCompleted: 'Cast 4th floor west wing beam-slab junction; AAC block masonry on 2nd floor units 201-204; MEP conduit laying.',
    safetyIncidents: 0,
    equipmentActive: 'Tower Crane #1, Concrete Transit Mixers (4), Concrete Pump, Bar Bending Machine',
    photoCount: 8,
  },
];

let milestonesStore = [...defaultMilestones];
let dailyReportsStore = [...defaultDailyReports];

apiRouter.get('/operations/milestones', (req: AuthRequest, res: Response) => {
  res.json(milestonesStore);
});

apiRouter.patch('/operations/milestones/:id', (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { progressPercentage, status } = req.body;
  const m = milestonesStore.find((x) => x.id === id);
  if (m) {
    if (progressPercentage !== undefined) m.progressPercentage = Number(progressPercentage);
    if (status) m.status = status;
    return res.json(m);
  }
  res.status(404).json({ error: 'Milestone not found' });
});

apiRouter.get('/operations/reports', (req: AuthRequest, res: Response) => {
  res.json(dailyReportsStore);
});

apiRouter.post('/operations/reports', (req: AuthRequest, res: Response) => {
  const { projectName, workforceCount, concretePouredCubicMeters, activitiesCompleted } = req.body;
  const newRep = {
    id: dailyReportsStore.length + 1,
    reportDate: new Date().toISOString().split('T')[0],
    projectName: projectName || 'Srijan Solus',
    siteEngineer: 'Er. Site Supervisor',
    weather: 'Clear',
    workforceCount: Number(workforceCount) || 120,
    concretePouredCubicMeters: Number(concretePouredCubicMeters) || 0,
    activitiesCompleted: activitiesCompleted || 'Daily civil construction works completed as per schedule.',
    safetyIncidents: 0,
    equipmentActive: 'Active Site Machinery',
    photoCount: 4,
  };
  dailyReportsStore.unshift(newRep);
  res.status(201).json(newRep);
});

// -------------------------------------------------------------
// 21. WHATSAPP BUSINESS INTEGRATION & TEMPLATES
// -------------------------------------------------------------
const defaultWhatsAppTemplates = [
  {
    id: 'tpl_lead_ack',
    title: 'Lead Acknowledgement & Brochure Dispatch',
    triggerEvent: 'New Lead Generated / Website Form',
    templateText: 'Namaste {{customerName}}, thank you for showing interest in {{projectName}} by AuraEstate. Download our official RERA brochure & floor plans here: {{brochureLink}}. Our sales advisor will connect shortly.',
    variables: ['customerName', 'projectName', 'brochureLink'],
  },
  {
    id: 'tpl_site_visit',
    title: 'Site Visit Confirmation & Driver Pickup',
    triggerEvent: 'Site Visit Booked',
    templateText: 'Dear {{customerName}}, your site visit for {{projectName}} is confirmed for {{date}} at {{time}}. Your designated sample flat executive is {{executiveName}} (Phone: {{mobile}}). Direction map: {{mapLink}}.',
    variables: ['customerName', 'projectName', 'date', 'time', 'executiveName', 'mobile', 'mapLink'],
  },
  {
    id: 'tpl_demand_notice',
    title: 'RERA Milestone Demand Letter Notice',
    triggerEvent: 'Construction Stage Milestone Achieved',
    templateText: 'Important: Milestone Notice {{demandNumber}} has been issued for Unit {{unitNumber}} at {{projectName}} upon reaching {{milestoneTitle}}. Due amount: ₹{{amount}} by {{dueDate}}. Remit to RERA Designated Escrow A/C. View letter: {{letterUrl}}.',
    variables: ['demandNumber', 'unitNumber', 'projectName', 'milestoneTitle', 'amount', 'dueDate', 'letterUrl'],
  },
  {
    id: 'tpl_payment_receipt',
    title: 'Payment Receipt Confirmation',
    triggerEvent: 'Payment Cleared & Verified',
    templateText: 'Payment Acknowledgement: We have received ₹{{amount}} towards Unit {{unitNumber}} at {{projectName}}. Official Money Receipt #{{receiptNumber}} has been generated and added to your Homeowner Vault. Download: {{receiptLink}}.',
    variables: ['amount', 'unitNumber', 'projectName', 'receiptNumber', 'receiptLink'],
  },
  {
    id: 'tpl_handover',
    title: 'Handover & Key Possession Invitation',
    triggerEvent: 'Occupancy Certificate Received',
    templateText: 'Heartiest Congratulations {{customerName}}! Occupancy Certificate (OC) has been granted for {{projectName}}. You are cordially invited for key handover and joint snag-free possession on {{date}}.',
    variables: ['customerName', 'projectName', 'date'],
  },
];

apiRouter.get('/whatsapp/templates', (req: AuthRequest, res: Response) => {
  res.json(defaultWhatsAppTemplates);
});

apiRouter.post('/whatsapp/send', (req: AuthRequest, res: Response) => {
  const { templateId, recipientMobile, variables } = req.body;
  res.json({
    success: true,
    messageId: `wa_msg_${Date.now()}`,
    status: 'Delivered',
    timestamp: new Date().toISOString(),
    recipientMobile,
    templateId,
  });
});

// -------------------------------------------------------------
// 22. CUSTOMER HOMEOWNER PORTAL API
// -------------------------------------------------------------
apiRouter.get('/customer-portal/me', (req: AuthRequest, res: Response) => {
  res.json({
    homeowner: {
      name: 'Vikramjit Chakraborty',
      customerCode: 'SRJ-CUS-0042',
      email: 'vikramjit.chakraborty@example.com',
      mobile: '+91 98310 44291',
      pan: 'ABCDE1234F',
    },
    property: {
      projectName: 'Srijan Solus',
      unitNumber: 'A-102',
      unitType: '3 BHK Luxury Deluxe',
      floor: 10,
      tower: 'Tower A',
      superBuiltUpArea: '1,540 sq.ft.',
      carpetArea: '1,120 sq.ft.',
      coveredParking: '1 Basement Bay (Slot B-14)',
      reraRegistration: 'WBRERA/P/KOL/2023/000214',
      totalConsideration: 14300000,
      totalPaid: 4290000,
      balanceOutstanding: 10010000,
      possessionCommitmentDate: 'June 2028',
    },
    paymentMilestones: [
      {
        stageName: 'Booking Token & Allotment Agreement',
        percentage: 10,
        amount: 1430000,
        status: 'Paid',
        receiptNumber: 'RCT-2026-0042',
      },
      {
        stageName: 'Completion of Foundation & Plinth',
        percentage: 10,
        amount: 1430000,
        status: 'Paid',
        receiptNumber: 'RCT-2026-0068',
      },
      {
        stageName: 'Completion of 3rd Floor Roof Slab',
        percentage: 10,
        amount: 1433250,
        status: 'Due Soon',
        dueDate: '2026-10-15',
        demandNumber: 'SRJ-DEM-2026-0012',
      },
      {
        stageName: 'Completion of 6th Floor Roof Slab',
        percentage: 10,
        amount: 1430000,
        status: 'Upcoming',
      },
      {
        stageName: 'Brickwork & External Plastering',
        percentage: 15,
        amount: 2145000,
        status: 'Upcoming',
      },
      {
        stageName: 'Flooring, Tiling & Sanitary Installation',
        percentage: 15,
        amount: 2145000,
        status: 'Upcoming',
      },
      {
        stageName: 'Notice of Possession & Registration',
        percentage: 30,
        amount: 4290000,
        status: 'Upcoming',
      },
    ],
    documents: [
      { id: 1, title: 'Registered Agreement for Sale (ATS)', date: '2026-04-12', size: '2.4 MB' },
      { id: 2, title: 'WBRERA Approved Sanction Plan', date: '2026-01-10', size: '4.8 MB' },
      { id: 3, title: 'Money Receipt - Foundation Stage (₹14.3 Lakhs)', date: '2026-08-20', size: '320 KB' },
      { id: 4, title: 'Form 16B - Section 194-IA TDS Credit Certificate', date: '2026-08-25', size: '180 KB' },
    ],
    constructionUpdates: [
      {
        title: '3rd Floor Slab Casting Completed Successfully',
        date: '2026-09-18',
        description: 'Structural inspection sign-off completed by Site Engineer and Consulting Structural Architect. High-grade M35 concrete poured.',
        photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800&auto=format&fit=crop',
      },
      {
        title: 'Podium Car Parking Waterproofing',
        date: '2026-08-05',
        description: 'Dual layer APP membrane waterproofing completed with 10-year warranty certificate.',
        photo: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop',
      },
    ],
  });
});


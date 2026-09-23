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

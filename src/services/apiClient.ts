import { clientDataStore } from './clientDataStore.ts';

const safeGetStorage = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const personaUid = safeGetStorage('auraestate_active_persona');
  if (personaUid) {
    headers['x-demo-user-uid'] = personaUid;
  }

  const targetOrgId = safeGetStorage('auraestate_target_org_id');
  if (targetOrgId) {
    headers['x-target-org-id'] = targetOrgId;
  }

  const idToken = safeGetStorage('auraestate_id_token');
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return headers;
};

// Client-Side Mock Router for Vercel Static Deployments & Offline Mode
function handleClientFallback(endpoint: string, options: RequestInit = {}): any {
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.replace(/^\/?api\/?/, '').split('?')[0];
  let bodyData: any = {};
  if (options.body && typeof options.body === 'string') {
    try {
      bodyData = JSON.parse(options.body);
    } catch {
      bodyData = {};
    }
  }

  console.info(`[AuraEstate Universal Net Sync] Serving ${method} /api/${cleanEndpoint} via Client Engine`);

  // Auth & Session
  if (cleanEndpoint === 'auth/me') {
    return clientDataStore.getSession();
  }
  if (cleanEndpoint === 'auth/personas') {
    return clientDataStore.getPersonas();
  }

  // Dashboard & Summary
  if (cleanEndpoint === 'dashboard') {
    return clientDataStore.getDashboard();
  }
  if (cleanEndpoint === 'reports/sales-summary') {
    const dash = clientDataStore.getDashboard();
    return {
      totalBookings: dash.metrics.totalBookings,
      totalSalesValue: dash.metrics.totalSalesValue,
      totalCollected: dash.metrics.totalCollected,
      outstanding: dash.metrics.outstanding,
      totalUnits: dash.metrics.totalUnits,
      availableUnits: dash.metrics.availableUnits,
      bookedUnits: dash.metrics.bookedUnits,
      totalLeads: dash.metrics.totalLeads,
    };
  }

  // Projects
  if (cleanEndpoint === 'projects') {
    return clientDataStore.getProjects();
  }
  if (cleanEndpoint.startsWith('projects/')) {
    const id = Number(cleanEndpoint.split('/')[1]);
    return clientDataStore.getProject(id);
  }

  // Units & Inventory
  if (cleanEndpoint === 'inventory/units') {
    return clientDataStore.getUnits();
  }
  if (cleanEndpoint.match(/inventory\/units\/\d+\/status/) && method === 'PATCH') {
    const id = Number(cleanEndpoint.split('/')[2]);
    return clientDataStore.updateUnitStatus(id, bodyData.status || 'Hold');
  }
  if (cleanEndpoint === 'inventory/units/quick-reserve' && method === 'POST') {
    const unitId = Number(bodyData.unitId);
    return clientDataStore.updateUnitStatus(unitId, 'Hold');
  }

  // Leads CRM
  if (cleanEndpoint === 'leads') {
    if (method === 'POST') {
      return clientDataStore.addLead(bodyData);
    }
    return clientDataStore.getLeads();
  }
  if (cleanEndpoint.startsWith('leads/')) {
    const parts = cleanEndpoint.split('/');
    const id = Number(parts[1]);
    if (parts[2] === 'stage' && method === 'POST') {
      return clientDataStore.updateLead(id, { status: bodyData.stage });
    }
    if (method === 'PUT' || method === 'PATCH') {
      return clientDataStore.updateLead(id, bodyData);
    }
    const lead = clientDataStore.getLeads().find((l) => l.id === id);
    return lead || {};
  }

  // Bookings
  if (cleanEndpoint === 'bookings') {
    if (method === 'POST') {
      return clientDataStore.addBooking(bodyData);
    }
    return clientDataStore.getBookings();
  }
  if (cleanEndpoint.startsWith('bookings/')) {
    const parts = cleanEndpoint.split('/');
    const id = Number(parts[1]);
    if (parts[2] === 'approval' && method === 'POST') {
      return clientDataStore.updateBooking(id, {
        status: bodyData.action === 'approve' ? 'Confirmed' : 'Cancelled',
        currentApprovalStep: 2,
      });
    }
    const booking = clientDataStore.getBookings().find((b) => b.id === id);
    return booking || {};
  }

  // Payments
  if (cleanEndpoint === 'payments') {
    if (method === 'POST') {
      return clientDataStore.addPayment(bodyData);
    }
    return clientDataStore.getPayments();
  }

  // Site Visits
  if (cleanEndpoint === 'site-visits') {
    return clientDataStore.getSiteVisits();
  }

  // Customers
  if (cleanEndpoint === 'customers') {
    return clientDataStore.getCustomers();
  }

  // Channel Partners
  if (cleanEndpoint === 'channel-partners') {
    return clientDataStore.getChannelPartners();
  }

  // Complaints
  if (cleanEndpoint === 'complaints') {
    return clientDataStore.getComplaints();
  }

  // Tasks
  if (cleanEndpoint === 'tasks') {
    return clientDataStore.getTasks();
  }

  // Search
  if (cleanEndpoint.startsWith('search')) {
    const qIndex = endpoint.indexOf('q=');
    const query = (qIndex !== -1 ? decodeURIComponent(endpoint.slice(qIndex + 2).split('&')[0]) : '').toLowerCase();
    const db = clientDataStore.getDatabase();
    return {
      leads: db.leads.filter((l) => l.name.toLowerCase().includes(query) || l.mobile.includes(query)),
      customers: db.customers.filter((c) => c.name.toLowerCase().includes(query) || c.mobile.includes(query)),
      projects: db.projects.filter((p) => p.name.toLowerCase().includes(query)),
      units: db.units.filter((u) => u.unitNumber.toLowerCase().includes(query)),
      bookings: db.bookings.filter((b) => b.bookingNumber.toLowerCase().includes(query) || b.customerName.toLowerCase().includes(query)),
    };
  }

  // Documents
  if (cleanEndpoint === 'documents') {
    return clientDataStore.getDocuments();
  }

  // Settings & Profile
  if (cleanEndpoint === 'organization/profile' || cleanEndpoint === 'organization/settings') {
    return {
      organization: clientDataStore.getDatabase().organization,
      settings: clientDataStore.getDatabase().settings,
    };
  }

  // Fallback generic response
  return { success: true };
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {}),
      },
    });

    // Check if response is valid JSON from an active backend API
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      return await response.json();
    }

    // If 404 (e.g. Vercel static hosting) or HTML fallback received, use client store
    if (response.status === 404 || contentType.includes('text/html')) {
      console.warn(`[AuraEstate] Backend not found on this host (${url}), switching to standalone demo store.`);
      return handleClientFallback(endpoint, options) as T;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (err: any) {
    // If network error, offline on Samsung mobile, or host unreachable, serve from client demo store
    console.warn(`[AuraEstate] Network unavailable for ${url}. Serving from local demo store.`, err);
    return handleClientFallback(endpoint, options) as T;
  }
}

export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator)
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatCurrency(val: number | string | undefined, symbol = '₹'): string {
  if (val === undefined || val === null || isNaN(Number(val))) return `${symbol}0`;
  const num = Number(val);
  return `${symbol}${num.toLocaleString('en-IN')}`;
}

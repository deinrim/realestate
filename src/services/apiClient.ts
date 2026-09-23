const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const personaUid = localStorage.getItem('auraestate_active_persona');
  if (personaUid) {
    headers['x-demo-user-uid'] = personaUid;
  }

  const targetOrgId = localStorage.getItem('auraestate_target_org_id');
  if (targetOrgId) {
    headers['x-target-org-id'] = targetOrgId;
  }

  const idToken = sessionStorage.getItem('auraestate_id_token') || localStorage.getItem('auraestate_id_token');
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return headers;
};

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return response.json();
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

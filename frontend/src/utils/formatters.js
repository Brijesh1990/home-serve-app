import dayjs from 'dayjs';

/**
 * Format numeric values into Indian Rupees (INR)
 */
export const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format decimal currency (e.g. for invoices with GST paise)
 */
export const formatCurrencyExact = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format date using Day.js
 */
export const formatDate = (dateStr, format = 'DD MMM YYYY') => {
  if (!dateStr) return 'N/A';
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format(format) : String(dateStr);
};

/**
 * Format date & time using Day.js
 */
export const formatDateTime = (dateStr, format = 'DD MMM YYYY, hh:mm A') => {
  if (!dateStr) return 'N/A';
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format(format) : String(dateStr);
};

/**
 * Format duration minutes into readable hours/mins
 */
export const formatDuration = (minutes) => {
  const mins = Number(minutes || 60);
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} mins` : `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
};

/**
 * Trigger browser CSV download from array of objects or raw CSV string
 */
export const downloadCSV = (data, filename = 'homeserve-report.csv') => {
  let csvContent = '';

  if (typeof data === 'string') {
    csvContent = data;
  } else if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');
    const rows = data.map((row) =>
      headers
        .map((fieldName) => {
          const val = row[fieldName] === null || row[fieldName] === undefined ? '' : String(row[fieldName]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    csvContent = [headerRow, ...rows].join('\n');
  } else {
    csvContent = 'ID,Status,Message\n1,Empty,No records found';
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows, headers) {
  const headerLine = headers.map((h) => escapeCsv(h.label || h.key)).join(',');
  const lines = [headerLine];

  for (const row of rows) {
    const line = headers.map((h) => escapeCsv(row[h.key])).join(',');
    lines.push(line);
  }

  return lines.join('\n');
}

module.exports = { toCsv };

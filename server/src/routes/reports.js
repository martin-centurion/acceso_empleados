const express = require('express');
const { supabase } = require('../supabase');
const { toCsv } = require('../utils/csv');

const router = express.Router();

function parseDateInput(value, isEnd) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (value.length <= 10) {
    if (isEnd) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
  }
  return date.toISOString();
}

function buildFilters(params) {
  return {
    from: parseDateInput(params.from, false),
    to: parseDateInput(params.to, true),
    employeeId: params.employee_id || null,
    employeeCode: params.employee_code || null,
    branchId: params.branch_id || null,
  };
}

function mapEventRow(row) {
  const employee = Array.isArray(row.employees) ? row.employees[0] : row.employees;
  const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
  return {
    id: row.id,
    event_time: row.event_time,
    device_time: row.device_time,
    action: row.action,
    lat: row.lat,
    lng: row.lng,
    accuracy_m: row.accuracy_m,
    employee_id: employee?.id,
    employee_code: employee?.code,
    full_name: employee?.full_name,
    branch_id: branch?.id,
    branch_name: branch?.name,
  };
}

async function loadAttendanceEvents(filters, limit) {
  let query = supabase
    .from('attendance_events')
    .select(
      'id, event_time, device_time, action, lat, lng, accuracy_m, employees!inner(id, code, full_name), branches!inner(id, name)'
    )
    .order('event_time', { ascending: false });

  if (filters.from) {
    query = query.gte('event_time', filters.from);
  }
  if (filters.to) {
    query = query.lte('event_time', filters.to);
  }
  if (filters.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }
  if (filters.employeeCode) {
    query = query.eq('employees.code', filters.employeeCode);
  }
  if (filters.branchId) {
    query = query.eq('branch_id', filters.branchId);
  }
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return data.map(mapEventRow);
}

router.get('/reports/attendance', async (req, res) => {
  try {
    const filters = buildFilters(req.query || {});
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;
    const events = await loadAttendanceEvents(filters, safeLimit);
    return res.json({ events });
  } catch (err) {
    console.error('Failed to load attendance report', err);
    return res.status(500).json({ error: 'Failed to load attendance report' });
  }
});

router.get('/reports/attendance.csv', async (req, res) => {
  try {
    const filters = buildFilters(req.query || {});
    const events = await loadAttendanceEvents(filters);

    const rows = events.map((row) => ({
      event_time: row.event_time ? new Date(row.event_time).toISOString() : '',
      device_time: row.device_time ? new Date(row.device_time).toISOString() : '',
      action: row.action,
      employee_code: row.employee_code,
      full_name: row.full_name,
      branch_name: row.branch_name,
      lat: row.lat,
      lng: row.lng,
      accuracy_m: row.accuracy_m,
    }));

    const csv = toCsv(rows, [
      { key: 'event_time', label: 'event_time' },
      { key: 'device_time', label: 'device_time' },
      { key: 'action', label: 'action' },
      { key: 'employee_code', label: 'employee_code' },
      { key: 'full_name', label: 'full_name' },
      { key: 'branch_name', label: 'branch_name' },
      { key: 'lat', label: 'lat' },
      { key: 'lng', label: 'lng' },
      { key: 'accuracy_m', label: 'accuracy_m' },
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
    return res.send(csv);
  } catch (err) {
    console.error('Failed to export attendance report', err);
    return res.status(500).json({ error: 'Failed to export attendance report' });
  }
});

module.exports = router;

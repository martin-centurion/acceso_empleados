const express = require('express');
const { supabase } = require('../supabase');
const { toCsv } = require('../utils/csv');

const router = express.Router();

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
});

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

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

function getDateKey(value) {
  return dateKeyFormatter.format(new Date(value));
}

function formatDateLabel(value) {
  return dateFormatter.format(new Date(value)).replace(',', '');
}

function formatTimeLabel(value) {
  return timeFormatter.format(new Date(value));
}

function formatHours(totalSeconds) {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

function calculateDailyHours(events) {
  const totals = new Map();
  const grouped = new Map();

  for (const event of events) {
    const key = event.employee_id;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(event);
  }

  for (const [employeeId, list] of grouped.entries()) {
    const sorted = [...list].sort(
      (a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
    );
    let lastIn = null;

    for (const event of sorted) {
      if (event.action === 'IN') {
        lastIn = event.event_time;
        continue;
      }
      if (event.action !== 'OUT' || !lastIn) {
        continue;
      }

      const start = new Date(lastIn);
      const end = new Date(event.event_time);
      const diff = end.getTime() - start.getTime();
      if (diff > 0) {
        const dateKey = getDateKey(lastIn);
        const totalKey = `${employeeId}-${dateKey}`;
        totals.set(totalKey, (totals.get(totalKey) || 0) + diff / 1000);
      }
      lastIn = null;
    }
  }

  return totals;
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
    const dailyHours = calculateDailyHours(events);

    const rows = events.map((row) => ({
      fecha: row.event_time ? formatDateLabel(row.event_time) : '',
      hora: row.event_time ? formatTimeLabel(row.event_time) : '',
      accion: row.action,
      empleado_codigo: row.employee_code,
      empleado_nombre: row.full_name,
      sucursal: row.branch_name,
      horas_trabajadas: row.event_time
        ? formatHours(dailyHours.get(`${row.employee_id}-${getDateKey(row.event_time)}`) || 0)
        : '',
      lat: row.lat,
      lng: row.lng,
      precision_m: row.accuracy_m,
    }));

    const csv = toCsv(rows, [
      { key: 'fecha', label: 'fecha' },
      { key: 'hora', label: 'hora' },
      { key: 'accion', label: 'accion' },
      { key: 'empleado_codigo', label: 'empleado_codigo' },
      { key: 'empleado_nombre', label: 'empleado_nombre' },
      { key: 'sucursal', label: 'sucursal' },
      { key: 'horas_trabajadas', label: 'horas_trabajadas' },
      { key: 'lat', label: 'lat' },
      { key: 'lng', label: 'lng' },
      { key: 'precision_m', label: 'precision_m' },
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

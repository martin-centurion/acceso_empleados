const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../supabase');

const router = express.Router();

function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

router.get('/public/branch-info', async (req, res) => {
  try {
    const { token } = req.query || {};

    if (!token) {
      return res.status(400).json({ error: 'token required' });
    }

    const { data: branch, error } = await supabase
      .from('branches')
      .select('id, name, is_active')
      .eq('qr_token', token)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!branch || !branch.is_active) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    return res.json({ branch: { id: branch.id, name: branch.name } });
  } catch (err) {
    console.error('Failed to load branch info', err);
    return res.status(500).json({ error: 'Failed to load branch info' });
  }
});

router.post('/public/check', async (req, res) => {
  try {
    const {
      token,
      employee_code,
      pin,
      action,
      device_time,
      lat,
      lng,
      accuracy,
    } = req.body || {};

    const code = employee_code ? String(employee_code).trim() : '';

    if (!token || !code) {
      return res.status(400).json({ error: 'token and employee_code are required' });
    }

    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, name, is_active')
      .eq('qr_token', token)
      .maybeSingle();

    if (branchError) {
      throw branchError;
    }

    if (!branch || !branch.is_active) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, code, full_name, pin_hash, is_active')
      .eq('code', code)
      .maybeSingle();

    if (employeeError) {
      throw employeeError;
    }

    if (!employee || !employee.is_active) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (employee.pin_hash) {
      if (!pin) {
        return res.status(401).json({ error: 'PIN required' });
      }
      const ok = await bcrypt.compare(String(pin), employee.pin_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid PIN' });
      }
    }

    let finalAction = action ? String(action).toUpperCase() : 'AUTO';
    if (!['AUTO', 'IN', 'OUT'].includes(finalAction)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (finalAction === 'AUTO') {
      const { data: lastEvents, error: lastError } = await supabase
        .from('attendance_events')
        .select('action')
        .eq('employee_id', employee.id)
        .order('event_time', { ascending: false })
        .limit(1);

      if (lastError) {
        throw lastError;
      }

      const lastAction = lastEvents?.[0]?.action;
      finalAction = lastAction === 'IN' ? 'OUT' : 'IN';
    }

    const deviceTime = device_time ? new Date(device_time) : null;
    const deviceTimeValue = deviceTime && !Number.isNaN(deviceTime.getTime()) ? deviceTime : null;

    const { data: created, error: insertError } = await supabase
      .from('attendance_events')
      .insert({
        employee_id: employee.id,
        branch_id: branch.id,
        action: finalAction,
        device_time: deviceTimeValue,
        lat: parseNumber(lat),
        lng: parseNumber(lng),
        accuracy_m: parseNumber(accuracy),
      })
      .select('id, action, event_time')
      .single();

    if (insertError) {
      throw insertError;
    }

    return res.json({
      ok: true,
      action: created.action,
      event_time: created.event_time,
      branch: { id: branch.id, name: branch.name },
      employee: { id: employee.id, code: employee.code, full_name: employee.full_name },
    });
  } catch (err) {
    console.error('Failed to register attendance', err);
    return res.status(500).json({ error: 'Failed to register attendance' });
  }
});

module.exports = router;

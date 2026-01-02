const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../supabase');

const router = express.Router();

router.get('/employees', async (req, res) => {
  try {
    const onlyActive = req.query.active === '1' || req.query.active === 'true';
    let query = supabase
      .from('employees')
      .select('id, code, full_name, phone, hire_date, termination_date, is_active, created_at')
      .order('full_name', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return res.json({ employees: data });
  } catch (err) {
    console.error('Failed to list employees', err);
    return res.status(500).json({ error: 'Failed to list employees' });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const { code, full_name, pin, phone, hire_date } = req.body || {};
    const normalizedCode = code ? String(code).trim() : '';
    const normalizedName = full_name ? String(full_name).trim() : '';
    const normalizedPhone = phone ? String(phone).trim() : null;
    const normalizedHireDate = hire_date ? String(hire_date).trim() : null;

    if (!normalizedCode || !normalizedName) {
      return res.status(400).json({ error: 'code and full_name are required' });
    }

    const pinHash = pin ? await bcrypt.hash(String(pin), 10) : null;

    const { data, error } = await supabase
      .from('employees')
      .insert({
        code: normalizedCode,
        full_name: normalizedName,
        phone: normalizedPhone || null,
        hire_date: normalizedHireDate || null,
        pin_hash: pinHash,
      })
      .select('id, code, full_name, phone, hire_date, termination_date, is_active, created_at');

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Employee code already exists' });
      }
      throw error;
    }

    return res.status(201).json({ employee: data?.[0] });
  } catch (err) {
    console.error('Failed to create employee', err);
    return res.status(500).json({ error: 'Failed to create employee' });
  }
});

router.patch('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, pin, is_active, phone, hire_date, termination_date } = req.body || {};

    const updates = {};

    if (full_name !== undefined) {
      updates.full_name = full_name;
    }

    if (phone !== undefined) {
      const normalizedPhone = phone ? String(phone).trim() : null;
      updates.phone = normalizedPhone || null;
    }

    if (hire_date !== undefined) {
      const normalizedHireDate = hire_date ? String(hire_date).trim() : null;
      updates.hire_date = normalizedHireDate || null;
    }

    if (termination_date !== undefined) {
      const normalizedTerminationDate = termination_date ? String(termination_date).trim() : null;
      updates.termination_date = normalizedTerminationDate || null;
    }

    if (pin !== undefined) {
      updates.pin_hash = pin ? await bcrypt.hash(String(pin), 10) : null;
    }

    if (is_active !== undefined) {
      updates.is_active =
        is_active === true ||
        is_active === 'true' ||
        is_active === 1 ||
        is_active === '1';
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select('id, code, full_name, phone, hire_date, termination_date, is_active, created_at');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.json({ employee: data[0] });
  } catch (err) {
    console.error('Failed to update employee', err);
    return res.status(500).json({ error: 'Failed to update employee' });
  }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        return res.status(409).json({ error: 'El empleado tiene registros' });
      }
      throw error;
    }
    return res.status(204).send();
  } catch (err) {
    console.error('Failed to delete employee', err);
    return res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;

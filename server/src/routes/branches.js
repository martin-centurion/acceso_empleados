const express = require('express');
const { randomUUID } = require('crypto');
const { supabase } = require('../supabase');

const router = express.Router();

router.get('/branches', async (req, res) => {
  try {
    const onlyActive = req.query.active === '1' || req.query.active === 'true';
    let query = supabase
      .from('branches')
      .select('id, name, qr_token, is_active, created_at')
      .order('name', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return res.json({ branches: data });
  } catch (err) {
    console.error('Failed to list branches', err);
    return res.status(500).json({ error: 'Failed to list branches' });
  }
});

router.post('/branches', async (req, res) => {
  try {
    const { name } = req.body || {};
    const normalizedName = name ? String(name).trim() : '';

    if (!normalizedName) {
      return res.status(400).json({ error: 'name is required' });
    }

    const token = randomUUID();
    const { data, error } = await supabase
      .from('branches')
      .insert({
        name: normalizedName,
        qr_token: token,
      })
      .select('id, name, qr_token, is_active, created_at');

    if (error) {
      throw error;
    }

    return res.status(201).json({ branch: data?.[0] });
  } catch (err) {
    console.error('Failed to create branch', err);
    return res.status(500).json({ error: 'Failed to create branch' });
  }
});

router.patch('/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body || {};

    const updates = {};

    if (name !== undefined) {
      updates.name = name;
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
      .from('branches')
      .update(updates)
      .eq('id', id)
      .select('id, name, qr_token, is_active, created_at');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    return res.json({ branch: data[0] });
  } catch (err) {
    console.error('Failed to update branch', err);
    return res.status(500).json({ error: 'Failed to update branch' });
  }
});

router.delete('/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        return res.status(409).json({ error: 'La sucursal tiene registros' });
      }
      throw error;
    }
    return res.status(204).send();
  } catch (err) {
    console.error('Failed to delete branch', err);
    return res.status(500).json({ error: 'Failed to delete branch' });
  }
});

module.exports = router;

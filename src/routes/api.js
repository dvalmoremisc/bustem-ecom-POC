const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get dashboard summary
router.get('/dashboard/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const data = await db.getDashboardSummary(storeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all visitors for a store
router.get('/visitors/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const visitors = await db.getVisitors(storeId, { limit, offset });
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single visitor detail
router.get('/visitor/:storeId/:visitorId', async (req, res) => {
  try {
    const { storeId, visitorId } = req.params;
    const visitor = await db.getVisitor(storeId, visitorId);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json(visitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alerts
router.get('/alerts/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status } = req.query;
    const alerts = await db.getAlerts(storeId, { status });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update alert status
router.patch('/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status } = req.body;
    await db.updateAlert(alertId, { status });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent activity (for live feed)
router.get('/activity/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 20 } = req.query;
    const activity = await db.getRecentActivity(storeId, limit);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


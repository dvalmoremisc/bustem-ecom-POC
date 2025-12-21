const express = require('express');
const router = express.Router();
const fingerprintService = require('../services/fingerprint');
const db = require('../db/database');
const riskAnalyzer = require('../utils/riskAnalyzer');

router.post('/collect', async (req, res) => {
  try {
    const { storeId, visitorId, requestId, page, clientSignals } = req.body;
    
    if (!storeId || !visitorId || !requestId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`📥 Tracking visitor ${visitorId.slice(0, 12)}... on store ${storeId}`);
    
    // Get full Smart Signals from FingerprintJS Server API
    let serverSignals = null;
    try {
      const event = await fingerprintService.getEvent(requestId);
      serverSignals = event.products;
      
      // Log key signals for debugging
      const suspectScore = serverSignals?.suspectScore?.data?.result;
      const tampering = serverSignals?.tampering?.data?.result;
      const botResult = serverSignals?.botd?.data?.bot?.result;
      
      console.log(`🔍 FingerprintJS Signals: suspectScore=${suspectScore}, tampering=${tampering}, bot=${botResult}`);
    } catch (err) {
      console.error('FingerprintJS API error:', err.message);
      // Continue without server signals - we can still analyze client signals
    }
    
    // Analyze risk
    const riskAnalysis = riskAnalyzer.analyze({
      clientSignals,
      serverSignals,
      visitorId,
      storeId
    });
    
    // Create visit record
    const visit = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      storeId,
      visitorId,
      requestId,
      page,
      clientSignals,
      serverSignals,
      riskAnalysis,
      timestamp: new Date().toISOString()
    };
    
    // Store visit
    await db.addVisit(visit);
    
    // Update visitor profile
    await db.updateVisitor(storeId, visitorId, visit);
    
    // Check if this visitor should trigger an alert (score 5+ on 0-10 scale)
    if (riskAnalysis.score >= 5) {
      await db.addAlert({
        id: `alert-${Date.now()}`,
        storeId,
        visitorId,
        riskScore: riskAnalysis.score,
        riskFactors: riskAnalysis.factors,
        timestamp: new Date().toISOString(),
        status: 'new'
      });
      console.log(`🚨 Alert created for visitor ${visitorId.slice(0, 12)}... (risk: ${riskAnalysis.score})`);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Collection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


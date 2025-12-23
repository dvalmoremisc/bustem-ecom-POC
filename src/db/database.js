/**
 * Simple JSON File Database (for POC)
 * 
 * In production, replace with PostgreSQL, MongoDB, etc.
 */

const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data');
const VISITORS_FILE = path.join(DB_PATH, 'visitors.json');
const VISITS_FILE = path.join(DB_PATH, 'visits.json');
const ALERTS_FILE = path.join(DB_PATH, 'alerts.json');

// Ensure data directory and files exist
async function init() {
  try {
    await fs.mkdir(DB_PATH, { recursive: true });
    
    for (const file of [VISITORS_FILE, VISITS_FILE, ALERTS_FILE]) {
      try {
        await fs.access(file);
      } catch {
        await fs.writeFile(file, '[]');
      }
    }
  } catch (error) {
    console.error('DB init error:', error);
  }
}

async function readJSON(file) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    return [];
  }
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// ========== VISITS (Sessions) ==========

// Check if a session (requestId) already exists
async function sessionExists(requestId) {
  const visits = await readJSON(VISITS_FILE);
  return visits.some(v => v.requestId === requestId);
}

// Add or update a visit/session
async function addVisit(visit) {
  const visits = await readJSON(VISITS_FILE);
  
  // Check if this session already exists
  const existingIndex = visits.findIndex(v => v.requestId === visit.requestId);
  
  if (existingIndex >= 0) {
    // Update existing session - add page to pages array
    const existing = visits[existingIndex];
    if (!existing.pages) existing.pages = [existing.path];
    if (!existing.pages.includes(visit.path)) {
      existing.pages.push(visit.path);
    }
    existing.lastActivity = visit.timestamp;
    await writeJSON(VISITS_FILE, visits);
    return { isNewSession: false };
  }
  
  // New session
  visit.pages = [visit.path];
  visits.unshift(visit);
  
  // Keep only last 1000 visits per store
  const storeVisits = visits.filter(v => v.storeId === visit.storeId);
  if (storeVisits.length > 1000) {
    const toRemove = storeVisits.slice(1000);
    const filtered = visits.filter(v => !toRemove.includes(v));
    await writeJSON(VISITS_FILE, filtered);
  } else {
    await writeJSON(VISITS_FILE, visits);
  }
  
  return { isNewSession: true };
}

async function getRecentActivity(storeId, limit = 20) {
  const visits = await readJSON(VISITS_FILE);
  return visits
    .filter(v => v.storeId === storeId)
    .slice(0, parseInt(limit));
}

// ========== VISITORS ==========

async function updateVisitor(storeId, visitorId, visit, isNewSession) {
  const visitors = await readJSON(VISITORS_FILE);
  
  const key = `${storeId}:${visitorId}`;
  let visitor = visitors.find(v => v.key === key);
  
  if (!visitor) {
    visitor = {
      key,
      storeId,
      visitorId,
      firstSeen: visit.timestamp,
      lastSeen: visit.timestamp,
      visitCount: 0,
      pagesVisited: [],
      highestRiskScore: 0,
      riskFactors: [],
      serverSignals: null
    };
    visitors.push(visitor);
  }
  
  // Update visitor
  visitor.lastSeen = visit.timestamp;
  visitor.serverSignals = visit.serverSignals;
  
  // Only increment visitCount for new sessions
  if (isNewSession) {
    visitor.visitCount += 1;
  }
  
  // Track unique pages visited
  const pagePath = visit.path || '/';
  if (!visitor.pagesVisited) visitor.pagesVisited = [];
  if (!visitor.pagesVisited.includes(pagePath)) {
    visitor.pagesVisited.push(pagePath);
  }
  
  // Update risk
  if (visit.riskAnalysis.score > visitor.highestRiskScore) {
    visitor.highestRiskScore = visit.riskAnalysis.score;
    visitor.riskLevel = visit.riskAnalysis.level;
    visitor.riskFactors = visit.riskAnalysis.factors;
  }
  
  await writeJSON(VISITORS_FILE, visitors);
}

async function getVisitors(storeId, { limit = 50, offset = 0 }) {
  const visitors = await readJSON(VISITORS_FILE);
  return visitors
    .filter(v => v.storeId === storeId)
    .sort((a, b) => b.highestRiskScore - a.highestRiskScore)
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
}

async function getVisitor(storeId, visitorId) {
  const visitors = await readJSON(VISITORS_FILE);
  const visits = await readJSON(VISITS_FILE);
  
  const visitor = visitors.find(v => v.storeId === storeId && v.visitorId === visitorId);
  if (!visitor) return null;
  
  // Include visit history
  visitor.visits = visits
    .filter(v => v.storeId === storeId && v.visitorId === visitorId)
    .slice(0, 50);
  
  return visitor;
}

// ========== ALERTS ==========

async function addAlert(alert) {
  const alerts = await readJSON(ALERTS_FILE);
  alerts.unshift(alert);
  await writeJSON(ALERTS_FILE, alerts);
}

async function getAlerts(storeId, { status } = {}) {
  const alerts = await readJSON(ALERTS_FILE);
  return alerts.filter(a => {
    if (a.storeId !== storeId) return false;
    if (status && a.status !== status) return false;
    return true;
  });
}

async function updateAlert(alertId, updates) {
  const alerts = await readJSON(ALERTS_FILE);
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    Object.assign(alert, updates);
    await writeJSON(ALERTS_FILE, alerts);
  }
}

// ========== DASHBOARD ==========

async function getDashboardSummary(storeId) {
  const visitors = await readJSON(VISITORS_FILE);
  const alerts = await readJSON(ALERTS_FILE);
  const visits = await readJSON(VISITS_FILE);
  
  const storeVisitors = visitors.filter(v => v.storeId === storeId);
  const storeAlerts = alerts.filter(a => a.storeId === storeId);
  const storeVisits = visits.filter(v => v.storeId === storeId);
  
  // Calculate stats
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const visitsToday = storeVisits.filter(v => new Date(v.timestamp) >= today);
  
  const criticalVisitors = storeVisitors.filter(v => v.riskLevel === 'critical');
  const highRiskVisitors = storeVisitors.filter(v => v.riskLevel === 'high');
  const newAlerts = storeAlerts.filter(a => a.status === 'new');
  
  return {
    totalVisitors: storeVisitors.length,
    visitsToday: visitsToday.length,
    criticalThreats: criticalVisitors.length,
    highRiskVisitors: highRiskVisitors.length,
    newAlerts: newAlerts.length,
    recentVisitors: storeVisitors
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
      .slice(0, 5),
    topThreats: storeVisitors
      .filter(v => v.highestRiskScore >= 6)  // Only show high+ risk (score 6+)
      .sort((a, b) => b.highestRiskScore - a.highestRiskScore)
      .slice(0, 5)
  };
}

// Initialize on load
init();

module.exports = {
  addVisit,
  getRecentActivity,
  updateVisitor,
  getVisitors,
  getVisitor,
  addAlert,
  getAlerts,
  updateAlert,
  getDashboardSummary
};


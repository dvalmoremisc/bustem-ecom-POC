/**
 * Risk Analyzer
 * 
 * Analyzes visitor signals and calculates a risk score for copycat detection.
 * Higher scores = more likely to be a copycat/scraper.
 */

function analyze({ clientSignals, serverSignals, visitorId, storeId }) {
  let score = 0;
  const factors = [];
  
  // ========== SERVER SIGNALS (from FingerprintJS) ==========
  
  if (serverSignals) {
    // Bot Detection - CRITICAL
    const botResult = serverSignals.botd?.data?.bot?.result;
    if (botResult === 'bad') {
      score += 40;
      factors.push({
        signal: 'Bot Detected',
        severity: 'critical',
        detail: `Type: ${serverSignals.botd?.data?.bot?.type || 'unknown'}`,
        points: 40
      });
    }
    
    // VPN Detection - HIGH
    if (serverSignals.vpn?.data?.result === true) {
      score += 20;
      factors.push({
        signal: 'VPN Detected',
        severity: 'high',
        detail: `Confidence: ${serverSignals.vpn?.data?.confidence}`,
        points: 20
      });
    }
    
    // Proxy Detection - HIGH
    if (serverSignals.proxy?.data?.result === true) {
      score += 20;
      factors.push({
        signal: 'Proxy Detected',
        severity: 'high',
        detail: 'Traffic routed through proxy',
        points: 20
      });
    }
    
    // Tor Detection - CRITICAL
    if (serverSignals.tor?.data?.result === true) {
      score += 35;
      factors.push({
        signal: 'Tor Network',
        severity: 'critical',
        detail: 'Visitor using Tor anonymization',
        points: 35
      });
    }
    
    // Datacenter IP - HIGH
    if (serverSignals.ipInfo?.data?.v4?.datacenter?.result === true) {
      score += 25;
      factors.push({
        signal: 'Datacenter IP',
        severity: 'high',
        detail: serverSignals.ipInfo?.data?.v4?.datacenter?.name || 'Unknown datacenter',
        points: 25
      });
    }
    
    // Incognito Mode - MEDIUM
    if (serverSignals.incognito?.data?.result === true) {
      score += 10;
      factors.push({
        signal: 'Incognito Mode',
        severity: 'medium',
        detail: 'Private browsing enabled',
        points: 10
      });
    }
    
    // Virtual Machine - HIGH
    if (serverSignals.virtualMachine?.data?.result === true) {
      score += 20;
      factors.push({
        signal: 'Virtual Machine',
        severity: 'high',
        detail: 'Running in VM environment',
        points: 20
      });
    }
    
    // Browser Tampering - CRITICAL
    if (serverSignals.tampering?.data?.result === true) {
      score += 30;
      const detail = serverSignals.tampering?.data?.antiDetectBrowser
        ? 'Anti-detect browser detected'
        : `Anomaly score: ${serverSignals.tampering?.data?.anomalyScore}`;
      factors.push({
        signal: 'Browser Tampering',
        severity: 'critical',
        detail,
        points: 30
      });
    }
    
    // High Activity - MEDIUM
    if (serverSignals.highActivity?.data?.result === true) {
      score += 15;
      factors.push({
        signal: 'High Activity',
        severity: 'medium',
        detail: `${serverSignals.highActivity?.data?.dailyRequests} requests today`,
        points: 15
      });
    }
    
    // Velocity - Rapid page visits
    const events5m = serverSignals.velocity?.data?.events?.intervals?.['5m'] || 0;
    if (events5m > 10) {
      score += 25;
      factors.push({
        signal: 'Rapid Browsing',
        severity: 'high',
        detail: `${events5m} page visits in 5 minutes`,
        points: 25
      });
    } else if (events5m > 5) {
      score += 10;
      factors.push({
        signal: 'Fast Browsing',
        severity: 'medium',
        detail: `${events5m} page visits in 5 minutes`,
        points: 10
      });
    }
  }
  
  // ========== CLIENT SIGNALS ==========
  
  if (clientSignals) {
    // Developer Tools Open - HIGH (strong indicator of copycat behavior)
    if (clientSignals.devToolsOpen === true) {
      score += 20;
      factors.push({
        signal: 'Developer Tools Open',
        severity: 'high',
        detail: 'Visitor inspecting page source/code',
        points: 20
      });
    }
  }
  
  // ========== DETERMINE RISK LEVEL ==========
  
  let level;
  if (score >= 60) {
    level = 'critical';
  } else if (score >= 40) {
    level = 'high';
  } else if (score >= 20) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return {
    score: Math.min(score, 100),  // Cap at 100
    level,
    factors,
    recommendation: getRecommendation(level)
  };
}

function getRecommendation(level) {
  switch (level) {
    case 'critical':
      return 'Likely scraper or copycat. Consider blocking this visitor.';
    case 'high':
      return 'Suspicious behavior detected. Monitor closely.';
    case 'medium':
      return 'Some risk signals present. Keep on watchlist.';
    default:
      return 'Normal visitor behavior.';
  }
}

module.exports = { analyze };


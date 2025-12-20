/**
 * Risk Analyzer
 * 
 * Uses FingerprintJS suspectScore to determine visitor risk.
 * suspectScore ranges from 0-1, where higher = more suspicious.
 */

function analyze({ clientSignals, serverSignals, visitorId, storeId }) {
  let score = 0;
  const factors = [];
  
  // ========== USE FINGERPRINTJS SUSPECT SCORE ==========
  
  if (serverSignals && serverSignals.suspectScore !== undefined) {
    // FingerprintJS suspectScore is 0-1, convert to 0-100
    score = Math.round(serverSignals.suspectScore * 100);
    
    // Add suspect score as primary factor
    factors.push({
      signal: 'FingerprintJS Suspect Score',
      severity: score >= 60 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low',
      detail: `Suspicion level: ${score}/100`,
      points: score
    });
    
    // Add detected signals as additional context
    if (serverSignals.botd?.data?.bot?.result === 'bad') {
      factors.push({
        signal: 'Bot Detected',
        severity: 'critical',
        detail: `Type: ${serverSignals.botd?.data?.bot?.type || 'unknown'}`,
        points: 0
      });
    }
    
    if (serverSignals.vpn?.data?.result === true) {
      factors.push({
        signal: 'VPN Detected',
        severity: 'high',
        detail: `Confidence: ${serverSignals.vpn?.data?.confidence || 'N/A'}`,
        points: 0
      });
    }
    
    if (serverSignals.proxy?.data?.result === true) {
      factors.push({
        signal: 'Proxy Detected',
        severity: 'high',
        detail: 'Traffic routed through proxy',
        points: 0
      });
    }
    
    if (serverSignals.tor?.data?.result === true) {
      factors.push({
        signal: 'Tor Network',
        severity: 'critical',
        detail: 'Visitor using Tor anonymization',
        points: 0
      });
    }
    
    if (serverSignals.ipInfo?.data?.v4?.datacenter?.result === true) {
      factors.push({
        signal: 'Datacenter IP',
        severity: 'high',
        detail: serverSignals.ipInfo?.data?.v4?.datacenter?.name || 'Unknown datacenter',
        points: 0
      });
    }
    
    if (serverSignals.incognito?.data?.result === true) {
      factors.push({
        signal: 'Incognito Mode',
        severity: 'medium',
        detail: 'Private browsing enabled',
        points: 0
      });
    }
    
    if (serverSignals.virtualMachine?.data?.result === true) {
      factors.push({
        signal: 'Virtual Machine',
        severity: 'high',
        detail: 'Running in VM environment',
        points: 0
      });
    }
    
    if (serverSignals.tampering?.data?.result === true) {
      const detail = serverSignals.tampering?.data?.antiDetectBrowser
        ? 'Anti-detect browser detected'
        : `Anomaly detected`;
      factors.push({
        signal: 'Browser Tampering',
        severity: 'critical',
        detail,
        points: 0
      });
    }
  } else {
    // Fallback: No FingerprintJS data (trial expired or API error)
    // Check client-side signals only
    if (clientSignals?.devToolsOpen === true) {
      score = 20;
      factors.push({
        signal: 'Developer Tools Open',
        severity: 'medium',
        detail: 'Visitor inspecting page source/code (client-side detection)',
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
    score,
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


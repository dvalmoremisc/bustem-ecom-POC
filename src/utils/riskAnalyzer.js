/**
 * Risk Analyzer
 * 
 * Uses FingerprintJS suspectScore as the primary risk indicator.
 * Higher suspectScore = more suspicious visitor.
 */

function analyze({ clientSignals, serverSignals, visitorId, storeId }) {
  let score = 0;
  const factors = [];
  
  // ========== USE FINGERPRINTJS SUSPECT SCORE ==========
  
  if (serverSignals) {
    // FingerprintJS suspectScore - raw value, higher = more suspicious
    const suspectScore = serverSignals.suspectScore?.data?.result;
    
    if (suspectScore !== undefined && suspectScore !== null) {
      score = suspectScore;
    }
    
    // Collect detected signals
    if (serverSignals.botd?.data?.bot?.result === 'bad') {
      factors.push({
        signal: 'Bot Detected',
        severity: 'critical',
        detail: `Type: ${serverSignals.botd?.data?.bot?.type || 'unknown'}`
      });
    }
    
    if (serverSignals.vpn?.data?.result === true) {
      factors.push({
        signal: 'VPN Detected',
        severity: 'high',
        detail: `Confidence: ${serverSignals.vpn?.data?.confidence || 'N/A'}`
      });
    }
    
    if (serverSignals.proxy?.data?.result === true) {
      factors.push({
        signal: 'Proxy Detected',
        severity: 'high',
        detail: 'Traffic routed through proxy'
      });
    }
    
    if (serverSignals.tor?.data?.result === true) {
      factors.push({
        signal: 'Tor Network',
        severity: 'critical',
        detail: 'Visitor using Tor anonymization'
      });
    }
    
    if (serverSignals.ipInfo?.data?.v4?.datacenter?.result === true) {
      factors.push({
        signal: 'Datacenter IP',
        severity: 'high',
        detail: serverSignals.ipInfo?.data?.v4?.datacenter?.name || 'Unknown datacenter'
      });
    }
    
    if (serverSignals.incognito?.data?.result === true) {
      factors.push({
        signal: 'Incognito Mode',
        severity: 'medium',
        detail: 'Private browsing enabled'
      });
    }
    
    if (serverSignals.virtualMachine?.data?.result === true) {
      factors.push({
        signal: 'Virtual Machine',
        severity: 'high',
        detail: 'Running in VM environment'
      });
    }
    
    if (serverSignals.tampering?.data?.result === true) {
      const anomalyScore = serverSignals.tampering?.data?.anomalyScore;
      const antiDetect = serverSignals.tampering?.data?.antiDetectBrowser;
      const detail = antiDetect
        ? 'Anti-detect browser detected'
        : `Browser tampering (anomaly: ${anomalyScore ? (anomalyScore * 100).toFixed(1) + '%' : 'N/A'})`;
      factors.push({
        signal: 'Browser Tampering',
        severity: 'critical',
        detail
      });
    }
    
    if (serverSignals.clonedApp?.data?.result === true) {
      factors.push({
        signal: 'Cloned App',
        severity: 'critical',
        detail: 'Running from a cloned/modified application'
      });
    }
    
    if (serverSignals.emulator?.data?.result === true) {
      factors.push({
        signal: 'Emulator Detected',
        severity: 'high',
        detail: 'Running in an emulated environment'
      });
    }
    
    if (serverSignals.rootApps?.data?.result === true) {
      factors.push({
        signal: 'Rooted Device',
        severity: 'high',
        detail: 'Device has root/jailbreak apps installed'
      });
    }
    
    if (serverSignals.highActivity?.data?.result === true) {
      const dailyRequests = serverSignals.highActivity?.data?.dailyRequests || 0;
      factors.push({
        signal: 'High Activity',
        severity: 'high',
        detail: `${dailyRequests} requests today`
      });
    }
  }
  
  // Fallback: Check client-side signals if no FingerprintJS data
  if (!serverSignals && clientSignals?.devToolsOpen === true) {
    factors.push({
      signal: 'Developer Tools Open',
      severity: 'medium',
      detail: 'Visitor inspecting page source/code'
    });
  }
  
  // ========== DETERMINE RISK LEVEL ==========
  // Based on FingerprintJS suspect score thresholds
  
  let level;
  if (score >= 10) {
    level = 'critical';
  } else if (score >= 6) {
    level = 'high';
  } else if (score >= 3) {
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

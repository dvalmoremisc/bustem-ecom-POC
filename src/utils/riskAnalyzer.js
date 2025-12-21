/**
 * Risk Analyzer
 * 
 * Uses FingerprintJS suspectScore to determine visitor risk.
 * suspectScore from FingerprintJS is 0-10 scale, converted to 0-100.
 */

function analyze({ clientSignals, serverSignals, visitorId, storeId }) {
  let score = 0;
  const factors = [];
  
  // ========== USE FINGERPRINTJS SUSPECT SCORE ==========
  
  if (serverSignals) {
    // FingerprintJS suspectScore is at products.suspectScore.data.result (0-10 scale)
    const suspectScoreRaw = serverSignals.suspectScore?.data?.result;
    
    if (suspectScoreRaw !== undefined && suspectScoreRaw !== null) {
      // Convert 0-10 scale to 0-100
      score = Math.round(suspectScoreRaw * 10);
      
      factors.push({
        signal: 'FingerprintJS Suspect Score',
        severity: score >= 60 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low',
        detail: `Suspicion level: ${suspectScoreRaw}/10 (${score}%)`,
        points: score
      });
    }
    
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
      const anomalyScore = serverSignals.tampering?.data?.anomalyScore;
      const antiDetect = serverSignals.tampering?.data?.antiDetectBrowser;
      const detail = antiDetect
        ? 'Anti-detect browser detected'
        : `Browser tampering detected (anomaly: ${anomalyScore ? (anomalyScore * 100).toFixed(1) + '%' : 'N/A'})`;
      factors.push({
        signal: 'Browser Tampering',
        severity: 'critical',
        detail,
        points: 0
      });
    }
    
    if (serverSignals.clonedApp?.data?.result === true) {
      factors.push({
        signal: 'Cloned App',
        severity: 'critical',
        detail: 'Running from a cloned/modified application',
        points: 0
      });
    }
    
    if (serverSignals.emulator?.data?.result === true) {
      factors.push({
        signal: 'Emulator Detected',
        severity: 'high',
        detail: 'Running in an emulated environment',
        points: 0
      });
    }
    
    if (serverSignals.rootApps?.data?.result === true) {
      factors.push({
        signal: 'Rooted Device',
        severity: 'high',
        detail: 'Device has root/jailbreak apps installed',
        points: 0
      });
    }
  }
  
  // Fallback: Check client-side signals if no server score
  if (score === 0 && clientSignals?.devToolsOpen === true) {
    score = 20;
    factors.push({
      signal: 'Developer Tools Open',
      severity: 'medium',
      detail: 'Visitor inspecting page source/code',
      points: 20
    });
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


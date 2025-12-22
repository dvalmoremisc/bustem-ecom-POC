/**
 * Copycat Detection Script
 * 
 * This script is injected into client stores via:
 * <script src="https://YOUR-SERVER.com/protect.js" data-store-id="STORE-123"></script>
 * 
 * FingerprintJS is called ONCE per session, then page paths are tracked using stored session data.
 */

(function() {
  'use strict';
  
  const scriptTag = document.currentScript;
  const storeId = scriptTag.getAttribute('data-store-id');
  const serverUrl = scriptTag.src.replace('/protect.js', '');
  const publicApiKey = scriptTag.getAttribute('data-api-key') || 'YOUR_PUBLIC_API_KEY';
  
  if (!storeId) {
    console.error('Copycat Detection: Missing data-store-id attribute');
    return;
  }
  
  const SESSION_KEY = 'copycat_session';
  let lastTrackedPath = null;
  
  // Get or create session from sessionStorage
  function getSession() {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  
  function saveSession(session) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {}
  }
  
  // Load FingerprintJS (only called once per session)
  function loadFingerprintJS() {
    return new Promise((resolve, reject) => {
      if (window.FingerprintJS) {
        resolve(window.FingerprintJS);
        return;
      }
      const script = document.createElement('script');
      script.src = `https://fpjscdn.net/v3/${publicApiKey}/iife.min.js`;
      script.async = true;
      script.onload = () => resolve(window.FingerprintJS);
      script.onerror = () => reject(new Error('Failed to load FingerprintJS'));
      document.head.appendChild(script);
    });
  }
  
  // Detect if DevTools is open
  function detectDevTools() {
    const threshold = 160;
    return (window.outerWidth - window.innerWidth > threshold) || 
           (window.outerHeight - window.innerHeight > threshold);
  }
  
  // Send page data to server
  async function sendPageData(visitorId, requestId, path) {
    await fetch(`${serverUrl}/api/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId,
        visitorId,
        requestId,
        path,
        timestamp: new Date().toISOString(),
        clientSignals: { devToolsOpen: detectDevTools() }
      }),
      keepalive: true
    });
  }
  
  // Main tracking function
  async function track() {
    const currentPath = window.location.pathname;
    
    // Skip if we already tracked this path
    if (currentPath === lastTrackedPath) return;
    lastTrackedPath = currentPath;
    
    try {
      let session = getSession();
      
      if (!session) {
        // First page of session - call FingerprintJS once
        const FingerprintJS = await loadFingerprintJS();
        const fp = await FingerprintJS.load();
        const result = await fp.get({ extendedResult: true });
        
        session = {
          visitorId: result.visitorId,
          requestId: result.requestId
        };
        saveSession(session);
        console.log('🔐 New session fingerprinted');
      }
      
      // Send page data (works for first and subsequent pages)
      await sendPageData(session.visitorId, session.requestId, currentPath);
      console.log(`📍 Tracked: ${currentPath}`);
      
    } catch (error) {
      console.error('Copycat Detection Error:', error);
    }
  }
  
  // Run on page load
  if (document.readyState === 'complete') {
    track();
  } else {
    window.addEventListener('load', track);
  }
  
  // Track SPA/Ajax navigation
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      track();
    }
  }, 1000);
  
  // Track browser back/forward navigation
  window.addEventListener('popstate', track);
  
})();

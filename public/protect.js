/**
 * Copycat Detection Script
 * 
 * This script is injected into client stores via:
 * <script src="https://YOUR-SERVER.com/protect.js" data-store-id="STORE-123"></script>
 */

(function() {
  'use strict';
  
  // Get store ID from script tag
  const scriptTag = document.currentScript;
  const storeId = scriptTag.getAttribute('data-store-id');
  const serverUrl = scriptTag.src.replace('/protect.js', '');
  
  // Get public API key from script tag
  const publicApiKey = scriptTag.getAttribute('data-api-key') || 'YOUR_PUBLIC_API_KEY';
  
  if (!storeId) {
    console.error('Copycat Detection: Missing data-store-id attribute');
    return;
  }
  
  // Track the last path to avoid duplicate tracking
  let lastTrackedPath = null;
  
  // Load FingerprintJS
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
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    return widthThreshold || heightThreshold;
  }
  
  // Main tracking function
  async function track() {
    const currentPath = window.location.pathname;
    
    // Skip if we already tracked this path
    if (currentPath === lastTrackedPath) {
      return;
    }
    lastTrackedPath = currentPath;
    
    try {
      const FingerprintJS = await loadFingerprintJS();
      const fp = await FingerprintJS.load();
      const result = await fp.get({ extendedResult: true });
      
      // Simplified payload - just track the path
      const payload = {
        storeId: storeId,
        visitorId: result.visitorId,
        requestId: result.requestId,
        path: currentPath,
        timestamp: new Date().toISOString(),
        clientSignals: {
          devToolsOpen: detectDevTools()
        }
      };
      
      // Send to server
      await fetch(`${serverUrl}/api/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: true
      });
      
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
  
  // Track navigation changes (for SPA-like Shopify navigation)
  let currentUrl = window.location.href;
  
  // Check for URL changes periodically (handles Ajax navigation)
  setInterval(function() {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      track();
    }
  }, 1000);
  
  // Also track browser back/forward navigation
  window.addEventListener('popstate', function() {
    track();
  });
  
})();

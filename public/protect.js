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
  
  // Get public API key from script tag or use default (for demo)
  const publicApiKey = scriptTag.getAttribute('data-api-key') || 'YOUR_PUBLIC_API_KEY';
  
  if (!storeId) {
    console.error('Copycat Detection: Missing data-store-id attribute');
    return;
  }
  
  // Load FingerprintJS
  function loadFingerprintJS() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
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
  
  // Collect page context
  function getPageContext() {
    return {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
      timestamp: new Date().toISOString()
    };
  }
  
  // Detect if DevTools is open (basic detection)
  function detectDevTools() {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    return widthThreshold || heightThreshold;
  }
  
  // Count images on page (copycats often scrape images)
  function getPageStats() {
    return {
      imageCount: document.querySelectorAll('img').length,
      linkCount: document.querySelectorAll('a').length,
      productImages: document.querySelectorAll('img[src*="cdn.shopify"]').length
    };
  }
  
  // Main tracking function
  async function track() {
    try {
      const FingerprintJS = await loadFingerprintJS();
      const fp = await FingerprintJS.load();
      const result = await fp.get({ extendedResult: true });
      
      // Prepare payload
      const payload = {
        storeId: storeId,
        visitorId: result.visitorId,
        requestId: result.requestId,
        page: getPageContext(),
        clientSignals: {
          devToolsOpen: detectDevTools(),
          pageStats: getPageStats(),
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          windowSize: `${window.innerWidth}x${window.innerHeight}`,
          colorDepth: window.screen.colorDepth,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          cookiesEnabled: navigator.cookieEnabled
        }
      };
      
      // Send to server
      await fetch(`${serverUrl}/api/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: true  // Ensures request completes even if user navigates away
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
  
  // Also track on page visibility change (catches tab switching)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      // User came back to the tab - they might be comparing to their copycat site
    }
  });
  
})();


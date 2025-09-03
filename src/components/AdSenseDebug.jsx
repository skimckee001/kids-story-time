import { useEffect, useState } from 'react';

function AdSenseDebug({ adClient, adSlot, adFormat = 'auto', style = {} }) {
  const [adStatus, setAdStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Debug logging
    console.log('AdSense Debug Info:', {
      adClient,
      adSlot,
      adFormat,
      adsbygoogleLoaded: typeof window !== 'undefined' && window.adsbygoogle,
      scriptLoaded: typeof window !== 'undefined' && document.querySelector('script[src*="pagead2.googlesyndication.com"]')
    });

    try {
      if (typeof window !== 'undefined') {
        // Check if AdSense script is loaded
        if (!window.adsbygoogle) {
          console.warn('AdSense: adsbygoogle not found - script may not be loaded yet');
          setAdStatus('script-not-loaded');
          setError('AdSense script not loaded');
          
          // Try to detect when script loads
          const checkInterval = setInterval(() => {
            if (window.adsbygoogle) {
              clearInterval(checkInterval);
              console.log('AdSense: Script now loaded, pushing ad');
              setAdStatus('loaded');
              try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
              } catch (pushError) {
                console.error('AdSense push error:', pushError);
                setError(pushError.message);
              }
            }
          }, 1000);

          // Clean up after 10 seconds
          setTimeout(() => clearInterval(checkInterval), 10000);
          
          return () => clearInterval(checkInterval);
        } else {
          // Script is loaded, push the ad
          console.log('AdSense: Pushing ad to adsbygoogle');
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdStatus('pushed');
        }
      }
    } catch (error) {
      console.error('AdSense error:', error);
      setError(error.message);
      setAdStatus('error');
    }
  }, []);

  // Show debug info in development
  const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  return (
    <div className="adsense-container" style={{ position: 'relative', ...style }}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          minHeight: '90px',
          ...style
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        data-ad-test={isDev ? "on" : undefined}
      />
      
      {/* Debug overlay */}
      {isDev && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid red',
          padding: '4px 8px',
          fontSize: '10px',
          color: 'red',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          Ad: {adStatus}
          {error && <div>Error: {error}</div>}
        </div>
      )}
      
      {/* Fallback content */}
      {adStatus === 'error' || adStatus === 'script-not-loaded' ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '90px',
          background: '#f5f5f5',
          border: '1px dashed #ddd',
          borderRadius: '8px',
          color: '#999',
          fontSize: '14px',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div>📚 Ads support our free stories</div>
            {isDev && <div style={{ fontSize: '12px', marginTop: '8px' }}>
              {error || 'AdSense not available'}
            </div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdSenseDebug;
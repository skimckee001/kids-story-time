import { useEffect } from 'react';

function AdSense({ adClient, adSlot, adFormat = 'auto', style = {} }) {
  useEffect(() => {
    try {
      // Push the ad to the adsbygoogle array
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: 'block',
        textAlign: 'center',
        ...style
      }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  );
}

export default AdSense;
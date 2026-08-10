import React, { useEffect } from 'react';
import { ADMOB_CONFIG, hideBanner } from '../utils/admob';

interface AdBannerProps {
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
  useEffect(() => {
    try {
      if (window.WebIntoApp?.AdMob?.showBanner) {
        window.WebIntoApp.AdMob.showBanner(ADMOB_CONFIG.bannerId);
      } else if (window.admob?.showBanner) {
        window.admob.showBanner({ adId: ADMOB_CONFIG.bannerId, position: 'BOTTOM_CENTER' });
      } else if (window.Capacitor?.Plugins?.AdMob?.showBanner) {
        window.Capacitor.Plugins.AdMob.showBanner({
          adId: ADMOB_CONFIG.bannerId,
          position: 'BOTTOM_CENTER',
        }).catch(() => {});
      } else if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        try {
          window.adsbygoogle.push({});
        } catch (err) {
          console.warn('adsbygoogle push warning:', err);
        }
      }
    } catch (e) {
      console.warn('AdBanner initialization notice:', e);
    }

    return () => {
      hideBanner();
    };
  }, []);

  return (
    <div
      className={`w-full max-w-md mx-auto flex items-center justify-center overflow-hidden min-h-[50px] bg-slate-900/60 border border-slate-800/80 rounded-xl p-1 text-center text-xs text-slate-500 z-10 pointer-events-auto ${className}`}
    >
      {/* AdMob Banner Unit Container */}
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '320px', height: '50px' }}
        data-ad-client="ca-app-pub-4647188052127146"
        data-ad-slot="7306973477"
      />
    </div>
  );
};

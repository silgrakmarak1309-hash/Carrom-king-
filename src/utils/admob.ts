// AdMob Configuration & Service Manager for Carrom Clash

export const ADMOB_CONFIG = {
  appId: 'ca-app-pub-4647188052127146~4344366810',
  bannerId: 'ca-app-pub-4647188052127146/7306973477',
  interstitialId: 'ca-app-pub-4647188052127146/8731469858',
};

declare global {
  interface Window {
    admob?: {
      initialize?: (appId: string) => void;
      showBanner?: (config: { adId: string; position?: string }) => void;
      hideBanner?: () => void;
      prepareInterstitial?: (config: { adId: string }) => void;
      showInterstitial?: () => void;
    };
    WebIntoApp?: {
      AdMob?: {
        init?: (appId: string) => void;
        showBanner?: (bannerId: string) => void;
        showInterstitial?: (interstitialId: string) => void;
      };
      showInterstitial?: () => void;
    };
    Capacitor?: {
      Plugins?: {
        AdMob?: {
          initialize?: (options: { initializeForTesting?: boolean }) => Promise<void>;
          showBanner?: (options: { adId: string; position?: string }) => Promise<void>;
          prepareInterstitial?: (options: { adId: string }) => Promise<void>;
          showInterstitial?: () => Promise<void>;
        };
      };
    };
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

let isInitialized = false;
let isInterstitialPrepared = false;

/**
 * Initialize AdMob SDK safely across mobile WebViews, WebIntoApp, Capacitor, or Browser.
 */
export const initAdMob = (): void => {
  if (isInitialized) return;
  try {
    // Check for native window admob bridge
    if (window.admob && typeof window.admob.initialize === 'function') {
      window.admob.initialize(ADMOB_CONFIG.appId);
      isInitialized = true;
    } else if (window.WebIntoApp?.AdMob?.init) {
      window.WebIntoApp.AdMob.init(ADMOB_CONFIG.appId);
      isInitialized = true;
    } else if (window.Capacitor?.Plugins?.AdMob?.initialize) {
      window.Capacitor.Plugins.AdMob.initialize({});
      isInitialized = true;
    } else {
      // Standard web environment ready state
      isInitialized = true;
    }
    preloadInterstitial();
  } catch (err) {
    console.warn('AdMob initialization warning:', err);
    isInitialized = true;
  }
};

/**
 * Safely hides active banner ad when leaving game view or switching screens.
 */
export const hideBanner = (): void => {
  try {
    if (window.admob?.hideBanner) {
      window.admob.hideBanner();
    } else if (window.Capacitor?.Plugins?.AdMob) {
      // Capacitor banner hide if applicable
    }
  } catch (e) {
    console.warn('AdMob hideBanner warning:', e);
  }
};

/**
 * Preloads interstitial ad for instant display when needed.
 */
export const preloadInterstitial = (): void => {
  try {
    if (window.admob?.prepareInterstitial) {
      window.admob.prepareInterstitial({ adId: ADMOB_CONFIG.interstitialId });
      isInterstitialPrepared = true;
    } else if (window.Capacitor?.Plugins?.AdMob?.prepareInterstitial) {
      window.Capacitor.Plugins.AdMob.prepareInterstitial({ adId: ADMOB_CONFIG.interstitialId }).catch(() => {});
      isInterstitialPrepared = true;
    }
  } catch (e) {
    console.warn('AdMob interstitial preload error:', e);
  }
};

/**
 * Displays an Interstitial Ad and calls `onComplete` after ad dismissal or on failure.
 */
export const showInterstitialAd = (onComplete?: () => void): void => {
  let callbackCalled = false;
  const finish = () => {
    if (!callbackCalled) {
      callbackCalled = true;
      if (onComplete) onComplete();
      // Re-preload for next time
      setTimeout(() => preloadInterstitial(), 2000);
    }
  };

  try {
    // Try WebIntoApp native bridge first
    if (window.WebIntoApp?.AdMob?.showInterstitial) {
      window.WebIntoApp.AdMob.showInterstitial(ADMOB_CONFIG.interstitialId);
      setTimeout(finish, 1000);
      return;
    }
    if (window.WebIntoApp?.showInterstitial) {
      window.WebIntoApp.showInterstitial();
      setTimeout(finish, 1000);
      return;
    }

    // Try standard AdMob JS plugin bridge
    if (window.admob?.showInterstitial && isInterstitialPrepared) {
      window.admob.showInterstitial();
      isInterstitialPrepared = false;
      setTimeout(finish, 1500);
      return;
    }

    // Try Capacitor AdMob plugin
    if (window.Capacitor?.Plugins?.AdMob?.showInterstitial) {
      window.Capacitor.Plugins.AdMob.showInterstitial()
        .then(() => setTimeout(finish, 1000))
        .catch(() => finish());
      return;
    }

    // If no native interstitial bridge is active, proceed smoothly without breaking flow
    finish();
  } catch (e) {
    console.warn('AdMob showInterstitial exception:', e);
    finish();
  }
};

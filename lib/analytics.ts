export function trackEvent(event: string, data?: Record<string, any>) {
  try {
    // Support generic analytics providers if available
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (w.analytics && typeof w.analytics.track === 'function') {
        w.analytics.track(event, data);
        return;
      }
      if (w.gtag) {
        w.gtag('event', event, data);
        return;
      }
    }
  } catch (err) {
    console.error('Analytics error', err);
  }
}

export function trackShare(movieId: string) {
  trackEvent('share_movie', { movieId });
}

/**
 * mappls.ts — stub retained so existing imports don't break at build time.
 * All map functionality has been migrated to Google Maps (@react-google-maps/api).
 * mapplsService methods are no-ops and waitForMappls resolves immediately.
 */

export const mapplsService = {
  initSearch(_inputId: string, _callback: (result: unknown) => void) {
    // no-op — replaced by Google Places Autocomplete
  },

  reverseGeocode(_lat: number, _lng: number): Promise<null> {
    return Promise.resolve(null);
  },

  getDistance(
    _startCoords: [number, number],
    _endCoords: [number, number]
  ): Promise<null> {
    return Promise.resolve(null);
  },
};

export const waitForMappls = (): Promise<void> => Promise.resolve();

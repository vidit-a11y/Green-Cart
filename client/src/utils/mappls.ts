export const mapplsService = {
  // 1. Autosuggest (Search)
  initSearch(inputId: string, callback: (result: any) => void) {
    if (!window.mappls) return;
    new window.mappls.search(document.getElementById(inputId), {
      callback: (data: any) => {
        if (data && data.length > 0) {
          callback(data[0]);
        }
      }
    });
  },

  // 2. Reverse Geocoding
  reverseGeocode(lat: number, lng: number): Promise<any> {
    return new Promise((resolve) => {
      if (!window.mappls) return resolve(null);

      window.mappls.reverseGeocode({ lat, lng }, (data: any) => {
        if (data && data.results && data.results.length > 0) {
          resolve(data.results[0]);
        } else {
          resolve(null);
        }
      });
    });
  },

  // 3. Distance Matrix
  getDistance(startCoords: [number, number], endCoords: [number, number]): Promise<any> {
    return new Promise((resolve) => {
      if (!window.mappls) return resolve(null);

      window.mappls.direction({
        start: { lat: startCoords[1], lng: startCoords[0] },
        end: { lat: endCoords[1], lng: endCoords[0] },
        profile: 'driving'
      }, (data: any) => {
        if (data && data.routes && data.routes.length > 0) {
          resolve({
            distance: data.routes[0].distance, // in meters
            duration: data.routes[0].duration  // in seconds
          });
        } else {
          resolve(null);
        }
      });
    });
  }
};

// Wait for Mappls SDK to be ready
export const waitForMappls = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.mappls) {
      resolve();
      return;
    }

    const check = setInterval(() => {
      if (window.mappls) {
        clearInterval(check);
        resolve();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(check);
      resolve();
    }, 10000);
  });
};


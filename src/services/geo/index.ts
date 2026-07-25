export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  mapsUrl: string;
}

export class GeoService {
  public static isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  public static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation API に対応していないブラウザです。'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          // Google Maps URL (緯度,経度)
          const mapsUrl = `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
          resolve({
            latitude,
            longitude,
            accuracy,
            mapsUrl
          });
        },
        (error) => {
          let message = '位置情報の取得に失敗しました。';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = '位置情報の利用許可が拒否されました。';
              break;
            case error.POSITION_UNAVAILABLE:
              message = '現在地を取得できませんでした。';
              break;
            case error.TIMEOUT:
              message = '位置情報の取得がタイムアウトしました。';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }
}

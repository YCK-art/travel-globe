declare module 'three-globe' {
  interface GeoJSONFeature {
    properties: {
      ADMIN?: string;
      name?: string;
      [key: string]: unknown;
    };
    geometry?: unknown;
    type?: string;
  }

  export default class Globe {
    globeImageUrl(url: string): this;
    bumpImageUrl(url: string): this;
    polygonsData(data: GeoJSONFeature[]): this;
    polygonCapColor(fn: (feat: GeoJSONFeature) => string): this;
    polygonSideColor(fn: (feat: GeoJSONFeature) => string): this;
    polygonStrokeColor(fn: (feat: GeoJSONFeature) => string): this;
    // 필요한 메서드만 추가
  }
} 
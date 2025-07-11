declare module 'three-globe' {
  export default class Globe {
    globeImageUrl(url: string): this;
    bumpImageUrl(url: string): this;
    polygonsData(data: any[]): this;
    polygonCapColor(fn: (feat: any) => string): this;
    polygonSideColor(fn: (feat: any) => string): this;
    polygonStrokeColor(fn: (feat: any) => string): this;
    // 필요한 메서드만 추가
  }
} 
"use client";
import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Globe from "three-globe";

interface Visited {
  country: string;
  start: string;
  end: string;
}

type Feature = {
  properties: {
    ADMIN?: string;
    name?: string;
    [key: string]: any;
  };
};

export default function GlobeComponent({ visited = [], fullScreen = false }: { visited?: Visited[], fullScreen?: boolean }) {
  function GlobeWithCountries({ visited }: { visited: Visited[] }) {
    const globeRef = useRef<object | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      let isMounted = true;
      let globeInstance: Globe;
      const load = async () => {
        try {
          globeInstance = new Globe();
          try {
            globeInstance.globeImageUrl("/earth-dark.jpg");
            globeInstance.bumpImageUrl("/earth-topology.png");
          } catch (imgErr) {
            console.error("[GlobeWithCountries] 텍스처 적용 오류:", imgErr, JSON.stringify(imgErr));
          }
          try {
            const res = await fetch("/countries-110m.geojson");
            if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`);
            const data = await res.json();
            if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
              throw new Error("GeoJSON 파일에 features 배열이 없거나 비어 있습니다.");
            }
            const visitedSet = new Set(
              visited.map(v => v.country.trim().toLowerCase())
            );
            globeInstance
              .polygonsData(data.features)
              .polygonCapColor((feat: Feature) => {
                const name = (feat.properties.ADMIN || feat.properties.name || "").toLowerCase();
                return visitedSet.has(name)
                  ? "rgba(255, 99, 132, 0.7)"
                  : "rgba(200,200,200,0.15)";
              })
              .polygonSideColor(() => "rgba(100,100,100,0.05)")
              .polygonStrokeColor(() => "#111");
          } catch (geoErr) {
            console.error("[GlobeWithCountries] GeoJSON 오류:", geoErr, JSON.stringify(geoErr));
          }
          if (isMounted) {
            globeRef.current = globeInstance;
            setReady(true);
          }
        } catch (err) {
          console.error("[GlobeWithCountries] three-globe import/초기화 오류:", err, JSON.stringify(err));
        }
      };
      load();
      return () => {
        isMounted = false;
      };
    }, [visited]);

    return ready && globeRef.current ? (
      <primitive object={globeRef.current as object} />
    ) : null;
  }

  return (
    <div className={fullScreen ? "w-full h-full" : "w-full h-[85vh] flex items-center justify-center"}>
      <Canvas
        camera={{ position: [0, 0, 220] }}
        style={fullScreen ? { width: "100vw", height: "100vh" } : { width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[100, 100, 100]} intensity={0.7} />
        <GlobeWithCountries visited={visited} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={false}
          enableDamping={true}
          dampingFactor={0.1}
          rotateSpeed={0.7}
          minDistance={120}
          maxDistance={800}
        />
      </Canvas>
    </div>
  );
} 
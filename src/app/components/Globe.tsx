"use client";
import React, { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Globe from "three-globe";
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface Visited {
  country: string;
  start: string;
  end: string;
}

interface City {
  name: string;
  lat: string;
  lng: string;
  country: string;
  admin1: string;
  admin2: string;
}

type Feature = {
  properties: {
    ADMIN?: string;
    name?: string;
    [key: string]: unknown;
  };
};

// 툴팁 컴포넌트
function Tooltip({ text, position }: { text: string; position: { x: number; y: number } | null }) {
  if (!position) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x + 10,
        top: position.y - 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        pointerEvents: 'none',
        zIndex: 1000,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      {text}
    </div>
  );
}

// 별 파티클 컴포넌트
function Stars({ count = 300 }) {
  const positions = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // 구 형태로 랜덤 배치 (지구본보다 멀리)
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 400 + Math.random() * 200; // 지구본 반지름보다 큼
      arr.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    return new Float32Array(arr);
  }, [count]);
  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial color="#fff" size={2} sizeAttenuation={true} depthWrite={false} transparent opacity={0.7} />
    </Points>
  );
}

// 도시 마커 컴포넌트
function CityMarkers({ cities }: { cities: City[] }) {
  const positions = React.useMemo(() => {
    const arr = [];
    for (const city of cities) {
      const lat = parseFloat(city.lat);
      const lng = parseFloat(city.lng);
      const radius = 100; // 지구본 반지름

      const phi = (90 - lat) * Math.PI / 180;
      const theta = lng * Math.PI / 180;

      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = -radius * Math.sin(phi) * Math.cos(theta);

      arr.push(x, y, z);
    }
    return new Float32Array(arr);
  }, [cities]);

  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial color={'#fff'} size={3} sizeAttenuation={true} depthWrite={false} transparent opacity={1} />
    </Points>
  );
}

// 위도, 경도를 three.js 3D 좌표로 변환
function latLonToVector3(lat: number, lon: number, radius = 220) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// 카메라 이동 컴포넌트
function CameraFocus({ lat, lon }: { lat: number, lon: number }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (typeof lat !== 'number' || typeof lon !== 'number') return;
    const target = latLonToVector3(lat, lon, 0); // 중심점
    const camPos = latLonToVector3(lat, lon, 220); // 카메라 위치
    camera.position.copy(camPos);
    camera.lookAt(target);
    // controls를 any로 캐스팅하여 타입 안전성 우회
    const orbit = controls as any;
    if (orbit && orbit.target && typeof orbit.update === 'function') {
      orbit.target.copy(target);
      orbit.update();
    }
  }, [lat, lon]);
  return null;
}

export default function GlobeComponent({ 
  visited = [], 
  cities = [],
  focus
}: { 
  visited?: Visited[], 
  cities?: City[],
  focus?: { lat: number, lon: number } | null
}) {
  const [tooltip, setTooltip] = useState<{ text: string; position: { x: number; y: number } } | null>(null);

  // SSR 환경에서는 아무것도 렌더하지 않음
  if (typeof window === "undefined") {
    return null;
  }

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
            globeInstance.globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg");
            globeInstance.bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png");
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
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(200,200,200,0.15)";
              })
              .polygonSideColor(() => "rgba(100,100,100,0.05)")
              .polygonStrokeColor((feat: Feature) => {
                const name = (feat.properties.ADMIN || feat.properties.name || "").toLowerCase();
                return visitedSet.has(name)
                  ? "rgba(255,180,80,0.9)"
                  : "#111";
              });
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

  // useThree를 활용해 camera와 scene을 받아옴
  function MouseTooltipHandler() {
    const { camera, scene } = useThree();
    useEffect(() => {
      const handleMouseMove = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(mouseX, mouseY);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          const intersect = intersects[0];
          const object = intersect.object;
          if (object.userData && object.userData.properties) {
            const properties = object.userData.properties;
            const countryName = properties.ADMIN || properties.name || "Unknown";
            const visitedSet = new Set(visited.map(v => v.country.trim().toLowerCase()));
            const isVisited = visitedSet.has(countryName.toLowerCase());
            if (isVisited) {
              setTooltip({
                text: `${countryName} (방문함)`,
                position: { x: event.clientX, y: event.clientY }
              });
              return;
            }
          }
        }
        setTooltip(null);
      };
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('mousemove', handleMouseMove);
        return () => canvas.removeEventListener('mousemove', handleMouseMove);
      }
    }, [camera, scene, visited]);
    return null;
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 220] }}
        gl={{ alpha: true }}
        style={{ width: "100vw", height: "100vh", background: "transparent" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[100, 100, 100]} intensity={0.7} />
        {/* 별 파티클 */}
        <Stars count={400} />
        <GlobeWithCountries visited={visited} />
        {/* 도시 마커 */}
        {Array.isArray(cities) && cities.length > 0 && <CityMarkers cities={cities} />}
        {focus && typeof focus.lat === 'number' && typeof focus.lon === 'number' && (
          <CameraFocus lat={focus.lat} lon={focus.lon} />
        )}
        <MouseTooltipHandler />
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
      {tooltip && <Tooltip text={tooltip.text} position={tooltip.position} />}
    </div>
  );
} 
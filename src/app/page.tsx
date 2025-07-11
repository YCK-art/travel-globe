"use client";

import dynamic from "next/dynamic";
import Toolbar from "./components/Toolbar";
import TravelAddBar from "./components/TravelAddBar";
import React from "react";

// Globe 컴포넌트를 동적 import로 변경 (SSR 비활성화)
const Globe = dynamic(() => import("./components/Globe"), { ssr: false });

type Feature = { properties: { ADMIN?: string; name?: string } };

export default function Home() {
  const [visited, setVisited] = React.useState<{country: string, start: string, end: string}[]>([]);
  const [countryList, setCountryList] = React.useState<string[]>([]);
  const [showToolbar, setShowToolbar] = React.useState(true);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    fetch("/countries-110m.geojson")
      .then(res => res.json())
      .then(data => {
        if (data.features && Array.isArray(data.features)) {
          const names = data.features.map((f: Feature) => f.properties.ADMIN || f.properties.name).filter(Boolean);
          setCountryList(Array.from(new Set(names)));
        }
      });
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) {
        setShowToolbar(true);
      } else if (currentY > lastScrollY.current) {
        setShowToolbar(false); // 아래로 내릴 때 숨김
      } else {
        setShowToolbar(true); // 위로 올릴 때 보임
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAdd = (country: string, start: string, end: string) => {
    setVisited(prev => [...prev, { country, start, end }]);
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* 지구본 전체 배경 */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <Globe visited={visited} fullScreen />
      </div>
      {/* Topbar 항상 고정 */}
      <Toolbar />
      {/* TravelAddBar: Topbar 아래에 fixed, showToolbar에 따라 슬라이드 업/다운 */}
      <div
        className={`fixed left-1/2 top-16 z-20 -translate-x-1/2 transition-transform duration-300 w-full max-w-5xl ${showToolbar ? "translate-y-0" : "-translate-y-24"}`}
        style={{ pointerEvents: showToolbar ? "auto" : "none" }}
      >
        <TravelAddBar onAdd={handleAdd} countryList={countryList} />
      </div>
    </div>
  );
}

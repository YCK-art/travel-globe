"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import Toolbar from "../components/Toolbar";
import SegmentControl from "../components/SegmentControl";

// Explore 대표 이미지는 public/explore-images 폴더에서만 불러옵니다.
const IMAGE_PATH = "/explore-images/";
const images = ["switzerland.jpg", "china.jpg"];

export default function ExplorePage() {
  const router = useRouter();
  const [current, setCurrent] = React.useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const goPrev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % images.length);

  return (
    <div className="min-h-screen bg-white">
      <Toolbar user={null} setUser={() => {}}>
        <div className="flex-1 flex justify-center">
          <SegmentControl
            value="destination"
            onChange={(val) => {
              if (val === "destination") {
                router.push("/explore");
              } else if (val === "ai") {
                router.push("/ai");
              } else {
                router.push("/");
              }
            }}
          />
        </div>
      </Toolbar>
      <main className="max-w-6xl mx-auto pt-28 px-4">
        <div className="relative w-[calc(100%-20px)] h-[370px] rounded-3xl overflow-hidden shadow-lg flex items-center justify-center bg-gray-200 mx-auto">
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-transparent hover:bg-transparent p-0 m-0"
            onClick={goPrev}
            aria-label="이전 이미지"
            type="button"
          >
            <MdChevronLeft size={40} color="#222" />
          </button>
          {images.length > 0 && (
            <img
              src={IMAGE_PATH + images[current]}
              alt="Travel Slide"
              className="w-full h-full object-cover object-center select-none"
              draggable={false}
            />
          )}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-transparent hover:bg-transparent p-0 m-0"
            onClick={goNext}
            aria-label="다음 이미지"
            type="button"
          >
            <MdChevronRight size={40} color="#222" />
          </button>
         {/* 하단 인디케이터 */}
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
           {images.map((_, idx) => (
             <span
               key={idx}
               onClick={() => setCurrent(idx)}
               className={`w-3 h-3 rounded-full transition-all cursor-pointer border border-white/60 ${current === idx ? "bg-[#222]" : "bg-black/30"}`}
               style={{ boxShadow: current === idx ? '0 0 0 2px #fff, 0 0 6px 2px #2222' : undefined }}
             />
           ))}
         </div>
        </div>
      </main>
    </div>
  );
} 
"use client";
import React, { useState, useEffect } from "react";
import { DateRange } from "react-date-range";
import { ko } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface City {
  name: string;
  lat: string;
  lng: string;
  country: string;
  admin1: string;
  admin2: string;
}

interface TravelAddBarProps {
  onAdd: (country: string, start: string, end: string, city?: string, lat?: number, lon?: number) => void;
  countryList: string[];
  cities?: City[];
  compact?: boolean;
  isLoggedIn: boolean;
  onLoginOpen: () => void;
}

export default function TravelAddBar({ onAdd, countryList, cities = [], compact = false, isLoggedIn, onLoginOpen }: TravelAddBarProps) {
  const [country, setCountry] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{city: string, lat: number, lon: number} | null>(null);
  const [focused, setFocused] = useState<'where' | null>('where');
  const countryInputRef = React.useRef<HTMLInputElement>(null);

  // 입력값과 일치하는 국가명만 필터링
  const filtered = country
    ? countryList
        .filter(countryName => 
          countryName.toLowerCase().includes(country.trim().toLowerCase())
        )
        .slice(0, 8)
        .map(countryName => ({
          display: countryName,
          value: countryName,
        }))
    : [];

  // 날짜 포맷 함수 (UTC 문제 방지)
  function formatDate(date: Date|null) {
    if (!date) return "";
    const y = date.getFullYear();
    const m = (date.getMonth()+1).toString().padStart(2,'0');
    const d = date.getDate().toString().padStart(2,'0');
    return `${y}-${m}-${d}`;
  }

  // 도시명 25자 초과시 ... 처리 함수
  function ellipsisCity(name: string) {
    return name.length > 25 ? name.slice(0, 25) + '...' : name;
  }

  // 출국일, 귀국일 관련 상태, ref, 함수 제거

  // bar 높이 및 padding/slim 스타일 조정
  const barHeight = compact ? 'h-12' : 'h-16';
  const sectionPad = compact ? 'py-1 px-3' : 'py-2 px-6';
  const sectionFont = compact ? 'text-[15px]' : 'text-base';

  return (
    <div className="w-full flex justify-center items-center">
      <div className={`relative bg-gray-100 rounded-full shadow-lg border-t border-gray-200 w-[400px] flex items-center gap-0 transition-all duration-300 ${barHeight} px-2 justify-center`}>
        {/* 여행지 입력 */}
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-xl mx-auto">
          <div className={`flex flex-col items-center justify-center w-full h-full ${sectionPad} ${sectionFont}`}> 
            {!compact && <span className="text-base font-semibold text-black mb-0.5" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Destination</span>}
            <input
              ref={countryInputRef}
              className="outline-none bg-transparent text-gray-700 placeholder:text-gray-400 w-full text-center text-sm"
              style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
              placeholder={loading ? "Loading..." : "Search by country"}
              value={ellipsisCity(country)}
              onChange={e => {
                setCountry(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => { setShowDropdown(true); setFocused('where'); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              autoComplete="off"
              disabled={loading}
              onKeyDown={e => {
                if (e.key === 'Enter' && filtered.length > 0) {
                  const item = filtered[0];
                  setCountry(item.value);
                  setShowDropdown(false);
                }
              }}
            />
            {showDropdown && filtered.length > 0 && !compact && (
              <ul className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[min(350px,100%)] bg-white border border-gray-200 rounded-2xl shadow-lg overflow-auto z-30 px-2 py-2">
                {filtered.slice(0, 6).map((item, index) => (
                  <li
                    key={index}
                    className={`px-4 py-2 hover:bg-pink-50 cursor-pointer text-gray-700 ${index !== filtered.slice(0, 6).length - 1 ? 'border-b border-gray-100' : ''}`}
                    onMouseDown={() => {
                      setCountry(item.value);
                      setShowDropdown(false);
                    }}
                  >
                    <div className="font-medium">{item.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Country</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* +버튼 */}
        <div className="flex items-center justify-center h-full ml-2">
          <button
            className={`rounded-full flex items-center justify-center text-white text-2xl shadow transition w-12 h-12 min-w-[3rem] min-h-[3rem] bg-gradient-to-r from-[#ff9800] via-[#ff7300] to-[#eb4605] hover:from-[#ffb74d] hover:via-[#ff9800] hover:to-[#ff7300]`}
            style={{fontSize: 24}}
            onClick={() => {
              if (!isLoggedIn) {
                onLoginOpen();
                return;
              }
              if (country) {
                const addData = {
                  country,
                  city: selectedCity?.city,
                  lat: selectedCity?.lat,
                  lon: selectedCity?.lon
                };
                console.log('여행지 추가:', addData);
                onAdd(country, "", "", selectedCity?.city, selectedCity?.lat, selectedCity?.lon);
              }
            }}
            aria-label="여행지 추가"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
} 
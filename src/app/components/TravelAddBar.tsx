"use client";
import React, { useState } from "react";
import { DateRange } from "react-date-range";
import { ko } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
// useTranslation 등 i18n 관련 코드 제거

interface TravelAddBarProps {
  onAdd: (country: string, start: string, end: string) => void;
  countryList: string[];
  compact?: boolean;
}

export default function TravelAddBar({ onAdd, countryList, compact = false }: TravelAddBarProps) {
  const [country, setCountry] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: null as Date | null,
      endDate: null as Date | null,
      key: "selection",
    },
  ]);
  // useTranslation 등 i18n 관련 코드 제거

  // 입력값과 일치하는 국가명 필터링
  const filtered = country
    ? countryList.filter(
        c => c.toLowerCase().includes(country.trim().toLowerCase())
      ).slice(0, 8)
    : [];

  const start = range[0].startDate ? range[0].startDate.toISOString().slice(0, 10) : "";
  const end = range[0].endDate ? range[0].endDate.toISOString().slice(0, 10) : "";

  return (
    <div className={`bg-white rounded-full shadow-lg ${compact ? "px-4 py-2 w-[400px] h-12" : "px-8 py-4 w-full max-w-5xl"} flex items-center gap-2 transition-all duration-300`}>
      {/* compact일 때 라벨 숨기고 input만 한줄로 */}
      <div className="flex-1 flex flex-col relative">
        {!compact && <span className="text-sm font-semibold text-black">여행지</span>}
        <input
          className="outline-none bg-transparent text-gray-700 text-base placeholder:text-gray-400"
          placeholder="국가명 입력"
          value={country}
          onChange={e => {
            setCountry(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          autoComplete="off"
          style={compact ? {height: 32, fontSize: 15} : {}}
        />
        {showDropdown && filtered.length > 0 && !compact && (
          <ul className="absolute top-14 left-0 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto z-50">
            {filtered.map((c, i) => (
              <li
                key={c}
                className="px-4 py-2 hover:bg-pink-50 cursor-pointer text-gray-700"
                onMouseDown={() => {
                  setCountry(c);
                  setShowDropdown(false);
                }}
              >
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
      {!compact && <div className="w-px h-8 bg-gray-200 mx-2" />}
      <div className="flex-1 flex flex-col relative">
        {!compact && <span className="text-sm font-semibold text-black">출국일</span>}
        <div className="flex items-center gap-2">
          <button
            className="outline-none bg-transparent text-gray-700 text-base placeholder:text-gray-400 text-left border-b border-gray-200 py-1"
            onClick={() => setShowCalendar(v => !v)}
            type="button"
            style={compact ? {height: 32, fontSize: 15, padding: 0, border: 0} : {}}
          >
            {start ? start : "출국일 선택"}
          </button>
          {start && !compact && (
            <button
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-lg ml-1"
              onClick={() => setRange([{ ...range[0], startDate: null }])}
              type="button"
              tabIndex={-1}
              aria-label="출국일 초기화"
            >
              ×
            </button>
          )}
        </div>
        {showCalendar && !compact && (
          <div className="absolute top-14 left-0 z-50">
            <DateRange
              editableDateInputs={true}
              onChange={(item: any) => setRange([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={range}
              locale={ko}
              months={2}
              direction="horizontal"
              showMonthAndYearPickers={false}
              rangeColors={["#ec4899"]}
              staticRanges={[]}
              inputRanges={[]}
            />
            <div className="flex justify-end mt-2">
              <button
                className="bg-pink-500 text-white px-4 py-2 rounded-lg shadow hover:bg-pink-600 transition"
                onClick={() => setShowCalendar(false)}
                type="button"
              >
                적용
              </button>
            </div>
          </div>
        )}
      </div>
      {!compact && <div className="w-px h-8 bg-gray-200 mx-2" />}
      <div className="flex-1 flex flex-col">
        {!compact && <span className="text-sm font-semibold text-black">귀국일</span>}
        <div className="flex items-center gap-2">
          <button
            className="outline-none bg-transparent text-gray-700 text-base placeholder:text-gray-400 text-left border-b border-gray-200 py-1"
            onClick={() => setShowCalendar(v => !v)}
            type="button"
            style={compact ? {height: 32, fontSize: 15, padding: 0, border: 0} : {}}
          >
            {end ? end : "귀국일 선택"}
          </button>
          {end && !compact && (
            <button
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-lg ml-1"
              onClick={() => setRange([{ ...range[0], endDate: null }])}
              type="button"
              tabIndex={-1}
              aria-label="귀국일 초기화"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <button
        className={`ml-4 rounded-full flex items-center justify-center text-white text-2xl shadow transition ${compact ? "w-8 h-8" : "w-12 h-12"}`}
        style={compact ? {fontSize: 20, marginLeft: 8, backgroundColor: '#F57C00'} : {backgroundColor: '#F57C00'}}
        onClick={() => {
          if (country && start && end) onAdd(country, start, end);
        }}
        aria-label="여행지 추가"
        onMouseOver={e => (e.currentTarget.style.backgroundColor = '#ff9800')}
        onMouseOut={e => (e.currentTarget.style.backgroundColor = '#F57C00')}
      >
        +
      </button>
    </div>
  );
} 
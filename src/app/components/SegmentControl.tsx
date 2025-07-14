import React from "react";
import { MdEditNote } from "react-icons/md"; // 기록(노트/기록 관련)
import { FaUmbrellaBeach } from "react-icons/fa"; // 갈 곳(여행지 분위기)
import { HiOutlineSparkles } from "react-icons/hi2"; // AI Search(마법/반짝임)

interface SegmentControlProps {
  value: "record" | "destination" | "ai";
  onChange: (value: "record" | "destination" | "ai") => void;
}

export default function SegmentControl({ value, onChange }: SegmentControlProps) {
  return (
    <div className="flex w-[420px] h-11 bg-[#f5f3f0] rounded-full shadow-sm p-1 gap-2">
      <button
        className={`flex items-center gap-2 flex-1 h-full rounded-full transition font-semibold text-base justify-center ${
          value === "record"
            ? "bg-white shadow text-[#222]" // 활성화: 흰배경, 그림자, 진한글씨
            : "bg-transparent text-[#222]/60" // 비활성화: 투명, 연한글씨
        }`}
        style={{
          fontFamily: 'SamsungSans-Regular, sans-serif',
          ...(value === "record" ? { boxShadow: "0 2px 8px 0 #f57c0033" } : {})
        }}
        onClick={() => onChange("record")}
        type="button"
      >
        <MdEditNote size={20} color={value === "record" ? "#F57C00" : "#BDBDBD"} />
        My Trips
      </button>
      <button
        className={`flex items-center gap-2 flex-1 h-full rounded-full transition font-semibold text-base justify-center ${
          value === "destination"
            ? "bg-white shadow text-[#222]"
            : "bg-transparent text-[#222]/60"
        }`}
        style={{
          fontFamily: 'SamsungSans-Regular, sans-serif',
          ...(value === "destination" ? { boxShadow: "0 2px 8px 0 #f57c0033" } : {})
        }}
        onClick={() => onChange("destination")}
        type="button"
      >
        <FaUmbrellaBeach size={18} color={value === "destination" ? "#F57C00" : "#BDBDBD"} />
        Explore
      </button>
      <button
        className={`flex items-center gap-2 flex-1 h-full rounded-full transition font-semibold text-base justify-center ${
          value === "ai"
            ? "bg-white shadow text-[#222]"
            : "bg-transparent text-[#222]/60"
        }`}
        style={{
          fontFamily: 'SamsungSans-Regular, sans-serif',
          ...(value === "ai" ? { boxShadow: "0 2px 8px 0 #f57c0033" } : {})
        }}
        onClick={() => onChange("ai")}
        type="button"
      >
        <HiOutlineSparkles size={20} color={value === "ai" ? "#F57C00" : "#BDBDBD"} />
        AI Search
      </button>
    </div>
  );
} 
import React, { ReactNode } from "react";
import { FiGlobe } from "react-icons/fi";
import LanguageModal from "./LanguageModal";

interface ToolbarProps {
  children?: ReactNode;
  compact?: boolean;
}

export default function Toolbar({ children, compact = false }: ToolbarProps) {
  const [langModalOpen, setLangModalOpen] = React.useState(false);
  return (
    <header className={`w-full h-16 flex items-center justify-between px-8 bg-white fixed top-0 left-0 z-[9999] transition-all duration-300 ${compact ? "shadow-md" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-pink-500">🌏</span>
        <span className="text-xl font-semibold tracking-tight">TravelGlobe</span>
      </div>
      {children}
      <nav className="flex items-center gap-8 text-gray-700 text-base font-medium">
        {/* 글로벌(지구본) 아이콘 - react-icons */}
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition focus:outline-none"
          aria-label="언어 설정"
          onClick={() => setLangModalOpen(true)}
          type="button"
        >
          <FiGlobe size={22} color="#222" />
        </button>
        {/* 내 여행지 */}
        <a href="#" className="hover:text-pink-500 transition px-2">내 여행지</a>
        {/* 로그인 */}
        <a href="#" className="hover:text-pink-500 transition px-2">로그인</a>
      </nav>
      <LanguageModal
        open={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        selectedLanguage={"ko"}
        setSelectedLanguage={() => setLangModalOpen(false)}
      />
    </header>
  );
}
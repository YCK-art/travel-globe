import React, { ReactNode } from "react";
import { FiGlobe } from "react-icons/fi";
import LanguageModal from "./LanguageModal";
import LoginModal, { getProfileInitial } from "./LoginModal";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

interface ToolbarProps {
  children?: ReactNode;
  compact?: boolean;
}

export default function Toolbar({ children, compact = false }: ToolbarProps) {
  const [langModalOpen, setLangModalOpen] = React.useState(false);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  // 메뉴 바깥 클릭 시 닫기
  React.useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.relative')) setShowProfileMenu(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showProfileMenu]);
  return (
    <header className={`w-full h-20 flex items-center justify-between px-8 bg-white fixed top-0 left-0 z-[9999] transition-all duration-300 ${compact ? "shadow-md" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="text-4xl font-bold tracking-tight font-alkia text-black ml-4">Globr</span>
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
        <a href="#" className="hover:text-[#F57C00] transition px-2">내 여행지</a>
        {/* 로그인 or 프로필 */}
        {user ? (
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-lg font-bold select-none focus:outline-none"
              onClick={() => setShowProfileMenu(v => !v)}
              type="button"
            >
              {getProfileInitial(user)}
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl py-3 z-50 flex flex-col animate-fadeIn">
                <button className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#e6f4ea] transition" type="button">기록</button>
                <button className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#e6f4ea] transition" type="button">가고싶은 곳</button>
                <button className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#e6f4ea] transition" type="button">프로필</button>
                <button className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#e6f4ea] transition" type="button">예약</button>
                <button
                  className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#e6f4ea] transition"
                  type="button"
                  onClick={async () => {
                    await signOut(auth);
                    setUser(null);
                    setShowProfileMenu(false);
                  }}
                >로그아웃</button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="hover:text-[#F57C00] transition px-2"
            onClick={() => setLoginModalOpen(true)}
            type="button"
          >
            로그인
          </button>
        )}
      </nav>
      <LanguageModal
        open={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        selectedLanguage={"ko"}
        setSelectedLanguage={() => setLangModalOpen(false)}
      />
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} onLogin={setUser} />
    </header>
  );
}
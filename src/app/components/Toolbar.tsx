"use client";

import React, { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FiGlobe } from "react-icons/fi";
import LanguageModal from "./LanguageModal";
import LoginModal, { getProfileInitial } from "./LoginModal";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

interface ToolbarProps {
  children?: ReactNode;
  compact?: boolean;
  user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; providerId: string } | null;
  setUser: (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; providerId: string } | null) => void;
}

export default function Toolbar({ children, compact = false, user, setUser }: ToolbarProps) {
  const router = useRouter();
  const [langModalOpen, setLangModalOpen] = React.useState(false);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
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
    <header className={`w-full h-20 flex items-center justify-between px-8 bg-[#FAFAFA] fixed top-0 left-0 z-[9999] transition-all duration-300 border-b border-gray-200 ${compact ? "shadow-md" : ""}`}>
      <div className="flex items-center gap-2">
        <span
          className="text-4xl font-bold tracking-tight font-alkia text-black ml-4 cursor-pointer select-none"
          onClick={() => router.push("/")}
        >
          Globr
        </span>
      </div>
      {children && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          {children}
        </div>
      )}
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
        <a
          href="#"
          className="hover:text-[#F57C00] transition px-2 hidden [@media(min-width:1200px)]:block"
          style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
        >
          My Places
        </a>
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
                <button className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#ffe0c2] transition" type="button" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>My Places</button>
                <button className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#ffe0c2] transition" type="button" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Record</button>
                <button className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#ffe0c2] transition" type="button" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Wishlist</button>
                <button className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#ffe0c2] transition" type="button" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Profile</button>
                <button className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#ffe0c2] transition" type="button" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Bookings</button>
                <button
                  className="text-[#173c2b] text-base text-left px-6 py-2 hover:bg-[#ffe0c2] transition"
                  type="button"
                  style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
                  onClick={async () => {
                    await signOut(auth);
                    setUser(null);
                    setShowProfileMenu(false);
                    router.push('/');
                  }}
                >Sign Out</button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="hover:text-[#F57C00] transition px-2"
            onClick={() => setLoginModalOpen(true)}
            type="button"
            style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
          >
            Sign In
          </button>
        )}
      </nav>
      <LanguageModal
        open={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        selectedLanguage={"en"}
        setSelectedLanguage={() => setLangModalOpen(false)}
      />
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} onLogin={setUser} />
    </header>
  );
}
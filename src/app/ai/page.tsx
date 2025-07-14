"use client";
import React, { useState } from "react";
import Toolbar from "../components/Toolbar";
import SegmentControl from "../components/SegmentControl";
import { useRouter } from "next/navigation";
import { FiPlus, FiMessageSquare, FiChevronLeft, FiChevronRight, FiArrowUp } from "react-icons/fi";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AISearchPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null; photoURL: string | null; providerId: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          providerId: firebaseUser.providerId,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 툴바 아이콘 목록 (플러스, 채팅만)
  const toolbarIcons = [
    { icon: <FiPlus size={22} />, label: "새 채팅", color: true },
    { icon: <FiMessageSquare size={22} />, label: "채팅기록" },
  ];
  // 최근 채팅 예시
  const recentChats = [
    { id: 3, title: "일본 벚꽃 여행" },
    { id: 4, title: "유럽 배낭여행" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#222] relative">
      {/* Topbar + 세그먼트컨트롤 */}
      <Toolbar user={user} setUser={setUser}>
        <div className="flex-1 flex justify-center">
          <SegmentControl
            value="ai"
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
      <div className="flex pt-20 relative">
        {/* 사이드바 오버레이 */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[9998]" onClick={() => setSidebarOpen(false)} />
        )}
        {/* Sidebar (오버레이, 고정) */}
        <aside
          className={`fixed top-20 left-0 z-[10000] h-[calc(100vh-5rem)] bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"} shadow-lg`}
          style={{ pointerEvents: sidebarOpen ? 'auto' : 'auto' }}
        >
          {/* 열기/닫기 버튼 (왼쪽 상단, 크기 22px) */}
          <button
            className="hover:bg-[#fff3e0] transition-colors ml-2 mt-4 mb-2 flex items-center justify-center"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            style={{ border: 'none', background: 'none', boxShadow: 'none', padding: 0, borderRadius: 0 }}
          >
            {sidebarOpen ? <FiChevronLeft size={22} color="#eb4605" /> : <FiChevronRight size={22} color="#eb4605" />}
          </button>
          {/* 아이콘/메뉴 */}
          <div className={`flex-1 flex flex-col items-center ${sidebarOpen ? "items-stretch" : "items-center"} gap-2 mt-2`}> 
            {toolbarIcons.map((item, idx) => (
              <button
                key={item.label}
                className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg transition hover:bg-orange-50 focus:outline-none ${sidebarOpen ? "justify-start pl-6" : "justify-center"} ${idx === 0 ? "bg-white" : "text-[#222]"}`}
                style={idx === 0 ? { fontWeight: 700 } : {}}
                tabIndex={0}
              >
                <span className={idx === 0 ? "text-[#eb4605]" : "text-[#eb4605] group-hover:text-[#eb4605]"}>
                  {React.cloneElement(item.icon, { color: '#eb4605' })}
                </span>
                {sidebarOpen && <span className={`text-base ${idx === 0 ? "text-[#222]" : "text-[#222]"}`}>{item.label}</span>}
              </button>
            ))}
            {/* 최근 항목 섹션 */}
            {sidebarOpen && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="text-xs text-gray-400 mb-2 pl-2">최근 항목</div>
                <ul className="flex flex-col gap-1">
                  {recentChats.map(chat => (
                    <li key={chat.id} className="px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded-lg cursor-pointer">{chat.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="p-4 text-xs text-gray-400 border-t border-gray-100 text-center">User Name</div>
        </aside>
        {/* 메인 영역 (항상 같은 크기) */}
        <main className="flex-1 flex flex-col items-center justify-center px-8 w-full min-h-[60vh]" style={{paddingTop: '60px', paddingBottom: '40px'}}>
          <h1 className="text-3xl font-bold mb-8 text-center text-[#222]" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Find your next travel destination</h1>
          {/* 채팅 입력창 */}
          <div className="w-full max-w-2xl flex flex-col items-center">
            <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
              {/* 채팅 내용 영역(추후 구현) */}
              <div className="flex-1 min-h-[120px] text-gray-400 flex items-center justify-center">Start a new conversation to get travel recommendations!</div>
              {/* 입력창 */}
              <div className="flex items-center gap-2 mt-4">
                <input
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-[#222] outline-none"
                  style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
                  placeholder="Ask anything about your next trip..."
                  disabled
                />
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#eb4605] hover:bg-[#ff9800] transition text-white" disabled>
                  <FiArrowUp size={20} color="#fff" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 
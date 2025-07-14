"use client";
import React, { useState, useRef, useEffect } from "react";
import Toolbar from "../components/Toolbar";
import SegmentControl from "../components/SegmentControl";
import { useRouter } from "next/navigation";
import { FiPlus, FiMessageSquare, FiChevronLeft, FiChevronRight, FiArrowUp, FiSun, FiDollarSign, FiAnchor } from "react-icons/fi";
import { FiMapPin } from "react-icons/fi";
import { GiPolarStar } from "react-icons/gi";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import ReactMarkdown from 'react-markdown';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

export default function AISearchPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null; photoURL: string | null; providerId: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [mainView, setMainView] = useState<'ai' | 'chatHistory'>('ai');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  interface ChatSummary {
    id: string;
    title: string;
    updatedAt?: any;
    createdAt?: any;
    messages?: { role: string; content: string; timestamp: number }[];
  }
  const [recentChats, setRecentChats] = useState<ChatSummary[]>([]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Firestore에서 유저별 채팅 세션 불러오기
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/chats`), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          updatedAt: data.updatedAt,
          createdAt: data.createdAt,
          messages: data.messages || [],
        } as ChatSummary;
      });
      setRecentChats(chats);
    });
    return () => unsubscribe();
  }, [user]);

  // New Chat 클릭 시 새로운 세션 생성
  const handleNewChat = async () => {
    if (!user) return;
    const newChatId = uuidv4();
    const chatRef = doc(db, `users/${user.uid}/chats/${newChatId}`);
    await setDoc(chatRef, {
      title: '',
      messages: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setChatId(newChatId);
    setMessages([]);
    setInput('');
    setMainView('ai');
  };

  // 질문 입력 시 Firestore에 저장
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    let currentChatId = chatId;
    // 세션이 없으면 새로 생성
    if (!currentChatId) {
      currentChatId = uuidv4();
      const chatRef = doc(db, `users/${user.uid}/chats/${currentChatId}`);
      await setDoc(chatRef, {
        title: input,
        messages: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setChatId(currentChatId);
    }
    const chatRef = doc(db, `users/${user.uid}/chats/${currentChatId}`);
    // Firestore에 메시지 추가
    const chatSnap = await getDoc(chatRef);
    const prevMessages = chatSnap.exists() ? chatSnap.data().messages || [] : [];
    const newMessages = [...prevMessages, { role: 'user', content: input, timestamp: Date.now() }];
    await updateDoc(chatRef, {
      messages: newMessages,
      title: prevMessages.length === 0 ? input : (chatSnap.data()?.title || ''),
      updatedAt: serverTimestamp(),
    });
    setMessages(msgs => [...msgs, { role: 'user', content: input }]);
    setLoading(true);
    setInput('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      // Firestore에 assistant 답변 추가
      const chatSnap2 = await getDoc(chatRef);
      const prevMessages2 = chatSnap2.exists() ? chatSnap2.data().messages || [] : [];
      const newMessages2 = [...prevMessages2, { role: 'assistant', content: data.result, timestamp: Date.now() }];
      await updateDoc(chatRef, {
        messages: newMessages2,
        updatedAt: serverTimestamp(),
      });
      setMessages(msgs => [...msgs, { role: 'assistant', content: data.result }]);
    } catch {
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Sorry, there was an error.' }]);
    }
    setLoading(false);
  };

  // 채팅 세션 불러오기 (recent chat 클릭/히스토리 클릭)
  const handleSelectChat = async (id: string) => {
    if (!user) return;
    const chatRef = doc(db, `users/${user.uid}/chats/${id}`);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      setChatId(id);
      setMessages(chatSnap.data().messages || []);
      setMainView('ai');
    }
  };

  // 예시 질문들 (아이콘 포함)
  const exampleQuestions = [
    {
      icon: <FiSun size={18} color="#eb4605" />, 
      text: "Where are the best travel destinations with good weather right now?"
    },
    {
      icon: <FiDollarSign size={18} color="#eb4605" />,
      text: "What are some travel destinations I can visit with a budget of $500?"
    },
    {
      icon: <FiAnchor size={18} color="#eb4605" />,
      text: "Can you recommend beautiful beach resorts?"
    },
    {
      icon: <GiPolarStar size={18} color="#eb4605" />,
      text: "Where can I see the Northern Lights?"
    },
    {
      icon: <FiMapPin size={18} color="#eb4605" />,
      text: "Can you recommend good pasta restaurants in Naples?"
    },
  ];

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
    { icon: <FiPlus size={22} />, label: "New Chat", color: true, onClick: handleNewChat },
    { icon: <FiMessageSquare size={22} />, label: "Chat History", onClick: () => { setMainView('chatHistory'); setSidebarOpen(false); } },
  ];
  // 최근 채팅 예시
  // const recentChats = [
  //   { id: 3, title: "일본 벚꽃 여행", icon: <FiMapPin size={16} color="#eb4605" /> },
  //   { id: 4, title: "유럽 배낭여행", icon: <FiGlobe size={16} color="#eb4605" /> },
  // ];

  const markdownComponents = {
    h1: (props: any) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />, 
    h2: (props: any) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />, 
    h3: (props: any) => <h3 className="text-lg font-bold mt-3 mb-1" {...props} />, 
    strong: (props: any) => <strong className="font-bold text-black" {...props} />, 
    ul: (props: any) => <ul className="list-disc pl-6 my-2" {...props} />, 
    ol: (props: any) => <ol className="list-decimal pl-6 my-2" {...props} />, 
    li: (props: any) => <li className="mb-1" {...props} />, 
    hr: (props: any) => <hr className="my-4 border-t border-gray-300" {...props} />, 
    p: (props: any) => <p className="my-2 leading-relaxed" {...props} />, 
    blockquote: (props: any) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2" {...props} />, 
  };

  return (
    <div className="h-screen flex flex-col bg-white text-[#222] overflow-hidden min-h-0">
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
      <div className="flex flex-1 min-h-0 pt-20 relative w-full">
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
            className={`hover:bg-[#fff3e0] transition-colors mt-4 mb-2 flex items-center ${sidebarOpen ? "ml-2 justify-start" : "justify-center"}`}
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
                onClick={item.onClick}
              >
                <span className={idx === 0 ? "text-[#eb4605]" : "text-[#eb4605] group-hover:text-[#eb4605]"}>
                  {React.cloneElement(item.icon, { color: '#eb4605' })}
                </span>
                {sidebarOpen && <span className={`text-base ${idx === 0 ? "text-[#222]" : "text-[#222]"}`} style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>{item.label}</span>}
              </button>
            ))}
            {/* 최근 항목 섹션 */}
            {sidebarOpen && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="text-xs text-gray-400 mb-2 pl-2" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Recent Chats</div>
                <ul className="flex flex-col gap-1">
                  {recentChats.map(chat => (
                    <li key={chat.id} className="px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded-lg cursor-pointer flex items-center gap-2" onClick={() => handleSelectChat(chat.id)}>
                        <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>{chat.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </aside>
        {/* 메인 영역 (항상 같은 크기) */}
        <main className="flex-1 flex flex-col items-center px-2 sm:px-8 w-full min-h-0 relative">
          {mainView === 'ai' ? (
            <div className="w-full max-w-[692px] mx-auto flex-1 flex flex-col relative min-h-0" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
              {/* 채팅 메시지 영역 */}
              <div className="flex-1 flex flex-col overflow-y-auto pr-0 custom-scrollbar pt-2 gap-5 min-h-0 pb-32" style={{scrollbarGutter: 'stable'}}>
                {messages.length === 0 ? (
                  <h1 className="text-3xl font-bold text-center text-[#222] mt-24" style={{fontFamily: 'SamsungSans-Regular, sans-serif', marginBottom: '80px'}}>
                    {user?.displayName ? `Hey there, ${user.displayName}!` : 'Hey there, traveler!'}
                  </h1>
                ) : null}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`w-full flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}> 
                    <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm ${msg.role === 'user' ? 'bg-[#eb4605] text-white ml-8' : 'bg-gray-50 text-[#222] mr-8 border border-gray-200'}`} style={{fontFamily: 'SamsungSans-Regular, sans-serif', fontWeight: msg.role === 'user' ? 700 : 400}}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="w-full flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-5 py-4 shadow-sm bg-gray-50 text-black border border-gray-200 animate-pulse" style={{fontFamily: 'SamsungSans-Regular, sans-serif', fontWeight: 'bold'}}>
                      ...
                    </div>
                  </div>
                )}
                {/* 예시 질문 (맨 아래에만, 메시지 없을 때) */}
                {messages.length === 0 && (
                  <div className="flex-1 min-h-[120px] flex flex-col gap-3 items-center justify-center mt-4">
                    <div className="text-sm text-gray-500 mb-2 text-center" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Try asking:</div>
                    {exampleQuestions.map((q, index) => (
                      <button
                        key={index}
                        className={`p-3 rounded-lg text-left text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2 ${
                          selectedQuestion === index 
                            ? 'bg-orange-100 border-2 border-orange-300 shadow-lg animate-pulse' 
                            : 'bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200'
                        }`}
                        onClick={() => {
                          setSelectedQuestion(index);
                          setInput(q.text);
                          inputRef.current?.focus();
                          setTimeout(() => setSelectedQuestion(null), 3000);
                        }}
                      >
                        {q.icon}
                        <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>{q.text}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {/* Claude 스타일 입력창 (하단 고정) */}
              <form
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[692px] px-2 sm:px-0 z-20"
                style={{background: 'rgba(255,255,255,0.98)', bottom: '30px'}}
                onSubmit={handleSend}
              >
                <div className="flex items-center bg-white rounded-2xl shadow-lg px-2 py-2 border border-gray-200 focus-within:border-orange-500 transition w-full">
                  {/* 입력창 */}
                  <input
                    ref={inputRef}
                    className="flex-1 bg-transparent px-3 py-2 outline-none text-base"
                    style={{ fontFamily: 'SamsungSans-Regular, sans-serif' }}
                    placeholder="Ask anything about your next trip..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                  />
                  {/* 전송 버튼 */}
                  <button type="submit" className="ml-2 w-10 h-10 flex items-center justify-center rounded-full bg-[#eb4605] hover:bg-[#ff9800] transition text-white" aria-label="전송" disabled={loading || !input.trim()}>
                    <FiArrowUp size={20} color="#fff" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Chat History View (기존 그대로)
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center pt-5" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
              <h2 className="text-2xl font-bold mb-6 w-full text-left" style={{color: '#222'}}>Your chat history</h2>
              <div className="w-full mb-4">
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#222] outline-none focus:border-[#eb4605] focus:ring-1 focus:ring-[#eb4605]"
                  style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
                  placeholder="Search your chats..."
                />
              </div>
              <div className="w-full flex flex-col gap-4">
                  {recentChats.map((chat) => (
                   <div key={chat.id} className="w-full bg-white border border-gray-200 rounded-xl p-5 flex flex-col shadow-sm hover:shadow-md transition cursor-pointer" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}} onClick={() => handleSelectChat(chat.id)}>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="font-bold text-base text-[#222]" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>{chat.title}</span>
                     </div>
                     <span className="text-xs text-gray-400" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Last message just now</span>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 
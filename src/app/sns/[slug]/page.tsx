"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Toolbar from "../../components/Toolbar";

import { storage } from "../../../lib/firebase";
import { ref, deleteObject } from "firebase/storage";
import { ReactSortable } from 'react-sortablejs';
import html2canvas from 'html2canvas';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import * as d3 from 'd3-geo';
import { Dialog } from '@headlessui/react';
import Image from 'next/image';

// 모달 컴포넌트 추가
function InstaStoryModal({ open, onClose, country, travelDay, travelType }: { open: boolean, onClose: () => void, country: string, travelDay: string|number, travelType: string }) {
  const [japanPath, setJapanPath] = useState<string | null>(null);
  const modalContentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchJapan() {
      const res = await fetch('/countries-110m.geojson');
      const geo = await res.json();
      const japan = geo.features.find((f: { properties: { name: string } }) => f.properties.name === 'Japan');
      if (!japan) return;
      const projection = d3.geoMercator().fitSize([120, 220], japan);
      const pathGen = d3.geoPath(projection);
      setJapanPath(pathGen(japan));
    }
    if (open) fetchJapan();
  }, [open]);

  const handleSave = async () => {
    if (!modalContentRef.current) return;
    const canvas = await html2canvas(modalContentRef.current, {
      backgroundColor: null,
      useCORS: true,
      scale: 2,
    });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'insta-story.png';
    link.click();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-black/40 backdrop-blur-sm" style={{background:'rgba(0,0,0,0.4)'}}>
      {/* Toolbar 그대로 노출 */}
      <div className="w-full max-w-[430px] mx-auto relative">
        <Toolbar user={null} setUser={() => {}} />
        {/* 다운로드 버튼: 임시로 빨간색/노란색 강조, z-9999, 크게 */}
        <button
          onClick={handleSave}
          className="absolute top-20 right-6 bg-red-600 border-4 border-yellow-300 hover:bg-black/90 rounded-full p-3 z-[9999]"
          title="저장"
          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.18)'}}
        >
          <svg width="32" height="32" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </div>
      {/* 메인 컨텐츠 */}
      <div ref={modalContentRef} className="flex flex-col items-center justify-center w-full max-w-[430px] mx-auto flex-1 bg-transparent" style={{height:'calc(100vh - 56px)'}}>
        {/* 일본 실루엣 SVG */}
        <div className="my-8">
          <svg width="120" height="220" viewBox="0 0 120 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            {japanPath && <path d={japanPath} stroke="white" strokeWidth="3" fill="white" />}
          </svg>
        </div>
        {/* 정보 텍스트 */}
        <div className="flex flex-row gap-8 justify-center w-full px-4 text-white font-bold text-lg mb-2" style={{textShadow:'0 2px 8px rgba(0,0,0,0.25)', fontFamily: 'OVSoge-Medium, sans-serif'}}>
          <div className="flex flex-col items-center min-w-[90px]">
            <span className="text-base font-semibold">Country</span>
            <span className="text-xl mt-1">{country}</span>
          </div>
          <div className="flex flex-col items-center min-w-[90px]">
            <span className="text-base font-semibold">Travel Day</span>
            <span className="text-xl mt-1">{travelDay}</span>
          </div>
          <div className="flex flex-col items-center min-w-[90px]">
            <span className="text-base font-semibold">Travel Type</span>
            <span className="text-xl mt-1">{travelType}</span>
          </div>
        </div>
      </div>
      {/* 닫기 버튼은 modalContentRef 바깥에 렌더링 (스크린샷에 포함되지 않음) */}
      <button className="mt-8 text-white bg-black/60 px-6 py-2 rounded-full" style={{fontFamily: 'OVSoge-Medium, sans-serif'}} onClick={onClose}>닫기</button>
    </div>
  );
}

export default function TravelDetailPage() {
  // Toolbar용 user, setUser 상태 (임시)
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null; photoURL: string | null; providerId: string } | null>(null);

  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [city, country] = slug && slug.includes("_") ? slug.split("_") : [null, slug];
  const title = city && country
    ? `${city.charAt(0).toUpperCase() + city.slice(1)}, ${country.charAt(0).toUpperCase() + country.slice(1)}`
    : country
      ? country.charAt(0).toUpperCase() + country.slice(1)
      : "";
  const imageUrl = city && country
    ? `/travel-images/${city}_${country}.jpg`
    : country
      ? `/travel-images/${country}.jpg`
      : "/travel-images/default.jpg";

  // 실제 피드 이미지 상태
  // feedImages를 객체 배열로 관리 (ReactSortable 요구)
  const [feedImages, setFeedImages] = useState<{ id: string, url: string }[]>([]);
  // 여행기간과 인원 상태 추가
  const [travelDays, setTravelDays] = useState<string | number>("-");
  const [travelPeople, setTravelPeople] = useState<string | number>("-");

  // 드롭다운 메뉴 상태
  const [showDropdown, setShowDropdown] = useState(false);

  // 스크린샷 기능
  const phoneRef = React.useRef<HTMLDivElement>(null);

  // 모달 상태
  const [showInstaStory, setShowInstaStory] = useState(false);
  // 모달 상태 (상세 이미지 뷰)
  const [modalOpen, setModalOpen] = useState(false);

  // 여행 감정 태그 상태 추가
  const [emotionTag, setEmotionTag] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  // Firebase에서 여행 데이터 불러오기
  const loadTravelData = async () => {
    if (!user || !user.uid || !slug) return;
    
    try {
      const travelDoc = doc(db, `users/${user.uid}/travels/${slug}`);
      const travelSnap = await getDoc(travelDoc);
      
      if (travelSnap.exists()) {
        const data = travelSnap.data();
        if (data.travelDays) setTravelDays(data.travelDays);
        if (data.travelPeople) setTravelPeople(data.travelPeople);
        if (data.emotionTag) setEmotionTag(data.emotionTag); // 감정 태그 불러오기
      }
    } catch {
      console.error('여행 데이터 불러오기 오류');
    }
  };



  // 감정 태그 저장 함수
  const saveEmotionTag = async () => {
    if (!user || !user.uid || !slug) return;
    setSavingTag(true);
    try {
      const travelDoc = doc(db, `users/${user.uid}/travels/${slug}`);
      await setDoc(travelDoc, { emotionTag }, { merge: true });
    } catch {
      alert('감정 태그 저장 중 오류가 발생했습니다.');
    }
    setSavingTag(false);
  };

  useEffect(() => {
    loadTravelData();
  }, [user, slug]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // 이미지 삭제 핸들러
  const handleDeleteImage = async (imgUrl: string) => {
    if (!user || !user.uid || !slug) return;
    try {
      // Storage 참조 경로 추출
      const pathMatch = imgUrl.match(/\/users%2F(.+?)\?alt/);
      let storagePath = '';
      if (pathMatch) {
        // gs:// 경로로 변환
        storagePath = decodeURIComponent(imgUrl.split('/o/')[1].split('?')[0]);
      } else {
        // fallback: 파일명만 추출
        storagePath = `users/${user.uid}/travels/${slug}/images/` + imgUrl.split('%2F').pop()?.split('?')[0];
      }
      const imgRef = ref(storage, storagePath);
      await deleteObject(imgRef);
      setFeedImages(prev => prev.filter(img => img.url !== imgUrl));
    } catch (err) {
      alert('이미지 삭제 중 오류가 발생했습니다: ' + (err as Error)?.message);
    }
  };

  // 드래그&드롭 정렬 핸들러
  // react-sortablejs는 setList로 자동 정렬됨 (별도 핸들러 불필요)

  // 상세 이미지 모달 오픈
  const openImageModal = () => {
    setModalOpen(true);
  };

  // 상세 이미지 모달 닫기
  const closeImageModal = () => setModalOpen(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Toolbar */}
      <Toolbar user={user} setUser={setUser} />
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div ref={phoneRef} className="relative w-full max-w-[560px] min-h-[80vh] mx-auto flex flex-col bg-black rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* 상단 정보 패널 (Airbnb 감성) */}
          <div className="w-full px-8 pt-10 pb-6 bg-gray-900/80 flex flex-col items-center rounded-b-3xl shadow-md" style={{boxShadow:'0 4px 24px 0 rgba(0,0,0,0.3)'}}>
            <div className="flex items-center gap-4 mb-2">
              <Image src={imageUrl} alt={title} width={64} height={64} className="rounded-2xl object-cover border-2 border-gray-600 shadow" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-white" style={{letterSpacing:'-1px'}}>{title}</span>
                <div className="flex gap-2 mt-1">
                  <span className="bg-orange-900 text-orange-200 rounded-full px-3 py-1 text-xs font-semibold">{travelDays === '-' ? '-' : `${travelDays}일`}</span>
                  <span className="bg-blue-900 text-blue-200 rounded-full px-3 py-1 text-xs font-semibold">{travelPeople === '-' ? '-' : `${travelPeople}명`}</span>
                  <span className="bg-gray-700 text-gray-300 rounded-full px-3 py-1 text-xs font-semibold">#여행</span>
                </div>
              </div>
            </div>
            <div className="text-gray-400 text-sm mt-1">Don&apos;t just see a place. Experience it.</div>
            {/* 여행 감정 태그 입력란 */}
            <div className="w-full flex flex-row items-center gap-2 mt-4">
              <input
                className="flex-1 rounded-lg px-3 py-2 text-base text-gray-900 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="여행 감정 태그를 입력하세요 (예: #힐링 #설렘)"
                value={emotionTag}
                onChange={e => setEmotionTag(e.target.value)}
                maxLength={30}
              />
              <button
                className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition disabled:opacity-60"
                onClick={saveEmotionTag}
                disabled={savingTag || !emotionTag}
              >
                {savingTag ? '저장중...' : '저장'}
              </button>
            </div>
            {/* 저장된 감정 태그 미리보기 */}
            {emotionTag && (
              <div className="mt-2 text-orange-200 text-base font-semibold">{emotionTag}</div>
            )}
          </div>

          {/* 감성 버튼 (공감/추억저장/인스타스토리) */}
          <div className="flex gap-3 justify-center items-center py-4 bg-gray-900/90 border-b border-gray-700">
            <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-pink-900 hover:bg-pink-800 text-pink-200 font-semibold shadow-sm transition">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 4 13 5.09C13.5 4 14.96 3 16.5 3C19.5 3 22 5.5 22 8.5C22 13.5 12 21 12 21Z"/></svg>
              공감하기
            </button>
            <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-900 hover:bg-yellow-800 text-yellow-200 font-semibold shadow-sm transition">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              추억 저장
            </button>
            <button 
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-800 border border-gray-600 hover:bg-gray-700 text-gray-200 font-semibold shadow-sm transition"
              onClick={() => setShowInstaStory(true)}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
              인스타스토리
            </button>
          </div>

          {/* 사진 그리드 (Instagram 감성) */}
          <div className="w-full flex-1 overflow-y-auto px-4 py-6" style={{minHeight:'400px', maxHeight:'calc(100vh - 220px)'}}>
            <ReactSortable
              tag="div"
              className="grid grid-cols-3 gap-4"
              list={feedImages}
              setList={setFeedImages}
            >
                             {feedImages.map((img) => (
                 <div key={img.id} className="relative w-full aspect-[4/5] overflow-hidden rounded-xl bg-gray-800 group shadow hover:shadow-lg transition cursor-pointer" onClick={openImageModal}>
                   <Image src={img.url} alt={title} width={200} height={250} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  {/* 오버레이/메모/삭제 */}
                  <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    onClick={e => { e.stopPropagation(); handleDeleteImage(img.url); }}
                    style={{ zIndex: 10 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </ReactSortable>
          </div>

        </div>

        {/* 상세 이미지 모달 (Instagram 스타일) */}
        <Dialog open={modalOpen} onClose={closeImageModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <Dialog.Panel className="bg-gray-900 rounded-2xl shadow-2xl p-0 max-w-[90vw] max-h-[90vh] flex flex-col items-center">
            <div className="relative w-[320px] h-[400px] flex items-center justify-center">
              {feedImages[0] && (
                <Image src={feedImages[0].url} alt={title} width={320} height={400} className="w-full h-full object-contain rounded-xl" />
              )}
              {/* 좌우 넘기기 버튼 완전히 제거 */}
              <button
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center"
                onClick={closeImageModal}
              >
                ×
              </button>
            </div>
          </Dialog.Panel>
        </Dialog>

      </div>
      {/* 인스타스토리 모달 */}
      <InstaStoryModal 
        open={showInstaStory} 
        onClose={() => setShowInstaStory(false)} 
        country={title || 'Japan'} 
        travelDay={travelDays || '12일'} 
        travelType={'Solo'} 
      />
    </div>
  );
} 
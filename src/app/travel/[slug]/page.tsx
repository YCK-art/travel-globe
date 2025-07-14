"use client";
import React, { useState, useEffect } from "react";
import Toolbar from "../../components/Toolbar";
import Image from "next/image";
import Link from "next/link";
import { FaRegHeart, FaHeart, FaLeaf, FaRegSmile, FaSpa, FaRegClock, FaRegSmileBeam, FaFeatherAlt, FaCloud, FaUserSecret, FaUserFriends, FaRing, FaUsers, FaUser, FaUserTie, FaChild, FaStar, FaHiking, FaUtensils, FaPlaneDeparture, FaBiking, FaTree, FaLandmark, FaCamera, FaWalking, FaCheck, FaPen, FaPlus, FaTimes, FaCalendarAlt, FaSearch } from "react-icons/fa";
import { auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import SegmentControl from "../../components/SegmentControl";
import { db, storage } from "../../../lib/firebase";
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';





// 영어 위키백과용 매핑 추가
const slugToEn: Record<string, string> = {
  south_korea: "South Korea",
  north_korea: "North Korea",
  united_states: "United States",
  united_kingdom: "United Kingdom",
  new_zealand: "New Zealand",
  // 필요시 추가
};

// 감정 태그 데이터 및 아이콘 매핑
const EMOTION_TAGS = [
  {
    category: "Mood & Feeling",
    icon: <FaLeaf className="inline mr-1" />,
    tags: [
      { key: "Sensitive", icon: <FaRegSmile className="inline mr-1" /> },
      { key: "Exciting", icon: <FaRegHeart className="inline mr-1" /> },
      { key: "Romantic", icon: <FaSpa className="inline mr-1" /> },
      { key: "Healing", icon: <FaRegClock className="inline mr-1" /> },
      { key: "Relaxed", icon: <FaRegSmileBeam className="inline mr-1" /> },
      { key: "Peaceful", icon: <FaFeatherAlt className="inline mr-1" /> },
      { key: "Free", icon: <FaCloud className="inline mr-1" /> },
      { key: "Dreamy", icon: <FaHeart className="inline mr-1" /> },
      { key: "Mysterious", icon: <FaUserSecret className="inline mr-1" /> },
    ]
  },
  {
    category: "People & Relationship",
    icon: <FaUserFriends className="inline mr-1" />,
    tags: [
      { key: "Friendship", icon: <FaUserFriends className="inline mr-1" /> },
      { key: "Honeymoon", icon: <FaRing className="inline mr-1" /> },
      { key: "Family", icon: <FaUsers className="inline mr-1" /> },
      { key: "Solo", icon: <FaUser className="inline mr-1" /> },
      { key: "Couple", icon: <FaHeart className="inline mr-1" /> },
      { key: "Friends", icon: <FaUserFriends className="inline mr-1" /> },
      { key: "Parents", icon: <FaUserTie className="inline mr-1" /> },
      { key: "With Kids", icon: <FaChild className="inline mr-1" /> },
    ]
  },
  {
    category: "Theme & Experience",
    icon: <FaStar className="inline mr-1" />,
    tags: [
      { key: "Memory", icon: <FaRegClock className="inline mr-1" /> },
      { key: "Best Moment", icon: <FaStar className="inline mr-1" /> },
      { key: "Adventure", icon: <FaHiking className="inline mr-1" /> },
      { key: "Food", icon: <FaUtensils className="inline mr-1" /> },
      { key: "Escape", icon: <FaPlaneDeparture className="inline mr-1" /> },
      { key: "Active", icon: <FaBiking className="inline mr-1" /> },
      { key: "Nature", icon: <FaTree className="inline mr-1" /> },
      { key: "Culture", icon: <FaLandmark className="inline mr-1" /> },
      { key: "Photo Spot", icon: <FaCamera className="inline mr-1" /> },
      { key: "Walking", icon: <FaWalking className="inline mr-1" /> },
    ]
  }
];

// SortableItem 컴포넌트 정의
function SortablePhoto({ id, url, onDelete }: { id: string, url: string, onDelete: (url: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative w-full aspect-square overflow-hidden group bg-gray-100">
      <Image src={url} alt={id} fill className="object-cover group-hover:scale-105 transition-transform duration-200" />
      <button
        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
        style={{zIndex:2}}
        onClick={() => onDelete(url)}
        type="button"
      >
        <FaTimes size={12} />
      </button>
    </div>
  );
}

interface City {
  name: string;
  lat: string;
  lng: string;
  country: string;
  admin1: string;
  admin2: string;
}

export default function TravelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null; photoURL: string | null; providerId: string } | null>(null);
  const [emotionModal, setEmotionModal] = useState(false);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isEmotionLoaded, setIsEmotionLoaded] = useState(false);
  const [segment, setSegment] = useState<"record"|"destination">("record");
  
  // 추억앨범 사진 업로드/불러오기 상태
  const [photoURLs, setPhotoURLs] = useState<string[]>([]);


  // 여행 기간 상태
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Visited 도시 관련 상태
  const [allCities, setAllCities] = useState<City[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [isCitiesLoaded, setIsCitiesLoaded] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');

  // DnD 훅을 컴포넌트 최상단에서 선언
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // 도시 데이터 로드
  useEffect(() => {
    fetch("/cities.json")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllCities(data);
        }
      })
      .catch(error => {
        console.error('도시 데이터 로드 실패:', error);
      });
  }, []);

      // 해당 국가의 도시들 필터링 (검색 포함)
    const countryCities = React.useMemo(() => {
    if (!allCities.length || !slug) return [];
    
    // slug를 국가명으로 변환 (예: japan -> Japan, south_korea -> South Korea)
    let countryName = slug.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    
    // 특별한 매핑 처리
    if (slug === 'japan') countryName = 'Japan';
    else if (slug === 'south_korea') countryName = 'South Korea';
    else if (slug === 'north_korea') countryName = 'North Korea';
    else if (slug === 'united_states') countryName = 'United States';
    else if (slug === 'united_kingdom') countryName = 'United Kingdom';
    else if (slug === 'new_zealand') countryName = 'New Zealand';
    
    // 국가 코드 매핑
    const countryCodeMap: { [key: string]: string } = {
      'japan': 'JP',
      'south_korea': 'KR', 
      'north_korea': 'KP',
      'united_states': 'US',
      'united_kingdom': 'GB',
      'new_zealand': 'NZ',
      'france': 'FR',
      'germany': 'DE',
      'spain': 'ES',
      'italy': 'IT',
      'china': 'CN',
      'australia': 'AU',
      'canada': 'CA',
      'brazil': 'BR',
      'argentina': 'AR',
      'mexico': 'MX',
      'india': 'IN',
      'russia': 'RU',
      'ukraine': 'UA',
      'poland': 'PL',
      'netherlands': 'NL',
      'belgium': 'BE',
      'switzerland': 'CH',
      'austria': 'AT',
      'sweden': 'SE',
      'norway': 'NO',
      'denmark': 'DK',
      'finland': 'FI',
      'portugal': 'PT',
      'greece': 'GR',
      'turkey': 'TR',
      'thailand': 'TH',
      'vietnam': 'VN',
      'singapore': 'SG',
      'malaysia': 'MY',
      'indonesia': 'ID',
      'philippines': 'PH',
      'taiwan': 'TW',
      'hong_kong': 'HK',
      'macau': 'MO'
    };

    // 국가 코드로 필터링
    const countryCode = countryCodeMap[slug.toLowerCase()];
    let filteredCities;
    
    if (countryCode) {
      filteredCities = allCities.filter(city => 
        city.country === countryCode
      );
      
      // 중복 제거: 같은 이름의 도시는 하나만 유지
      const uniqueCities = [];
      const seenNames = new Set();
      for (const city of filteredCities) {
        if (!seenNames.has(city.name)) {
          seenNames.add(city.name);
          uniqueCities.push(city);
        }
      }
      filteredCities = uniqueCities;
    } else {
      // 매핑되지 않은 국가는 기존 방식 사용
      filteredCities = allCities.filter(city => 
        city.country.toLowerCase() === countryName.toLowerCase()
      );
    }

    // 검색어로 필터링
    const searchFilteredCities = filteredCities.filter(city =>
      city.name.toLowerCase().includes(citySearchTerm.toLowerCase())
    );
    
    return searchFilteredCities;
  }, [allCities, slug, citySearchTerm]);

  // 방문한 도시 저장 함수
  const saveVisitedCities = async (cities: string[]) => {
    if (!user) return;
    await setDoc(doc(db, `users/${user.uid}/travels/${slug}`), {
      visitedCities: cities,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  // 방문한 도시 불러오기 함수
  const loadVisitedCities = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, `users/${user.uid}/travels/${slug}`));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.visitedCities)) {
        setSelectedCities(data.visitedCities);
      }
    }
    setIsCitiesLoaded(true);
  };

  // 로그인/slug 변경 시 방문한 도시 불러오기
  useEffect(() => {
    if (user) loadVisitedCities();
  }, [user, slug]);

  // 방문한 도시 변경 시 Firestore에 저장 (불러온 후에만)
  useEffect(() => {
    if (user && isCitiesLoaded) saveVisitedCities(selectedCities);
  }, [selectedCities, user, slug, isCitiesLoaded]);

  // 도시 선택/해제 함수
  const toggleCity = (cityName: string) => {
    setSelectedCities(prev => 
      prev.includes(cityName) 
        ? prev.filter(c => c !== cityName)
        : [...prev, cityName]
    );
  };

  // 도시 삭제 함수
  const removeCity = (cityName: string) => {
    setSelectedCities(prev => prev.filter(c => c !== cityName));
  };

  // 사진 업로드 함수 (Storage에만 저장)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `users/${user.uid}/travels/${slug}/images/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
      }
      // 업로드 후 목록 새로고침
      await fetchPhotos();
    } catch {
      alert('사진 업로드 실패');
    }
  };

  // Storage에서 내 uid 경로의 사진 목록 불러오기
  const fetchPhotos = async () => {
    if (!user) return;
    const imagesRef = ref(storage, `users/${user.uid}/travels/${slug}/images`);
    const res = await listAll(imagesRef);
    const urls = await Promise.all(res.items.map(item => getDownloadURL(item)));
    setPhotoURLs(urls.reverse()); // 최신순(업로드 기준)으로 보여주기 위해 reverse
  };

  // 로그인/slug 변경 시 사진 목록 불러오기
  useEffect(() => {
    if (user) fetchPhotos();
  }, [user, slug]);

  // 사진 삭제 함수
  const handleDeletePhoto = async (url: string) => {
    if (!user) return;
    try {
      const pathStart = `/o/`;
      const idx = url.indexOf(pathStart);
      if (idx === -1) return;
      const path = decodeURIComponent(url.substring(idx + 3, url.indexOf("?", idx)));
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      setPhotoURLs(urls => urls.filter(u => u !== url));
    } catch {
      alert('사진 삭제 실패');
    }
  };





  const [desc, setDesc] = useState("여행지 정보를 불러오는 중...");
  const [descExpanded, setDescExpanded] = useState(false);
  
  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          providerId: user.providerData[0]?.providerId || 'password'
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchDesc() {
      let wikiTitle = slug.replace(/_/g, " ");
      // 영어 위키백과 사용
      if (slugToEn[slug.toLowerCase()]) {
        wikiTitle = slugToEn[slug.toLowerCase()];
      } else {
        // slug를 영어로 변환 (예: south_korea -> South Korea)
        wikiTitle = slug.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      }
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`);
      if (!res.ok) {
        setDesc("여행지에 대한 설명이 없습니다.");
        return;
      }
      const data = await res.json();
      setDesc(data.extract);
    }
    fetchDesc();
  }, [slug]);



  const toggleEmotion = (tag: string) => {
    setSelectedEmotions(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // 여행감정 Firestore 저장
  const saveEmotions = async (emotions: string[]) => {
    if (!user) return;
    await setDoc(doc(db, `travel/${slug}/emotions`, user.uid), {
      emotions,
      updatedAt: new Date().toISOString(),
    });
  };

  // 한국어 태그를 영어 태그로 변환하는 매핑
  const koreanToEnglishTagMap: { [key: string]: string } = {
    "감성": "Sensitive",
    "설렘": "Exciting", 
    "낭만": "Romantic",
    "힐링": "Healing",
    "여유": "Relaxed",
    "한적함": "Peaceful",
    "자유": "Free",
    "꿈같이": "Dreamy",
    "로맨틱": "Romantic",
    "비밀스런": "Mysterious",
    "우정": "Friendship",
    "신혼": "Honeymoon",
    "가족": "Family",
    "혼자": "Solo",
    "커플": "Couple",
    "친구": "Friends",
    "엄빠": "Parents",
    "아이랑": "With Kids",
    "추억": "Memory",
    "최고의순간": "Best Moment",
    "모험": "Adventure",
    "미식": "Food",
    "일탈": "Escape",
    "액티브": "Active",
    "자연": "Nature",
    "문화": "Culture",
    "사진맛집": "Photo Spot",
    "한바퀴": "Walking"
  };

  // 여행감정 Firestore 불러오기 (한국어 태그를 영어로 변환)
  const fetchEmotions = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, `travel/${slug}/emotions`, user.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.emotions)) {
        // 한국어 태그를 영어 태그로 변환
        const convertedEmotions = data.emotions.map((tag: string) => 
          koreanToEnglishTagMap[tag] || tag
        );
        setSelectedEmotions(convertedEmotions);
        
        // 변환된 태그가 있으면 Firebase에 업데이트
        if (convertedEmotions.some(tag => koreanToEnglishTagMap[tag])) {
          await saveEmotions(convertedEmotions);
        }
      }
    }
    setIsEmotionLoaded(true); // 불러오기 완료
  };

  // 로그인/slug 변경 시 감정 불러오기
  useEffect(() => {
    if (user) fetchEmotions();
  }, [user, slug]);

  // 감정 태그 변경 시 Firestore에 저장 (불러온 후에만)
  useEffect(() => {
    if (user && isEmotionLoaded) saveEmotions(selectedEmotions);
  }, [selectedEmotions, user, slug, isEmotionLoaded]);

  // 날짜 포맷 함수
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 여행 기간 저장 함수
  const saveTravelDates = async (start: Date | null, end: Date | null) => {
    if (!user || !user.uid || !slug) return;
    
    try {
      const travelDoc = doc(db, `users/${user.uid}/travels/${slug}`);
      await setDoc(travelDoc, {
        startDate: start?.toISOString() || null,
        endDate: end?.toISOString() || null
      }, { merge: true });
      console.log('여행 기간 저장 완료');
    } catch (error) {
      console.error('여행 기간 저장 오류:', error);
    }
  };

  // 여행 기간 불러오기 함수
  const loadTravelDates = async () => {
    if (!user || !user.uid || !slug) return;
    
    try {
      const travelDoc = doc(db, `users/${user.uid}/travels/${slug}`);
      const travelSnap = await getDoc(travelDoc);
      
      if (travelSnap.exists()) {
        const data = travelSnap.data();
        if (data.startDate) setStartDate(new Date(data.startDate));
        if (data.endDate) setEndDate(new Date(data.endDate));
      }
    } catch (error) {
      console.error('여행 기간 불러오기 오류:', error);
    }
  };

  // 로그인/slug 변경 시 여행 기간 불러오기
  useEffect(() => {
    if (user) loadTravelDates();
  }, [user, slug]);

  // 대표 이미지 URL 생성
  let imageUrl = "/travel-images/default.jpg";
  if (slug) {
    const slugStr = typeof slug === 'string' ? slug : Array.isArray(slug) ? slug[0] : '';
    imageUrl = `/travel-images/${slugStr.toLowerCase()}.jpg`;
  }


  return (
    <>
      <div className="min-h-screen bg-white">
        <Toolbar user={user} setUser={setUser}>
          <div className="flex-1 flex justify-center">
            <SegmentControl
              value={segment}
              onChange={(val) => {
                if (val === 'record' || val === 'destination') setSegment(val);
                // 'ai'는 무시
              }}
            />
          </div>
        </Toolbar>
      {/* 대표 이미지 바깥, 왼쪽 상단 아주 작은 네비게이션 */}
      <div className="w-full max-w-4xl mx-auto flex items-center gap-1 pt-24 pb-1 px-2">
        <Link href="/" className="text-black text-xs font-semibold hover:underline" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Home</Link>
        <span className="mx-0.5 text-black text-xs font-semibold">&gt;</span>
        <span className="text-black text-xs font-semibold" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>{slug.charAt(0).toUpperCase() + slug.slice(1)}</span>
      </div>
      {/* 대표 이미지 */}
      <div className="w-full max-w-5xl mx-auto aspect-[3/1.2] rounded-3xl overflow-hidden relative shadow-lg flex items-center justify-center mt-0">
        <Image src={imageUrl} alt="대표이미지" fill className="object-cover" priority />
      </div>
      {/* 타이틀/설명/저장 */}
      <section className="w-full max-w-4xl mx-auto mt-6 flex items-center justify-between px-2">
        <h2 className="text-5xl font-extrabold text-black tracking-tight" style={{fontFamily: 'SamsungSans-Bold, sans-serif'}}>{slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Travel</h2>
        <div className="flex items-center gap-3">
          {startDate && endDate && (
            <span className="text-sm text-gray-600" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
              {formatDate(startDate)}~{formatDate(endDate)}
            </span>
          )}
          <button
            onClick={() => setShowDateModal(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="여행 기간 설정"
          >
            <FaCalendarAlt className="text-gray-600 text-lg" />
          </button>
        </div>
      </section>
      {/* 설명 */}
      <section className="w-full max-w-4xl mx-auto mt-8 px-2">
        <div className="text-gray-700 text-sm leading-relaxed max-w-2xl" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
          <span style={{
            display: '-webkit-box',
            WebkitLineClamp: descExpanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: descExpanded ? 'visible' : 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: descExpanded ? 'normal' : 'initial',
          }}>{desc}</span>
          {desc && (
                          <button
                className="ml-2 text-black underline text-sm"
                style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
                onClick={() => setDescExpanded(e => !e)}
              >
              {descExpanded ? 'Show Less ▲' : 'Show More ▼'}
            </button>
          )}
        </div>
      </section>

      {/* Visited (방문한 도시) */}
      <section className="w-full max-w-4xl mx-auto mt-6 px-2">
        <h3 className="text-xl font-bold mb-2 text-black" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Visited</h3>
        <div className="flex flex-wrap gap-2 mb-2 relative group min-h-[32px]">
          {selectedCities.length === 0 ? (
            <>
              <span className="text-gray-400 text-sm" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Please select the cities you visited on this trip</span>
            </>
          ) : (
            <>
              {selectedCities.map(city => (
                <span key={city} className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-300 text-sm font-semibold" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
                  {city}
                  <button
                    onClick={() => removeCity(city)}
                    className="ml-1 hover:text-orange-900 transition"
                  >
                    <FaTimes size={12} />
                  </button>
                </span>
              ))}
            </>
          )}
          <button
            className="absolute right-0 top-0 text-gray-400 hover:text-orange-600 transition text-base p-1"
            onClick={() => setShowCityModal(true)}
            aria-label="방문한 도시 수정"
          >
            <FaPen />
          </button>
        </div>

      </section>

      {/* 여행감정(태그) */}
      <section className="w-full max-w-4xl mx-auto mt-6 px-2">
        <h3 className="text-xl font-bold mb-2 text-black" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Travel Tags</h3>
        <div className="flex flex-wrap gap-2 mb-2 relative group min-h-[32px]">
          {selectedEmotions.length === 0 ? (
            <>
              <span className="text-gray-400 text-sm" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>You haven&apos;t selected any emotion tags yet.</span>
            </>
          ) : (
            <>
              {selectedEmotions.map(tag => {
                const found = EMOTION_TAGS.flatMap(c => c.tags).find(t => t.key === tag);
                return (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-300 text-sm font-semibold" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
                    {found?.icon}{tag}
                  </span>
                );
              })}
            </>
          )}
          <button
            className="absolute right-0 top-0 text-gray-400 hover:text-orange-600 transition text-base p-1"
            onClick={()=>setEmotionModal(true)}
            aria-label="감정 태그 수정"
          >
            <FaPen />
          </button>
        </div>
        {/* 감정 태그 선택 모달 */}
        {emotionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto">
              <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                {EMOTION_TAGS.map(cat => (
                  <div key={cat.category}>
                    <div className="font-semibold text-gray-700 mb-2 flex items-center gap-1" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>{cat.icon}{cat.category}</div>
                    <div className="flex flex-wrap gap-2">
                      {cat.tags.map(t => (
                        <button
                          key={t.key}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold transition ${selectedEmotions.includes(t.key) ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"}`}
                          style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
                          onClick={()=>toggleEmotion(t.key)}
                          type="button"
                        >
                          {t.icon}{t.key}
                          {selectedEmotions.includes(t.key) && <FaCheck className="ml-1" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}} onClick={()=>setEmotionModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </section>



      {/* 추억앨범 카드 그리드 */}
      <section className="w-full max-w-4xl mx-auto mt-6 px-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-black" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Album</h3>
          {user && (
            <label htmlFor="photo-upload" className="cursor-pointer flex items-center justify-center w-7 h-7">
              <FaPlus size={16} color="#888" />
              <input type="file" id="photo-upload" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </label>
          )}
        </div>
        {/* 조건부 렌더링: 사진 없을 때 안내문구, 있을 때 DndContext */}
        {photoURLs.length === 0 ? (
          <div className="text-gray-400 text-sm py-8 text-center" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>You don&apos;t have any photos in your travel album yet.</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({active, over}) => {
              if (active.id !== over?.id) {
                const oldIndex = photoURLs.findIndex(u => u === active.id);
                const newIndex = photoURLs.findIndex(u => u === over?.id);
                setPhotoURLs((items) => arrayMove(items, oldIndex, newIndex));
              }
            }}
          >
            <SortableContext items={photoURLs} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-px bg-gray-200">
                {photoURLs.map((url) => (
                  <SortablePhoto key={url} id={url} url={url} onDelete={handleDeletePhoto} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
      </div>

      {/* Footer와의 간격 */}
      <div className="h-5 bg-white"></div>

      {/* 날짜 선택 모달 */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] min-w-[680px] p-0 mx-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-black px-6 pt-6" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Set Travel Period</h3>
            <div className="flex justify-center w-full px-6" style={{minWidth: 0}}>
              <style>{`
                .rdrDayNumber span {
                  font-size: 1.1rem !important;
                  font-family: SamsungSans-Regular, sans-serif !important;
                }
                .rdrMonthAndYearPickers select, .rdrMonthAndYearPickers span {
                  font-family: SamsungSans-Regular, sans-serif !important;
                }
                /* 드롭다운 버튼은 기본 디자인으로 복원 */
                .rdrMonthAndYearPickers select {
                  border-radius: initial !important;
                  border: initial !important;
                  padding: initial !important;
                  height: initial !important;
                  font-size: initial !important;
                  background: initial !important;
                  color: initial !important;
                  transition: none;
                }
                .rdrMonthAndYearPickers select:focus {
                  border-color: initial !important;
                  box-shadow: none !important;
                  outline: auto !important;
                }
                .rdrMonthAndYearPickers select:hover {
                  border-color: initial !important;
                }
                /* 드롭다운 옵션(선택창) 커스텀 */
                .rdrMonthAndYearPickers select option {
                  font-family: SamsungSans-Regular, sans-serif;
                  background: #fff;
                  color: #222;
                }
                .rdrMonthAndYearPickers select option:checked {
                  background: #eb4605;
                  color: #fff;
                }
                .rdrMonthAndYearPickers select option:hover, .rdrMonthAndYearPickers select option:focus {
                  background: #ffe0c2;
                  color: #eb4605;
                }
                /* 스크롤바 커스텀 (Webkit 기반 브라우저) */
                .rdrMonthAndYearPickers select option::-webkit-scrollbar {
                  width: 8px;
                  background: #ffe0c2;
                  border-radius: 8px;
                }
                .rdrMonthAndYearPickers select option::-webkit-scrollbar-thumb {
                  background: #eb4605;
                  border-radius: 8px;
                }
                /* 진한 주황: 출국일/입국일 */
                .rdrDayStartOfRange .rdrDayNumber span,
                .rdrDayEndOfRange .rdrDayNumber span {
                  background: #eb4605 !important;
                  color: #fff !important;
                  border-radius: 50% !important;
                }
                /* 옅은 파스텔 주황: 그 사이 기간 */
                .rdrInRange .rdrDayNumber span:not(.rdrDayStartOfRange):not(.rdrDayEndOfRange) {
                  background: #ffe0c2 !important;
                  color: #222 !important;
                  border-radius: 0 !important;
                }
              `}</style>
              <DateRange
                onChange={(ranges) => {
                  const range = ranges.selection;
                  setStartDate(range.startDate);
                  setEndDate(range.endDate);
                  // 출국일과 입국일이 모두 선택되어도 모달을 닫지 않음
                  if (range.startDate && range.endDate && range.startDate !== range.endDate) {
                    saveTravelDates(range.startDate, range.endDate);
                    // setTimeout(() => setShowDateModal(false), 300); // 자동 닫힘 제거
                  }
                }}
                moveRangeOnFirstSelection={false}
                months={2}
                direction="horizontal"
                ranges={[{
                  startDate: startDate || new Date(),
                  endDate: endDate || new Date(),
                  key: 'selection',
                }]}
                showDateDisplay={false}
                rangeColors={["#eb4605"]}
                weekdayDisplayFormat="EEEEE"
                className="w-full"
                calendarOptions={{
                  years: Array.from({length: 2025-1980+1}, (_,i)=>1980+i)
                }}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6 px-6 pb-6">
              <button
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm"
                style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
              >
                Reset
              </button>
              <button
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm"
                style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
                onClick={() => setShowDateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 도시 선택 모달 */}
      {showCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCityModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-black" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>Select Visited Cities in {slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
            
            {/* 검색창 */}
            <div className="mb-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search cities..."
                value={citySearchTerm}
                onChange={(e) => setCitySearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-black"
                style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
              />
            </div>
            
            <div className="flex flex-col gap-3 h-[300px] overflow-y-auto">
              {countryCities.length === 0 ? (
                <p style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
                  {citySearchTerm ? `No cities found matching "${citySearchTerm}"` : 'No cities found for this country.'}
                </p>
              ) : (
                countryCities.map((city, index) => (
                  <button
                    key={`${city.name}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg border ${selectedCities.includes(city.name) ? "bg-orange-100 border-orange-300 text-orange-700" : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"}`}
                    style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
                    onClick={() => toggleCity(city.name)}
                  >
                    <span>{city.name}</span>
                    {selectedCities.includes(city.name) && <FaCheck className="ml-2 text-orange-600" />}
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm"
                style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}
                onClick={() => {
                  setShowCityModal(false);
                  setCitySearchTerm(''); // 모달 닫을 때 검색어 초기화
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* FOOTER */}
      <footer className="w-full bg-[#eb4605] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          {/* 왼쪽: 국가/언어/통화 */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="bg-white/10 text-white px-4 py-2 rounded-lg font-semibold text-sm" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
              대한민국 · 한국어 · ₩ KRW
            </div>
          </div>
          {/* 중앙: 메뉴 */}
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-2 text-white text-sm font-medium">
            <div className="flex flex-col gap-1">
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>도움말</span>
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>쿠키 정책</span>
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>탐색</span>
            </div>
            <div className="flex flex-col gap-1">
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>개인정보 설정</span>
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>개인정보처리방침</span>
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>회사</span>
            </div>
            <div className="flex flex-col gap-1">
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>로그인</span>
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>서비스 약관</span>
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>파트너</span>
            </div>
            <div className="flex flex-col gap-1">
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>회사 정보</span>
              <span style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>여행 일정</span>
            </div>
          </div>
        </div>
        <div className="text-center text-white/80 text-xs mt-8" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
          © Globr 2024
        </div>
      </footer>
    </>
  );
} 
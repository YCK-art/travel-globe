"use client";

import dynamic from "next/dynamic";
import Toolbar from "./components/Toolbar";
import LoginModal from "./components/LoginModal";
import TravelAddBar from "./components/TravelAddBar";
import React from "react";
import SegmentControl from "./components/SegmentControl";
import { db, setDoc, doc } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { FaPlaneDeparture } from "react-icons/fa6";
import { useRouter } from "next/navigation";

// Globe 컴포넌트를 동적 import로 변경 (SSR 비활성화)
const Globe = dynamic(() => import("./components/Globe"), { ssr: false });

interface City {
  name: string;
  lat: string;
  lng: string;
  country: string;
  admin1: string;
  admin2: string;
}

interface Visited {
  country: string;
  start: string;
  end: string;
  city?: string;
  lat?: number;
  lon?: number;
}

export default function Home() {
  const router = useRouter();
  const [visited, setVisited] = React.useState<Visited[]>([]);
  const [countryList, setCountryList] = React.useState<string[]>([]);
  const [cities, setCities] = React.useState<City[]>([]);
  const [showToolbar, setShowToolbar] = React.useState(true);
  const [segment, setSegment] = React.useState<"record"|"destination">("record");
  const lastScrollY = React.useRef(0);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [user, setUser] = React.useState<{ uid: string; email: string | null; displayName: string | null; photoURL: string | null; providerId: string } | null>(null);

  // 방문한 도시들의 마커 데이터 생성
  const visitedCities = React.useMemo(() => {
    // 마커 초기화: 빈 배열 반환
    return [];
  }, [visited]);

  React.useEffect(() => {
    fetch("/countries-110m.geojson")
      .then(res => res.json())
      .then(data => {
        if (data.features && Array.isArray(data.features)) {
          const names = data.features.map((f: { properties: { ADMIN?: string; name?: string } }) => f.properties.ADMIN || f.properties.name).filter(Boolean);
          setCountryList(Array.from(new Set(names)));
        }
      });
  }, []);

  // 도시 데이터 로드 (자동완성용)
  React.useEffect(() => {
    fetch("/cities.json")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCities(data);
        }
      })
      .catch(error => {
        console.error('도시 데이터 로드 실패:', error);
      });
  }, []);

  React.useEffect(() => {
    if (user && user.uid) {
      // Firestore에서 여행 기록 불러오기
      (async () => {
        const snap = await getDocs(collection(db, `users/${user.uid}/travels`));
        const travels = snap.docs.map(doc => {
          const data = doc.data();
          return {
            country: data.country ?? '',
            start: data.start ?? '',
            end: data.end ?? '',
            city: data.city ?? '',
            lat: data.lat ?? null,
            lon: data.lon ?? null,
          };
        });
        setVisited(travels);
        // travels 중 lat/lon이 있는 가장 마지막 여행지로 포커스 이동
        for (let i = travels.length - 1; i >= 0; i--) {
          const t = travels[i];
          if (typeof t.lat === 'number' && typeof t.lon === 'number' && !isNaN(t.lat) && !isNaN(t.lon)) {
            setFocus({ lat: t.lat, lon: t.lon });
            break;
          }
        }
      })();
    } else {
      setVisited([]);
    }
  }, [user]);

  // 새로고침 시 로그인 상태 유지
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

  React.useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) {
        setShowToolbar(true);
      } else if (currentY > lastScrollY.current) {
        setShowToolbar(false); // 아래로 내릴 때 숨김
      } else {
        setShowToolbar(true); // 위로 올릴 때 보임
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [focus, setFocus] = React.useState<{ lat: number, lon: number } | null>(null);
  const handleAdd = async (country: string, start: string, end: string, city?: string, lat?: number, lon?: number) => {
    setVisited(prev => [...prev, { country, start, end, city, lat, lon }]);
    if (user && user.uid) {
      // Firestore에 저장
      const travelId = `${country}_${city || ''}_${Date.now()}`;
      await setDoc(
        doc(db, `users/${user.uid}/travels/${travelId}`),
        {
          country,
          start,
          end,
          city: city ?? null,
          lat: lat ?? null,
          lon: lon ?? null,
          createdAt: new Date().toISOString()
        }
      );
    }
    // 여행지 추가 시 해당 위치로 포커스 이동
    if (typeof lat === 'number' && typeof lon === 'number') {
      setFocus({ lat, lon });
    }
  };

  // 모든 데이터 초기화 함수
  const handleReset = () => {
    setVisited([]);
    // 로컬 스토리지도 초기화 (혹시 저장된 데이터가 있다면)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('visited');
      localStorage.removeItem('travelData');
    }
    console.log('모든 여행 데이터가 초기화되었습니다.');
  };

  // 여행지 이미지 경로 생성 함수
  function getImagePath(city?: string, country?: string) {
    if (city && country) {
      return `/travel-images/${city.toLowerCase().replace(/ /g, "_")}_${country.toLowerCase().replace(/ /g, "_")}.jpg`;
    } else if (country) {
      return `/travel-images/${country.toLowerCase().replace(/ /g, "_")}.jpg`;
    }
    return "/travel-images/default.jpg";
  }


  return (
    <>
      {/* SECTION 1: 지구본(검은 배경) */}
      <section className="w-full h-screen bg-black relative flex flex-col justify-center overflow-hidden">
        <Toolbar user={user} setUser={setUser}>
          <div className="flex-1 flex justify-center">
            <SegmentControl
              value={segment}
              onChange={(val) => {
                if (val === "destination") {
                  router.push("/explore");
                } else if (val === "ai") {
                  router.push("/ai");
                } else {
                  setSegment(val);
                }
              }}
            />
          </div>
        </Toolbar>
        <div
          className={`fixed left-1/2 top-32 z-20 -translate-x-1/2 transition-transform duration-1000 ease-in-out w-full max-w-3xl ${showToolbar ? "translate-y-0" : "-translate-y-[200px]"}`}
          style={{ pointerEvents: showToolbar ? "auto" : "none" }}
        >
          <TravelAddBar
            onAdd={handleAdd}
            countryList={countryList}
            cities={cities}
            isLoggedIn={!!user}
            onLoginOpen={() => setLoginModalOpen(true)}
          />
        </div>
        <div className="w-full flex-1 flex items-center justify-center mt-24">
          <Globe visited={visited} cities={visitedCities} focus={focus} />
        </div>
        <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} onLogin={setUser} />
      </section>

      {/* SECTION 2: 흰색 섹션 */}
      <section className="w-full min-h-[60vh] bg-white flex flex-col items-start justify-start py-16 px-0 relative">
        <h2 className="text-4xl font-extrabold mb-8 mt-4 ml-[102px] text-black" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>My Travel Log</h2>
        {visited.length === 0 ? (
          <p className="text-lg text-gray-400 ml-[102px]" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>No travel memories added yet.</p>
        ) : (
          <div className="w-full pl-[102px] pr-[102px] mt-8 relative">
            {/* 슬라이드 버튼 */}
            <button
              className="hidden md:flex items-center justify-center absolute left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#222]/60 text-white text-3xl shadow hover:bg-[#222]/80 transition"
              style={{backdropFilter: 'blur(2px)'}}
              onClick={() => smoothScroll('left')}
              aria-label="Scroll Left"
            >
              <MdChevronLeft size={36} />
            </button>
            <button
              className="hidden md:flex items-center justify-center absolute right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#222]/60 text-white text-3xl shadow hover:bg-[#222]/80 transition"
              style={{backdropFilter: 'blur(2px)'}}
              onClick={() => smoothScroll('right')}
              aria-label="Scroll Right"
            >
              <MdChevronRight size={36} />
            </button>
            <div id="travel-log-scroll" className="overflow-x-auto scroll-smooth pb-2">
              <div className="flex gap-6 justify-start min-w-max">
                {visited.filter(item => item.country).map((item, idx) => {
                  // 카드용 이미지 경로(임시, 실제 이미지는 추후 추가)
                  // const imgUrl = getImagePath(item.city, item.country);
                  return (
                    <Link
                      key={idx}
                      href={`/travel/${item.city ? `${item.city.toLowerCase().replace(/ /g, "_")}_${item.country.toLowerCase().replace(/ /g, "_")}` : item.country.toLowerCase().replace(/ /g, "_")}`}
                      className="relative w-[340px] h-[340px] rounded-2xl overflow-hidden shadow-lg bg-gray-300 flex-shrink-0 flex flex-col justify-end transition-all duration-300 hover:shadow-2xl group cursor-pointer z-10"
                    >
                      {/* 연도 뱃지 */}
                      {item.start && (
                        <div className="absolute left-3 top-3 z-20 flex items-center rounded-lg bg-orange-500 text-white font-bold text-xs px-2 h-6 shadow" style={{fontFamily: 'SamsungSans-Bold, sans-serif'}}>
                          <span className="mr-1"><FaPlaneDeparture size={12} /></span>
                          {new Date(item.start).getFullYear()}
                        </div>
                      )}
                      {/* 여행지 이미지 배경 */}
                      <div
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          backgroundImage: `url('${getImagePath(item.city, item.country)}')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center"
                        }}
                      />
                      {/* hover 시 밝아지는 오버레이 */}
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                      {/* 여행지명 (도시, 국가) */}
                      <div className="relative z-10 p-5">
                        <div className="text-white text-3xl font-bold drop-shadow mb-1" style={{fontFamily: 'SamsungSans-Regular, sans-serif'}}>
                          {item.city ? `${item.city}, ${item.country}` : item.country}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-[#eb4605] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          {/* 왼쪽: 국가/언어/통화 */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="bg-white/10 text-white px-4 py-2 rounded-lg font-semibold text-sm">
              United States · English · $ USD
            </div>
          </div>
          {/* 중앙: 메뉴 */}
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-2 text-white text-sm font-medium">
            <div className="flex flex-col gap-1">
              <span>Help</span>
              <span>Cookie Policy</span>
              <span>Explore</span>
            </div>
            <div className="flex flex-col gap-1">
              <span>Privacy Settings</span>
              <span>Privacy Policy</span>
              <span>Company</span>
            </div>
            <div className="flex flex-col gap-1">
              <span>Sign In</span>
              <span>Terms of Service</span>
              <span>Partners</span>
            </div>
            <div className="flex flex-col gap-1">
              <span>About Us</span>
              <span>Travel Schedule</span>
            </div>
          </div>
        </div>
        <div className="text-center text-white/80 text-xs mt-8">
          © Globr 2025
        </div>
      </footer>
    </>
  );
}

// 컴포넌트 내에 추가: 아주 부드러운 스크롤 함수
function smoothScroll(direction: 'left' | 'right') {
  const el = document.getElementById('travel-log-scroll');
  if (!el) return;
  const scrollAmount = 600; // 더 크게 이동
  const start = el.scrollLeft;
  const to = direction === 'left' ? start - scrollAmount : start + scrollAmount;
  const duration = 400;
  let startTime: number | null = null;
  console.log('슬라이드 버튼 클릭:', direction, '현재:', start, '목표:', to);
  function animateScroll(timestamp: number) {
    if (!el) return; // el이 null일 경우 애니메이션 중단
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    el.scrollLeft = start + (to - start) * easeInOutCubic(progress);
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  }
  requestAnimationFrame(animateScroll);
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

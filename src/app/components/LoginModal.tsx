import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db, setDoc, doc } from "../../lib/firebase";
import { getDoc } from "firebase/firestore";
import Image from "next/image";
import { MdEmail } from "react-icons/md";

// 이름(또는 이메일)에서 프로필 이니셜 추출
export function getProfileInitial(user: { displayName?: string|null; email?: string|null }) {
  if (user.displayName && user.displayName.length > 0) {
    // 한글 이름이면 마지막 글자, 영문이면 첫 글자
    const name = user.displayName.trim();
    const lastChar = name[name.length-1];
    if (/^[가-힣]$/.test(lastChar)) return lastChar;
    return name[0].toUpperCase();
  }
  if (user.email && user.email.length > 0) return user.email[0].toUpperCase();
  return "?";
}

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin?: (user: any) => void;
}

export default function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fadeIn flex flex-col items-center">
        {/* 닫기 버튼 */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-2xl text-gray-500"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>
        {/* Globr 로고 */}
        <div className="mb-6 mt-2 w-full flex justify-start">
          <span className="text-5xl font-bold font-alkia text-black">Globr</span>
        </div>
        {/* 안내문구 */}
        <h2 className="text-2xl font-bold mb-8 text-left text-[#173c2b] leading-snug">
          로그인하여<br />당신만의 여정을 기록하세요
        </h2>
        {/* 로그인 버튼들 */}
        <div className="flex flex-col gap-4 w-full mb-8">
          <button
            className="flex items-center justify-center gap-3 w-full border-2 border-[#173c2b] rounded-full py-3 text-lg font-semibold text-[#173c2b] hover:bg-[#f5f5f5] transition"
            onClick={async () => {
              try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                  // 최초 회원가입(로그인)
                  await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    providerId: user.providerId,
                    createdAt: new Date().toISOString(), // 회원가입 날짜
                    lastLogin: new Date().toISOString()
                  });
                } else {
                  // 기존 유저: lastLogin만 갱신
                  await setDoc(userRef, {
                    lastLogin: new Date().toISOString()
                  }, { merge: true });
                }
                if (onLogin) onLogin(user);
                onClose();
              } catch (err) {
                console.error("[Google 로그인 실패]", err);
              }
            }}
          >
            <Image src="/google-logo.webp" alt="Google" width={32} height={32} />
            Google로 계속하기
          </button>
          <button className="flex items-center justify-center gap-3 w-full border-2 border-[#173c2b] rounded-full py-3 text-lg font-semibold text-[#173c2b] hover:bg-[#f5f5f5] transition">
            <MdEmail size={24} color="#222" />
            이메일로 계속하기
          </button>
        </div>
        {/* 하단 안내문구 */}
        <div className="text-xs text-gray-600 text-center leading-relaxed mt-4">
          계속 진행할 경우, Globr의 <span className="underline">개인정보 취급방침</span> 및 <span className="underline">쿠키 정책</span>에 동의한 것으로 간주됩니다.<br />
          이 사이트는 reCAPTCHA에 의해 보호되며 Google <span className="underline">개인정보 취급방침</span> 및 <span className="underline">이용 약관</span>이 적용됩니다.
        </div>
      </div>
    </div>
  );
} 
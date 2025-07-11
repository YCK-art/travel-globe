import React from "react";

interface LanguageOption {
  code: string;
  label: string;
  region: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "ko", label: "한국어", region: "대한민국" },
  { code: "en", label: "English", region: "United States" },
  { code: "en-uk", label: "English", region: "United Kingdom" },
  { code: "ja", label: "日本語", region: "日本" },
  { code: "zh", label: "中文", region: "中国" },
  { code: "fr", label: "Français", region: "France" },
  { code: "de", label: "Deutsch", region: "Deutschland" },
  { code: "es", label: "Español", region: "España" },
  { code: "it", label: "Italiano", region: "Italia" },
  { code: "ru", label: "Русский", region: "Россия" },
];

interface LanguageModalProps {
  open: boolean;
  onClose: () => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
}

export default function LanguageModal({ open, onClose, selectedLanguage, setSelectedLanguage }: LanguageModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto p-8 relative animate-fadeIn">
        {/* 닫기 버튼 */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-2xl text-gray-500"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-black">언어와 지역을 선택하세요</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`border rounded-xl px-4 py-3 text-left transition flex flex-col focus:outline-none ${selectedLanguage === lang.code ? "border-[#F57C00]" : "border-gray-200"}`}
              style={{
                borderColor: selectedLanguage === lang.code ? '#F57C00' : undefined
              }}
              onClick={() => setSelectedLanguage(lang.code)}
              onFocus={e => e.currentTarget.style.borderColor = '#F57C00'}
              onBlur={e => e.currentTarget.style.borderColor = selectedLanguage === lang.code ? '#F57C00' : '#e5e7eb'}
              onMouseOver={e => e.currentTarget.style.borderColor = '#F57C00'}
              onMouseOut={e => e.currentTarget.style.borderColor = selectedLanguage === lang.code ? '#F57C00' : '#e5e7eb'}
            >
              <span className="font-semibold text-base text-black">{lang.label}</span>
              <span className="text-xs text-black mt-1">{lang.region}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tailwind 애니메이션
// .animate-fadeIn { animation: fadeIn 0.2s; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } } 
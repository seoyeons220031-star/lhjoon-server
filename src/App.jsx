import React, { useState } from 'react';
import MainChat from './MainChat';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 임시 로그인 상태
  const [nickname, setNickname] = useState('사용자');

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
        <button 
          onClick={() => setIsLoggedIn(true)} 
          className="px-6 py-3 bg-[#FFA3A3] text-[#1A1110] font-bold rounded-xl shadow-md"
        >
          다시 로그인하기
        </button>
      </div>
    );
  }

  return <MainChat onLogout={handleLogout} nickname={nickname} />;
}

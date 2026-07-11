import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, CheckCircle, ShieldAlert } from 'lucide-react';
import MainChat from './MainChat';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentNickname, setCurrentNickname] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  // 🔒 14. 보안 - 앱 잠금 시스템 상태
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [savedPin, setSavedPin] = useState(() => localStorage.getItem('lhjoon_app_pin') || '');
  const [isSettingPin, setIsSettingPin] = useState(false);

  const [formData, setFormData] = useState({ nickname: '', password: '', confirmPassword: '' });

  // 👥 로컬 저장소 기반 회원 가입 목록 관리 (이메일 개념 결합)
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('lhjoon_registered_users');
    return saved ? JSON.parse(saved) : [{ nickname: '관리자', password: 'admin', email: 'admin@lhjoon.com' }];
  });

  // 📱 12. 앱 기능 - PWA 상태 관리 및 12. 오프라인 기본 화면 처리
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // 오프라인 상태 감지 리스너
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 🔑 2. 자동 로그인 체크
    const savedNickname = localStorage.getItem('lhjoon_nickname');
    const autoLoginActive = localStorage.getItem('lhjoon_auto_login');

    if (savedNickname && autoLoginActive === 'true') {
      setCurrentNickname(savedNickname);
      setIsAuthenticated(true);
      if (savedPin) {
        setIsAppLocked(true); // PIN 번호가 있다면 앱 잠금 화면 먼저 표시
      }
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [savedPin]);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetNickname = formData.nickname.trim();

    if (isLogin) {
      const user = registeredUsers.find(u => u.nickname === targetNickname && u.password === formData.password);
      if (!user) {
        alert('닉네임 또는 비밀번호가 일치하지 않습니다.');
        return;
      }

      setCurrentNickname(targetNickname);
      setIsAuthenticated(true);

      if (savedPin) setIsAppLocked(true);

      if (keepLoggedIn) {
        localStorage.setItem('lhjoon_nickname', targetNickname);
        localStorage.setItem('lhjoon_auto_login', 'true');
      } else {
        localStorage.removeItem('lhjoon_nickname');
        localStorage.removeItem('lhjoon_auto_login');
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (registeredUsers.some(u => u.nickname === targetNickname)) {
        alert('이미 존재하는 닉네임(아이디)입니다.');
        return;
      }

      const updatedUsers = [...registeredUsers, { nickname: targetNickname, password: formData.password, email: `${targetNickname}@lhjoon.com` }];
      setRegisteredUsers(updatedUsers);
      localStorage.setItem('lhjoon_registered_users', JSON.stringify(updatedUsers));

      alert('회원가입이 완료되었습니다! 로그인해 주세요.');
      setIsLogin(true);
      setFormData({ nickname: '', password: '', confirmPassword: '' });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentNickname('');
    setFormData({ nickname: '', password: '', confirmPassword: '' });
    localStorage.removeItem('lhjoon_nickname');
    localStorage.removeItem('lhjoon_auto_login');
  };

  // 🔓 PIN 잠금 해제 핸들러
  const handleUnlockApp = (e) => {
    e.preventDefault();
    if (pinInput === savedPin) {
      setIsAppLocked(false);
      setPinInput('');
    } else {
      alert('PIN 번호가 일치하지 않습니다.');
      setPinInput('');
    }
  };

  // 📱 12. 오프라인 기본 화면 레이아웃 분기
  if (!isOnline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A0B0B] text-[#EAE0D5] p-6 text-center font-sans">
        <ShieldAlert size={64} className="text-[#D4AF37] mb-4 animate-pulse" />
        <h1 className="text-2xl font-serif font-bold text-[#F4E3B1] mb-2">인터넷 연결이 끊어졌습니다</h1>
        <p className="text-sm text-[#C2B2A2] max-w-sm">LHJOON 메신저가 오프라인 모드로 대기 중입니다. 네트워크 상태를 확인하시면 대화를 자동으로 동기화합니다.</p>
      </div>
    );
  }

  // 🔒 보안 앱 잠금 화면 활성화 시
  if (isAuthenticated && isAppLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A0B0B] text-[#EAE0D5] px-4 font-sans">
        <div className="w-full max-w-sm bg-[#3D2222]/90 rounded-3xl p-8 border border-[#5C4033] shadow-2xl text-center">
          <Lock size={40} className="mx-auto mb-4 text-[#D4AF37]" />
          <h2 className="text-xl font-bold text-[#F4E3B1] mb-2">LHJOON 앱 잠금</h2>
          <p className="text-xs text-[#C2B2A2] mb-6">보안을 위해 PIN 번호 4자리를 입력하세요.</p>
          <form onSubmit={handleUnlockApp} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-widest text-2xl py-3 bg-[#1F0E0E] border border-[#4A312C] rounded-xl text-white outline-none focus:border-[#D4AF37]"
            />
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-[#2D1616] font-bold rounded-xl transition-all">잠금 해제</button>
          </form>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <MainChat nickname={currentNickname} onLogout={handleLogout} savedPin={savedPin} setSavedPin={setSavedPin} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#2D1616] via-[#221010] to-[#1A0B0B] text-[#EAE0D5] font-sans px-4 relative">
      {showInstallBtn && (
        <div className="absolute top-6 bg-[#3D2222] border border-[#D4AF37]/40 px-4 py-3 rounded-2xl flex items-center space-x-4 shadow-xl text-sm z-50 max-w-sm">
          <span className="font-medium text-[#F4E3B1]">🏠 홈 화면에 LHJOON 앱을 추가해 보세요!</span>
          <button onClick={handleInstallApp} className="bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-[#2D1616] px-3 py-1 rounded-xl font-bold text-xs">설치</button>
          <button onClick={() => setShowInstallBtn(false)} className="text-xs text-gray-400">❌</button>
        </div>
      )}

      <div className="w-full max-w-md bg-[#3D2222]/80 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-10 border border-[#5C4033]/40 backdrop-blur-md transition-all duration-300">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-[#F5F2EB] mb-6 shadow-2xl border-4 border-[#C19A6B]/30 overflow-hidden">
            <img src="/logo.png" alt="LHJOON Logo" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"; }} />
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight bg-gradient-to-r from-[#F4E3B1] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent">LHJOON</h1>
          <p className="text-[#C2B2A2] text-xs mt-3 font-medium tracking-wide">"대화는 흘러가지만, 소중한 순간은 LHJOON이 기억합니다."</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[#A78B71] uppercase tracking-widest mb-2.5 pl-1">닉네임 / 아이디</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8C725E] group-focus-within:text-[#D4AF37] transition-colors"><User size={20} /></span>
              <input type="text" name="nickname" required value={formData.nickname} onChange={handleChange} placeholder="닉네임을 입력하세요" className="w-full pl-12 pr-4 py-4 bg-[#1F0E0E]/80 border border-[#4A312C] rounded-2xl focus:outline-none focus:border-[#D4AF37] text-sm text-[#EAE0D5] transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A78B71] uppercase tracking-widest mb-2.5 pl-1">비밀번호</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8C725E] group-focus-within:text-[#D4AF37] transition-colors"><Lock size={20} /></span>
              <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} placeholder="비밀번호를 입력하세요" className="w-full pl-12 pr-12 py-4 bg-[#1F0E0E]/80 border border-[#4A312C] rounded-2xl focus:outline-none focus:border-[#D4AF37] text-sm text-[#EAE0D5] transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#8C725E] hover:text-[#EAE0D5] transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-[#A78B71] uppercase tracking-widest mb-2.5 pl-1">비밀번호 확인</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8C725E] group-focus-within:text-[#C19A6B] transition-colors"><CheckCircle size={20} /></span>
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" required={!isLogin} value={formData.confirmPassword} onChange={handleChange} placeholder="비밀번호를 한번 더 입력하세요" className="w-full pl-12 pr-4 py-4 bg-[#1F0E0E]/80 border border-[#4A312C] rounded-2xl focus:outline-none focus:border-[#C19A6B] text-sm text-[#EAE0D5] transition-all" />
              </div>
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer group">
                <input type="checkbox" checked={keepLoggedIn} onChange={(e) => setKeepLoggedIn(e.target.checked)} className="rounded bg-[#1F0E0E] border-[#4A312C] text-[#C19A6B] focus:ring-0 w-4 h-4 cursor-pointer" />
                <span className="text-[#C2B2A2] group-hover:text-[#EAE0D5] transition-colors font-medium">자동 로그인 유지</span>
              </label>
            </div>
          )}

          <button type="submit" className="w-full py-4 mt-4 bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-[#2D1616] font-bold rounded-2xl shadow-xl transition-all transform active:scale-[0.98] text-sm tracking-wider">
            {isLogin ? '로그인' : 'LHJOON 가입하기'}
          </button>
        </form>

        <div className="text-center mt-8 text-xs text-[#8C725E]">
          {isLogin ? (
            <p>계정이 없으신가요? <button onClick={() => { setIsLogin(false); setFormData({ nickname: '', password: '', confirmPassword: '' }); }} className="text-[#D4AF37] font-bold underline ml-1">회원가입</button></p>
          ) : (
            <p>이미 계정이 있으신가요? <button onClick={() => { setIsLogin(true); setFormData({ nickname: '', password: '', confirmPassword: '' }); }} className="text-[#D4AF37] font-bold underline ml-1">로그인하기</button></p>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, CheckCircle } from 'lucide-react';
import MainChat from './MainChat';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentNickname, setCurrentNickname] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true); // 자동 로그인 체크 유무 상태

  const [formData, setFormData] = useState({
    nickname: '',
    password: '',
    confirmPassword: '',
  });

  // 👥 로컬 저장소 기반 가입 유저 목록 (중복 가입 방지 및 보안 연동)
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('lhjoon_registered_users');
    return saved ? JSON.parse(saved) : [{ nickname: '관리자', password: 'admin' }];
  });

  // 📱 PWA 홈 화면 추가 설치를 위한 상태 관리
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // 💡 [앱 실행 시] 자동 로그인 및 PWA 설치 안내 감지
  useEffect(() => {
    const savedNickname = localStorage.getItem('lhjoon_nickname');
    const autoLoginActive = localStorage.getItem('lhjoon_auto_login');

    if (savedNickname && autoLoginActive === 'true') {
      setCurrentNickname(savedNickname);
      setIsAuthenticated(true);
    }

    // PWA 홈 화면 추가 지원 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  // 📱 홈 화면에 설치(추가)하는 함수
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetNickname = formData.nickname.trim();

    if (isLogin) {
      // 회원 정보 조회 및 로그인 검증
      const user = registeredUsers.find(u => u.nickname === targetNickname && u.password === formData.password);
      
      if (!user) {
        alert('닉네임 또는 비밀번호가 일치하지 않거나 없는 계정입니다.');
        return;
      }

      setCurrentNickname(targetNickname);
      setIsAuthenticated(true);

      // 💡 [자동 로그인 조건문] 체크되어 있다면 브라우저 저장소에 기록 보존
      if (keepLoggedIn) {
        localStorage.setItem('lhjoon_nickname', targetNickname);
        localStorage.setItem('lhjoon_auto_login', 'true');
      } else {
        localStorage.removeItem('lhjoon_nickname');
        localStorage.removeItem('lhjoon_auto_login');
      }
    } else {
      // 회원가입 모드 검증
      if (formData.password !== formData.confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }

      // 아이디(닉네임) 중복 방지 체크 추가
      if (registeredUsers.some(u => u.nickname === targetNickname)) {
        alert('이미 존재하는 닉네임입니다. 다른 닉네임을 사용해 주세요.');
        return;
      }

      const updatedUsers = [...registeredUsers, { nickname: targetNickname, password: formData.password }];
      setRegisteredUsers(updatedUsers);
      localStorage.setItem('lhjoon_registered_users', JSON.stringify(updatedUsers));

      alert('회원가입이 완료되었습니다! 로그인해 주세요.');
      setIsLogin(true);
      setFormData({ nickname: '', password: '', confirmPassword: '' });
    }
  };

  // 💡 [로그아웃] 저장소의 로그인 데이터까지 싹 지워야 안전하게 로그아웃됩니다.
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentNickname('');
    setFormData({ nickname: '', password: '', confirmPassword: '' });
    localStorage.removeItem('lhjoon_nickname');
    localStorage.removeItem('lhjoon_auto_login');
  };

  if (isAuthenticated) {
    return <MainChat nickname={currentNickname} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#2D1616] via-[#221010] to-[#1A0B0B] text-[#EAE0D5] font-sans px-4 relative">
      
      {/* 📱 PWA 홈 화면 추가 상단 알림 배너 */}
      {showInstallBtn && (
        <div className="absolute top-6 bg-[#3D2222] border border-[#D4AF37]/40 px-4 py-3 rounded-2xl flex items-center space-x-4 shadow-xl text-sm transition-all animate-bounce z-50 max-w-sm">
          <span className="font-medium text-[#F4E3B1]">📱 홈 화면에 앱을 추가해 보세요!</span>
          <button 
            onClick={handleInstallApp} 
            className="bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-[#2D1616] px-3 py-1 rounded-xl font-bold text-xs"
          >
            설치
          </button>
          <button onClick={() => setShowInstallBtn(false)} className="text-xs text-gray-400">❌</button>
        </div>
      )}

      <div className="w-full max-w-md bg-[#3D2222]/80 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-10 border border-[#5C4033]/40 backdrop-blur-md">
        
        {/* 상단 로고 영역 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-[#F5F2EB] mb-6 shadow-2xl border-4 border-[#C19A6B]/30 overflow-hidden">
            <img 
              src="/logo.png" 
              alt="LHJOON Logo" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"; }} // 로고 누락 시 대체 캐릭터 프로필 자동 서빙
            />
          </div>

          <h1 className="text-4xl font-serif font-bold tracking-tight bg-gradient-to-r from-[#F4E3B1] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent">
            LHJOON Ultimate
          </h1>
          <p className="text-[#C2B2A2] text-sm mt-3 font-medium tracking-wide">
            {isLogin ? '소중한 순간을 기억하는 메신저' : 'LHJOON의 새로운 멤버가 되어보세요'}
          </p>
        </div>

        {/* 폼 영역 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[#A78B71] uppercase tracking-widest mb-2.5 pl-1">
              닉네임
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8C725E] group-focus-within:text-[#D4AF37] transition-colors">
                <User size={20} />
              </span>
              <input
                type="text"
                name="nickname"
                required
                value={formData.nickname}
                onChange={handleChange}
                placeholder="닉네임을 입력하세요"
                className="w-full pl-12 pr-4 py-4 bg-[#1F0E0E]/80 border border-[#4A312C] rounded-2xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#EAE0D5] text-base transition-all placeholder-[#5C4742]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A78B71] uppercase tracking-widest mb-2.5 pl-1">
              비밀번호
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8C725E] group-focus-within:text-[#D4AF37] transition-colors">
                <Lock size={20} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
                className="w-full pl-12 pr-12 py-4 bg-[#1F0E0E]/80 border border-[#4A312C] rounded-2xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#EAE0D5] text-base transition-all placeholder-[#5C4742]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#8C725E] hover:text-[#EAE0D5] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-[#A78B71] uppercase tracking-widest mb-2.5 pl-1">
                비밀번호 확인
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8C725E] group-focus-within:text-[#C19A6B] transition-colors">
                  <CheckCircle size={20} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="비밀번호를 한 번 더 입력하세요"
                  className="w-full pl-12 pr-4 py-4 bg-[#1F0E0E]/80 border border-[#4A312C] rounded-2xl focus:outline-none focus:border-[#C19A6B] focus:ring-1 focus:ring-[#C19A6B] text-[#EAE0D5] text-base transition-all placeholder-[#5C4742]"
                />
              </div>
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  name="autoLogin"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="rounded bg-[#1F0E0E] border-[#4A312C] text-[#C19A6B] focus:ring-0 focus:ring-offset-0 w-5 h-5 cursor-pointer transition-colors"
                />
                <span className="text-[#C2B2A2] group-hover:text-[#EAE0D5] transition-colors font-medium">자동 로그인 유지</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 mt-4 bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] hover:from-[#C19A6B] hover:to-[#F4E3B1] active:from-[#8A640F] active:to-[#AA7C11] text-[#2D1616] font-bold rounded-2xl shadow-xl shadow-black/40 transition-all transform active:scale-[0.98] text-base tracking-wider"
          >
            {isLogin ? '로그인' : 'LHJOON 가입하기'}
          </button>
        </form>

        <div className="text-center mt-8 text-sm text-[#8C725E]">
          {isLogin ? (
            <p>
              An 계정이 없으신가요?{' '}
              <button
                onClick={() => { setIsLogin(false); setFormData({ nickname: '', password: '', confirmPassword: '' }); }}
                className="text-[#D4AF37] hover:text-[#F4E3B1] font-bold underline underline-offset-4 ml-1.5 transition-colors"
              >
                회원가입
              </button>
            </p>
          ) : (
            <p>
              이미 LHJOON 계정이 있으신가요?{' '}
              <button
                onClick={() => { setIsLogin(true); setFormData({ nickname: '', password: '', confirmPassword: '' }); }}
                className="text-[#D4AF37] hover:text-[#F4E3B1] font-bold underline underline-offset-4 ml-1.5 transition-colors"
              >
                로그인하기
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
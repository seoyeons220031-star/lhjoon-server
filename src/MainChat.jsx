import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit2, UserPlus, BellOff, Trash2, Shield, Calendar, FileText, Search, 
  Clock, Heart, Archive, Smile, Reply, Paperclip, MoreVertical, Check, Eye, Download, MessageSquare, ShieldAlert, DownloadCloud, Settings, Menu, X, LogOut
} from 'lucide-react';

// 임시 가짜 소켓 객체 생성 (패키지 미설치로 인한 빌드 에러 방지)
const socket = {
  emit: () => {},
  on: () => {},
  off: () => {}
};

// 로고 이미지 경로 설정
const LHJOON_LOGO_URL = '/logo.png';

// 시스템 기본 알림음 (공공 오디오 링크 대체)
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav';

const themes = {
  green: { name: '포레스트 그린 🌿', bg: 'bg-[#000000]', sidebar: 'bg-[#022c22]', sidebarHeader: 'bg-[#064e3b]', border: 'border-[#0f766e]', inputBorder: 'border-[#115e59]', chatBg: 'bg-[#021e17]', myMsg: 'bg-[#065f46] border-[#10b981] text-white font-semibold', otherMsg: 'bg-[#115e59] border-[#14b8a6] text-white font-semibold', text: 'text-[#f0fdf4]', accent: 'bg-[#22c55e] text-white' },
  peach: { name: '피치 핑크 🍑', bg: 'bg-[#fff5f5]', sidebar: 'bg-[#ffe3e3]', sidebarHeader: 'bg-[#ffccd5]', border: 'border-[#ffa3a3]', inputBorder: 'border-[#ffb3b3]', chatBg: 'bg-[#fff9f9]', myMsg: 'bg-[#ff8787] border-[#ff6b6b] text-white font-semibold', otherMsg: 'bg-[#f1f3f5] border-[#e9ecef] text-[#495057] font-semibold', text: 'text-[#495057]', accent: 'bg-[#ff6b6b] text-white' },
  blue: { name: '클래식 블루 💙', bg: 'bg-[#000000]', sidebar: 'bg-[#0f172a]', sidebarHeader: 'bg-[#1e293b]', border: 'border-[#334155]', inputBorder: 'border-[#475569]', chatBg: 'bg-[#090d16]', myMsg: 'bg-[#1e40af] border-[#3b82f6] text-white font-semibold', otherMsg: 'bg-[#334155] border-[#475569] text-white font-semibold', text: 'text-[#f8fafc]', accent: 'bg-[#3b82f6] text-white' },
  dark: { name: '미드나잇 다크 🌙', bg: 'bg-[#000000]', sidebar: 'bg-[#020617]', sidebarHeader: 'bg-[#0f172a]', border: 'border-[#1e293b]', inputBorder: 'border-[#334155]', chatBg: 'bg-[#090d16]', myMsg: 'bg-[#1e293b] border-[#475569] text-white font-semibold', otherMsg: 'bg-[#334155] border-[#475569] text-white font-semibold', text: 'text-[#f8fafc]', accent: 'bg-[#38bdf8] text-black' },
  orange: { name: '선셋 오렌지 🍊', bg: 'bg-[#000000]', sidebar: 'bg-[#2d0f05]', sidebarHeader: 'bg-[#451a03]', border: 'border-[#7c2d12]', inputBorder: 'border-[#9a3412]', chatBg: 'bg-[#1c0a04]', myMsg: 'bg-[#9a3412] border-[#f97316] text-white font-semibold', otherMsg: 'bg-[#451a03] border-[#7c2d12] text-white font-semibold', text: 'text-[#fff7ed]', accent: 'bg-[#ea580c] text-white' },
  purple: { name: '코지 퍼플 🍇', bg: 'bg-[#000000]', sidebar: 'bg-[#1b063a]', sidebarHeader: 'bg-[#2e1065]', border: 'border-[#4c1d95]', inputBorder: 'border-[#5b21b6]', chatBg: 'bg-[#140326]', myMsg: 'bg-[#5b21b6] border-[#8b5cf6] text-white font-semibold', otherMsg: 'bg-[#2e1065] border-[#4c1d95] text-white font-semibold', text: 'text-[#f5f3ff]', accent: 'bg-[#8b5cf6] text-white' }
};

export default function MainChat({ onLogout, nickname, savedPin, setSavedPin }) {
  const [currentThemeKey, setCurrentThemeKey] = useState('green');
  const t = themes[currentThemeKey];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [myProfile, setMyProfile] = useState({
    nickname: nickname || '사용자',
    statusMsg: 'LHJOON Ultimate 메신저 사용 중 🧸',
    avatar: LHJOON_LOGO_URL
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(myProfile.nickname);
  const [editStatus, setEditStatus] = useState(myProfile.statusMsg);
  const [editAvatar, setEditAvatar] = useState(myProfile.avatar);

  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('lhjoon_friends');
    return saved ? JSON.parse(saved) : [{ name: '관리자', email: 'admin@lhjoon.com', isBlocked: false }];
  });
  const [addFriendInput, setAddFriendInput] = useState('');

  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('lhjoon_rooms');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeRoomId, setActiveRoomId] = useState(() => {
    const saved = localStorage.getItem('lhjoon_active_room_id');
    return saved ? Number(saved) : null;
  });

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('lhjoon_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [message, setMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  const [integratedSearchQuery, setIntegratedSearchQuery] = useState('');

  const [capsules, setCapsules] = useState([]);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [capsuleText, setCapsuleText] = useState('');
  const [capsuleTime, setCapsuleTime] = useState('');
  const [memories, setMemories] = useState([{ id: 1, date: '2026-06', sentence: '소중한 사람들과 함께 나눈 따뜻한 대화 기록' }]);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [personalMemo, setPersonalMemo] = useState(localStorage.getItem('lhjoon_personal_memo') || '');
  const [sharedMemo, setSharedMemo] = useState('팀원들과 같이 쓰는 실시간 공유 메모 공간입니다.');
  const [showMemoModal, setShowMemoModal] = useState(false);

  const [activeViewerFile, setActiveViewerFile] = useState(null);
  const fileInputRef = useRef(null);

  // 알림음 재생 함수
  const playNotificationSound = () => {
    try {
      const audio = new Audio(NOTIFICATION_SOUND_URL);
      audio.volume = 0.8;
      audio.play().catch(err => console.log('오디오 재생은 사용자 상호작용(클릭)이 필요합니다:', err));
    } catch (e) {
      console.error('사운드 파일 재생 실패:', e);
    }
  };

  // 백그라운드 푸시 알림 발송 함수
  const sendBackgroundNotification = (title, body) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: LHJOON_LOGO_URL,
        tag: 'lhjoon-chat'
      });
    }
  };

  // 컴포넌트 마운트 시 브라우저 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lhjoon_friends', JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem('lhjoon_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    if (activeRoomId) {
      localStorage.setItem('lhjoon_active_room_id', activeRoomId);
    } else {
      localStorage.removeItem('lhjoon_active_room_id');
    }
  }, [activeRoomId]);

  useEffect(() => {
    localStorage.setItem('lhjoon_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (rooms.length > 0) {
      socket.emit("join rooms", rooms.map(r => r.id));
    }

    socket.on("chat message", (data) => {
      const blockedUsers = friends.filter(f => f.isBlocked).map(f => f.name);
      if (blockedUsers.includes(data.sender)) return;

      const isMe = data.sender === myProfile.nickname;

      // 내가 보낸 메시지가 아닐 때만 소리 및 백그라운드 알림 처리
      if (!isMe) {
        const targetRoom = rooms.find(r => r.id === data.roomId);
        const isMuted = targetRoom ? targetRoom.isMuted : false;

        if (!isMuted) {
          playNotificationSound();
        }

        // 사용자가 다른 탭을 보고 있거나 창이 비활성화 상태일 때 푸시 알림 작동
        if (document.hidden) {
          const roomName = targetRoom ? targetRoom.name : 'LHJOON 메신저';
          sendBackgroundNotification(`💬 ${roomName} - ${data.sender}`, data.type === 'text' ? data.content : '[파일 전송됨]');
        }
      }

      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, { ...data, isMe: isMe }];
      });
      setRooms(prev => prev.map(r => r.id === data.roomId ? { ...r, lastMsg: data.type === 'text' ? data.content : '[파일 전송됨]' } : r));
    });

    socket.on("typing notification", (data) => {
      if (data.roomId === activeRoomId && data.user !== myProfile.nickname) {
        setTypingUser(data.user);
        setIsTyping(data.isTyping);
      }
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => {
      socket.off("chat message");
      socket.off("typing notification");
    };
  }, [activeRoomId, friends, myProfile.nickname, rooms]);

  const handleAddToHomeScreen = async () => {
    if (!deferredPrompt) {
      alert('현재 브라우저 환경이 앱 설치를 지원하지 않거나 이미 설치되어 있습니다.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleInputChange = (e) => {
    if (!activeRoomId) return;
    setMessage(e.target.value);
    socket.emit("typing notification", { roomId: activeRoomId, user: myProfile.nickname, isTyping: e.target.value.length > 0 });
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!activeRoomId || !message.trim()) return;

    const newMsg = {
      id: Date.now() + Math.random(),
      roomId: activeRoomId,
      sender: myProfile.nickname,
      type: 'text',
      content: message,
      fileUrl: null,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      replyTo: replyTarget ? { sender: replyTarget.sender, content: replyTarget.content } : null,
      reactions: {},
      isMe: true
    };

    setMessages((prev) => [...prev, newMsg]);
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, lastMsg: newMsg.content } : r));
    socket.emit("chat message", newMsg);
    
    setMessage('');
    setReplyTarget(null);
    socket.emit("typing notification", { roomId: activeRoomId, user: myProfile.nickname, isTyping: false });
  };

  const handleFileUploadClick = (e) => {
    if (!activeRoomId) return;
    const file = e.target.files[0];
    if (!file) return;

    let fileType = 'file';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.startsWith('video/')) fileType = 'video';
    else if (file.type === 'application/pdf') fileType = 'pdf';

    const objectUrl = URL.createObjectURL(file);

    const fileMsg = {
      id: Date.now() + Math.random(),
      roomId: activeRoomId,
      sender: myProfile.nickname,
      type: fileType,
      content: file.name,
      fileUrl: objectUrl,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      replyTo: null,
      reactions: {},
      isMe: true
    };

    setMessages((prev) => [...prev, fileMsg]);
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, lastMsg: `[파일] ${file.name}` } : r));
    socket.emit("chat message", fileMsg);

    e.target.value = '';
  };

  const handleExecuteDeleteMessage = (id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleExecuteUpdateMessage = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: editMessageText + ' (수정됨)' } : m));
    setEditingMessageId(null);
  };

  const handleAddReaction = (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const nextReactions = { ...m.reactions };
        nextReactions[emoji] = (nextReactions[emoji] || 0) + 1;
        return { ...m, reactions: nextReactions };
      }
      return m;
    }));
  };

  const handleAddFriendSubmit = () => {
    if (!addFriendInput.trim()) return;
    setFriends([...friends, { name: addFriendInput.trim(), email: `${addFriendInput.trim()}@lhjoon.com`, isBlocked: false }]);
    setAddFriendInput('');
    alert('친구가 정상적으로 추가되었습니다.');
  };

  const handleExitOrDeleteRoom = (id) => {
    if (!window.confirm('방을 삭제하거나 나가시겠습니까? 모든 대화록이 증발합니다.')) return;
    const nextRooms = rooms.filter(r => r.id !== id);
    setRooms(nextRooms);
    setMessages(prev => prev.filter(m => m.roomId !== id));
    if (activeRoomId === id) {
      setActiveRoomId(nextRooms.length > 0 ? nextRooms[0].id : null);
    }
  };

  const handleSaveProfile = () => {
    setMyProfile({ nickname: editName, statusMsg: editStatus, avatar: editAvatar });
    setIsProfileModalOpen(false);
  };

  const handleSaveCapsule = () => {
    if (!capsuleText.trim() || !capsuleTime) return;
    setCapsules([...capsules, { id: Date.now(), text: capsuleText, targetTime: capsuleTime }]);
    setCapsuleText('');
    setShowCapsuleModal(false);
    alert('미래 타임캡슐 메시지가 정상적으로 예약되었습니다! ⏳');
  };

  const handleSaveSchedule = () => {
    setSchedules([...schedules, { id: Date.now(), title: scheduleTitle, date: scheduleDate }]);
    setScheduleTitle('');
    setShowScheduleModal(false);
    alert('새 일정이 추가되어 실시간 공유되었습니다.');
  };

  const currentRoom = rooms.find(r => r.id === activeRoomId) || null;

  const filteredMessages = messages
    .filter(m => m.roomId === activeRoomId)
    .filter(m => !integratedSearchQuery || m.content.toLowerCase().includes(integratedSearchQuery.toLowerCase()));

  return (
    <div className={`flex h-screen w-full overflow-hidden ${t.bg} ${t.text} text-sm font-sans p-2 relative`}>
      
      {/* 왼쪽 사이드바 */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 mr-2' : 'w-0 opacity-0 pointer-events-none mr-0'} ${t.sidebar} border rounded-2xl ${t.border} flex flex-col h-full z-10 shadow-lg overflow-hidden`}>
        
        {/* 상단 프로필 및 제어 바 */}
        <div className={`p-4 border-b ${t.border} ${t.sidebarHeader} flex items-center justify-between`}>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
            <img src={myProfile.avatar} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md" />
            <div className="min-w-0">
              <h2 className="font-bold truncate text-sm flex items-center gap-1">{myProfile.nickname}</h2>
              <p className="text-[11px] truncate font-medium opacity-80">{myProfile.statusMsg}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={() => setIsProfileModalOpen(true)} className="p-1.5 opacity-80 hover:opacity-100 transition-colors" title="시스템 설정">
              <Settings size={18} />
            </button>
            <button type="button" onClick={onLogout} className="p-1.5 text-red-500 hover:text-red-600 transition-colors" title="로그아웃">
              <LogOut size={18} />
            </button>
            <button type="button" onClick={() => setIsSidebarOpen(false)} className="p-1.5 opacity-80 hover:opacity-100" title="사이드바 접기">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 테마 스위처 및 PWA 배너 */}
        <div className="p-3 border-b flex flex-col space-y-2 bg-black/5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">🎨 테마 변경</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
              {Object.keys(themes).map(k => (
                <button type="button" key={k} onClick={() => setCurrentThemeKey(k)} className={`text-[10px] px-1.5 py-0.5 rounded border ${currentThemeKey === k ? 'bg-white font-bold text-black border-zinc-400 shadow-sm' : 'opacity-70 bg-zinc-100 text-zinc-800 border-zinc-300'}`}>{themes[k].name.split(' ')[0]}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold opacity-80">🔒 4자리 앱 잠금 활성화</span>
            <button type="button" onClick={() => { const p = prompt('새로운 PIN 4자리를 설정하세요:'); setSavedPin(p || ''); if (p) localStorage.setItem('lhjoon_app_pin', p); else localStorage.removeItem('lhjoon_app_pin'); }} className="bg-white/50 border border-zinc-300 px-2 py-0.5 rounded font-bold text-xs hover:bg-white">{savedPin ? '변경' : '설정하기'}</button>
          </div>
          <button type="button" onClick={handleAddToHomeScreen} className="w-full bg-blue-600 text-white text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-blue-700 transition-all">
            <DownloadCloud size={13} /> 스마트폰/PC 홈 화면에 추가하기
          </button>
        </div>

        {/* 검색창 */}
        <div className="p-2 border-b bg-black/5">
          <div className="flex items-center bg-white/60 rounded-xl px-2.5 py-1.5 border border-zinc-300">
            <Search size={14} className="opacity-60 mr-2" />
            <input type="text" placeholder="통합 검색 (대화, 파일 내용...)" value={integratedSearchQuery} onChange={(e) => setIntegratedSearchQuery(e.target.value)} className="w-full bg-transparent text-xs outline-none" />
          </div>
        </div>

        {/* 리스트 목록 */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 bg-black/5">
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-bold opacity-80 uppercase tracking-wider">
              <span>채팅방 리스트 ({rooms.length})</span>
              <button type="button" onClick={() => { const n = prompt('생성할 그룹 채팅방 이름을 작성하세요:'); if(n?.trim()) { const id = Date.now(); setRooms([...rooms, { id, name: n.trim(), lastMsg: '새 방이 개설되었습니다.', members: [myProfile.nickname], isMuted: false, isPinned: false }]); setActiveRoomId(id); } }} className="text-[10px] bg-white border border-zinc-300 px-1.5 py-0.5 rounded font-bold hover:bg-gray-100">+ 신규 개설</button>
            </div>
            <div className="space-y-1">
              {rooms.map(room => (
                <div key={room.id} onClick={() => setActiveRoomId(room.id)} className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between group transition-all ${room.id === activeRoomId ? 'bg-white/80 shadow-md font-bold border-l-4 border-blue-500' : 'hover:bg-white/40'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{room.isPinned ? '📌 ' : '💬 '}{room.name}</p>
                    <p className="text-[11px] opacity-70 font-normal truncate mt-0.5">{room.lastMsg}</p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setRooms(rooms.map(r => r.id === room.id ? { ...r, isPinned: !r.isPinned } : r)); }} className="text-[10px] bg-white border border-zinc-300 px-1 rounded">핀</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setRooms(rooms.map(r => r.id === room.id ? { ...r, isMuted: !r.isMuted } : r)); }} className="text-[10px] bg-white border border-zinc-300 px-1">{room.isMuted ? '소리' : '무음'}</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleExitOrDeleteRoom(room.id); }} className="text-[10px] bg-red-50 text-red-600 border border-red-200 p-1 rounded hover:bg-red-100"><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
              {rooms.length === 0 && (
                <p className="text-center text-[11px] text-zinc-400 py-4">개설된 채팅방이 없습니다.</p>
              )}
            </div>
          </div>

          <div className="border-t border-zinc-300 pt-3">
            <p className="text-[11px] font-bold opacity-80 mb-2 px-2 uppercase">친구 관리 ({friends.length})</p>
            <div className="flex gap-1.5 px-2 mb-2">
              <input type="text" placeholder="친구 닉네임 입력..." value={addFriendInput} onChange={e => setAddFriendInput(e.target.value)} className="w-full text-xs p-1.5 border border-zinc-300 rounded-lg bg-white/80 outline-none" />
              <button type="button" onClick={handleAddFriendSubmit} className="text-xs bg-zinc-800 text-white px-2 rounded-lg font-bold shrink-0 hover:bg-zinc-700">추가</button>
            </div>
            <div className="space-y-1 px-1">
              {friends.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-white/40 rounded-lg border border-zinc-200">
                  <span className={`${f.isBlocked ? 'line-through opacity-40' : ''}`}>{f.name}</span>
                  <button type="button" onClick={() => setFriends(friends.map((friend, i) => i === idx ? { ...friend, isBlocked: !friend.isBlocked } : friend))} className={`text-[10px] px-1 border rounded ${f.isBlocked ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-zinc-300'}`}>{f.isBlocked ? '차단됨' : '차단'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 우측 메인 대화 영역 */}
      <div className="flex-1 flex flex-col h-full bg-white/40 border border-zinc-200 rounded-2xl overflow-hidden relative">
        
        {/* 상단 타이틀 바 */}
        <div className="h-16 border-b border-zinc-200 bg-white/80 px-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            {!isSidebarOpen && (
              <button type="button" onClick={() => setIsSidebarOpen(true)} className="p-2 mr-1 bg-white border border-zinc-300 rounded-xl hover:bg-gray-50" title="사이드바 열기">
                <Menu size={18} />
              </button>
            )}
            <img src={LHJOON_LOGO_URL} alt="LHJOON Logo" className="w-9 h-9 object-contain border border-zinc-200 rounded-full bg-white p-0.5 shadow-sm" />
            {currentRoom ? (
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-sm">{currentRoom.name}</h2>
                  <button type="button" onClick={() => { const n = prompt('새로운 방 이름을 작성해 주세요:'); if (n?.trim()) setRooms(rooms.map(r => r.id === currentRoom.id ? { ...r, name: n.trim() } : r)); }} className="text-[11px] text-blue-600 underline hover:text-blue-500 font-bold">이름 수정</button>
                </div>
                <p className="text-[11px] opacity-70">참여자: {currentRoom.members?.join(', ')}</p>
              </div>
            ) : (
              <div>
                <h2 className="font-bold text-sm">LHJOON 메신저</h2>
                <p className="text-[11px] opacity-70">채팅방을 선택하거나 새로 개설하세요.</p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {currentRoom && (
              <button type="button" onClick={() => { const f = prompt('초대할 친구 이름:'); if(f?.trim()) setRooms(rooms.map(r => r.id === currentRoom.id ? { ...r, members: [...r.members, f.trim()] } : r)); }} className="flex items-center gap-1 bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-zinc-700"><UserPlus size={12} /> 친구 초대</button>
            )}
          </div>
        </div>

        {/* 대화창 내부 메인 */}
        <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${t.chatBg} flex flex-col justify-center`}>
          {currentRoom ? (
            <div className="space-y-3.5 flex-1 overflow-y-auto">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} group`}>
                  <span className="text-[11px] mb-0.5 px-1.5 py-0.2 bg-black/5 rounded font-bold">{msg.sender}</span>
                  {msg.replyTo && (
                    <div className="bg-black/5 text-[10px] px-2 py-0.5 rounded-t-lg opacity-60 max-w-xs truncate border-t border-x border-zinc-200">↩️ {msg.replyTo.content}</div>
                  )}
                  <div className="flex items-end space-x-1.5 space-x-reverse max-w-md">
                    <div className="flex flex-col">
                      {msg.type === 'text' ? (
                        <div className={`p-2.5 rounded-2xl border text-sm shadow-sm tracking-wide ${msg.isMe ? t.myMsg : t.otherMsg}`}>{msg.content}</div>
                      ) : msg.type === 'image' ? (
                        <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white p-1.5 max-w-xs shadow-sm cursor-pointer" onClick={() => setActiveViewerFile(msg)}>
                          <img src={msg.fileUrl} alt="uploaded" className="w-48 h-auto max-h-48 object-cover rounded-xl" />
                          <p className="text-[11px] p-1 font-medium truncate">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-white border border-zinc-200 rounded-2xl flex items-center space-x-2 shadow-sm cursor-pointer" onClick={() => setActiveViewerFile(msg)}>
                          <FileText size={16} className="text-amber-500 shrink-0" />
                          <div className="text-left"><p className="text-xs font-bold truncate max-w-[120px]">{msg.content}</p><p className="text-[9px] text-blue-500 font-bold">뷰어 열기</p></div>
                        </div>
                      )}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(msg.reactions).map(([emo, count]) => (
                            <span key={emo} className="bg-white border border-zinc-200 text-[10px] px-1 rounded-full font-bold shadow-sm">{emo} {count}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[10px] opacity-60 font-medium min-w-[50px]">
                      <p>{msg.time}</p>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 mt-1 transition-opacity justify-end">
                        <button type="button" onClick={() => setReplyTarget(msg)} className="opacity-60 hover:opacity-100" title="답장"><Reply size={11} /></button>
                        <button type="button" onClick={() => handleAddReaction(msg.id, '👍')} className="hover:scale-125 transition-transform">👍</button>
                        <button type="button" onClick={() => handleAddReaction(msg.id, '❤️')} className="hover:scale-125 transition-transform">❤️</button>
                        {msg.isMe && (
                          <div className="flex gap-1 ml-1 bg-white/90 px-1.5 py-0.5 rounded border border-zinc-200 text-[9px] font-bold shadow-sm">
                            <button type="button" onClick={() => { setEditingMessageId(msg.id); setEditMessageText(msg.content.replace(' (수정됨)','')); }} className="text-blue-500 hover:underline">수정</button>
                            <button type="button" onClick={() => handleExecuteDeleteMessage(msg.id)} className="text-red-500 hover:underline">삭제</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-zinc-400 text-xs">나눈 대화가 없습니다. 대화를 작성해 보세요!</div>
              )}
            </div>
          ) : (
            <div className="text-center text-zinc-400 text-xs my-auto">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
              왼쪽 사이드바의 <b>+ 신규 개설</b> 버튼을 눌러 채팅방을 생성해 보세요.
            </div>
          )}
          {isTyping && (
            <div className="text-[11px] opacity-50 italic animate-pulse px-2 mt-auto">✍️ {typingUser}님이 입력 중...</div>
          )}
        </div>

        {/* 대화 입력 바 */}
        <div className="p-3 bg-white/80 border-t border-zinc-200 flex flex-col space-y-1.5 z-10">
          {replyTarget && (
            <div className="bg-white p-1.5 rounded-lg flex items-center justify-between border border-zinc-200 shadow-sm">
              <span className="text-xs opacity-80">↩️ <b>{replyTarget.sender}</b>님에게 답글 연결 모드</span>
              <button type="button" onClick={() => setReplyTarget(null)}>❌</button>
            </div>
          )}
          {editingMessageId && (
            <div className="bg-white p-2 rounded-xl flex gap-2 items-center border border-zinc-200 shadow-sm">
              <input type="text" value={editMessageText} onChange={e => setEditMessageText(e.target.value)} className="w-full text-xs p-1.5 border border-zinc-300 rounded-lg bg-zinc-50" />
              <button type="button" onClick={() => handleExecuteUpdateMessage(editingMessageId)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold">변경</button>
              <button type="button" onClick={() => setEditingMessageId(null)} className="text-xs text-zinc-400">취소</button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className={`flex items-center space-x-2 border ${t.inputBorder} rounded-xl px-3 py-2 bg-white ${!activeRoomId ? 'opacity-40 pointer-events-none' : ''}`}>
            <button type="button" onClick={() => fileInputRef.current.click()} className="opacity-60 hover:opacity-100 shrink-0" disabled={!activeRoomId}>
              <Paperclip size={18} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUploadClick} className="hidden" />
            <input type="text" value={message} onChange={handleInputChange} placeholder={activeRoomId ? "대화 내용을 타이핑하세요..." : "채팅방을 먼저 선택하거나 새로 열어주세요."} className="flex-1 bg-transparent border-none outline-none text-xs" disabled={!activeRoomId} />
            <button type="submit" disabled={!message.trim() || !activeRoomId} className="text-blue-600 font-bold text-sm disabled:opacity-30 hover:text-blue-500 shrink-0">보내기</button>
          </form>
        </div>
      </div>

      {/* 설정 모달 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 max-w-md w-full shadow-2xl text-zinc-800">
            <h3 className="font-bold text-base mb-4 border-b border-zinc-200 pb-2 flex items-center gap-2">⚙️ LHJOON 시스템 통합 설정</h3>
            <div className="space-y-3 text-xs mb-5">
              <div><label className="block mb-1 font-bold text-zinc-500">아바타 이미지 URL 변경</label><input type="text" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-xl outline-none" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block mb-1 font-bold text-zinc-500">닉네임 변경</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-xl outline-none" /></div>
                <div><label className="block mb-1 font-bold text-zinc-500">한줄 상태메시지</label><input type="text" value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-xl outline-none" /></div>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-4 mb-4">
              <label className="block mb-2 font-bold text-xs text-zinc-500">🌟 LHJOON 전용 스마트 확장 플러그인 기능</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button type="button" onClick={() => { setIsProfileModalOpen(false); setShowCapsuleModal(true); }} className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 text-left">
                  <Clock size={16} className="text-indigo-500" /> <div><p className="font-bold">타임캡슐</p><p className="text-[10px] text-zinc-400">미래 메시지 예약</p></div>
                </button>
                <button type="button" onClick={() => { setIsProfileModalOpen(false); setShowMemoryModal(true); }} className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 text-left">
                  <Archive size={16} className="text-amber-600" /> <div><p className="font-bold">추억 보관함</p><p className="text-[10px] text-zinc-400">매달 기록 확인</p></div>
                </button>
                <button type="button" onClick={() => { setIsProfileModalOpen(false); setShowScheduleModal(true); }} className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 text-left">
                  <Calendar size={16} className="text-green-600" /> <div><p className="font-bold">일정 공유</p><p className="text-[10px] text-zinc-400">실시간 연동 캘린더</p></div>
                </button>
                <button type="button" onClick={() => { setIsProfileModalOpen(false); setShowMemoModal(true); }} className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 text-left">
                  <FileText size={16} className="text-blue-500" /> <div><p className="font-bold">공유 메모장</p><p className="text-[10px] text-zinc-400">보안 및 동시수정</p></div>
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-2 border-t border-zinc-200">
              <button type="button" onClick={() => setIsProfileModalOpen(false)} className="w-1/3 bg-zinc-100 border border-zinc-300 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200">닫기</button>
              <button type="button" onClick={handleSaveProfile} className="w-2/3 bg-zinc-800 text-white py-2 rounded-xl text-xs font-bold hover:bg-zinc-700">변경사항 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 확장 기능 모달 컴포넌트 */}
      {showCapsuleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 max-w-sm w-full text-zinc-800">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5"><Clock size={16} /> 미래지향형 타임캡슐 예약 메시지</h3>
            <div className="space-y-3 text-xs">
              <textarea value={capsuleText} onChange={e => setCapsuleText(e.target.value)} placeholder="미래에 남길 예약 메시지 내용..." className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-xl h-20 outline-none" />
              <input type="datetime-local" value={capsuleTime} onChange={e => setCapsuleTime(e.target.value)} className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-xl outline-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => { setShowCapsuleModal(false); setIsProfileModalOpen(true); }} className="w-1/2 bg-zinc-100 border border-zinc-300 py-2 rounded-xl text-xs">이전으로</button>
              <button type="button" onClick={handleSaveCapsule} className="w-1/2 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700">캡슐 봉인하기</button>
            </div>
          </div>
        </div>
      )}

      {showMemoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 max-w-sm w-full text-zinc-800">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Archive size={16} /> 명언 추억 보관함</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {memories.map(m => (
                <div key={m.id} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <p className="font-bold text-amber-600 text-[10px]">{m.date} 기록</p>
                  <p className="mt-1 font-medium italic text-zinc-600">"{m.sentence}"</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { setShowMemoryModal(false); setIsProfileModalOpen(true); }} className="w-full bg-zinc-100 border border-zinc-300 py-2 rounded-xl text-xs mt-4 font-bold hover:bg-zinc-200">이전으로</button>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 max-w-sm w-full text-zinc-800">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Calendar size={16} /> 그룹 실시간 일정 공유</h3>
            <div className="space-y-3 text-xs mb-4">
              <input type="text" placeholder="일정 이름" value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)} className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-xl outline-none" />
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-xl outline-none" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowScheduleModal(false); setIsProfileModalOpen(true); }} className="w-1/2 bg-zinc-100 border border-zinc-300 py-2 rounded-xl text-xs">이전으로</button>
              <button type="button" onClick={handleSaveSchedule} className="w-1/2 bg-green-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-700">공유하기</button>
            </div>
          </div>
        </div>
      )}

      {showMemoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 max-w-md w-full text-zinc-800">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><FileText size={16} /> 메모장</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block mb-1 font-bold text-zinc-500">🔒 개인 메모</label>
                <textarea value={personalMemo} onChange={e => { setPersonalMemo(e.target.value); localStorage.setItem('lhjoon_personal_memo', e.target.value); }} className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-xl h-32 outline-none" />
              </div>
              <div>
                <label className="block mb-1 font-bold text-zinc-500">👥 공유 메모</label>
                <textarea value={sharedMemo} onChange={e => setSharedMemo(e.target.value)} className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-xl h-32 outline-none" />
              </div>
            </div>
            <button type="button" onClick={() => { setShowMemoModal(false); setIsProfileModalOpen(true); }} className="w-full bg-zinc-100 border border-zinc-300 py-2 rounded-xl text-xs mt-4 font-bold hover:bg-zinc-200">이전으로</button>
          </div>
        </div>
      )}

      {/* 파일 인앱 뷰어 모달 */}
      {activeViewerFile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 max-w-lg w-full text-zinc-800 text-center shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase text-blue-600">[인앱 뷰어 모드] {activeViewerFile.type}</span>
              <button type="button" onClick={() => setActiveViewerFile(null)} className="text-xs font-bold">❌ 닫기</button>
            </div>
            <div className="p-4 bg-zinc-50 rounded-xl min-h-[160px] flex items-center justify-center border border-zinc-200">
              {activeViewerFile.type === 'image' ? (
                <img src={activeViewerFile.fileUrl} alt="In-app preview" className="max-w-full max-h-60 object-contain" />
              ) : (
                <div className="text-center"><FileText size={48} className="text-zinc-400 mx-auto" /><p className="text-xs font-bold mt-2">{activeViewerFile.content}</p></div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <a href={activeViewerFile.fileUrl} download={activeViewerFile.content} className="flex-1 bg-zinc-800 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><Download size={14} /> 다운로드</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

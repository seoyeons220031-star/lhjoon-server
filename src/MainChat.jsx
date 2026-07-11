import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Edit2, UserPlus, BellOff, Trash2, Shield, Calendar, FileText, Search, 
  Clock, Heart, Archive, Smile, Reply, Paperclip, MoreVertical, Check, Eye, Download, MessageSquare, ShieldAlert, DownloadCloud, Settings, Menu, X, LogOut
} from 'lucide-react';

const socket = io("https://lhjoon-server.vercel.app");

// 로고 이미지 경로 설정
const LHJOON_LOGO_URL = '/logo.png';

const themes = {
  blue: { name: '클래식 블루 💙', bg: 'bg-[#000000]', sidebar: 'bg-[#0f172a]', sidebarHeader: 'bg-[#1e293b]', border: 'border-[#334155]', inputBorder: 'border-[#475569]', chatBg: 'bg-[#090d16]', myMsg: 'bg-[#1e40af] border-[#3b82f6] text-white font-semibold', otherMsg: 'bg-[#334155] border-[#475569] text-white font-semibold', text: 'text-[#f8fafc]', accent: 'bg-[#3b82f6] text-white' },
  green: { name: '포레스트 그린 🌿', bg: 'bg-[#000000]', sidebar: 'bg-[#022c22]', sidebarHeader: 'bg-[#064e3b]', border: 'border-[#0f766e]', inputBorder: 'border-[#115e59]', chatBg: 'bg-[#021e17]', myMsg: 'bg-[#065f46] border-[#10b981] text-white font-semibold', otherMsg: 'bg-[#115e59] border-[#14b8a6] text-white font-semibold', text: 'text-[#f0fdf4]', accent: 'bg-[#22c55e] text-white' },
  dark: { name: '미드나잇 다크 🌙', bg: 'bg-[#000000]', sidebar: 'bg-[#020617]', sidebarHeader: 'bg-[#0f172a]', border: 'border-[#1e293b]', inputBorder: 'border-[#334155]', chatBg: 'bg-[#090d16]', myMsg: 'bg-[#1e293b] border-[#475569] text-white font-semibold', otherMsg: 'bg-[#334155] border-[#475569] text-white font-semibold', text: 'text-[#f8fafc]', accent: 'bg-[#38bdf8] text-black' },
  orange: { name: '선셋 오렌지 🍊', bg: 'bg-[#000000]', sidebar: 'bg-[#2d0f05]', sidebarHeader: 'bg-[#451a03]', border: 'border-[#7c2d12]', inputBorder: 'border-[#9a3412]', chatBg: 'bg-[#1c0a04]', myMsg: 'bg-[#9a3412] border-[#f97316] text-white font-semibold', otherMsg: 'bg-[#451a03] border-[#7c2d12] text-white font-semibold', text: 'text-[#fff7ed]', accent: 'bg-[#ea580c] text-white' },
  purple: { name: '코지 퍼플 🍇', bg: 'bg-[#000000]', sidebar: 'bg-[#1b063a]', sidebarHeader: 'bg-[#2e1065]', border: 'border-[#4c1d95]', inputBorder: 'border-[#5b21b6]', chatBg: 'bg-[#140326]', myMsg: 'bg-[#5b21b6] border-[#8b5cf6] text-white font-semibold', otherMsg: 'bg-[#2e1065] border-[#4c1d95] text-white font-semibold', text: 'text-[#f5f3ff]', accent: 'bg-[#8b5cf6] text-white' }
};

export default function MainChat({ onLogout, nickname, savedPin, setSavedPin }) {
  const [currentThemeKey, setCurrentThemeKey] = useState('green');
  const t = themes[currentThemeKey];

  // 로그인 직후 처음 들어왔을 때 옆 바를 안 보이게(닫힘 상태) 처리
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // 프로필 상태
  const [myProfile, setMyProfile] = useState({
    nickname: nickname || '사용자',
    statusMsg: 'LHJOON Ultimate 메신저 사용 중 🧸',
    avatar: LHJOON_LOGO_URL
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(myProfile.nickname);
  const [editStatus, setEditStatus] = useState(myProfile.statusMsg);
  const [editAvatar, setEditAvatar] = useState(myProfile.avatar);

  // 친구 상태
  const [friends, setFriends] = useState([{ name: '관리자', email: 'admin@lhjoon.com', isBlocked: false }]);
  const [addFriendInput, setAddFriendInput] = useState('');

  // 채팅방 상태
  const [rooms, setRooms] = useState([
    { id: 1, name: 'LHJOON 공식 대화방 💬', lastMsg: '새로운 소통방입니다.', creator: '관리자', members: ['관리자', myProfile.nickname], isMuted: false, isPinned: true },
    { id: 2, name: '자유 소통 광장 🎈', lastMsg: '반갑습니다!', creator: '관리자', members: ['관리자', myProfile.nickname], isMuted: false, isPinned: false }
  ]);
  const [activeRoomId, setActiveRoomId] = useState(1);

  // 메시지 상태
  const [messages, setMessages] = useState([
    { id: 1, roomId: 1, sender: '관리자', type: 'text', content: 'LHJOON 라이브에 오신 것을 환영합니다! ✨', time: '오후 12:00', isMe: false, reactions: {} }
  ]);
  const [message, setMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  const [integratedSearchQuery, setIntegratedSearchQuery] = useState('');

  // 확장 플러그인 상태
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

  useEffect(() => {
    socket.emit("join rooms", rooms.map(r => r.id));

    socket.on("chat message", (data) => {
      const blockedUsers = friends.filter(f => f.isBlocked).map(f => f.name);
      if (blockedUsers.includes(data.sender)) return;

      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, { ...data, isMe: data.sender === myProfile.nickname }];
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
    setMessage(e.target.value);
    socket.emit("typing notification", { roomId: activeRoomId, user: myProfile.nickname, isTyping: e.target.value.length > 0 });
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

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
    if (activeRoomId === id && nextRooms.length > 0) setActiveRoomId(nextRooms[0].id);
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

  const currentRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  const filteredMessages = messages
    .filter(m => m.roomId === activeRoomId)
    .filter(m => !integratedSearchQuery || m.content.toLowerCase().includes(integratedSearchQuery.toLowerCase()));

  return (
    <div className={`flex h-screen w-full overflow-hidden ${t.bg} ${t.text} text-sm font-sans bg-black p-2 relative`}>
      
      {/* 왼쪽 사이드바 (기본 닫힘 상태) */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 mr-2' : 'w-0 opacity-0 pointer-events-none mr-0'} ${t.sidebar} border rounded-2xl ${t.border} flex flex-col h-full z-10 shadow-lg overflow-hidden`}>
        
        {/* 상단 프로필 및 제어 바 */}
        <div className={`p-4 border-b ${t.border} ${t.sidebarHeader} flex items-center justify-between`}>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
            <img src={myProfile.avatar} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md" />
            <div className="min-w-0">
              <h2 className="font-bold truncate text-white text-sm flex items-center gap-1">{myProfile.nickname}</h2>
              <p className="text-[11px] truncate text-gray-300 font-medium">{myProfile.statusMsg}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsProfileModalOpen(true)} className="p-1.5 text-gray-300 hover:text-white transition-colors" title="시스템 설정">
              <Settings size={18} />
            </button>
            <button onClick={onLogout} className="p-1.5 text-red-400 hover:text-red-300 transition-colors" title="로그아웃">
              <LogOut size={18} />
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-gray-300 hover:text-white" title="사이드바 접기">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 테마 스위처 및 PWA 배너 */}
        <div className="p-3 border-b flex flex-col space-y-2 bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-200">🎨 테마 변경</span>
            <div className="flex gap-1">
              {Object.keys(themes).map(k => (
                <button key={k} onClick={() => setCurrentThemeKey(k)} className={`text-[10px] px-1.5 py-0.5 rounded border ${currentThemeKey === k ? 'bg-white font-bold text-black border-white' : 'opacity-60 bg-zinc-800 text-white border-zinc-700'}`}>{themes[k].name.split(' ')[0]}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-gray-300">🔒 4자리 앱 잠금 활성화</span>
            <button onClick={() => { const p = prompt('새로운 PIN 4자리를 설정하세요:'); setSavedPin(p || ''); if (p) localStorage.setItem('lhjoon_app_pin', p); else localStorage.removeItem('lhjoon_app_pin'); }} className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded font-bold text-xs text-white hover:bg-zinc-700">{savedPin ? '변경' : '설정하기'}</button>
          </div>
          <button onClick={handleAddToHomeScreen} className="w-full bg-blue-600 text-white text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-blue-700 transition-all">
            <DownloadCloud size={13} /> 스마트폰/PC 홈 화면에 추가하기
          </button>
        </div>

        {/* 검색창 */}
        <div className="p-2 border-b bg-zinc-900/20">
          <div className="flex items-center bg-zinc-900 rounded-xl px-2.5 py-1.5 border border-zinc-800">
            <Search size={14} className="text-gray-400 mr-2" />
            <input type="text" placeholder="통합 검색 (대화, 파일 내용...)" value={integratedSearchQuery} onChange={(e) => setIntegratedSearchQuery(e.target.value)} className="w-full bg-transparent text-xs outline-none text-white" />
          </div>
        </div>

        {/* 리스트 목록 */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 bg-zinc-950/30">
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              <span>채팅방 리스트 ({rooms.length})</span>
              <button onClick={() => { const n = prompt('생성할 그룹 채팅방 이름을 작성하세요:'); if(n?.trim()) setRooms([...rooms, { id: Date.now(), name: n.trim(), lastMsg: '새 방이 개설되었습니다.', members: [myProfile.nickname], isMuted: false, isPinned: false }]); }} className="text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-white font-bold hover:bg-zinc-700">+ 신규 개설</button>
            </div>
            <div className="space-y-1">
              {rooms.map(room => (
                <div key={room.id} onClick={() => setActiveRoomId(room.id)} className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between group transition-all ${room.id === activeRoomId ? 'bg-zinc-900 shadow-md font-bold border-l-4 border-blue-500 text-white' : 'hover:bg-zinc-900/50 text-gray-300'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{room.isPinned ? '📌 ' : '💬 '}{room.name}</p>
                    <p className="text-[11px] text-gray-400 font-normal truncate mt-0.5">{room.lastMsg}</p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button onClick={(e) => { e.stopPropagation(); setRooms(rooms.map(r => r.id === room.id ? { ...r, isPinned: !r.isPinned } : r)); }} className="text-[10px] bg-zinc-800 border border-zinc-700 px-1 rounded text-white">핀</button>
                    <button onClick={(e) => { e.stopPropagation(); setRooms(rooms.map(r => r.id === room.id ? { ...r, isMuted: !r.isMuted } : r)); }} className="text-[10px] bg-zinc-800 border border-zinc-700 px-1 text-white">{room.isMuted ? '소리' : '무음'}</button>
                    <button onClick={(e) => { e.stopPropagation(); handleExitOrDeleteRoom(room.id); }} className="text-[10px] bg-red-950 text-red-400 border border-red-900 p-1 rounded hover:bg-red-900"><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <p className="text-[11px] font-bold text-gray-300 mb-2 px-2 uppercase">친구 관리 ({friends.length})</p>
            <div className="flex gap-1.5 px-2 mb-2">
              <input type="text" placeholder="친구 닉네임 입력..." value={addFriendInput} onChange={e => setAddFriendInput(e.target.value)} className="w-full text-xs p-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-white outline-none" />
              <button onClick={handleAddFriendSubmit} className="text-xs bg-white text-black px-2 rounded-lg font-bold shrink-0 hover:bg-gray-200">추가</button>
            </div>
            <div className="space-y-1 px-1">
              {friends.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/40">
                  <span className={`text-gray-300 ${f.isBlocked ? 'line-through text-gray-600' : ''}`}>{f.name}</span>
                  <button onClick={() => setFriends(friends.map((friend, i) => i === idx ? { ...friend, isBlocked: !friend.isBlocked } : friend))} className={`text-[10px] px-1 border rounded ${f.isBlocked ? 'bg-red-600 border-red-700 text-white' : 'bg-zinc-800 border-zinc-700 text-gray-300'}`}>{f.isBlocked ? '차단됨' : '차단'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 우측 메인 대화 영역 */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden relative">
        
        {/* 상단 타이틀 바 */}
        <div className="h-16 border-b border-zinc-800 bg-zinc-900 px-4 flex items-center justify-between text-white z-10">
          <div className="flex items-center space-x-2.5">
            {/* 사이드바가 닫혀 있을 때 ☰ 토글 메뉴 버튼 노출 */}
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-1 text-white bg-zinc-800 rounded-xl hover:bg-zinc-700" title="사이드바 열기">
                <Menu size={18} />
              </button>
            )}
            <img src={LHJOON_LOGO_URL} alt="LHJOON Logo" className="w-9 h-9 object-contain border border-zinc-700 rounded-full bg-black p-0.5 shadow-md" />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-sm text-white">{currentRoom?.name || 'LHJOON 대화방'}</h2>
                <button onClick={() => { const n = prompt('새로운 방 이름을 작성해 주세요:'); if (n?.trim()) setRooms(rooms.map(r => r.id === currentRoom.id ? { ...r, name: n.trim() } : r)); }} className="text-[11px] text-blue-400 underline hover:text-blue-300 font-bold">이름 수정</button>
              </div>
              <p className="text-[11px] text-gray-300">참여자: {currentRoom?.members?.join(', ')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => { const f = prompt('초대할 친구 이름:'); if(f?.trim()) setRooms(rooms.map(r => r.id === currentRoom.id ? { ...r, members: [...r.members, f.trim()] } : r)); }} className="flex items-center gap-1 bg-white text-black font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-gray-200"><UserPlus size={12} /> 친구 초대</button>
          </div>
        </div>

        {/* 대화창 내부 메인 */}
        <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${t.chatBg}`}>
          {filteredMessages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} group`}>
              <span className="text-[11px] mb-0.5 px-1.5 py-0.2 bg-zinc-800/60 rounded font-bold text-white">{msg.sender}</span>
              {msg.replyTo && (
                <div className="bg-black/30 text-[10px] px-2 py-0.5 rounded-t-lg text-gray-400 max-w-xs truncate border-t border-x border-zinc-800">↩️ {msg.replyTo.content}</div>
              )}
              <div className="flex items-end space-x-1.5 space-x-reverse max-w-md">
                <div className="flex flex-col">
                  {msg.type === 'text' ? (
                    <div className={`p-2.5 rounded-2xl border text-sm shadow-md tracking-wide ${msg.isMe ? t.myMsg : t.otherMsg}`}>{msg.content}</div>
                  ) : msg.type === 'image' ? (
                    <div className="border border-zinc-700 rounded-2xl overflow-hidden bg-zinc-900 p-1.5 max-w-xs shadow-md cursor-pointer" onClick={() => setActiveViewerFile(msg)}>
                      <img src={msg.fileUrl} alt="uploaded" className="w-48 h-auto max-h-48 object-cover rounded-xl" />
                      <p className="text-[11px] p-1 text-white font-medium truncate">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-zinc-800 text-white border border-zinc-700 rounded-2xl flex items-center space-x-2 shadow-md cursor-pointer" onClick={() => setActiveViewerFile(msg)}>
                      <FileText size={16} className="text-amber-400 shrink-0" />
                      <div className="text-left"><p className="text-xs font-bold text-white truncate max-w-[120px]">{msg.content}</p><p className="text-[9px] text-blue-400 font-bold">뷰어 열기</p></div>
                    </div>
                  )}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(msg.reactions).map(([emo, count]) => (
                        <span key={emo} className="bg-zinc-800 border border-zinc-700 text-[10px] px-1 rounded-full font-bold text-white">{emo} {count}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right text-[10px] text-gray-400 font-medium min-w-[50px]">
                  <p>{msg.time}</p>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 mt-1 transition-opacity justify-end">
                    <button onClick={() => setReplyTarget(msg)} className="text-gray-400 hover:text-white" title="답장"><Reply size={11} /></button>
                    <button onClick={() => handleAddReaction(msg.id, '👍')} className="hover:scale-125 transition-transform">👍</button>
                    <button onClick={() => handleAddReaction(msg.id, '❤️')} className="hover:scale-125 transition-transform">❤️</button>
                    {msg.isMe && (
                      <div className="flex gap-1 ml-1 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-700 text-[9px] font-bold">
                        <button onClick={() => { setEditingMessageId(msg.id); setEditMessageText(msg.content.replace(' (수정됨)','')); }} className="text-blue-400 hover:underline">수정</button>
                        <button onClick={() => handleExecuteDeleteMessage(msg.id)} className="text-red-400 hover:underline">삭제</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="text-[11px] text-gray-500 italic animate-pulse px-2">✍️ {typingUser}님이 입력 중...</div>
          )}
        </div>

        {/* 대화 입력 바 */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-white flex flex-col space-y-1.5 z-10">
          {replyTarget && (
            <div className="bg-zinc-950 text-[11px] p-1.5 rounded-lg flex items-center justify-between border border-zinc-800">
              <span className="text-gray-300">↩️ <b>{replyTarget.sender}</b>님에게 답글 연결 모드</span>
              <button onClick={() => setReplyTarget(null)}>❌</button>
            </div>
          )}
          {editingMessageId && (
            <div className="bg-zinc-950 p-2 rounded-xl flex gap-2 items-center border border-zinc-800">
              <input type="text" value={editMessageText} onChange={e => setEditMessageText(e.target.value)} className="w-full text-xs p-1.5 border border-zinc-700 rounded-lg bg-zinc-900 text-white" />
              <button onClick={() => handleExecuteUpdateMessage(editingMessageId)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold">변경</button>
              <button onClick={() => setEditingMessageId(null)} className="text-xs text-gray-500">취소</button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className={`flex items-center space-x-2 border ${t.inputBorder} rounded-xl px-3 py-2 bg-zinc-950`}>
            <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-300 hover:text-white shrink-0">
              <Paperclip size={18} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUploadClick} className="hidden" />
            <input type="text" value={message} onChange={handleInputChange} placeholder="대화 내용을 타이핑하세요..." className="flex-1 bg-transparent border-none outline-none text-xs text-white" />
            <button type="submit" disabled={!message.trim()} className="text-blue-400 font-bold text-sm disabled:opacity-30 hover:text-blue-300 shrink-0">보내기</button>
          </form>
        </div>
      </div>

      {/* 설정 모달 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md text-white">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-base mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">⚙️ LHJOON 시스템 통합 설정</h3>
            <div className="space-y-3 text-xs mb-5">
              <div><label className="block mb-1 font-bold text-gray-400">아바타 이미지 URL 변경</label><input type="text" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} className="w-full border border-zinc-700 bg-zinc-950 text-white p-2 rounded-xl outline-none" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block mb-1 font-bold text-gray-400">닉네임 변경</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-zinc-700 bg-zinc-950 text-white p-2 rounded-xl outline-none" /></div>
                <div><label className="block mb-1 font-bold text-gray-400">한줄 상태메시지</label><input type="text" value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full border border-zinc-700 bg-zinc-950 text-white p-2 rounded-xl outline-none" /></div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 mb-4">
              <label className="block mb-2 font-bold text-xs text-gray-400">🌟 LHJOON 전용 스마트 확장 플러그인 기능</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button onClick={() => { setIsProfileModalOpen(false); setShowCapsuleModal(true); }} className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-left">
                  <Clock size={16} className="text-indigo-400" /> <div><p className="font-bold">타임캡슐</p><p className="text-[10px] text-gray-500">미래 메시지 예약</p></div>
                </button>
                <button onClick={() => { setIsProfileModalOpen(false); setShowMemoryModal(true); }} className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-left">
                  <Archive size={16} className="text-amber-500" /> <div><p className="font-bold">추억 보관함</p><p className="text-[10px] text-gray-500">매달 기록 확인</p></div>
                </button>
                <button onClick={() => { setIsProfileModalOpen(false); setShowScheduleModal(true); }} className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-left">
                  <Calendar size={16} className="text-green-400" /> <div><p className="font-bold">일정 공유</p><p className="text-[10px] text-gray-500">실시간 연동 캘린더</p></div>
                </button>
                <button onClick={() => { setIsProfileModalOpen(false); setShowMemoModal(true); }} className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-left">
                  <FileText size={16} className="text-blue-400" /> <div><p className="font-bold">공유 메모장</p><p className="text-[10px] text-gray-500">보안 및 동시수정</p></div>
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-2 border-t border-zinc-800">
              <button onClick={() => setIsProfileModalOpen(false)} className="w-1/3 bg-zinc-800 border border-zinc-700 py-2 rounded-xl text-xs font-bold hover:bg-zinc-700">닫기</button>
              <button onClick={handleSaveProfile} className="w-2/3 bg-white text-black py-2 rounded-xl text-xs font-bold hover:bg-gray-200">변경사항 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 확장 기능 모달 컴포넌트 */}
      {showCapsuleModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 text-white">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5"><Clock size={16} /> 미래지향형 타임캡슐 예약 메시지</h3>
            <div className="space-y-3 text-xs">
              <textarea value={capsuleText} onChange={e => setCapsuleText(e.target.value)} placeholder="미래에 남길 예약 메시지 내용..." className="w-full border border-zinc-700 bg-zinc-950 text-white p-2 rounded-xl h-20 outline-none" />
              <input type="datetime-local" value={capsuleTime} onChange={e => setCapsuleTime(e.target.value)} className="w-full border border-zinc-700 bg-zinc-950 text-white p-2 rounded-xl outline-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowCapsuleModal(false); setIsProfileModalOpen(true); }} className="w-1/2 bg-zinc-800 border border-zinc-700 py-2 rounded-xl text-xs">이전으로</button>
              <button onClick={handleSaveCapsule} className="w-1/2 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700">캡슐 봉인하기</button>
            </div>
          </div>
        </div>
      )}

      {showMemoryModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 text-white">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Archive size={16} /> 명언 추억 보관함</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {memories.map(m => (
                <div key={m.id} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <p className="font-bold text-amber-500 text-[10px]">{m.date} 기록</p>
                  <p className="mt-1 font-medium italic text-gray-300">"{m.sentence}"</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowMemoryModal(false); setIsProfileModalOpen(true); }} className="w-full bg-zinc-800 border border-zinc-700 py-2 rounded-xl text-xs mt-4 font-bold hover:bg-zinc-700">이전으로</button>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 text-white">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Calendar size={16} /> 그룹 실시간 일정 공유</h3>
            <div className="space-y-3 text-xs mb-4">
              <input type="text" placeholder="일정 이름" value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)} className="w-full border border-zinc-700 bg-zinc-950 text-white p-2 rounded-xl outline-none" />
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full border border-zinc-700 bg-zinc-950 text-white p-2 rounded-xl outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowScheduleModal(false); setIsProfileModalOpen(true); }} className="w-1/2 bg-zinc-800 border border-zinc-700 py-2 rounded-xl text-xs">이전으로</button>
              <button onClick={handleSaveSchedule} className="w-1/2 bg-green-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-700">공유하기</button>
            </div>
          </div>
        </div>
      )}

      {showMemoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 text-white">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-md w-full">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><FileText size={16} /> 메모장</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block mb-1 font-bold text-gray-400">🔒 개인 메모</label>
                <textarea value={personalMemo} onChange={e => { setPersonalMemo(e.target.value); localStorage.setItem('lhjoon_personal_memo', e.target.value); }} className="w-full border border-zinc-700 bg-zinc-950 text-white p-2 rounded-xl h-32 outline-none" />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-400">👥 공유 메모</label>
                <textarea value={sharedMemo} onChange={e => setSharedMemo(e.target.value)} className="w-full border border-zinc-700 bg-zinc-950 text-white p-2 rounded-xl h-32 outline-none" />
              </div>
            </div>
            <button onClick={() => { setShowMemoModal(false); setIsProfileModalOpen(true); }} className="w-full bg-zinc-800 border border-zinc-700 py-2 rounded-xl text-xs mt-4 font-bold hover:bg-zinc-700">이전으로</button>
          </div>
        </div>
      )}

      {/* 파일 인앱 뷰어 모달 */}
      {activeViewerFile && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 max-w-lg w-full text-white text-center shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase text-blue-400">[인앱 뷰어 모드] {activeViewerFile.type}</span>
              <button onClick={() => setActiveViewerFile(null)} className="text-xs font-bold">❌ 닫기</button>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl min-h-[160px] flex items-center justify-center border border-zinc-800">
              {activeViewerFile.type === 'image' ? (
                <img src={activeViewerFile.fileUrl} alt="In-app preview" className="max-w-full max-h-60 object-contain" />
              ) : (
                <div className="text-center"><FileText size={48} className="text-gray-500 mx-auto" /><p className="text-xs font-bold mt-2">{activeViewerFile.content}</p></div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <a href={activeViewerFile.fileUrl} download={activeViewerFile.content} className="flex-1 bg-white text-black py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><Download size={14} /> 다운로드</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

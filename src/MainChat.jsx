import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client'; // 실제 소켓 패키지 도입
import { 
  Edit2, UserPlus, BellOff, Trash2, Shield, Calendar, FileText, Search, 
  Clock, Heart, Archive, Smile, Reply, Paperclip, MoreVertical, Check, Eye, Download, MessageSquare, ShieldAlert, DownloadCloud, Settings, Menu, X, LogOut
} from 'lucide-react';

// ⚠️ 본인의 실제 Node.js / Socket.io 백엔드 서버 주소를 입력하세요.
const SERVER_URL = 'http://localhost:4000'; 
const socket = io(SERVER_URL, { autoConnect: false });

// 로고 이미지 경로 설정
const LHJOON_LOGO_URL = '/logo.png';
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

  const playNotificationSound = () => {
    try {
      const audio = new Audio(NOTIFICATION_SOUND_URL);
      audio.volume = 0.8;
      audio.play().catch(err => console.log('소리 재생에는 유저의 화면 클릭이 필요합니다.', err));
    } catch (e) {
      console.error(e);
    }
  };

  const sendBackgroundNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: LHJOON_LOGO_URL, tag: 'lhjoon-chat' });
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    // 소켓 서버 연결 및 내 식별 정보 등록
    socket.connect();
    socket.emit("register user", myProfile.nickname);

    return () => {
      socket.disconnect();
    };
  }, [myProfile.nickname]);

  // 로컬스토리지 동기화
  useEffect(() => { localStorage.setItem('lhjoon_friends', JSON.stringify(friends)); }, [friends]);
  useEffect(() => { localStorage.setItem('lhjoon_rooms', JSON.stringify(rooms)); }, [rooms]);
  useEffect(() => {
    if (activeRoomId) localStorage.setItem('lhjoon_active_room_id', activeRoomId);
    else localStorage.removeItem('lhjoon_active_room_id');
  }, [activeRoomId]);
  useEffect(() => { localStorage.setItem('lhjoon_messages', JSON.stringify(messages)); }, [messages]);

  // 실시간 소켓 이벤트 리스너 리액트 연동
  useEffect(() => {
    // 1. 누군가 나를 초대했을 때 서버가 보내주는 이벤트
    socket.on("room invited", (newRoom) => {
      setRooms((prev) => {
        if (prev.some(r => r.id === newRoom.id)) return prev;
        return [...prev, newRoom];
      });
      playNotificationSound();
      sendBackgroundNotification("📢 새로운 채팅방 초대", `"${newRoom.name}" 채팅방에 초대되었습니다.`);
    });

    // 2. 새로운 메시지가 수신되었을 때
    socket.on("chat message", (data) => {
      const blockedUsers = friends.filter(f => f.isBlocked).map(f => f.name);
      if (blockedUsers.includes(data.sender)) return;

      const isMe = data.sender === myProfile.nickname;

      if (!isMe) {
        const targetRoom = rooms.find(r => r.id === data.roomId);
        if (targetRoom && !targetRoom.isMuted) playNotificationSound();
        if (document.hidden) {
          sendBackgroundNotification(`💬 ${targetRoom?.name || '채팅방'} - ${data.sender}`, data.type === 'text' ? data.content : '[파일]');
        }
      }

      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, { ...data, isMe }];
      });
      setRooms(prev => prev.map(r => r.id === data.roomId ? { ...r, lastMsg: data.type === 'text' ? data.content : '[파일]' } : r));
    });

    socket.on("typing notification", (data) => {
      if (data.roomId === activeRoomId && data.user !== myProfile.nickname) {
        setTypingUser(data.user);
        setIsTyping(data.isTyping);
      }
    });

    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });

    return () => {
      socket.off("room invited");
      socket.off("chat message");
      socket.off("typing notification");
    };
  }, [activeRoomId, friends, myProfile.nickname, rooms]);

  // 신규 채팅방 생성 및 서버 등록
  const handleCreateRoom = () => {
    const n = prompt('생성할 그룹 채팅방 이름을 작성하세요:');
    if (!n?.trim()) return;

    const newRoom = {
      id: Date.now(),
      name: n.trim(),
      lastMsg: '새 방이 개설되었습니다.',
      members: [myProfile.nickname],
      isMuted: false,
      isPinned: false
    };

    setRooms([...rooms, newRoom]);
    setActiveRoomId(newRoom.id);
    
    // 서버를 통해 내가 방을 만들었음을 보냄 (서버 조인 처리용)
    socket.emit("create room", newRoom);
  };

  // 실시간 친구 초대 시스템 고도화
  const handleInviteFriend = () => {
    if (!activeRoomId || !currentRoom) return;
    const targetFriend = prompt('초대할 친구의 정확한 닉네임을 입력하세요:');
    if (!targetFriend?.trim()) return;

    const updatedMembers = [...currentRoom.members, targetFriend.trim()];
    const updatedRoom = { ...currentRoom, members: updatedMembers };

    // 내 로컬 상태 변경
    setRooms(rooms.map(r => r.id === activeRoomId ? updatedRoom : r));

    // 🌟 핵심: 서버로 친구 초대 이벤트를 전송하여 상대방에게 실시간으로 방 데이터를 꽂아줌
    socket.emit("invite user", {
      roomId: activeRoomId,
      roomData: updatedRoom,
      targetUser: targetFriend.trim()
    });

    alert(`"${targetFriend}"님을 실시간으로 초대했습니다.`);
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
    
    // 서버로 실시간 메시지 발송
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

  const handleExecuteDeleteMessage = (id) => { setMessages(prev => prev.filter(m => m.id !== id)); };
  const handleExecuteUpdateMessage = (id) => { setMessages(prev => prev.map(m => m.id === id ? { ...m, content: editMessageText + ' (수정됨)' } : m)); setEditingMessageId(null); };
  const handleAddReaction = (msgId, emoji) => { setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: { ...m.reactions, [emoji]: (m.reactions[emoji] || 0) + 1 } } : m)); };
  const handleAddFriendSubmit = () => { if (!addFriendInput.trim()) return; setFriends([...friends, { name: addFriendInput.trim(), email: `${addFriendInput.trim()}@lhjoon.com`, isBlocked: false }]); setAddFriendInput(''); alert('친구 추가 완료'); };
  const handleExitOrDeleteRoom = (id) => { if (!window.confirm('방을 삭제하시겠습니까?')) return; const next = rooms.filter(r => r.id !== id); setRooms(next); setMessages(prev => prev.filter(m => m.roomId !== id)); if (activeRoomId === id) setActiveRoomId(next.length > 0 ? next[0].id : null); };
  const handleSaveProfile = () => { setMyProfile({ nickname: editName, statusMsg: editStatus, avatar: editAvatar }); setIsProfileModalOpen(false); };

  const currentRoom = rooms.find(r => r.id === activeRoomId) || null;
  const filteredMessages = messages.filter(m => m.roomId === activeRoomId).filter(m => !integratedSearchQuery || m.content.toLowerCase().includes(integratedSearchQuery.toLowerCase()));

  return (
    <div className={`flex h-screen w-full overflow-hidden ${t.bg} ${t.text} text-sm font-sans p-2 relative`}>
      
      {/* 왼쪽 사이드바 */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 mr-2' : 'w-0 opacity-0 pointer-events-none mr-0'} ${t.sidebar} border rounded-2xl ${t.border} flex flex-col h-full z-10 shadow-lg overflow-hidden`}>
        <div className={`p-4 border-b ${t.border} ${t.sidebarHeader} flex items-center justify-between`}>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
            <img src={myProfile.avatar} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md" />
            <div className="min-w-0">
              <h2 className="font-bold truncate text-sm">{myProfile.nickname}</h2>
              <p className="text-[11px] truncate opacity-80">{myProfile.statusMsg}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={() => setIsProfileModalOpen(true)} className="p-1.5 opacity-80 hover:opacity-100"><Settings size={18} /></button>
            <button type="button" onClick={onLogout} className="p-1.5 text-red-500 hover:text-red-600"><LogOut size={18} /></button>
            <button type="button" onClick={() => setIsSidebarOpen(false)} className="p-1.5 opacity-80 hover:opacity-100"><X size={18} /></button>
          </div>
        </div>

        <div className="p-3 border-b flex flex-col space-y-2 bg-black/5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">🎨 테마 변경</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
              {Object.keys(themes).map(k => (
                <button type="button" key={k} onClick={() => setCurrentThemeKey(k)} className={`text-[10px] px-1.5 py-0.5 rounded border ${currentThemeKey === k ? 'bg-white font-bold text-black border-zinc-400 shadow-sm' : 'opacity-70 bg-zinc-100 text-zinc-800 border-zinc-300'}`}>{themes[k].name.split(' ')[0]}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-2 border-b bg-black/5">
          <div className="flex items-center bg-white/60 rounded-xl px-2.5 py-1.5 border border-zinc-300">
            <Search size={14} className="opacity-60 mr-2" />
            <input type="text" placeholder="통합 검색..." value={integratedSearchQuery} onChange={(e) => setIntegratedSearchQuery(e.target.value)} className="w-full bg-transparent text-xs outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 bg-black/5">
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-bold opacity-80 uppercase">
              <span>채팅방 리스트 ({rooms.length})</span>
              <button type="button" onClick={handleCreateRoom} className="text-[10px] bg-white border border-zinc-300 px-1.5 py-0.5 rounded font-bold hover:bg-gray-100">+ 신규 개설</button>
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
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleExitOrDeleteRoom(room.id); }} className="text-[10px] bg-red-50 text-red-600 border border-red-200 p-1 rounded"><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 우측 메인 대화 영역 */}
      <div className="flex-1 flex flex-col h-full bg-white/40 border border-zinc-200 rounded-2xl overflow-hidden relative">
        <div className="h-16 border-b border-zinc-200 bg-white/80 px-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            {!isSidebarOpen && (
              <button type="button" onClick={() => setIsSidebarOpen(true)} className="p-2 mr-1 bg-white border border-zinc-300 rounded-xl hover:bg-gray-50"><Menu size={18} /></button>
            )}
            <img src={LHJOON_LOGO_URL} alt="Logo" className="w-9 h-9 object-contain border border-zinc-200 rounded-full bg-white p-0.5 shadow-sm" />
            {currentRoom ? (
              <div>
                <h2 className="font-bold text-sm">{currentRoom.name}</h2>
                <p className="text-[11px] opacity-70">참여자: {currentRoom.members?.join(', ')}</p>
              </div>
            ) : (
              <div>
                <h2 className="font-bold text-sm">LHJOON 메신저</h2>
                <p className="text-[11px] opacity-70">채팅방을 개설하거나 선택하세요.</p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {currentRoom && (
              <button type="button" onClick={handleInviteFriend} className="flex items-center gap-1 bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-zinc-700"><UserPlus size={12} /> 친구 초대</button>
            )}
          </div>
        </div>

        <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${t.chatBg} flex flex-col justify-center`}>
          {currentRoom ? (
            <div className="space-y-3.5 flex-1 overflow-y-auto">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} group`}>
                  <span className="text-[11px] mb-0.5 px-1.5 py-0.2 bg-black/5 rounded font-bold">{msg.sender}</span>
                  <div className="flex items-end space-x-1.5 space-x-reverse max-w-md">
                    <div className={`p-2.5 rounded-2xl border text-sm shadow-sm ${msg.isMe ? t.myMsg : t.otherMsg}`}>{msg.content}</div>
                    <div className="text-right text-[10px] opacity-60 font-medium min-w-[50px]">{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-400 text-xs my-auto">사이드바에서 방을 선택해 주세요.</div>
          )}
        </div>

        <div className="p-3 bg-white/80 border-t border-zinc-200 flex flex-col space-y-1.5 z-10">
          <form onSubmit={handleSendMessage} className={`flex items-center space-x-2 border ${t.inputBorder} rounded-xl px-3 py-2 bg-white ${!activeRoomId ? 'opacity-40 pointer-events-none' : ''}`}>
            <input type="text" value={message} onChange={handleInputChange} placeholder="대화 내용을 타이핑하세요..." className="flex-1 bg-transparent border-none outline-none text-xs" disabled={!activeRoomId} />
            <button type="submit" disabled={!message.trim() || !activeRoomId} className="text-blue-600 font-bold text-sm">보내기</button>
          </form>
        </div>
      </div>

    </div>
  );
}

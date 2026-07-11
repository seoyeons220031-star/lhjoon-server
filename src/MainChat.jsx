import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Edit2, UserPlus, BellOff, Trash2, Shield, Calendar, FileText, Search, 
  Clock, Heart, Archive, Smile, Reply, Paperclip, MoreVertical, Check, Eye, Download, MessageSquare, ShieldAlert
} from 'lucide-react';

const socket = io("https://lhjoon-server.vercel.app");

// 🎨 13. 디자인 - 브랜드 컬러 기반 깔끔한 UI 다중 테마 (핑크 제외)
const themes = {
  beige: { name: '포근 베이지 ☕', bg: 'bg-[#FDFBF7]', sidebar: 'bg-[#F3E6DE]', sidebarHeader: 'bg-[#EAD9CE]', border: 'border-[#E0D0C5]', inputBorder: 'border-[#D5C2B4]', chatBg: 'bg-[#FAF7F0]', myMsg: 'bg-[#C19A6B] border-[#A78B71] text-white', otherMsg: 'bg-white border-[#D5C2B4] text-black', text: 'text-[#2C2524]', accent: 'bg-[#C19A6B] text-white' },
  dark: { name: '다크 모드 🌙', bg: 'bg-[#121212]', sidebar: 'bg-[#1E1E1E]', sidebarHeader: 'bg-[#2A2A2A]', border: 'border-[#333333]', inputBorder: 'border-[#444444]', chatBg: 'bg-[#181818]', myMsg: 'bg-[#D4AF37] border-[#AA7C11] text-black', otherMsg: 'bg-[#2D2D2D] border-[#333333] text-white', text: 'text-[#E0E0E0]', accent: 'bg-[#D4AF37] text-black' },
  mint: { name: '민트 그린 🌿', bg: 'bg-[#F0FDF4]', sidebar: 'bg-[#DCFCE7]', sidebarHeader: 'bg-[#BBF7D0]', border: 'border-[#86EFAC]', inputBorder: 'border-[#4ADE80]', chatBg: 'bg-[#F0FDF4]', myMsg: 'bg-[#22C55E] border-[#16A34A] text-white', otherMsg: 'bg-white border-[#86EFAC] text-black', text: 'text-[#14532D]', accent: 'bg-[#22C55E] text-white' }
};

export default function MainChat({ onLogout, nickname, savedPin, setSavedPin }) {
  const [currentThemeKey, setCurrentThemeKey] = useState('beige');
  const t = themes[currentThemeKey];

  // 👤 3. 프로필 상태 관리 (사진, 이름, 상태메시지)
  const [myProfile, setMyProfile] = useState({
    nickname: nickname || '사용자',
    statusMsg: 'LHJOON Ultimate 메신저 사용 중 🧸',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(myProfile.nickname);
  const [editStatus, setEditStatus] = useState(myProfile.statusMsg);
  const [editAvatar, setEditAvatar] = useState(myProfile.avatar);

  // 👥 4. 친구 시스템 및 차단 기능 상태
  const [friends, setFriends] = useState([{ name: '관리자', email: 'admin@lhjoon.com', isBlocked: false }]);
  const [searchFriendQuery, setSearchFriendQuery] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');

  // 🗂️ 8. 채팅방 상태 관리 (방나가기, 핀고정, 알림, 이름 변경)
  const [rooms, setRooms] = useState([
    { id: 1, name: 'LHJOON 공식 대화방 💬', lastMsg: '새로운 소통방입니다.', creator: '관리자', members: ['관리자', myProfile.nickname], isMuted: false, isPinned: true },
    { id: 2, name: '자유 소통 광장 🎈', lastMsg: '반갑습니다!', creator: '관리자', members: ['관리자', myProfile.nickname], isMuted: false, isPinned: false }
  ]);
  const [activeRoomId, setActiveRoomId] = useState(1);
  const [searchRoomQuery, setSearchRoomQuery] = useState('');

  // 💬 5. 채팅 핵심 상태 (메시지 수정/삭제, 읽음표시, 답장, 이모지 반응)
  const [messages, setMessages] = useState([
    { id: 1, roomId: 1, sender: '관리자', type: 'text', content: 'LHJOON 라이브에 오신 것을 환영합니다! ✨', time: '오후 12:00', isMe: false, readCount: 1, reactions: {} }
  ]);
  const [message, setMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  // 🔍 16. 통합 및 조건별 검색창 상태
  const [integratedSearchQuery, setIntegratedSearchQuery] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);

  // ⭐ 9. LHJOON 전용 특별 기능 (타임캡슐, 추억 보관함)
  const [capsules, setCapsules] = useState([]);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [capsuleText, setCapsuleText] = useState('');
  const [capsuleTime, setCapsuleTime] = useState('');

  const [memories, setMemories] = useState([
    { id: 1, date: '2026-06', sentence: '소중한 사람들과 함께 나눈 따뜻한 대화 기록' }
  ]);
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  // 📅 10. 일정 및 📝 11. 메모 기능 시스템 상태
  const [schedules, setSchedules] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  const [personalMemo, setPersonalMemo] = useState(localStorage.getItem('lhjoon_personal_memo') || '');
  const [sharedMemo, setSharedMemo] = useState('팀원들과 같이 쓰는 실시간 공유 메모 공간입니다.');
  const [showMemoModal, setShowMemoModal] = useState(false);

  // 📁 6. 파일 인앱 뷰어 모달 제어용 상태
  const [activeViewerFile, setActiveViewerFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    socket.emit("join rooms", rooms.map(r => r.id));

    socket.on("chat message", (data) => {
      // 차단 유저 확인 가드레일 작동
      const blockedUsers = friends.filter(f => f.isBlocked).map(f => f.name);
      if (blockedUsers.includes(data.sender)) return;

      setMessages((prev) => [...prev, { ...data, isMe: data.sender === myProfile.nickname, readCount: 2 }]);
      setRooms(prev => prev.map(r => r.id === data.roomId ? { ...r, lastMsg: data.type === 'text' ? data.content : '[파일 전송됨]' } : r));
    });

    socket.on("typing notification", (data) => {
      if (data.roomId === activeRoomId && data.user !== myProfile.nickname) {
        setTypingUser(data.user);
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socket.off("chat message");
      socket.off("typing notification");
    };
  }, [activeRoomId, friends, myProfile.nickname, rooms]);

  // 5. 입력 중 표시 트리거 함수
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socket.emit("typing notification", { roomId: activeRoomId, user: myProfile.nickname, isTyping: e.target.value.length > 0 });
  };

  // 5. 메시지 전송 및 6. 파일 전송(가상 변환 결합) 시스템
  const handleSendMessage = (e, fileData = null) => {
    if (e) e.preventDefault();
    if (!message.trim() && !fileData) return;

    const newMsg = {
      id: Date.now(),
      roomId: activeRoomId,
      sender: myProfile.nickname,
      type: fileData ? fileData.type : 'text',
      content: fileData ? fileData.name : message,
      fileUrl: fileData ? fileData.url : null,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      replyTo: replyTarget ? { sender: replyTarget.sender, content: replyTarget.content } : null,
      reactions: {}
    };

    socket.emit("chat message", newMsg);
    setMessage('');
    setReplyTarget(null);
    socket.emit("typing notification", { roomId: activeRoomId, user: myProfile.nickname, isTyping: false });
  };

  // 가상 파일 업로드 업데이터 함수
  const handleFileUploadClick = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let fileType = 'file';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.startsWith('video/')) fileType = 'video';
    else if (file.type === 'application/pdf') fileType = 'pdf';

    const fakeUrl = URL.createObjectURL(file);
    handleSendMessage(null, { name: file.name, type: fileType, url: fakeUrl });
  };

  // 5. 메시지 수정 및 삭제 엔진
  const handleExecuteDeleteMessage = (id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleExecuteUpdateMessage = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: editMessageText + ' (수정됨)' } : m));
    setEditingMessageId(null);
  };

  // 5. 이모지 반응 연동 시스템
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

  // 4. 친구 추가 / 차단 조작기
  const handleAddFriendSubmit = () => {
    if (!addFriendInput.trim()) return;
    setFriends([...friends, { name: addFriendInput.trim(), email: `${addFriendInput.trim()}@lhjoon.com`, isBlocked: false }]);
    setAddFriendInput('');
    alert('친구가 정상적으로 추가되었습니다.');
  };

  // 8. 채팅방 나가기 / 삭제 통합 함수
  const handleExitOrDeleteRoom = (id) => {
    if (!window.confirm('방을 삭제하거나 나가시겠습니까? 모든 대화록이 증발합니다.')) return;
    const nextRooms = rooms.filter(r => r.id !== id);
    setRooms(nextRooms);
    setMessages(prev => prev.filter(m => m.roomId !== id));
    if (activeRoomId === id && nextRooms.length > 0) setActiveRoomId(nextRooms[0].id);
  };

  // 👤 3. 프로필 저장 함수
  const handleSaveProfile = () => {
    setMyProfile({ nickname: editName, statusMsg: editStatus, avatar: editAvatar });
    setIsProfileModalOpen(false);
  };

  // ⭐ 9. 타임캡슐 메시지 예약 심기
  const handleSaveCapsule = () => {
    if (!capsuleText.trim() || !capsuleTime) return;
    setCapsules([...capsules, { id: Date.now(), text: capsuleText, targetTime: capsuleTime }]);
    setCapsuleText('');
    setShowCapsuleModal(false);
    alert('미래로 보낼 타임캡슐 메시지가 정상적으로 예약되었습니다! ⏳');
  };

  // 📅 10. 일정 공유 등록
  const handleSaveSchedule = () => {
    setSchedules([...schedules, { id: Date.now(), title: scheduleTitle, date: scheduleDate }]);
    setScheduleTitle('');
    setShowScheduleModal(false);
    alert('새 일정이 추가되어 실시간 공유되었습니다.');
  };

  const currentRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  // 16. 통합 검색 필터링 로직 구현
  const filteredMessages = messages
    .filter(m => m.roomId === activeRoomId)
    .filter(m => !integratedSearchQuery || m.content.toLowerCase().includes(integratedSearchQuery.toLowerCase()));

  return (
    <div className={`flex h-screen w-full overflow-hidden ${t.bg} ${t.text} text-sm font-sans`}>
      
      {/* 왼쪽 사이드바 제어판 */}
      <div className={`w-80 ${t.sidebar} border-r ${t.border} flex flex-col h-full z-10 shadow-lg`}>
        
        {/* 상단 내 프로필 정보 바 */}
        <div className={`p-4 border-b ${t.border} ${t.sidebarHeader} flex items-center justify-between`}>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
            <img src={myProfile.avatar} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md" />
            <div className="min-w-0">
              <h2 className="font-bold truncate text-black text-sm flex items-center gap-1">{myProfile.nickname} <Edit2 size={12} className="text-gray-600" /></h2>
              <p className="text-[11px] truncate text-gray-700 font-medium">{myProfile.statusMsg}</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs bg-white text-gray-800 font-bold px-2 py-1 border rounded-lg shadow-2xs">로그아웃</button>
        </div>

        {/* 🎨 테마 교체 및 PIN 보안 제어판 */}
        <div className="p-3 border-b flex flex-col space-y-2 bg-white/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">🎨 테마 스위처</span>
            <div className="flex gap-1">
              {Object.keys(themes).map(k => (
                <button key={k} onClick={() => setCurrentThemeKey(k)} className={`text-[10px] px-1.5 py-0.5 rounded border ${currentThemeKey === k ? 'bg-white font-bold' : 'opacity-60 bg-white/30'}`}>{themes[k].name.split(' ')[0]}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-gray-600">🔒 4자리 앱 잠금 활성화</span>
            <button onClick={() => { const p = prompt('새로운 PIN 4자리를 설정하세요 (해제는 공백):'); setSavedPin(p || ''); if (p) localStorage.setItem('lhjoon_app_pin', p); else localStorage.removeItem('lhjoon_app_pin'); }} className="bg-white border px-2 py-0.5 rounded font-bold text-xs">{savedPin ? '설정됨 (변경)' : '설정하기'}</button>
          </div>
        </div>

        {/* 🔍 16. 통합 검색 컨트롤 영역 */}
        <div className="p-2 border-b">
          <div className="flex items-center bg-white rounded-xl px-2.5 py-1.5 border shadow-2xs">
            <Search size={14} className="text-gray-400 mr-2" />
            <input type="text" placeholder="통합 검색 (대화, 파일 내용...)" value={integratedSearchQuery} onChange={(e) => setIntegratedSearchQuery(e.target.value)} className="w-full bg-transparent text-xs outline-none text-black" />
          </div>
        </div>

        {/* 🌟 9, 10, 11 특별 서브 기능 퀵 서브 메뉴바 */}
        <div className="p-2 border-b bg-gray-50 flex justify-around text-gray-700 text-xs font-bold">
          <button onClick={() => setShowCapsuleModal(true)} className="flex flex-col items-center"><Clock size={16} className="text-indigo-600" /><span>타임캡슐</span></button>
          <button onClick={() => setShowMemoryModal(true)} className="flex flex-col items-center"><Archive size={16} className="text-amber-700" /><span>추억보관함</span></button>
          <button onClick={() => setShowScheduleModal(true)} className="flex flex-col items-center"><Calendar size={16} className="text-green-600" /><span>일정공유</span></button>
          <button onClick={() => setShowMemoModal(true)} className="flex flex-col items-center"><FileText size={16} className="text-blue-600" /><span>공유메모</span></button>
        </div>

        {/* 🗂️ 채팅방 및 친구 관리 탭 목록 */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          
          {/* 채팅방 오퍼레이션 영역 */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <span>채팅방 관리 리스트 ({rooms.length})</span>
              <button onClick={() => { const n = prompt('생성할 그룹 채팅방 이름을 작성하세요:'); if(n?.trim()) setRooms([...rooms, { id: Date.now(), name: n.trim(), lastMsg: '새 방이 개설되었습니다.', members: [myProfile.nickname], isMuted: false, isPinned: false }]); }} className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-black font-bold">+ 신규 개설</button>
            </div>
            <div className="space-y-1">
              {rooms.map(room => (
                <div key={room.id} onClick={() => setActiveRoomId(room.id)} className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between group transition-all ${room.id === activeRoomId ? 'bg-white shadow-md font-bold border-l-4 border-[#C19A6B]' : 'hover:bg-white/40'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-black truncate">{room.isPinned ? '📌 ' : '💬 '}{room.name}</p>
                    <p className="text-[11px] text-gray-500 font-normal truncate mt-0.5">{room.lastMsg}</p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button onClick={(e) => { e.stopPropagation(); setRooms(rooms.map(r => r.id === room.id ? { ...r, isPinned: !r.isPinned } : r)); }} className="text-[10px] bg-white border px-1 rounded text-black">핀</button>
                    <button onClick={(e) => { e.stopPropagation(); setRooms(rooms.map(r => r.id === room.id ? { ...r, isMuted: !r.isMuted } : r)); }} className="text-[10px] bg-white border px-1 text-black">{room.isMuted ? '소리' : '무음'}</button>
                    <button onClick={(e) => { e.stopPropagation(); handleExitOrDeleteRoom(room.id); }} className="text-[10px] bg-red-50 text-red-600 border px-1 rounded"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 👥 4. 친구 시스템 인터페이스 영역 */}
          <div className="border-t pt-3">
            <p className="text-[11px] font-bold text-gray-500 mb-2 px-2 uppercase">친구 및 연락망 관리 ({friends.length})</p>
            <div className="flex gap-1.5 px-2 mb-2">
              <input type="text" placeholder="친구 닉네임 입력..." value={addFriendInput} onChange={e => setAddFriendInput(e.target.value)} className="w-full text-xs p-1.5 border rounded-lg bg-white text-black outline-none" />
              <button onClick={handleAddFriendSubmit} className="text-xs bg-gray-900 text-white px-2 rounded-lg font-bold shrink-0">추가</button>
            </div>
            <div className="space-y-1 px-1">
              {friends.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-white/30 rounded-lg">
                  <span className={`text-black ${f.isBlocked ? 'line-through text-gray-400' : ''}`}>{f.name}</span>
                  <button onClick={() => setFriends(friends.map((friend, i) => i === idx ? { ...friend, isBlocked: !friend.isBlocked } : friend))} className={`text-[10px] px-1 border rounded ${f.isBlocked ? 'bg-red-500 text-white' : 'bg-white text-gray-700'}`}>{f.isBlocked ? '차단됨' : '차단'}</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 우측 메인 대화 스페이스 프레임 */}
      <div className="flex-1 flex flex-col h-full bg-transparent relative">
        
        {/* 상단 룸 디테일 헤더 바 */}
        <div className="h-16 border-b bg-white shadow-xs px-4 flex items-center justify-between text-black z-10">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm text-gray-900">{currentRoom?.name || 'LHJOON 대화방'}</h2>
              <button onClick={() => { const n = prompt('새로운 방 이름을 작성해 주세요:'); if (n?.trim()) setRooms(rooms.map(r => r.id === currentRoom.id ? { ...r, name: n.trim() } : r)); }} className="text-[11px] text-gray-400 underline hover:text-black">수정</button>
            </div>
            <p className="text-[11px] text-gray-500">참여자 목록: {currentRoom?.members?.join(', ')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => { const f = prompt('이 방에 초대할 친구의 이름을 적어주세요:'); if(f?.trim()) setRooms(rooms.map(r => r.id === currentRoom.id ? { ...r, members: [...r.members, f.trim()] } : r)); }} className="flex items-center gap-1 bg-gray-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs"><UserPlus size={12} /> 친구 초대</button>
          </div>
        </div>

        {/* 💬 메시지 출력 스크롤 뷰 스페이스 */}
        <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${t.chatBg}`}>
          {filteredMessages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} group`}>
              <span className="text-[10px] text-gray-500 mb-0.5 px-1 font-bold">{msg.sender}</span>
              
              {/* 답장 타깃 인클루드 컨테이너 */}
              {msg.replyTo && (
                <div className="bg-black/5 text-[10px] px-2 py-0.5 rounded-t-lg text-gray-600 max-w-xs truncate">↩️ {msg.replyTo.content}</div>
              )}

              <div className="flex items-end space-x-1.5 space-x-reverse max-w-md">
                
                {/* 6. 파일 포맷별 실시간 인앱 인라인 뷰어 탑재 */}
                <div className="flex flex-col">
                  {msg.type === 'text' ? (
                    <div className={`p-2.5 rounded-2xl border text-xs shadow-2xs ${msg.isMe ? t.myMsg : t.otherMsg}`}>{msg.content}</div>
                  ) : msg.type === 'image' ? (
                    <div className="border rounded-2xl overflow-hidden bg-white p-1 max-w-xs cursor-pointer" onClick={() => setActiveViewerFile(msg)}>
                      <img src={msg.fileUrl} alt="In-app View" className="w-40 h-auto max-h-40 object-cover rounded-xl" />
                      <p className="text-[10px] p-1 text-black truncate">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-white text-black border rounded-2xl flex items-center space-x-2 cursor-pointer shadow-2xs" onClick={() => setActiveViewerFile(msg)}>
                      <FileText size={16} className="text-amber-700" />
                      <div className="text-left"><p className="text-xs font-bold truncate max-w-[120px]">{msg.content}</p><p className="text-[9px] text-blue-600 uppercase font-bold">{msg.type} 뷰어 열기</p></div>
                    </div>
                  )}

                  {/* 5. 이모지 반응 라인 표시단 */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(msg.reactions).map(([emo, count]) => (
                        <span key={emo} className="bg-white/80 border text-[10px] px-1 rounded-full font-bold text-black">{emo} {count}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 메시지별 정밀 조작 서브 기어 레이블 */}
                <div className="text-right text-[9px] text-gray-400 font-medium">
                  <p>{msg.time}</p>
                  <p className="text-amber-700 font-bold">읽음 {msg.readCount || 1}</p>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 mt-1 transition-opacity">
                    <button onClick={() => setReplyTarget(msg)} className="text-gray-500" title="답장"><Reply size={10} /></button>
                    <button onClick={() => handleAddReaction(msg.id, '👍')} className="text-xs">👍</button>
                    <button onClick={() => handleAddReaction(msg.id, '❤️')} className="text-xs">❤️</button>
                    {msg.isMe && (
                      <>
                        <button onClick={() => { setEditingMessageId(msg.id); setEditMessageText(msg.content.replace(' (수정됨)','')); }} className="text-blue-500">수정</button>
                        <button onClick={() => handleExecuteDeleteMessage(msg.id)} className="text-red-500">삭제</button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}

          {/* 5. 상대방 입력 중 상태 알림 노티바 */}
          {isTyping && (
            <div className="text-[11px] text-gray-500 italic animate-pulse px-2">✍️ {typingUser}님이 열심히 메시지를 입력하고 있습니다...</div>
          )}
        </div>

        {/* 하단 텍스트 및 파일 인젝션 인풋 폼 영역 */}
        <div className="p-3 bg-white border-t text-black flex flex-col space-y-1.5 z-10">
          {replyTarget && (
            <div className="bg-gray-100 text-[11px] p-1.5 rounded-lg flex items-center justify-between">
              <span>↩️ <b>{replyTarget.sender}</b>님에게 답글 연결 모드</span>
              <button onClick={() => setReplyTarget(null)}>❌</button>
            </div>
          )}

          {editingMessageId && (
            <div className="bg-blue-50 p-2 rounded-xl flex gap-2 items-center">
              <input type="text" value={editMessageText} onChange={e => setEditMessageText(e.target.value)} className="w-full text-xs p-1.5 border rounded-lg bg-white" />
              <button onClick={() => handleExecuteUpdateMessage(editingMessageId)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold">변경</button>
              <button onClick={() => setEditingMessageId(null)} className="text-xs text-gray-400">취소</button>
            </div>
          )}

          <form onSubmit={(e) => handleSendMessage(e)} className={`flex items-center space-x-2 border ${t.inputBorder} rounded-xl px-3 py-2 bg-[#FDFBF7]`}>
            <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-black" title="6. 모든 파일 통합 전송">
              <Paperclip size={16} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUploadClick} className="hidden" />

            <input type="text" value={message} onChange={handleInputChange} placeholder="대화 내용을 타이핑하세요..." className="flex-1 bg-transparent border-none outline-none text-xs text-black" />
            <button type="submit" disabled={!message.trim()} className="text-amber-800 font-bold text-xs disabled:opacity-30">보내기</button>
          </form>
        </div>
      </div>

      {/* 👤 3. 프로필 상세 제어 모달창 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs text-black">
          <div className="bg-white border rounded-2xl p-5 max-w-sm w-full">
            <h3 className="font-bold text-sm mb-4">👤 내 계정 프로필 정보 편집</h3>
            <div className="space-y-3 text-xs">
              <div><label className="block mb-1 font-bold text-gray-600">아바타 이미지 URL 변경</label><input type="text" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} className="w-full border p-2 rounded-xl outline-none" /></div>
              <div><label className="block mb-1 font-bold text-gray-600">닉네임/이름 변경</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border p-2 rounded-xl outline-none" /></div>
              <div><label className="block mb-1 font-bold text-gray-600">나의 한줄 상태메시지</label><input type="text" value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full border p-2 rounded-xl outline-none" /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setIsProfileModalOpen(false)} className="w-1/3 bg-gray-100 py-2 rounded-xl text-xs font-bold">닫기</button>
              <button onClick={handleSaveProfile} className="w-2/3 bg-gray-900 text-white py-2 rounded-xl text-xs font-bold">변경사항 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ⏳ ⭐ 9. 타임캡슐 예약 모달창 */}
      {showCapsuleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-black">
          <div className="bg-white border rounded-2xl p-5 max-w-sm w-full">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5"><Clock size={16} /> 미래지향형 타임캡슐 예약 메시지</h3>
            <p className="text-[11px] text-gray-500 mb-3">미래의 특정 시점에 도달하면 대화방에 자동 전달됩니다.</p>
            <div className="space-y-3 text-xs">
              <textarea value={capsuleText} onChange={e => setCapsuleText(e.target.value)} placeholder="미래에 남길 예약 메시지 내용..." className="w-full border p-2 rounded-xl h-20 outline-none" />
              <input type="datetime-local" value={capsuleTime} onChange={e => setCapsuleTime(e.target.value)} className="w-full border p-2 rounded-xl outline-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCapsuleModal(false)} className="w-1/2 bg-gray-100 py-2 rounded-xl text-xs">취소</button>
              <button onClick={handleSaveCapsule} className="w-1/2 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold">캡슐 봉인하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 📂 ⭐ 9. 한 달의 추억 및 추억 보관함 뷰어 모달 */}
      {showMemoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-black">
          <div className="bg-white border rounded-2xl p-5 max-w-sm w-full">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Archive size={16} /> LHJOON 매달의 명언 추억 보관함</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {memories.map(m => (
                <div key={m.id} className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <p className="font-bold text-amber-800 text-[10px]">{m.date} 이달의 핵심 기록 문장</p>
                  <p className="mt-1 font-medium italic">"{m.sentence}"</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowMemoryModal(false)} className="w-full bg-gray-100 py-2 rounded-xl text-xs mt-4 font-bold">닫기</button>
          </div>
        </div>
      )}

      {/* 📅 10. 일정 공유 등록/캘린더 모달 */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-black">
          <div className="bg-white border rounded-2xl p-5 max-w-sm w-full">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Calendar size={16} /> 그룹 실시간 일정 공유</h3>
            <div className="space-y-3 text-xs mb-4">
              <input type="text" placeholder="일정 이름" value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)} className="w-full border p-2 rounded-xl outline-none" />
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full border p-2 rounded-xl outline-none" />
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1 mb-3 text-[11px]">
              {schedules.map(s => <div key={s.id} className="bg-gray-100 p-1.5 rounded-lg">📅 {s.date} - {s.title}</div>)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowScheduleModal(false)} className="w-1/2 bg-gray-100 py-2 rounded-xl text-xs">닫기</button>
              <button onClick={handleSaveSchedule} className="w-1/2 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">공유하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 📝 11. 메모 기능 컴포넌트 모달 */}
      {showMemoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 text-black">
          <div className="bg-white border rounded-2xl p-5 max-w-md w-full">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><FileText size={16} /> 메모 수집 오퍼레이션</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block mb-1 font-bold text-gray-500">🔒 개인 비밀 메모</label>
                <textarea value={personalMemo} onChange={e => { setPersonalMemo(e.target.value); localStorage.setItem('lhjoon_personal_memo', e.target.value); }} className="w-full border p-2 rounded-xl h-32 outline-none bg-yellow-50/40 text-black" placeholder="나만 볼 수 있는 메모..." />
              </div>
              <div>
                <label className="block mb-1 font-bold text-gray-500">👥 그룹 실시간 공유 메모</label>
                <textarea value={sharedMemo} onChange={e => setSharedMemo(e.target.value)} className="w-full border p-2 rounded-xl h-32 outline-none bg-blue-50/40 text-black" placeholder="다 함께 수정하는 공유 메모..." />
              </div>
            </div>
            <button onClick={() => setShowMemoModal(false)} className="w-full bg-gray-900 text-white py-2 rounded-xl text-xs mt-4 font-bold">작업 마침</button>
          </div>
        </div>
      )}

      {/* 📁 6. 인앱 통합 파일 미디어 뷰어 & 다운로드 연동 모달 */}
      {activeViewerFile && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full text-black text-center shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase text-blue-600">[인앱 뷰어 모드] {activeViewerFile.type}</span>
              <button onClick={() => setActiveViewerFile(null)} className="text-xs font-bold">❌ 닫기</button>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl min-h-[160px] flex items-center justify-center border">
              {activeViewerFile.type === 'image' ? (
                <img src={activeViewerFile.fileUrl} alt="In-app preview" className="max-w-full max-h-60 object-contain" />
              ) : activeViewerFile.type === 'video' ? (
                <video src={activeViewerFile.fileUrl} controls className="max-w-full max-h-60" />
              ) : activeViewerFile.type === 'pdf' ? (
                <div className="text-center"><FileText size={48} className="text-red-500 mx-auto" /><p className="text-xs font-bold mt-2">{activeViewerFile.content}</p><p className="text-[11px] text-gray-500">인앱 내장 PDF 가상 샌드박스로 열람 중</p></div>
              ) : (
                <div className="text-center"><FileText size={48} className="text-gray-500 mx-auto" /><p className="text-xs font-bold mt-2">{activeViewerFile.content}</p><p className="text-[11px] text-gray-400">기타 압축/문서 파일 형식 리포트</p></div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <a href={activeViewerFile.fileUrl} download={activeViewerFile.content} className="flex-1 bg-gray-900 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><Download size={14} /> 파일 로컬 기기에 저장 (다운로드)</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

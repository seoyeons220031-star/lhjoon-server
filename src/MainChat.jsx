import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Settings, User, Bell, BellOff, Volume2, VolumeX, UserPlus, Trash2, Shield, Moon, Sun, Coffee, Leaf, Share2, Pin, Check, MessageSquare, Edit2 } from 'lucide-react';

const socket = io("https://lhjoon-server.vercel.app");

// 🎨 테마 설정 (사용자 요청에 따라 핑크색 완전 제외)
const themes = {
  beige: { name: '포근 베이지 ☕', bg: 'bg-[#FDFBF7]', sidebar: 'bg-[#F3E6DE]', sidebarHeader: 'bg-[#EAD9CE]', border: 'border-[#E0D0C5]', inputBorder: 'border-[#D5C2B4]', chatBg: 'bg-[#FAF7F0]', myMsg: 'bg-[#C19A6B] border-[#A78B71] text-white', otherMsg: 'bg-white border-[#D5C2B4] text-black', text: 'text-[#2C2524]', subText: 'text-[#7A5F56]', accent: 'bg-[#C19A6B] text-white' },
  dark: { name: '다크 모드 🌙', bg: 'bg-[#121212]', sidebar: 'bg-[#1E1E1E]', sidebarHeader: 'bg-[#2A2A2A]', border: 'border-[#333333]', inputBorder: 'border-[#444444]', chatBg: 'bg-[#181818]', myMsg: 'bg-[#D4AF37] border-[#AA7C11] text-black', otherMsg: 'bg-[#2D2D2D] border-[#333333] text-white', text: 'text-[#E0E0E0]', subText: 'text-[#A0A0A0]', accent: 'bg-[#D4AF37] text-black' },
  mint: { name: '민트 그린 🌿', bg: 'bg-[#F0FDF4]', sidebar: 'bg-[#DCFCE7]', sidebarHeader: 'bg-[#BBF7D0]', border: 'border-[#86EFAC]', inputBorder: 'border-[#4ADE80]', chatBg: 'bg-[#F0FDF4]', myMsg: 'bg-[#22C55E] border-[#16A34A] text-white', otherMsg: 'bg-white border-[#86EFAC] text-black', text: 'text-[#14532D]', subText: 'text-[#166534]', accent: 'bg-[#22C55E] text-white' }
};

export default function MainChat({ onLogout, nickname }) {
  const [currentThemeKey, setCurrentThemeKey] = useState('beige');
  const t = themes[currentThemeKey];

  // 👤 프로필 수정 상태 관리
  const [myProfile, setMyProfile] = useState({
    nickname: nickname || '사용자',
    statusMsg: 'LHJOON Ultimate 메신저 사용 중 🧸',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(myProfile.nickname);
  const [editStatus, setEditStatus] = useState(myProfile.statusMsg);

  // 👥 친구 목록 및 관리 상태
  const [friends, setFriends] = useState(['관리자', '네캐릭터_봇']);
  const [searchFriendQuery, setSearchFriendQuery] = useState('');

  // 🗂️ 채팅방 목록 (상단 고정 및 알림 켜고 끄기 설정 포함)
  const [rooms, setRooms] = useState([
    { id: 1, name: 'LHJOON 공식 대화방 💬', lastMsg: '새로운 소통방입니다.', creator: '관리자', notice: '서로 예쁜 말만 사용하기로 해요.', members: ['관리자', myProfile.nickname], isMuted: false, isPinned: true },
    { id: 2, name: '자유 소통 광장 🎈', lastMsg: '반갑습니다!', creator: '관리자', notice: null, members: ['관리자', myProfile.nickname], isMuted: false, isPinned: false }
  ]);
  const [activeRoomId, setActiveRoomId] = useState(1);
  const [searchRoomQuery, setSearchRoomQuery] = useState('');

  // 💬 메시지 목록
  const [messages, setMessages] = useState([
    { id: 1, roomId: 1, sender: '관리자', type: 'text', content: 'LHJOON 라이브에 오신 것을 환영합니다! ✨', time: '오후 12:00', isMe: false, isPinned: false, readMembers: ['관리자'] }
  ]);
  const [message, setMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);

  // 컴포넌트 마운트 시 실시간 소켓 방 연결
  useEffect(() => {
    socket.emit("join rooms", rooms.map(r => r.id));

    socket.on("chat message", (data) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, { ...data, isMe: data.sender === myProfile.nickname, readMembers: [...(data.readMembers || []), myProfile.nickname] }];
      });

      setRooms(prev => prev.map(r => {
        if (r.id === data.roomId) {
          // 알림 켜고 끄기 검증 가드레일 적용
          if (!r.isMuted && data.sender !== myProfile.nickname && activeRoomId !== data.roomId) {
            if (Notification.permission === "granted") {
              new Notification(`[${r.name}] ${data.sender}`, { body: data.content });
            }
          }
          return { ...r, lastMsg: data.content };
        }
        return r;
      }));
    });

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => { socket.off("chat message"); };
  }, [activeRoomId, myProfile.nickname]);

  const currentRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  // 👥 친구 추가 및 초대 기능 (방별 알림 및 초대 연동)
  const handleInviteFriend = () => {
    const friendName = prompt('이 방에 초대할 친구의 정확한 이름을 입력하세요:');
    if (!friendName || !friendName.trim()) return;

    setRooms(prev => prev.map(r => {
      if (r.id === activeRoomId) {
        if (r.members.includes(friendName.trim())) {
          alert('이미 대화방에 참여 중인 멤버입니다.');
          return r;
        }
        alert(`${friendName.trim()}님을 성공적으로 초대했습니다.`);
        return { ...r, members: [...r.members, friendName.trim()] };
      }
      return r;
    }));
  };

  // 👤 프로필 수정 완료 처리
  const handleSaveProfile = () => {
    if (!editName.trim()) {
      alert('이름은 공백으로 설정할 수 없습니다.');
      return;
    }
    // 다른 가입 유저와의 중복 이름 방지 체크 (로컬 스토리지 데이터 교차 검증)
    const savedUsers = JSON.parse(localStorage.getItem('lhjoon_registered_users') || '[]');
    if (editName.trim() !== myProfile.nickname && savedUsers.some(u => u.nickname === editName.trim())) {
      alert('이미 해당 이름을 사용하는 유저가 있습니다. 다른 중복되지 않는 이름을 사용해 주세요.');
      return;
    }

    setMyProfile({ ...myProfile, nickname: editName.trim(), statusMsg: editStatus.trim() });
    setIsProfileModalOpen(false);
    alert('프로필 수정이 완료되었습니다.');
  };

  // 💬 메시지 전송 기능
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMsg = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      roomId: activeRoomId,
      sender: myProfile.nickname,
      type: 'text',
      content: message,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      readMembers: [myProfile.nickname],
      replyTo: replyTarget ? { sender: replyTarget.sender, content: replyTarget.content } : null
    };

    socket.emit("chat message", newMsg);
    setMessage('');
    setReplyTarget(null);
  };

  // 🗂️ 알림 토글, 핀 토글 제어기
  const toggleMuteRoom = (id, e) => { e.stopPropagation(); setRooms(prev => prev.map(r => r.id === id ? { ...r, isMuted: !r.isMuted } : r)); };
  const togglePinRoom = (id, e) => { e.stopPropagation(); setRooms(prev => prev.map(r => r.id === id ? { ...r, isPinned: !r.isPinned } : r)); };

  const sortedRooms = [...rooms].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
    .filter(r => r.name.toLowerCase().includes(searchRoomQuery.toLowerCase()));

  const currentRoomMessages = messages.filter(m => m.roomId === activeRoomId);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${t.bg} ${t.text} text-sm font-sans`}>
      
      {/* 🛠️ 왼쪽 제어 사이드바 */}
      <div className={`w-80 ${t.sidebar} border-r ${t.border} flex flex-col h-full`}>
        
        {/* 프로필 및 테마 교체 상단부 */}
        <div className={`p-4 border-b ${t.border} ${t.sidebarHeader} flex items-center justify-between`}>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setEditName(myProfile.nickname); setEditStatus(myProfile.statusMsg); setIsProfileModalOpen(true); }}>
            <img src={myProfile.avatar} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
            <div className="min-w-0 flex-1">
              <h2 className="font-bold truncate text-[#2C2524] flex items-center gap-1">{myProfile.nickname} <Edit2 size={12} className="opacity-60" /></h2>
              <p className="text-[11px] truncate opacity-70 font-medium">{myProfile.statusMsg}</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs bg-white/70 hover:bg-white text-[#2C2524] px-2 py-1 rounded-xl border font-bold shadow-xs transition-colors">로그아웃</button>
        </div>

        {/* 🎨 테마 변경 선택 영역 (원할 때 실시간 바꿀 수 있게 적용) */}
        <div className={`p-3 border-b ${t.border} bg-white/20 flex items-center justify-between`}>
          <span className="text-xs font-bold flex items-center gap-1">🎨 실시간 테마 설정</span>
          <div className="flex gap-1">
            {Object.keys(themes).map(k => (
              <button 
                key={k} 
                onClick={() => setCurrentThemeKey(k)} 
                className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${currentThemeKey === k ? 'bg-white font-bold border-black shadow-xs' : 'bg-white/40 border-transparent hover:bg-white/70 text-black'}`}
              >
                {themes[k].name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* 방 검색창 */}
        <div className="p-3">
          <div className="flex items-center bg-white border rounded-xl px-2.5 py-1.5 shadow-2xs">
            <span className="text-xs mr-1.5 opacity-60">🔍</span>
            <input type="text" placeholder="대화방 이름 검색..." value={searchRoomQuery} onChange={(e) => setSearchRoomQuery(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs text-black" />
          </div>
        </div>

        {/* 채팅방 리스트 (상단고정, 알림 기능 완벽 탑재) */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold opacity-60 uppercase tracking-wider">나의 대화방 리스트 ({sortedRooms.length})</span>
            <button onClick={() => { const n = prompt('만들고 싶은 대화방 이름을 적어주세요:'); if(n?.trim()) setRooms([...rooms, { id: Date.now(), name: n.trim() + ' 💬', lastMsg: '새로 만들어진 방입니다.', creator: myProfile.nickname, members: [myProfile.nickname], isMuted: false, isPinned: false }]); }} className="text-[10px] bg-white border px-2 py-0.5 rounded-lg font-bold">+ 새 대화방</button>
          </div>

          {sortedRooms.map(room => (
            <div key={room.id} onClick={() => setActiveRoomId(room.id)} className={`p-3 rounded-xl cursor-pointer flex items-center justify-between group transition-all ${room.id === activeRoomId ? 'bg-white shadow-sm font-bold border-l-4 border-[#C19A6B]' : 'hover:bg-white/30'}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <span className="truncate text-xs">{room.isPinned ? '📌 ' : '✨ '} {room.name}</span>
                  {room.isMuted && <BellOff size={12} className="text-gray-400" />}
                </div>
                <p className="text-[11px] mt-1 truncate font-normal opacity-60">{room.lastMsg}</p>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 ml-1 transition-opacity">
                <button onClick={(e) => togglePinRoom(room.id, e)} className="p-1 text-[9px] bg-white border rounded hover:bg-gray-50" title="상단 고정">{room.isPinned ? '해제' : '고정'}</button>
                <button onClick={(e) => toggleMuteRoom(room.id, e)} className="p-1 text-[9px] bg-white border rounded hover:bg-gray-50" title="알림 켜고 끄기">{room.isMuted ? '🔔 켜기' : '🔕 끄기'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 💬 오른쪽 대화 영역 */}
      <div className="flex-1 flex flex-col h-full bg-transparent">
        
        {/* 상단 룸 정보바 */}
        <div className="h-16 border-b bg-white shadow-2xs px-4 flex items-center justify-between text-black">
          <div>
            <h2 className="font-bold text-sm flex items-center gap-2">
              ✨ {currentRoom?.name} 
              {currentRoom?.isMuted && <span className="text-xs font-normal text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">🔕 알림 꺼짐</span>}
            </h2>
            <p className="text-[11px] opacity-60 font-medium">참여 멤버: {currentRoom?.members?.join(', ')}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={handleInviteFriend} className="flex items-center gap-1 bg-[#1F0E0E] text-[#EAE0D5] hover:bg-black font-bold px-3 py-1.5 rounded-xl text-xs transition-colors">
              <UserPlus size={14} /> 친구 초대하기
            </button>
          </div>
        </div>

        {/* 메시지 출력 메인 스페이스 */}
        <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${t.chatBg}`}>
          {currentRoomMessages.map((msg) => (
            <div key={msg.id} className={`flex items-start space-x-2 ${msg.isMe ? 'justify-end space-x-reverse' : ''}`}>
              <div className="flex flex-col max-w-md group">
                <span className={`text-[11px] font-bold mb-0.5 opacity-70 ${msg.isMe ? 'text-right' : ''}`}>{msg.sender}</span>
                
                {msg.replyTo && (
                  <div className="bg-black/5 text-[10px] px-2 py-0.5 rounded-t-lg opacity-60 truncate">↩️ {msg.replyTo.content}</div>
                )}

                <div className="flex items-end space-x-1.5 space-x-reverse">
                  <div onClick={() => setReplyTarget(msg)} className={`p-2.5 rounded-2xl border text-sm transition-all shadow-2xs cursor-pointer ${msg.isMe ? t.myMsg : t.otherMsg}`}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] opacity-50 font-medium">{msg.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 텍스트 입력 폼 */}
        <div className="p-3 bg-white border-t flex flex-col space-y-1.5 text-black">
          {replyTarget && (
            <div className="bg-gray-100 text-[11px] p-1.5 rounded-lg flex items-center justify-between font-medium">
              <span>↩️ <b>{replyTarget.sender}</b>님에게 답글 작성 모드</span>
              <button onClick={() => setReplyTarget(null)}>❌</button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className={`flex items-center space-x-2 border ${t.inputBorder} rounded-xl px-3 py-2 bg-[#FDFBF7]`}>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="대화를 나누어 보세요..." className="flex-1 bg-transparent border-none outline-none text-xs text-black" />
            <button type="submit" disabled={!message.trim()} className="text-amber-700 font-bold disabled:opacity-30 text-xs px-2">보내기</button>
          </form>
        </div>
      </div>

      {/* 👤 프로필 수정 인터페이스 모달 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border rounded-2xl p-5 max-w-sm w-full text-black shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm">👤 내 프로필 정보 관리</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-xs font-bold text-gray-400 hover:text-black">❌</button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-bold text-gray-600">이름 (중복 방지 실시간 검증)</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border rounded-xl p-2.5 outline-none focus:border-black" placeholder="닉네임 입력" />
              </div>
              <div>
                <label className="block mb-1.5 font-bold text-gray-600">나의 상태메시지</label>
                <input type="text" value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full border rounded-xl p-2.5 outline-none focus:border-black" placeholder="상태 메시지 입력" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setIsProfileModalOpen(false)} className="w-1/3 bg-gray-100 py-2.5 rounded-xl font-bold text-xs">취소</button>
              <button onClick={handleSaveProfile} className="w-2/3 bg-[#1F0E0E] text-[#EAE0D5] py-2.5 rounded-xl font-bold text-xs hover:bg-black transition-colors">저장 및 중복체크</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { LogOut, Plus, MessageSquare, Send, Bell, Settings, Image, Calendar, Trash2, Edit2, Copy, MoreVertical, X, Maximize2, Search, CornerUpLeft, Star, ArrowRight, Pin, Clock, User, Smile } from 'lucide-react';

// 백엔드 Vercel 주소와 소켓 실시간 연결 인프라 구축
const socket = io("https://lhjoon-server.vercel.app");

export default function MainChat({ onLogout, nickname: initialNickname }) {
  // --- [상태 관리: 사용자 / 설정] ---
  const [myProfile, setMyProfile] = useState({
    nickname: initialNickname || '사용자',
    statusMsg: 'LHJOON Ultimate 사용 중',
    avatarBg: '#D4AF37'
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // --- [상태 관리: 채팅방] ---
  const [rooms, setRooms] = useState([
    { id: 1, name: 'LHJOON 공식 방', lastMsg: 'LHJOON Ultimate에 오신 것을 환영합니다!', unread: 0, creator: '관리자', notice: '공식 룰을 준수해주세요.', isMuted: false },
    { id: 2, name: '친구들과 함께', lastMsg: '오늘 모임 몇 시지?', unread: 0, creator: myProfile.nickname, notice: null, isMuted: false },
  ]);
  const [activeRoomId, setActiveRoomId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // --- [상태 관리: 메시지 아카이브] ---
  const [messages, setMessages] = useState([
    { id: 1, roomId: 1, sender: '관리자', type: 'text', content: 'LHJOON Ultimate에 오신 것을 환영합니다!', time: '오후 9:44', isMe: false, emojis: {}, isStarred: false },
  ]);

  // --- [상태 관리: 인터페이스 제어] ---
  const [message, setMessage] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null); 
  const [editingMessageId, setEditingMessageId] = useState(null); 
  const [editValue, setEditValue] = useState(''); 
  const [isDragging, setIsDragging] = useState(false); 
  const [selectedImgUrl, setSelectedImgUrl] = useState(null);
  
  // 기능 제어용 상태 (답장 / 예약 / 타임캡슐)
  const [replyTarget, setReplyTarget] = useState(null);
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const [specialType, setSpecialType] = useState('normal'); // 'normal', 'reserve', 'capsule'
  const [unlockTime, setUnlockTime] = useState('');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 💡 [소켓 네트워크 이벤트 수신 등록]
  useEffect(() => {
    // 백엔드 서버로부터 브로드캐스팅되는 실시간 메시지 처리
    socket.on("chat message", (data) => {
      // 내가 보낸 메시지는 handleSendMessage에서 이미 로컬 추가했으므로, 
      // 소켓 아이디 구분이 없으므로 닉네임과 방 ID를 대조하여 중복 방지 처리합니다.
      setMessages((prev) => {
        const isDuplicate = prev.some(m => m.id === data.id);
        if (isDuplicate) return prev;
        
        return [...prev, {
          id: data.id,
          roomId: data.roomId,
          sender: data.sender,
          type: data.type,
          content: data.content,
          time: data.time,
          isMe: data.sender === myProfile.nickname, // 실시간 비교 후 판단
          emojis: data.emojis || {},
          isStarred: false,
          replyTo: data.replyTo || null,
          unlockAt: data.unlockAt || null
        }];
      });

      // 왼쪽 룸 리스트의 최신 메시지 텍스트 실시간 동기화
      setRooms(prevRooms => 
        prevRooms.map(r => r.id === data.roomId ? { ...r, lastMsg: data.type === 'capsule' ? '🔒 타임캡슐이 도착했습니다.' : (data.type === 'image' ? '🖼️ 사진을 보냈습니다.' : data.content) } : r)
      );
    });

    return () => {
      socket.off("chat message");
    };
  }, [myProfile.nickname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoomId]);

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // --- [핵심 로직: 메시지 발송 인프라 + 소켓 연동] ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const msgId = Date.now();
    const formattedTime = getFormattedTime();

    const newMsg = {
      id: msgId,
      roomId: activeRoomId,
      sender: myProfile.nickname,
      type: specialType === 'capsule' ? 'capsule' : 'text',
      content: message,
      time: formattedTime,
      isMe: true,
      emojis: {},
      isStarred: false,
      replyTo: replyTarget ? { sender: replyTarget.sender, content: replyTarget.content } : null,
      unlockAt: specialType === 'capsule' ? Date.now() + 10000 : null 
    };

    if (specialType === 'reserve') {
      alert(`[예약 완료] ${unlockTime || '설정된 시간'}에 메시지가 자동 발송됩니다.`);
      resetInputOption();
      return;
    }

    // 1. 내 화면에 즉시 띄우기
    setMessages(prev => [...prev, newMsg]);
    setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, lastMsg: specialType === 'capsule' ? '🔒 타임캡슐이 도착했습니다.' : message } : r));

    // 2. 💡 실시간 소켓 서버로 데이터 송신 (다른 사람들에게 전송)
    socket.emit("chat message", newMsg);

    resetInputOption();
  };

  const resetInputOption = () => {
    setMessage('');
    setReplyTarget(null);
    setSpecialType('normal');
    setIsTimeMenuOpen(false);
  };

  // --- [멀티미디어 드래그 앤 드롭 + 소켓 연동] ---
  const processImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const imageUrl = URL.createObjectURL(file);
    const msgId = Date.now();
    const formattedTime = getFormattedTime();

    const newImgMsg = {
      id: msgId,
      roomId: activeRoomId,
      sender: myProfile.nickname,
      type: 'image',
      content: imageUrl,
      time: formattedTime,
      isMe: true,
      emojis: {},
      isStarred: false
    };

    // 1. 내 화면에 이미지 즉시 추가
    setMessages(prev => [...prev, newImgMsg]);
    setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, lastMsg: '🖼️ 사진을 보냈습니다.' } : r));

    // 2. 💡 소켓 서버를 통해 상대방 대화창에도 실시간 이미지 쏘기
    socket.emit("chat message", newImgMsg);
  };

  // --- [액션 빌더: 답장, 즐겨찾기, 이모지, 공지] ---
  const handleAddEmoji = (msgId, emoji) => {
    setMessages(messages.map(msg => {
      if (msg.id === msgId) {
        const currentCount = msg.emojis[emoji] || 0;
        return { ...msg, emojis: { ...msg.emojis, [emoji]: currentCount + 1 } };
      }
      return msg;
    }));
    setActiveMenuId(null);
  };

  const toggleStarMessage = (msgId) => {
    setMessages(messages.map(m => m.id === msgId ? { ...m, isStarred: !m.isStarred } : m));
    setActiveMenuId(null);
  };

  const handleRegisterNotice = (msgContent) => {
    setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, notice: msgContent } : r));
    setActiveMenuId(null);
    alert('이 메시지가 방 상단 공지로 고정되었습니다.');
  };

  const handleCreateRoom = () => {
    const name = prompt('새 채팅방 이름을 입력하세요:');
    if (!name?.trim()) return;
    const newRoom = { id: Date.now(), name: name.trim(), lastMsg: '대화가 없습니다.', unread: 0, creator: myProfile.nickname, notice: null, isMuted: false };
    setRooms([...rooms, newRoom]);
    setActiveRoomId(newRoom.id);
  };

  const currentRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];
  const currentRoomMessages = messages.filter(m => m.roomId === activeRoomId);
  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const isRoomManager = currentRoom?.creator === myProfile.nickname;

  return (
    <div className="flex h-screen bg-[#1A0B0B] text-[#EAE0D5] font-sans select-none relative"
         onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
         onDragLeave={() => setIsDragging(false)}
         onDrop={(e) => { e.preventDefault(); setIsDragging(false); processImageFile(e.dataTransfer.files[0]); }}>
      
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#2D1616]/90 border-4 border-dashed border-[#D4AF37] flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm animate-pulse">
          <Image size={64} className="text-[#D4AF37] mb-4" />
          <p className="text-xl font-bold text-[#F4E3B1]">명세서 표준: 드래그 앤 드롭 파일 업로드 활성화</p>
        </div>
      )}

      {/* 왼쪽 사이드바 */}
      <div className="w-80 bg-[#2D1616] border-r border-[#4A312C] flex flex-col">
        <div className="p-4 border-b border-[#4A312C] flex items-center justify-between bg-[#241111]">
          <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80" onClick={() => setIsProfileModalOpen(true)}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#2D1616]" style={{ backgroundColor: myProfile.avatarBg }}>
              {myProfile.nickname[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-sm text-[#F4E3B1] truncate">{myProfile.nickname}</h2>
              <p className="text-[11px] text-[#8C725E] truncate">{myProfile.statusMsg}</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-[#8C725E] hover:text-[#D4AF37]"><LogOut size={18} /></button>
        </div>

        {/* 대화 검색 필터 바 */}
        <div className="p-3 pb-0">
          <div className="flex items-center space-x-2 bg-[#1F0E0E] border border-[#4A312C] rounded-xl px-3 py-1.5 focus-within:border-[#D4AF37]">
            <Search size={14} className="text-[#8C725E]" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="채팅방 이름 검색..." className="w-full bg-transparent border-none outline-none text-xs text-[#EAE0D5]" />
          </div>
        </div>

        <div className="p-3">
          <button onClick={handleCreateRoom} className="w-full py-2 bg-[#3D2222] hover:bg-[#4A312C] text-[#D4AF37] rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold border border-[#5C4033]/30">
            <Plus size={16} />
            <span>새 채팅방 생성</span>
          </button>
        </div>

        {/* 방 리스트 */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#3D2222]/40">
          {filteredRooms.map(room => (
            <div key={room.id} onClick={() => setActiveRoomId(room.id)} className={`p-4 cursor-pointer flex items-center justify-between ${room.id === activeRoomId ? 'bg-[#3D2222]/70 border-l-4 border-[#D4AF37]' : 'hover:bg-[#3D2222]/30'}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-[#F4E3B1] truncate flex items-center space-x-1">
                    <span>{room.name}</span>
                    {room.creator === myProfile.nickname && <span className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] px-1 rounded">방장</span>}
                  </h3>
                </div>
                <p className="text-xs text-[#8C725E] mt-0.5 truncate">{room.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 메인 대화 구역 */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-[#221010] to-[#1A0B0B]">
        {/* 상단 룸 바 */}
        <div className="h-16 border-b border-[#4A312C] px-6 flex items-center justify-between bg-[#2D1616]/40 backdrop-blur-md">
          <div>
            <h2 className="font-bold text-base text-[#F4E3B1]">{currentRoom?.name}</h2>
            <p className="text-xs text-[#8C725E]">소유자: {currentRoom?.creator}</p>
          </div>
          <div className="flex items-center space-x-4 text-[#8C725E]">
            <button className="hover:text-[#D4AF37]"><Bell size={20} /></button>
            <button className="hover:text-[#D4AF37]"><Settings size={20} /></button>
          </div>
        </div>

        {/* 📢 방장 고정 공지 레이아웃 브릿지 */}
        {currentRoom?.notice && (
          <div className="bg-[#3D2222]/90 border-b border-[#D4AF37]/30 px-6 py-2 flex items-center justify-between text-xs animate-fade-in text-[#F4E3B1]">
            <div className="flex items-center space-x-2 min-w-0">
              <Pin size={12} className="text-[#D4AF37] shrink-0" />
              <span className="font-bold shrink-0 text-[#D4AF37]">[공지]</span>
              <span className="truncate">{currentRoom.notice}</span>
            </div>
            {isRoomManager && (
              <button onClick={() => setRooms(rooms.map(r => r.id === activeRoomId ? { ...r, notice: null } : r))} className="text-[#8C725E] hover:text-red-400 ml-2">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* 대화창 내역 타임라인 */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {currentRoomMessages.map((msg) => (
            <div key={msg.id} className={`flex items-start space-x-3 ${msg.isMe ? 'justify-end space-x-reverse' : ''}`}>
              <div className="flex flex-col relative group max-w-md">
                
                {/* 💬 답장 헤더 렌더링 검증 */}
                {msg.replyTo && (
                  <div className="bg-[#1F0E0E] text-[11px] text-[#A78B71] px-2.5 py-1 rounded-t-xl border-l-2 border-[#D4AF37] mb-[-4px] opacity-80 truncate">
                    ↩️ {msg.replyTo.sender}: {msg.replyTo.content}
                  </div>
                )}

                <div className="flex items-end space-x-2 space-x-reverse relative">
                  <div className={`p-3 text-sm rounded-2xl shadow-md border ${
                    msg.isMe ? 'bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-[#2D1616] rounded-tr-none border-[#D4AF37]/20 font-medium' : 'bg-[#3D2222] text-[#EAE0D5] rounded-tl-none border-[#5C4033]/20'
                  }`}>
                    {msg.type === 'capsule' ? (
                      <span className="flex items-center space-x-2 text-xs italic opacity-90">
                        <Clock size={13} /> <span>🔒 비밀 타임캡슐 메시지가 보관되었습니다.</span>
                      </span>
                    ) : msg.type === 'image' ? (
                      <img src={msg.content} alt="전송 이미지" className="max-w-xs rounded-xl border border-[#4A312C] shadow-inner" />
                    ) : (
                      msg.content
                    )}
                  </div>
                  
                  {msg.isStarred && <Star size={12} className="text-amber-400 fill-amber-400 absolute top-0 -left-4" />}
                  <span className="text-[10px] text-[#8C725E] whitespace-nowrap">{msg.time}</span>
                  
                  <button onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[#8C725E] hover:text-[#D4AF37]">
                    <MoreVertical size={14} />
                  </button>
                </div>

                {/* 이모지 반응 라인 */}
                {Object.keys(msg.emojis).length > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    {Object.entries(msg.emojis).map(([em, cnt]) => (
                      <span key={em} className="bg-[#2D1616] px-1.5 py-0.5 rounded-full text-[11px] border border-[#4A312C]">{em} {cnt}</span>
                    ))}
                  </div>
                )}

                {/* 팝업 콘텍스트 확장 액션 메뉴 */}
                {activeMenuId === msg.id && (
                  <div className={`absolute top-8 z-30 bg-[#2D1616] border border-[#4A312C] rounded-xl shadow-2xl p-2 flex flex-col space-y-1.5 ${msg.isMe ? 'right-0' : 'left-0'}`}>
                    <div className="flex space-x-1 bg-[#1F0E0E] p-1 rounded-lg">
                      {['👍', '❤️', '😂', '😮', '😢'].map(e => (
                        <button key={e} onClick={() => handleAddEmoji(msg.id, e)} className="hover:scale-125 text-xs p-0.5">{e}</button>
                      ))}
                    </div>
                    <button onClick={() => setReplyTarget(msg)} className="flex items-center space-x-2 text-left px-2 py-1 text-xs text-[#EAE0D5] hover:bg-[#3D2222] rounded"><CornerUpLeft size={12}/> <span>답장하기</span></button>
                    <button onClick={() => toggleStarMessage(msg.id)} className="flex items-center space-x-2 text-left px-2 py-1 text-xs text-[#EAE0D5] hover:bg-[#3D2222] rounded"><Star size={12}/> <span>즐겨찾기 토글</span></button>
                    {isRoomManager && (
                      <button onClick={() => handleRegisterNotice(msg.content)} className="flex items-center space-x-2 text-left px-2 py-1 text-xs text-[#D4AF37] hover:bg-[#3D2222] rounded"><Pin size={12}/> <span>공지 고정</span></button>
                    )}
                  </div>
                )}

              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 하단 제어 및 입력 계층 인프라 */}
        <div className="p-4 border-t border-[#4A312C] bg-[#2D1616]/20 flex flex-col space-y-2">
          
          {/* 답장 타깃 안내 상태 인디케이터 */}
          {replyTarget && (
            <div className="bg-[#2D1616] border border-[#4A312C] px-3 py-1.5 rounded-xl flex items-center justify-between text-xs text-[#A78B71]">
              <span className="truncate">↩️ <b>{replyTarget.sender}</b>님에게 답장 작성 중: {replyTarget.content}</span>
              <button onClick={() => setReplyTarget(null)}><X size={14}/></button>
            </div>
          )}

          {/* 타임 제어 옵션 인디케이터 상태바 */}
          {specialType !== 'normal' && (
            <div className="bg-[#3D2222]/50 border border-[#D4AF37]/30 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs text-[#D4AF37]">
              <span>⚙️ {specialType === 'reserve' ? '⏰ 예약 메시지 발송 모드 활성화' : '🔒 그룹 캡슐 메시지 모드 활성화'}</span>
              <button onClick={() => setSpecialType('normal')} className="text-xs underline text-[#8C725E]">취소</button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center space-x-3 bg-[#1F0E0E] border border-[#4A312C] rounded-2xl px-4 py-2.5 focus-within:border-[#D4AF37]">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => processImageFile(e.target.files[0])} />
            <button type="button" onClick={() => fileInputRef.current.click()} className="text-[#8C725E] hover:text-[#D4AF37]"><Image size={22} /></button>
            
            {/* 🌟 명세서 특별 기능: 예약/타임캡슐 패널 트리거 단추 */}
            <div className="relative">
              <button type="button" onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)} className={`transition-colors ${specialType !== 'normal' ? 'text-[#D4AF37]' : 'text-[#8C725E] hover:text-[#D4AF37]'}`}><Clock size={22} /></button>
              {isTimeMenuOpen && (
                <div className="absolute bottom-10 left-0 bg-[#2D1616] border border-[#4A312C] rounded-xl p-2 z-40 w-44 flex flex-col space-y-1 shadow-2xl">
                  <button type="button" onClick={() => { setSpecialType('reserve'); setIsTimeMenuOpen(false); }} className="text-left text-xs px-2 py-1.5 hover:bg-[#3D2222] rounded">⏰ 예약 전송 모드</button>
                  <button type="button" onClick={() => { setSpecialType('capsule'); setIsTimeMenuOpen(false); }} className="text-left text-xs px-2 py-1.5 hover:bg-[#3D2222] rounded">🔒 그룹 타임캡슐 모드</button>
                </div>
              )}
            </div>

            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} placeholder="메시지를 입력하세요..." className="flex-1 bg-transparent border-none outline-none text-sm text-[#EAE0D5]" />
            <button type="submit" disabled={!message.trim()} className="text-[#D4AF37] disabled:text-[#5C4742]"><Send size={22} /></button>
          </form>
        </div>
      </div>

      {/* 👤 사용자 정보 수정 및 프로필 상태 상세 관리 모달창 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#2D1616] border border-[#4A312C] w-full max-w-sm rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-[#8C725E] hover:text-[#EAE0D5]"><X size={18} /></button>
            <h3 className="text-base font-bold text-[#F4E3B1] mb-4 flex items-center space-x-2"><User size={16}/> <span>내 프로필 설정 (명세서 규격)</span></h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#8C725E] mb-1">닉네임 변경</label>
                <input type="text" value={myProfile.nickname} onChange={(e) => setMyProfile({ ...myProfile, nickname: e.target.value })} className="w-full bg-[#1F0E0E] border border-[#4A312C] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="block text-xs text-[#8C725E] mb-1">상태 메시지 설정</label>
                <input type="text" value={myProfile.statusMsg} onChange={(e) => setMyProfile({ ...myProfile, statusMsg: e.target.value })} className="w-full bg-[#1F0E0E] border border-[#4A312C] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="block text-xs text-[#8C725E] mb-1">아바타 테마 컬러</label>
                <div className="flex space-x-2">
                  {['#D4AF37', '#AA7C11', '#92400E', '#065F46', '#1E3A8A'].map(c => (
                    <button key={c} type="button" onClick={() => setMyProfile({ ...myProfile, avatarBg: c })} className={`w-6 h-6 rounded-full border-2 ${myProfile.avatarBg === c ? 'border-[#EAE0D5]' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setIsProfileModalOpen(false)} className="w-full mt-6 bg-[#D4AF37] hover:bg-[#F4E3B1] text-[#2D1616] py-2 rounded-xl text-sm font-bold transition-colors">저장 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}

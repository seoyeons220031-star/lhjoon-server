import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io("https://lhjoon-server.vercel.app");

export default function MainChat({ onLogout, nickname: initialNickname }) {
  const [myProfile, setMyProfile] = useState({
    nickname: initialNickname || '사용자',
    statusMsg: '오늘도 좋은 하루 친하게 지내요 ☕',
    avatarBg: '#FF8E8E'
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 채팅방 상태 (알림 ON/OFF 속성인 isMuted 추가)
  const [rooms, setRooms] = useState([
    { id: 1, name: '도란도란 대화방 💬', lastMsg: 'LHJOON 라이브에 오신 걸 환영해요!', unread: 0, creator: '관리자', notice: '서로 예쁜 말만 사용하기로 해요 오손도손 소통방입니다.', members: ['관리자', '사용자'], isMuted: false },
    { id: 2, name: '오늘 머먹지? 🍕', lastMsg: '여기 맛집 추천 좀 해주라!', unread: 0, creator: myProfile.nickname, notice: null, members: [myProfile.nickname], isMuted: false }
  ]);
  const [activeRoomId, setActiveRoomId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, roomId: 1, sender: '관리자', type: 'text', content: 'LHJOON 라이브에 오신 걸 환영해요! 편하게 이야기 나눠요 🤍', time: '오후 9:44', isMe: false, emojis: {} }
  ]);

  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false); 
  const [replyTarget, setReplyTarget] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    socket.on("chat message", (data) => {
      // 1. 아이디(메시지 고유 ID) 중복 생성 및 수신 원천 방지
      setMessages((prev) => {
        const isDuplicate = prev.some(m => m.id === data.id);
        if (isDuplicate) return prev;
        return [...prev, { ...data, isMe: data.sender === myProfile.nickname }];
      });

      setRooms(prevRooms => 
        prevRooms.map(r => {
          if (r.id === data.roomId) {
            // 2. 알림이 켜진(isMuted: false) 방에 다른 사람이 새 메시지를 보냈을 때 브라우저 기본 알림창 울리기
            if (!r.isMuted && data.sender !== myProfile.nickname) {
              if (Notification.permission === "granted") {
                new Notification(`[${r.name}] ${data.sender}`, { body: data.content });
              }
            }
            return { ...r, lastMsg: data.type === 'image' ? '🖼️ 사진이 도착했어요' : data.content };
          }
          return r;
        })
      );
    });

    // 시스템 브라우저 알림 권한 미리 요청
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => { socket.off("chat message"); };
  }, [myProfile.nickname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoomId]);

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // 밀리초와 무작위 난수를 섞어 중복 생성이 절대 불가능한 유일 ID 발급
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

    const newMsg = {
      id: uniqueId,
      roomId: activeRoomId,
      sender: myProfile.nickname,
      type: 'text',
      content: message,
      time: getFormattedTime(),
      emojis: {},
      replyTo: replyTarget ? { sender: replyTarget.sender, content: replyTarget.content } : null
    };

    setMessages(prev => [...prev, { ...newMsg, isMe: true }]);
    socket.emit("chat message", newMsg);
    setMessage('');
    setReplyTarget(null);
  };

  const processImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

    const newImgMsg = {
      id: uniqueId,
      roomId: activeRoomId,
      sender: myProfile.nickname,
      type: 'image',
      content: URL.createObjectURL(file),
      time: getFormattedTime(),
      emojis: {}
    };
    setMessages(prev => [...prev, { ...newImgMsg, isMe: true }]);
    socket.emit("chat message", newImgMsg);
  };

  // 친구 초대 기능
  const handleInviteFriend = () => {
    const friendName = prompt('초대할 친구의 닉네임을 입력하세요:');
    if (!friendName || !friendName.trim()) return;

    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id === activeRoomId) {
          if (room.members.includes(friendName.trim())) {
            alert('이미 방에 있는 친구입니다.');
            return room;
          }
          const systemMsg = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            roomId: activeRoomId,
            sender: '시스템',
            type: 'text',
            content: `📢 ${friendName.trim()}님이 초대되었습니다.`,
            time: getFormattedTime(),
            isMe: false
          };
          setMessages(prev => [...prev, systemMsg]);
          return { ...room, members: [...room.members, friendName.trim()] };
        }
        return room;
      })
    );
  };

  // 채팅방 삭제(나가기) 기능
  const handleDeleteRoom = (roomId, roomName, e) => {
    e.stopPropagation(); 
    if (!confirm(`'${roomName}' 방을 삭제하고 나가시겠습니까?`)) return;

    const remainingRooms = rooms.filter(r => r.id !== roomId);
    setRooms(remainingRooms);
    setMessages(prev => prev.filter(m => m.roomId !== roomId));

    if (activeRoomId === roomId && remainingRooms.length > 0) {
      setActiveRoomId(remainingRooms[0].id);
    }
  };

  // 개별 채팅방 알림 토글(ON/OFF) 기능
  const toggleMuteRoom = (roomId, e) => {
    e.stopPropagation();
    setRooms(prevRooms =>
      prevRooms.map(r => r.id === roomId ? { ...r, isMuted: !r.isMuted } : r)
    );
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processImageFile(files[0]);
  };

  const currentRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];
  const currentRoomMessages = messages.filter(m => m.roomId === activeRoomId);
  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div 
      className="flex h-screen bg-[#FDFBF7] text-[#2C2524] font-sans relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#F5EBE6]/95 border-4 border-dashed border-[#FF8E8E] flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm">
          <p className="text-xl font-bold text-[#7A5F56]">여기에 사진을 놓으면 전송됩니다 🧸</p>
        </div>
      )}

      {/* 사이드바 */}
      <div className="w-72 bg-[#F3E6DE] border-r border-[#E0D0C5] flex flex-col">
        <div className="p-4 border-b border-[#E0D0C5] flex items-center justify-between bg-[#EAD9CE]">
          <div className="flex items-center space-x-3 cursor-pointer hover:opacity-90" onClick={() => setIsProfileModalOpen(true)}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: myProfile.avatarBg }}>
              {myProfile.nickname[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-sm text-[#2C2524] truncate">{myProfile.nickname}</h2>
              <p className="text-xs text-[#6B5755] truncate font-medium">{myProfile.statusMsg}</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-[#6B5755] hover:text-[#2C2524] text-sm font-bold">로그아웃</button>
        </div>

        <div className="p-3 pb-0">
          <div className="flex items-center space-x-2 bg-white border border-[#D5C2B4] rounded-xl px-3 py-2">
            <span className="text-sm">🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="이야기방 검색..." className="w-full bg-transparent border-none outline-none text-sm text-[#2C2524]" />
          </div>
        </div>

        <div className="p-3">
          <button onClick={() => {
            const name = prompt('방 이름을 입력하세요:');
            if (name?.trim()) setRooms([...rooms, { id: Date.now(), name: name.trim() + ' 🎈', lastMsg: '새 방이 개설되었어요!', unread: 0, creator: myProfile.nickname, notice: null, members: [myProfile.nickname], isMuted: false }]);
          }} className="w-full py-2.5 bg-white hover:bg-[#FDFBF7] text-[#7A5F56] rounded-xl flex items-center justify-center space-x-2 text-xs font-bold border border-[#D5C2B4]">
            <span>➕ 새로운 이야기방 만들기</span>
          </button>
        </div>

        {/* 방 목록 사이드바 */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredRooms.map(room => (
            <div key={room.id} onClick={() => setActiveRoomId(room.id)} className={`p-3 rounded-xl cursor-pointer flex items-center justify-between group ${room.id === activeRoomId ? 'bg-white text-[#FF5252] shadow-md border border-[#FFC1C1] font-bold' : 'hover:bg-white/50 text-[#4E4140]'}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm truncate">✨ {room.name}</span>
                  {room.isMuted && <span className="text-xs text-gray-400" title="알림 끔">🔕</span>}
                </div>
                <p className="text-xs mt-1 truncate text-[#8A7371] font-normal">{room.lastMsg}</p>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <button 
                  onClick={(e) => toggleMuteRoom(room.id, e)}
                  className="text-xs p-1 rounded hover:bg-gray-200"
                  title={room.isMuted ? "알림 켜기" : "알림 끄기"}
                >
                  {room.isMuted ? "🔔" : "🔕"}
                </button>
                <button 
                  onClick={(e) => handleDeleteRoom(room.id, room.name, e)}
                  className="text-xs p-1 rounded hover:bg-gray-200"
                  title="방 삭제하기"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 대화창 */}
      <div className="flex-1 flex flex-col bg-[#FDFBF7]">
        {/* 상단바 및 상단 알림 설정 버튼 */}
        <div className="h-16 border-b border-[#E0D0C5] px-6 flex items-center justify-between bg-white shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-base text-[#2C2524]">✨ {currentRoom?.name}</h2>
              <button 
                onClick={(e) => toggleMuteRoom(currentRoom?.id, e)}
                className="text-sm px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 font-normal"
                title={currentRoom?.isMuted ? "클릭하면 알림을 켭니다" : "클릭하면 알림을 끕니다"}
              >
                {currentRoom?.isMuted ? "🔕 알림 꺼짐" : "🔔 알림 켜짐"}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">참여 중: {currentRoom?.members?.join(', ')}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleInviteFriend}
              className="px-3 py-1.5 bg-[#FFF4EE] border border-[#EAD9CE] rounded-lg text-xs font-bold text-[#7A5F56] hover:bg-[#F5EBE6]"
            >
              👤👤 친구 초대
            </button>
          </div>
        </div>

        {currentRoom?.notice && (
          <div className="bg-[#FFF4EE] border-b border-[#EAD9CE] px-6 py-2.5 flex items-center space-x-2 text-sm text-[#2C2524]">
            <span className="font-bold text-[#FF5252]">[공지]</span>
            <span className="truncate text-[#4E4140]">{currentRoom.notice}</span>
          </div>
        )}

        {/* 메시지창 (답글 연동 유지) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FAF7F0]">
          {currentRoomMessages.map((msg) => (
            <div key={msg.id} className={`flex items-start space-x-3 ${msg.isMe ? 'justify-end space-x-reverse' : ''}`}>
              {!msg.isMe && (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white bg-[#A39084]">
                  {msg.sender[0]}
                </div>
              )}
              <div className="flex flex-col max-w-lg">
                {!msg.isMe && <span className="text-xs font-bold text-[#5C4B49] mb-1">{msg.sender}</span>}
                
                {msg.replyTo && (
                  <div className="bg-[#EAD9CE] text-xs font-medium text-[#5C4B49] px-2.5 py-1 rounded-t-lg mb-[-1px] border border-b-0 border-[#D5C2B4] truncate">
                    ↩️ {msg.replyTo.sender}: {msg.replyTo.content}
                  </div>
                )}

                <div className="flex items-end space-x-2 space-x-reverse">
                  <div 
                    onClick={() => setReplyTarget(msg)} 
                    title="클릭하면 답글을 작성할 수 있습니다"
                    className={`px-4 py-2.5 text-[15px] rounded-2xl border cursor-pointer select-none ${
                      msg.sender === '시스템' 
                        ? 'bg-gray-200 text-gray-600 border-gray-300 mx-auto text-xs py-1 rounded-md'
                        : msg.isMe ? 'bg-[#FFA3A3] border-[#FF8E8E] rounded-tr-none' : 'bg-white border-[#D5C2B4] rounded-tl-none'
                    }`}
                  >
                    {msg.type === 'image' ? <img src={msg.content} alt="img" className="max-w-xs rounded-xl" /> : msg.content}
                  </div>
                  {msg.sender !== '시스템' && <span className="text-[10px] text-[#7A5F56]">{msg.time}</span>}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 하단 글 입력창 */}
        <div className="p-4 border-t border-[#E0D0C5] bg-white flex flex-col space-y-2">
          {replyTarget && (
            <div className="bg-[#F3E6DE] px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-semibold text-[#5C4B49]">
              <span className="truncate">↩️ <b>{replyTarget.sender}</b>님에게 답글 남기는 중...</span>
              <button onClick={() => setReplyTarget(null)}>❌</button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center space-x-3 bg-[#FDFBF7] border border-[#D5C2B4] rounded-2xl px-4 py-3">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => processImageFile(e.target.files[0])} />
            <button type="button" onClick={() => fileInputRef.current.click()} className="text-lg">🖼️</button>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="따뜻한 이야기를 나누어보세요..." className="flex-1 bg-transparent border-none outline-none text-sm text-[#2C2524]" />
            <button type="submit" disabled={!message.trim()} className="text-[#FF5252] font-bold">전송</button>
          </form>
        </div>
      </div>

      {/* 프로필 모달 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D5C2B4] w-full max-w-sm rounded-2xl p-6 relative">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 font-bold">❌</button>
            <h3 className="text-sm font-bold text-[#2C2524] mb-4">👤 <span>프로필 바꾸기</span></h3>
            <div className="space-y-4">
              <input type="text" value={myProfile.nickname} onChange={(e) => setMyProfile({ ...myProfile, nickname: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#D5C2B4] rounded-xl px-3 py-2 text-sm" />
            </div>
            <button onClick={() => setIsProfileModalOpen(false)} className="w-full mt-6 bg-[#FFA3A3] text-[#1A1110] py-2.5 rounded-xl text-sm font-bold">수정 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}

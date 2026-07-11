import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { LogOut, Plus, Image, X, Search, Pin, User, Bell, Settings } from 'lucide-react';

const socket = io("https://lhjoon-server.vercel.app");

export default function MainChat({ onLogout, nickname: initialNickname }) {
  const [myProfile, setMyProfile] = useState({
    nickname: initialNickname || '사용자',
    statusMsg: '오늘도 좋은 하루 친하게 지내요 ☕',
    avatarBg: '#FF8E8E'
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [rooms, setRooms] = useState([
    { id: 1, name: '도란도란 대화방 💬', lastMsg: 'LHJOON 라이브에 오신 걸 환영해요!', unread: 0, creator: '관리자', notice: '서로 예쁜 말만 사용하기로 해요 오손도손 소통방입니다.', isMuted: false },
    { id: 2, name: '오늘 머먹지? 🍕', lastMsg: '여기 맛집 추천 좀 해주라!', unread: 0, creator: myProfile.nickname, notice: null, isMuted: false }
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
      setMessages((prev) => {
        const isDuplicate = prev.some(m => m.id === data.id);
        if (isDuplicate) return prev;
        return [...prev, { ...data, isMe: data.sender === myProfile.nickname }];
      });
      setRooms(prevRooms => 
        prevRooms.map(r => r.id === data.roomId ? { ...r, lastMsg: data.type === 'image' ? '🖼️ 사진이 도착했어요' : data.content } : r)
      );
    });
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

    const newMsg = {
      id: Date.now(),
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
    const newImgMsg = {
      id: Date.now(),
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

  const currentRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];
  const currentRoomMessages = messages.filter(m => m.roomId === activeRoomId);
  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-[#2C2524] font-sans relative">
      {/* 사이드바 */}
      <div className="w-72 bg-[#F3E6DE] border-r border-[#E0D0C5] flex flex-col">
        <div className="p-4 border-b border-[#E0D0C5] flex items-center justify-between bg-[#EAD9CE]">
          <div className="flex items-center space-x-3 cursor-pointer hover:opacity-90" onClick={() => setIsProfileModalOpen(true)}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm text-sm" style={{ backgroundColor: myProfile.avatarBg }}>
              {myProfile.nickname[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-sm text-[#2C2524] truncate">{myProfile.nickname}</h2>
              <p className="text-xs text-[#6B5755] truncate font-medium">{myProfile.statusMsg}</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-[#6B5755] hover:text-[#2C2524] transition-colors">
            <LogOut size={18} />
          </button>
        </div>

        <div className="p-3 pb-0">
          <div className="flex items-center space-x-2 bg-white border border-[#D5C2B4] rounded-xl px-3 py-2">
            <Search size={16} className="text-[#8A7371]" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="이야기방 검색..." className="w-full bg-transparent border-none outline-none text-sm text-[#2C2524]" />
          </div>
        </div>

        <div className="p-3">
          <button onClick={() => {
            const name = prompt('방 이름을 입력하세요:');
            if (name?.trim()) setRooms([...rooms, { id: Date.now(), name: name.trim() + ' 🎈', lastMsg: '새 방이 개설되었어요!', unread: 0, creator: myProfile.nickname, notice: null }]);
          }} className="w-full py-2.5 bg-white hover:bg-[#FDFBF7] text-[#7A5F56] rounded-xl flex items-center justify-center space-x-2 text-xs font-bold border border-[#D5C2B4]">
            <Plus size={16} />
            <span>새로운 이야기방 만들기</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredRooms.map(room => (
            <div key={room.id} onClick={() => setActiveRoomId(room.id)} className={`p-3 rounded-xl cursor-pointer flex items-center justify-between ${room.id === activeRoomId ? 'bg-white text-[#FF5252] shadow-md border border-[#FFC1C1] font-bold' : 'hover:bg-white/50 text-[#4E4140]'}`}>
              <div className="min-w-0 flex-1">
                <span className="text-sm truncate block">✨ {room.name}</span>
                <p className="text-xs mt-1 truncate text-[#8A7371]">{room.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 대화창 */}
      <div className="flex-1 flex flex-col bg-[#FDFBF7]">
        <div className="h-16 border-b border-[#E0D0C5] px-6 flex items-center justify-between bg-white shadow-sm">
          <h2 className="font-bold text-base text-[#2C2524]">✨ {currentRoom?.name}</h2>
          <div className="flex items-center space-x-4 text-[#7A5F56]">
            <Bell size={20} />
            <Settings size={20} />
          </div>
        </div>

        {currentRoom?.notice && (
          <div className="bg-[#FFF4EE] border-b border-[#EAD9CE] px-6 py-2.5 flex items-center space-x-2 text-sm text-[#2C2524]">
            <Pin size={14} className="text-[#FF5252]" />
            <span className="font-bold text-[#FF5252]">[공지]</span>
            <span className="truncate text-[#4E4140]">{currentRoom.notice}</span>
          </div>
        )}

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
                <div className="flex items-end space-x-2 space-x-reverse">
                  <div className={`px-4 py-2.5 text-[15px] rounded-2xl border ${msg.isMe ? 'bg-[#FFA3A3] border-[#FF8E8E]' : 'bg-white border-[#D5C2B4]'}`}>
                    {msg.type === 'image' ? <img src={msg.content} alt="img" className="max-w-xs rounded-xl" /> : msg.content}
                  </div>
                  <span className="text-[10px] text-[#7A5F56]">{msg.time}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-[#E0D0C5] bg-white flex flex-col space-y-2">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3 bg-[#FDFBF7] border border-[#D5C2B4] rounded-2xl px-4 py-3">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => processImageFile(e.target.files[0])} />
            <button type="button" onClick={() => fileInputRef.current.click()} className="text-[#7A5F56]"><Image size={20} /></button>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="따뜻한 이야기를 나누어보세요..." className="flex-1 bg-transparent border-none outline-none text-sm text-[#2C2524]" />
            <button type="submit" disabled={!message.trim()} className="text-[#FF5252] font-bold">전송</button>
          </form>
        </div>
      </div>

      {/* 모달 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D5C2B4] w-full max-w-sm rounded-2xl p-6 relative">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-[#7A5F56]"><X size={18} /></button>
            <h3 className="text-sm font-bold text-[#2C2524] mb-4 flex items-center space-x-2"><User size={16}/> <span>프로필 바꾸기</span></h3>
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

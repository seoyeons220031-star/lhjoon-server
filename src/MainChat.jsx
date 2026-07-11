import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Edit2, UserPlus, BellOff, Trash2, Shield, Calendar, FileText, Search, 
  Clock, Heart, Archive, Smile, Reply, Paperclip, MoreVertical, Check, Eye, Download, MessageSquare, ShieldAlert, DownloadCloud, Settings, Menu, X
} from 'lucide-react';

const socket = io("https://lhjoon-server.vercel.app");

const LHJOON_LOGO_URL = '/logo.png';

const themes = {
  blue: { 
    name: '클래식 블루 💙', 
    bg: 'bg-[#000000]', 
    sidebar: 'bg-[#0f172a]', 
    sidebarHeader: 'bg-[#1e293b]', 
    border: 'border-[#334155]', 
    inputBorder: 'border-[#475569]', 
    chatBg: 'bg-[#090d16]', 
    myMsg: 'bg-[#1e40af] border-[#3b82f6] text-white font-semibold', 
    otherMsg: 'bg-[#334155] border-[#475569] text-white font-semibold', 
    text: 'text-[#f8fafc]', 
    accent: 'bg-[#3b82f6] text-white' 
  },
  green: { 
    name: '포레스트 그린 🌿', 
    bg: 'bg-[#000000]', 
    sidebar: 'bg-[#022c22]', 
    sidebarHeader: 'bg-[#064e3b]', 
    border: 'border-[#0f766e]', 
    inputBorder: 'border-[#115e59]', 
    chatBg: 'bg-[#021e17]', 
    myMsg: 'bg-[#065f46] border-[#10b981] text-white font-semibold', 
    otherMsg: 'bg-[#115e59] border-[#14b8a6] text-white font-semibold', 
    text: 'text-[#f0fdf4]', 
    accent: 'bg-[#22c55e] text-white' 
  },
  dark: { 
    name: '미드나잇 다크 🌙', 
    bg: 'bg-[#000000]', 
    sidebar: 'bg-[#020617]', 
    sidebarHeader: 'bg-[#0f172a]', 
    border: 'border-[#1e293b]', 
    inputBorder: 'border-[#334155]', 
    chatBg: 'bg-[#090d16]', 
    myMsg: 'bg-[#1e293b] border-[#475569] text-white font-semibold', 
    otherMsg: 'bg-[#334155] border-[#475569] text-white font-semibold', 
    text: 'text-[#f8fafc]', 
    accent: 'bg-[#38bdf8] text-black' 
  }
};

export default function MainChat({ onLogout, nickname, savedPin, setSavedPin }) {
  const [currentThemeKey, setCurrentThemeKey] = useState('green');
  const t = themes[currentThemeKey];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [myProfile, setMyProfile] = useState({
    nickname: nickname || '사용자',
    statusMsg: 'LHJOON Ultimate 메신저 사용 중 🧸',
    avatar: LHJOON_LOGO_URL
  });

  const [friends, setFriends] = useState([{ name: '관리자', email: 'admin@lhjoon.com', isBlocked: false }]);
  const [rooms, setRooms] = useState([
    { id: 1, name: 'LHJOON 공식 대화방 💬', lastMsg: '새로운 소통방입니다.', creator: '관리자', members: ['관리자', myProfile.nickname], isMuted: false, isPinned: true }
  ]);
  const [activeRoomId, setActiveRoomId] = useState(1);

  const [messages, setMessages] = useState([
    { id: 1, roomId: 1, sender: '관리자', type: 'text', content: 'LHJOON 라이브에 오신 것을 환영합니다! ✨', time: '오후 12:00', isMe: false, reactions: {} }
  ]);
  const [message, setMessage] = useState('');
  const [integratedSearchQuery, setIntegratedSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    socket.emit("join rooms", rooms.map(r => r.id));

    socket.on("chat message", (data) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, { ...data, isMe: data.sender === myProfile.nickname }];
      });
      setRooms(prev => prev.map(r => r.id === data.roomId ? { ...r, lastMsg: data.type === 'text' ? data.content : '[파일 전송됨]' } : r));
    });

    return () => {
      socket.off("chat message");
    };
  }, [rooms, myProfile.nickname]);

  // 💬 텍스트 대화 전송 핸들러
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
      isMe: true
    };

    setMessages((prev) => [...prev, newMsg]);
    socket.emit("chat message", newMsg);
    setMessage('');
  };

  // 📁 [수정완료] 파일 및 이미지 전송 핵심 비동기 처리 함수
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
      isMe: true
    };

    // 로컬 화면에 즉시 노출 시키고 서버로 공유
    setMessages((prev) => [...prev, fileMsg]);
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, lastMsg: `[파일] ${file.name}` } : r));
    socket.emit("chat message", fileMsg);

    // 인풋 값 초기화 (동일 파일 연속 업로드 가능용)
    e.target.value = '';
  };

  const currentRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];
  const filteredMessages = messages.filter(m => m.roomId === activeRoomId);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${t.bg} ${t.text} text-sm font-sans bg-black p-2 relative`}>
      
      {/* 왼쪽 사이드바 */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 mr-2' : 'w-0 opacity-0 pointer-events-none mr-0'} ${t.sidebar} border rounded-2xl ${t.border} flex flex-col h-full z-10 shadow-lg overflow-hidden`}>
        <div className={`p-4 border-b ${t.border} ${t.sidebarHeader} flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <img src={myProfile.avatar} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-white" />
            <div className="min-w-0">
              <h2 className="font-bold truncate text-white text-sm">{myProfile.nickname}</h2>
              <p className="text-[11px] truncate text-gray-300">{myProfile.statusMsg}</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-3 bg-zinc-950/30 flex-1 overflow-y-auto">
          <p className="text-[11px] font-bold text-gray-300 mb-2 px-1">채팅방 리스트</p>
          {rooms.map(room => (
            <div key={room.id} className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-white font-bold text-xs">
              💬 {room.name}
            </div>
          ))}
        </div>
      </div>

      {/* 우측 메인 대화 영역 */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden relative">
        <div className="h-16 border-b border-zinc-800 bg-zinc-900 px-4 flex items-center text-white z-10">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-2.5 text-white bg-zinc-800 rounded-xl hover:bg-zinc-700">
              <Menu size={18} />
            </button>
          )}
          <h2 className="font-bold text-sm">{currentRoom?.name}</h2>
        </div>

        {/* 메시지 출력 리스트 및 이미지 분기 필터링 구현 */}
        <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${t.chatBg}`}>
          {filteredMessages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[11px] mb-0.5 px-1.5 py-0.2 bg-zinc-800/60 rounded font-bold text-white">{msg.sender}</span>
              <div className="flex items-end space-x-1.5 space-x-reverse max-w-md">
                
                {/* 메시지 형태별 출력 단락 */}
                <div className="flex flex-col">
                  {msg.type === 'text' ? (
                    <div className={`p-2.5 rounded-2xl border text-sm shadow-md ${msg.isMe ? t.myMsg : t.otherMsg}`}>
                      {msg.content}
                    </div>
                  ) : msg.type === 'image' ? (
                    <div className="border border-zinc-700 rounded-2xl overflow-hidden bg-zinc-900 p-1.5 max-w-xs shadow-md">
                      <img src={msg.fileUrl} alt="uploaded" className="w-48 h-auto max-h-48 object-cover rounded-xl" />
                      <p className="text-[11px] p-1 text-white font-medium truncate">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-zinc-800 text-white border border-zinc-700 rounded-2xl flex items-center space-x-2 shadow-md">
                      <FileText size={16} className="text-amber-400 shrink-0" />
                      <a href={msg.fileUrl} download={msg.content} className="text-xs font-bold text-white hover:underline truncate max-w-[150px]">
                        {msg.content} (다운로드)
                      </a>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-gray-400">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 전송 인풋 바 */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex flex-col z-10">
          <form onSubmit={handleSendMessage} className={`flex items-center space-x-2 border ${t.inputBorder} rounded-xl px-3 py-2 bg-zinc-950`}>
            {/* 파일 업로드 트리거 클립 단추 */}
            <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-300 hover:text-white shrink-0">
              <Paperclip size={18} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUploadClick} className="hidden" />
            
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="대화 내용을 타이핑하세요..." className="flex-1 bg-transparent border-none outline-none text-xs text-white" />
            <button type="submit" disabled={!message.trim()} className="text-blue-400 font-bold text-sm disabled:opacity-30 hover:text-blue-300 shrink-0">보내기</button>
          </form>
        </div>
      </div>

    </div>
  );
}

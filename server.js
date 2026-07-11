const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// 친구들의 다른 도메인/IP 접속을 허용하는 CORS 설정
const io = new Server(server, {
  cors: {
    origin: "*", // 전 세계 어디서든 접속 가능하도록 개방
    methods: ["GET", "POST"]
  }
});

// 실시간 네트워킹 소켓 핸들러
io.on('connection', (socket) => {
  console.log(`🌐 유저 접속됨 (ID: ${socket.id})`);

  // 특정 채팅방에 입장 처리
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`🚪 유저가 방 [${roomId}] 에 입장했습니다.`);
  });

  // 메시지 수신 및 동일 방 유저들에게 실시간 브로드캐스팅
  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ 유저 접속 끊김 (ID: ${socket.id})`);
  });
});

// ⭐ 렌더 클라우드가 주는 포트(process.env.PORT)를 1순위로 쓰고, 없으면 4000번을 쓰는 핵심 자동 코드입니다!
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 LHJOON Ultimate 실시간 서버가 ${PORT}번 포트에서 가동 중입니다!`);
});
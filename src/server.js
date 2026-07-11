const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*", // 프론트엔드가 어디서든 접속할 수 있게 허용
    methods: ["GET", "POST"]
  }
});

// Render 또는 Vercel 클라우드가 지정해주는 동적 포트 적용
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('채팅 서버가 정상적으로 작동 중입니다!');
});

// 실시간 데이터 송수신 구역
io.on('connection', (socket) => {
  console.log('유저가 접속했습니다:', socket.id);

  // [추가] 친구가 메시지를 보냈을 때 처리하는 이벤트
  socket.on('chat message', (data) => {
    // 나를 포함하여 접속한 모든 유저에게 메시지 배달
    io.emit('chat message', {
      username: data.username || "익명",
      text: data.text,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    });
  });

  socket.on('disconnect', () => {
    console.log('유저가 나갔습니다:', socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 잘 돌아가고 있습니다.`);
});
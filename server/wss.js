const WebSocket = require('ws');
const config = require('./config.js');

const wss = new WebSocket.Server(config.server.options);

const rooms = {};
const players = {};

/**
 * 
 * @param {String} msg 一个json字符，必须包含action属性，用来区分不同操作。
 */
function onMessage(msg) {
  console.log(msg);
  // msg一律是json
  let d;
  try {
    d = JSON.parse(msg);
  } catch(e) {
    return handleError(this, d, new Error(`msg必须是一个json字符串。收到的msg：${msg}`));
  }

  if(d.action === 'join') {
    handleJoin(this, d);
  } else if(d.action === 'move') {
    handleMove(this, d);
  } else if(d.action === 'ready') {
    handleReady(this, d);
  }
}

function handleReady(ws, d){
  let {roomId, playerId, isReady} = d;
  let room = rooms[roomId];
  if(room.isPlaying) return; // 已经开局就忽略它
  let side = players[playerId].side;
  room[side].isReady = isReady;

  if(room.B && room.B.isReady && room.W && room.W.isReady) {
    // 两边都准备好，就直接发送start指令给双方
    room.isPlaying = true;
    let msg = JSON.stringify({action: 'start'});
    room.B.ws.send(msg);
    room.W.ws.send(msg);
  }
}

function handleJoin(ws, d){
  let { roomId } = d;
  if(!rooms[roomId]) rooms[roomId] = {isPlaying: false};
  // 一进来就先按顺序分了黑白，如果要交换，用其他action
  let side;
  let playerId;
  let player;
  if(!rooms[roomId].B) {
    side = 'B';
    playerId = roomId + '_num_1';
  } else if(!rooms[roomId].W) {
    side = 'W';
    playerId = roomId + '_num_2';
  } else {
    // 满了，回个join失败的信息
    let res = {
      action: 'join',
      playerId: playerId,
      side: side,
      roomId: roomId,
      isSuccess: false,
    };
    return ws.send(JSON.stringify(res));
  }
  ws.playerId = playerId;

  player = {ws: ws, playerId: playerId, side: side, roomId: roomId, isReady: false};
  rooms[roomId][side] = player;
  players[playerId] = player;

  let res = {
    action: 'join',
    playerId: playerId,
    side: side,
    roomId: roomId,
    isSuccess: true,
  };
  ws.send(JSON.stringify(res));
}

function handleMove(ws, d){
  let {roomId, side, move, checkmateValue} = d;
  let room = rooms[roomId];
  let otherSide = side === 'B' ? 'W' : 'B';
  let action = 'move';
  let msg = JSON.stringify({action, move});

  let otherPlayer = room[otherSide];
  if(otherPlayer){
    otherPlayer.ws.send(msg);
  }

  if(checkmateValue) {
    rooms[roomId].isPlaying = false;
    rooms.B.isReady = false;
    rooms.W.isReady = false;
  }
}

function onError(e){
  console.log(e);
}

function onClose(e){
  console.log(e);
  let ws = this;
  let playerId = ws.playerId;
  if(playerId) {
    let player = players[playerId];
    let side = player.side;
    let roomId = player.roomId;
    let room = rooms[roomId];
    delete room[side];
    delete players[playerId];
  }
}

function onConnection(ws) {
  ws.on('message', onMessage);
  ws.on('error', onError);
  ws.on('close', onClose);
}

wss.on('connection', onConnection);
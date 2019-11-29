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
    return handleErrorMsg(this, d, new Error(`msg必须是一个json字符串。收到的msg：${msg}`));
  }

  if(d.action === 'join') {
    handleJoin(this, d);
  } else if(d.action === 'move') {
    handleMove(this, d);
  } else if(d.action === 'ready') {
    handleReady(this, d);
  } else if(d.action === 'change') {
    handleChange(this, d);
  }
}

function handleErrorMsg(ws, d, err){
  console.error(err);
}

function handleChange(ws, d){
  let {roomId, playerId, status} = d;
  let side = players[playerId].side;
  let otherSide = side === 'B' ? 'W' : 'B';
  let room = rooms[roomId];
  if(status === 'ask') {
    // 一方发起，给另一方发起询问消息
    if(room.isChanging) return; // 正在交换就忽略它
    room.isChanging = true;
    let msg = JSON.stringify({action: 'change', status: 'ask'});
    if(room[otherSide]) {
      room[otherSide].ws.send(msg);
    }
  } else if(status === 'accept') {
    // 另一方同意，进行调换
    let tem = room.B;
    room.B = room.W;
    room.B.side = 'B';
    room.W = tem;
    room.W.side = 'W';

    room.B.ws.send(JSON.stringify({action: 'change', status: 'accept', side: room.B.side}));
    room.W.ws.send(JSON.stringify({action: 'change', status: 'accept', side: room.W.side}));
    room.isChanging = false;
  } else if(status === 'reject') {
    // 另一方拒绝，给双方发拒绝，保证两边逻辑一致
    room.B.ws.send(JSON.stringify({action: 'change', status: 'reject'}));
    room.W.ws.send(JSON.stringify({action: 'change', status: 'reject'}));
    room.isChanging = false;
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
  if(!rooms[roomId]) rooms[roomId] = {isPlaying: false, isChanging: false};
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

  if(rooms[roomId].isChanging) {
    // 先进来的玩家提出换边还没处理
    let msg = JSON.stringify({action: 'change', status: 'ask'});
    ws.send(msg);
  }
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
    rooms[roomId].B.isReady = false;
    rooms[roomId].W.isReady = false;
  }
}

function onError(e){
  console.log(e);
}

function onClose(e){
  console.log(e);
  let playerId = this.playerId;
  if(playerId) {
    let player = players[playerId];
    let side = player.side;
    let roomId = player.roomId;
    let room = rooms[roomId];
    room.isPlaying = false;
    delete room[side];
    delete players[playerId];
    if(!room.B && !room.W) delete rooms[roomId];
  }
}

function onConnection(ws) {
  ws.on('message', onMessage);
  ws.on('error', onError);
  ws.on('close', onClose);
}

wss.on('connection', onConnection);
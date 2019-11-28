/**
 * 加入房间
 * @param {WebSocket} ws WebSocket对象
 * @param {String} roomId 房间号
 */
export function join(ws, roomId) {
  ws.send(JSON.stringify({action: 'join', roomId}));
}

export function parseMessage(e) {
  return JSON.parse(e.data);
}

export function setReady(ws, roomId, playerId, isReady) {
  ws.send(JSON.stringify({action: 'ready', roomId, playerId, isReady}));
}

const WebSocket = require('ws');
const {Game, AI, tools} = require('rsg-chess');
 
const ws = new WebSocket('ws://localhost:18888');

let game;
let roomId = 'ai';
let playerId;
let side;
let depth = 2;
let promote = null;

function moveAI(game, depth){
  const board = tools.uncycleBoard(game.board);
  const turn = tools.uncycleTurns(game.turn);

  const gameState = {
    board: board,
    turn: turn,
    threefold: game.threefold,
    FEN: game.FEN,
  };

  let bestMove = AI(depth, gameState, true);
  if (bestMove.to.movePiece) bestMove.to.movePiece = tools.uncycleMovePiece(bestMove.to.movePiece);
  return bestMove;
};

function handlePromotion(pawn, x, y, color){
  console.log('handlePromotion');
  game.promotePawn(pawn, x, y, color, promote || 'queen');
  promote = null;
}

function handleCheckmate(){
  console.log('handleCheckmate');
}

ws.on('open', function open() {
  game = Game.prototype.initializeGame();
  ws.send(JSON.stringify({action: 'join', roomId}));
});

ws.on('message', function incoming(e) {
  let msg = JSON.parse(e);
  if(msg.action === 'join') {
    console.log('成功加入房间');
    console.log(msg);
    playerId = msg.playerId;
    side = msg.side;

    ws.send(JSON.stringify({action: 'ready', roomId, playerId, isReady: true}));
  } else if(msg.action === 'move') {
    if(msg.promote) promote = msg.promote;
    game.moveSelected(
      game.board[msg.move.from.y][msg.move.from.x],
      msg.move.to,
      handlePromotion,
      handleCheckmate,
      false,
    );

    let move = moveAI(game, depth);

    let gameMove = game.moveSelected(
      game.board[move.from.y][move.from.x],
      move.to,
      handlePromotion,
      handleCheckmate,
      false,
    );
    console.log(gameMove);

    let res = {
      action: 'move',
      roomId: roomId,
      side: side,
      move: {
        from: {
          x: move.from.x,
          y: move.from.y,
        },
        to: {
          x: move.to.x,
          y: move.to.y,
        },
      },
    };
    if(gameMove.promotion) res.promote = 'queen';
    res = JSON.stringify(res);
    ws.send(res);

    
  } else if(msg.action === 'start') {
    if(side === 'W'){
      let move = moveAI(game, depth);

      let res = {
        action: 'move',
        roomId: roomId,
        side: side,
        move: {
          from: {
            x: move.from.x,
            y: move.from.y,
          },
          to: {
            x: move.to.x,
            y: move.to.y,
          },
        },
      };
      res = JSON.stringify(res);
      ws.send(res);
  
      game.moveSelected(
        game.board[move.from.y][move.from.x],
        move.to,
        handlePromotion,
        handleCheckmate,
        false,
      );
    }
  }
});
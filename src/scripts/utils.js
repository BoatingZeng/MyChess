import {tools} from 'rsg-chess';

export const combineParams = (game, playAgainstAI) => {
  const board = tools.uncycleBoard(game.board);
  const turn = tools.uncycleTurns(game.turn);

  const combine = {
    board: board,
    turn: turn,
    threefold: game.threefold,
    FEN: game.FEN,
    FENboard: game.FENboard,
    playAgainstAI: playAgainstAI,
  };

  return JSON.stringify(combine);
};

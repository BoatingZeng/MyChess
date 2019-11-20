import {tools} from 'rsg-chess';

export const combineParams = (game, playAgainstAI) => {
  const board = tools.uncycleBoard(game.board);
  const turn = tools.uncycleTurns(game.turn);

  const combine = {
    board: board,
    turn: JSON.stringify(turn),
    threefold: JSON.stringify(game.threefold),
    FEN: game.FEN,
    playAgainstAI: playAgainstAI,
  };

  return JSON.stringify(combine);
};

// 改造模块rsg-chess-rn-graphics。这个模块就只有一个文件，比较方便改。

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { find } from 'lodash';

export default class ChessBoard extends Component {
  render() {
    const props = this.props;
    const { showValidMoves, rotated, board, selected, onPress, self, boardRotated } = props;
    const validMoves = selected && selected.getValidMoves(true);

    let isBlackRotated = false;
    let isWhiteRotated = false;
    if(!boardRotated && rotated || boardRotated) isBlackRotated = true;
    if(boardRotated && !rotated) isWhiteRotated = true;

    return (
      <View style={[styles.container, boardRotated && styles.rotatedStyles]}>
        {board &&
          board.map((row, i) => (
            <View key={i} style={[styles.row, i !== 0 && styles.spaceOnTheTop]}>
              {row.map((cell, j) => (
                <TouchableOpacity key={j} onPress={onPress.bind(self, j, i)}>
                  <View
                    style={[
                      styles.cell,
                      {
                        width: props.boardWidth,
                        height: props.boardHeight,
                      },
                      i === 7 && styles.bottomBorder,
                      j === 7 && styles.rightBorder,
                      ((i % 2 === 0 && j % 2 !== 0) ||
                        (i % 2 !== 0 && j % 2 === 0)) && {
                        backgroundColor: props.blackCells,
                      },
                      ((i % 2 === 0 && j % 2 === 0) ||
                        (i % 2 !== 0 && j % 2 !== 0)) && {
                        backgroundColor: props.whiteCells,
                      },
                      showValidMoves &&
                        selected &&
                        find(validMoves, { x: j, y: i }) && {
                          backgroundColor: props.validBG,
                        },
                      selected &&
                        selected === cell && {
                          backgroundColor: props.selectedBG,
                        },
                    ]}
                  >
                    <Text
                      style={[
                        {
                          fontSize: props.pieceSize,
                          color: 'black',
                        },
                        cell &&
                          ((cell.color === 'B' && isBlackRotated) || (cell.color === 'W' && isWhiteRotated)) &&
                          styles.rotatedStyles,
                        selected &&
                          selected === cell && {
                            color: props.selectedColor,
                          },
                      ]}
                    >
                      {cell && cell.char}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderColor: 'grey',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBorder: {
    borderBottomWidth: 1,
  },
  rightBorder: {
    borderRightWidth: 1,
  },
  rotatedStyles: {
    transform: [{ rotateX: '180deg' }],
  },
});

ChessBoard.defaultProps = {
  showValidMoves: true,
  rotated: false,
  selected: null,
  validBG: 'red',
  whiteCells: 'rgb(255, 205, 160)',
  blackCells: 'rgb(210, 140, 70)',
  selectedBG: 'brown',
  selectedColor: 'lightblue',
  boardHeight: 50,
  boardWidth: 50,
  pieceSize: 38,
  board: null,
  slef: null,
  onPress: () => {},
  boardRotated: false,
};

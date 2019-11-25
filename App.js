/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {Dimensions, View, ToastAndroid} from 'react-native';
import {createDrawerNavigator} from 'react-navigation-drawer';
import {createAppContainer} from 'react-navigation';
import {Game} from 'rsg-chess';
import {WebView} from 'react-native-webview';

import Play from './src/pages/Play';
import Settings from './src/pages/Settings';
import NavigationContext from './src/components/NavigationContext';
import {html} from './src/scripts/AI';
import {combineParams} from './src/scripts/utils';

let game = Game.prototype.initializeGame();
const blankFEN = game.FEN; // FEN是棋局状态，blankFEN就是初始状态

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
      palette: 'blue',
      showValidMoves: true,
      selected: null,
      checkmate: null,
      playAgainstAI: null,
      isAIThinking: false,
      promotionParams: null,
      rotated: false,
      selectModeModal: game.FEN === blankFEN, // 回到初始状态的话，就准备开始下一局
    };

    Dimensions.addEventListener('change', () => {
      this.setState({
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
      });
    });

    const MainNavigator = createDrawerNavigator({
      Play: {
        screen: Play,
      },
      Settings: {
        screen: Settings,
      },
    }, {
      drawerWidth: 150,
    });
    this.NavigationComponent = createAppContainer(MainNavigator);
  }

  startAI() {
    // 这里的startAI是调用WebView里的js写的AI，让AI走一步
    this.webView.injectJavaScript(
      `AI(${combineParams(game, this.state.playAgainstAI)})`,
    );
    this.setState({isAIThinking: true});
  }

  handlePress(x, y) {
    let {selected, playAgainstAI, isAIThinking, checkmate} = this.state;

    if (isAIThinking) {
      ToastAndroid.show('AI Thinking', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
      return;
    }

    if (selected) {
      // move the selected piece
      let move = game.moveSelected(
        selected,
        {x: x, y: y},
        this.handlePromotion,
        this.handleCheckmate,
        false,
      );

      this.setState({selected: null});

      // use the worker for generating AI movement

      let last = game.turn.length - 1;

      if (
        move &&
        playAgainstAI &&
        last >= 0 &&
        game.turn[last].color === 'W' &&
        !checkmate &&
        !move.promotion
      ) {
        this.startAI();
      }
    } else {
      let last = game.turn.length - 1;
      if (
        game.board[y][x] &&
        (last >= 0
          ? game.board[y][x].color !== game.turn[last].color
          : game.board[y][x].color === 'W')
      ) {
        this.setState({selected: game.board[y][x]});
      } else {
        game.board[y][x] &&
          ToastAndroid.show(
            'Invalid move...',
            ToastAndroid.SHORT,
            ToastAndroid.BOTTOM,
          );
      }
    }
  }

  promoteAI(pawn, x, y, color) {
    ToastAndroid.show(
      'The AI promoted one of his pawns!',
      ToastAndroid.LONG,
      ToastAndroid.BOTTOM,
    );
    game.promotePawn(pawn, x, y, color, 'queen');
  }

  handlePromotion = (pawn, x, y, color) => {
    this.setState({
      promotionParams: {
        x: x,
        y: y,
        color: color,
        pawn: pawn,
      },
    });
  };

  promoteSelectedPawn = piece => {
    // 国际象棋那个兵升级的规则
    const {promotionParams, playAgainstAI, checkmate} = this.state;
    if (promotionParams) {
      piece = piece ? piece : 'knight';
      const {x, y, color, pawn} = promotionParams;
      game.promotePawn(pawn, x, y, color, piece);
      this.setState({promotionParams: null});
      if (playAgainstAI && !checkmate) {
        this.startAI();
      }
    }
  };

  handleCheckmate = color => {
    this.setState({checkmate: color});
  };

  handleMessage = msg => {
    if (msg && msg.nativeEvent.data) {
      msg = JSON.parse(msg.nativeEvent.data);
      const {promoteAI} = this;

      game.moveSelected(
        game.board[msg.from.y][msg.from.x],
        msg.to,
        promoteAI,
        this.handleCheckmate,
        false,
      );

      this.setState({isAIThinking: false});
    }
  };

  handleReplay = () => {
    // 这个replay是重新开始的意思，不是重播
    this.setState({
      selected: null,
      promotionParams: null,
      checkmate: null,
      isAIThinking: false,
      playAgainstAI: null,
      selectModeModal: true,
    });

    game = Game.prototype.initializeGame();
  };

  selectMode = playAgainstAI => {
    this.setState({
      selectModeModal: false,
      playAgainstAI: playAgainstAI,
    });
  };

  updatePalette = value => {
    this.setState({palette: value});
  };

  setRotation = value => {
    this.setState({
      rotated: value,
    });
  };

  render() {
    const {
      NavigationComponent,
      handlePress,
      promoteSelectedPawn,
      handleReplay,
      selectMode,
      updatePalette,
      setRotation,
    } = this;
    return (
      <>
        <NavigationContext.Provider
          value={{
            self: this,
            game: game,
            handlePress: handlePress,
            promoteSelectedPawn: promoteSelectedPawn,
            handleReplay: handleReplay,
            selectMode: selectMode,
            updatePalette: updatePalette,
            setRotation: setRotation,
            ...this.state,
          }}>
          <NavigationComponent
            ref={nav => {
              this.navigator = nav;
            }}
          />
          <View>
            <WebView
              ref={el => (this.webView = el)}
              source={{html: html}}
              javaScriptEnabled={true}
              onMessage={this.handleMessage}
            />
          </View>
        </NavigationContext.Provider>
      </>
    );
  }
}

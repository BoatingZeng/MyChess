/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

/* global WebSocket:readonly */

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
import {join, parseMessage} from './src/scripts/websocketTool';

let game = Game.prototype.initializeGame();
const blankFEN = game.FEN; // FEN是棋局状态，blankFEN就是初始状态

export default class App extends React.Component {
  constructor() {
    super();
    this.playOnline = null;

    this.state = {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
      palette: 'blue',
      showValidMoves: true,
      selected: null,
      checkmate: null,
      playAgainstAI: null,
      promotionParams: null,
      rotated: false,
      side: 'W',
      isAIThinking: false, // 设置这个触发渲染
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
    // 用websocket时也复用这个函数，这样改动最少，反正把websocket另一边的玩家也当作ai就好了
    if(this.playOnline) {
      // 实际上只要等待就行
    } else {
      // 这里的startAI是调用WebView里的js写的AI，让AI走一步
      this.webView.injectJavaScript(
        `AI(${combineParams(game, this.state.playAgainstAI)})`,
      );
    }
    this.setState({isAIThinking: true});
  }

  handlePress = (x, y) => {
    let {selected, playAgainstAI, checkmate, isAIThinking} = this.state;

    if (isAIThinking) {
      ToastAndroid.show('AI Thinking', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
      return;
    }

    if (selected) {
      let from = {x: selected.x, y: selected.y}; // 因为下面moveSelected会改变selected，所以先记下来
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
        game.turn[last].color === this.state.side &&
        !checkmate &&
        !move.promotion
      ) {
        this.startAI();
        if(this.playOnline && this.ws && this.ws.readyState === this.ws.OPEN) {
          // 发送到服务器
          let msg = {
            action: 'move',
            roomId: this.playOnline.roomId,
            side: this.state.side,
            move: {
              from: {
                x: from.x,
                y: from.y,
              },
              to: {
                x: x,
                y: y,
              },
            },
          };
          msg = JSON.stringify(msg);
          this.ws.send(msg);
        }
      }
    } else {
      let last = game.turn.length - 1;
      if (
        game.board[y][x] &&
        (last >= 0
          ? game.board[y][x].color !== game.turn[last].color
          : game.board[y][x].color === this.state.side)
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
  };

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
    const {promoteAI} = this;
    if(msg.action === 'move') {
      game.moveSelected(
        game.board[msg.move.from.y][msg.move.from.x],
        msg.move.to,
        promoteAI,
        this.handleCheckmate,
        false,
      );
    } else if (msg && msg.nativeEvent.data) {
      msg = JSON.parse(msg.nativeEvent.data);
      game.moveSelected(
        game.board[msg.from.y][msg.from.x],
        msg.to,
        promoteAI,
        this.handleCheckmate,
        false,
      );
    }
    this.setState({isAIThinking: false});
  };

  handleReplay = () => {
    // 这个replay是重新开始的意思，不是重播
    this.setState({
      selected: null,
      promotionParams: null,
      checkmate: null,
      playAgainstAI: null,
    });
    this.setState({isAIThinking: false});

    game = Game.prototype.initializeGame();
  };

  selectMode = (playAgainstAI, playOnline) => {
    if(playOnline) {
      this.playOnline = {...playOnline};
      return this.connect();
    }
    this.handleReplay();
    this.setState({
        selectModeModal: false,
        playAgainstAI: playAgainstAI,
    }, () => {
      if(this.state.side === 'B' && playAgainstAI) {
        this.startAI();
      }
    });
  };

  handleJoin = (data) => {
    let {playerId, side, roomId} = data;
    let {host, port} = this.playOnline;
    this.playOnline = {host, port, playerId, roomId};
    this.handleReplay();
    this.setState({
      playAgainstAI: {depth: 'online'},
      side: side,
    }, () => {
      if(this.side === 'B') {
        this.startAI();
      }
    });
  };

  handleReady = () => {

  };

  connect = () => {
    if(this.ws && this.ws.readyState !== this.ws.CLOSED) return;
    let url = `ws://${this.playOnline.host}:${this.playOnline.port}`;
    let ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      join(ws, this.playOnline.roomId);
    };

    ws.onmessage = (e) => {
      let msg = parseMessage(e);
      if(msg.action === 'join') {
        this.handleJoin(msg);
      } else if(msg.action === 'move') {
        this.handleMessage(msg); // 这个函数原本是用来响应webView的，现在复用它
      }
    };

    ws.onerror = (e) => {
      console.error(e.message);
    };

    ws.onclose = (e) => {
      console.log(e.code, e.reason);
    };
  };

  // 让子组件改变自己状态的统一函数，之前是分散了很多个函数的，比较混乱
  updateState = v => {
    this.setState(v);
  };

  render() {
    const {
      NavigationComponent,
      handlePress,
      promoteSelectedPawn,
      handleReplay,
      selectMode,
      updateState,
    } = this;
    return (
      <>
        <NavigationContext.Provider
          value={{
            self: this,
            game: game,
            handlePress,
            promoteSelectedPawn,
            handleReplay,
            selectMode,
            updateState,
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

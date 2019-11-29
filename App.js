/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

/* global WebSocket:readonly */

import React from 'react';
import {Dimensions, View, ToastAndroid, Alert} from 'react-native';
import {createDrawerNavigator} from 'react-navigation-drawer';
import {createAppContainer} from 'react-navigation';
import {Game} from 'rsg-chess';
import {WebView} from 'react-native-webview';

import Play from './src/pages/Play';
import Settings from './src/pages/Settings';
import NavigationContext from './src/components/NavigationContext';
import {html} from './src/scripts/AI';
import {combineParams} from './src/scripts/utils';
import {join, parseMessage, setReady} from './src/scripts/websocketTool';

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
      promotionParams: null,
      rotated: false,
      host: 'localhost',
      port: '18888',
      roomId: 'ai',
      playerId: '',
      isConnected: false, // 是否已经连接并且加入房间
      isChanging: false, // 是否等待处理换边
      isReady: false, // 联网时，自己是否准备好
      isOnlinePlaying: false, // 联网游戏是否已经开始
      side: 'W',
      isWaiting: false, // 等待对手，设置这个触发渲染
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
    if(this.state.isOnlinePlaying) {
      // 实际上只要等待就行
    } else {
      // 这里的startAI是调用WebView里的js写的AI，让AI走一步
      this.webView.injectJavaScript(
        `AI(${combineParams(game, this.state.playAgainstAI)})`,
      );
    }
    this.setState({isWaiting: true});
  }

  handlePress = (x, y) => {
    let {selected, playAgainstAI, checkmate, isWaiting, isOnlinePlaying} = this.state;

    if (isWaiting) {
      ToastAndroid.show('Waiting', ToastAndroid.SHORT);
      return;
    }

    if (selected) {
      let from = {x: selected.x, y: selected.y}; // 因为下面moveSelected会改变selected，所以先记下来
      this.from = from; // 因为另一个函数也要访问，所以存到this里
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
        (playAgainstAI || isOnlinePlaying) &&
        last >= 0 &&
        game.turn[last].color === this.state.side &&
        !checkmate &&
        !move.promotion
      ) {
        let checkmateValue = move.checkmate ? (this.state.side === 'W' ? 'B' : 'W') : false;
        if(!checkmateValue) this.startAI();
        if(this.state.isOnlinePlaying && this.ws && this.ws.readyState === this.ws.OPEN) {
          // 发送到服务器
          let msg = {
            action: 'move',
            roomId: this.state.roomId,
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
          if(checkmateValue) msg.checkmateValue = checkmateValue;
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
          );
      }
    }
  };

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
    const {promotionParams, playAgainstAI, isOnlinePlaying} = this.state;
    if (promotionParams) {
      piece = piece ? piece : 'knight';
      const {x, y, color, pawn} = promotionParams;
      game.promotePawn(pawn, x, y, color, piece);
      // promote之后要主动检查是否checkmate
      let checkmateColor = color === 'W' ? 'B' : 'W';
      let checkmateValue = game.checkmate(checkmateColor);
      if(checkmateValue) this.handleCheckmate(checkmateValue);
      this.setState({promotionParams: null});
      if ((playAgainstAI || isOnlinePlaying)) {
        if(!checkmateValue) this.startAI();
        if(this.state.isOnlinePlaying && this.ws && this.ws.readyState === this.ws.OPEN) {
          // 发送到服务器
          let from = this.from;
          let msg = {
            action: 'move',
            roomId: this.state.roomId,
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
            promote: piece,
          };
          if(checkmateValue) msg.checkmateValue = checkmateValue;
          msg = JSON.stringify(msg);
          this.ws.send(msg);
        }
      }
    }
  };

  handleCheckmate = color => {
    this.setState({checkmate: color, isReady: false, isOnlinePlaying: false});
  };

  handleMessage = msg => {
    function promoteAI(pawn, x, y, color) {
      ToastAndroid.show(
        'Other player promoted one of his pawns!',
        ToastAndroid.LONG,
      );
      game.promotePawn(pawn, x, y, color, msg.promote || 'queen');
      let checkmateColor = color === 'W' ? 'B' : 'W';
      let checkmateValue = game.checkmate(checkmateColor);
      if(checkmateValue) this.handleCheckmate(checkmateValue);
    }

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
    this.setState({isWaiting: false});
  };

  handleReplay = () => {
    // 这个replay是重新开始的意思，不是重播
    this.setState({
      selected: null,
      promotionParams: null,
      checkmate: null,
      playAgainstAI: null,
      isWaiting: false,
    });

    game = Game.prototype.initializeGame();
  };

  selectMode = (playAgainstAI) => {
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
    let {playerId, side, isSuccess} = data;
    if(isSuccess) {
      this.setState({
        playerId,
        isConnected: true,
        side: side,
      });
    } else if(this.ws && this.ws.readyState !== this.ws.CLOSED && this.ws.readyState !== this.ws.CLOSING) {
      ToastAndroid.show('Room Full', ToastAndroid.LONG);
      this.ws.close();
    }
  };

  handleStart = (data) => {
    this.handleReplay();
    this.setState({
      isOnlinePlaying: true,
      selectModeModal: false,
    }, () => {
      if(this.side === 'B') {
        this.startAI();
      }
    });
  };

  handleChange = (d) => {
    let status = d.status;
    if(status === 'ask') {
      this.setState({isChanging: true});
      Alert.alert(
        'Change Side',
        'The other player want to change side. Accept or reject?',
        [
          {
            text: 'Accept',
            onPress: () => {
              let msg = {
                action: 'change',
                status: 'accept',
                roomId: this.state.roomId,
                playerId: this.state.playerId,
              };
              this.ws.send(JSON.stringify(msg));
            },
          },
          {
            text: 'Reject',
            onPress: () => {
              let msg = {
                action: 'change',
                status: 'reject',
                roomId: this.state.roomId,
                playerId: this.state.playerId,
              };
              this.ws.send(JSON.stringify(msg));
            },
          },
        ],
        {cancelable: false},
      );
    } else if(status === 'accept') {
      let side = d.side;
      this.setState({
        isChanging: false,
        side: side,
      });
    } else if(status === 'reject') {
      this.setState({isChanging: false});
    }
  };

  changeMyReadyState = () => {
    this.setState(state => {
      return {isReady: !state.isReady};
    }, () => {
      let {roomId, playerId, isReady} = this.state;
      setReady(this.ws, roomId, playerId, isReady);
    });
  };

  connect = () => {
    if(this.ws && this.ws.readyState !== this.ws.CLOSED) return;
    let url = `ws://${this.state.host}:${this.state.port}`;
    let ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      join(ws, this.state.roomId);
    };

    ws.onmessage = (e) => {
      let msg = parseMessage(e);
      if(msg.action === 'join') {
        this.handleJoin(msg);
      } else if(msg.action === 'move') {
        this.handleMessage(msg); // 这个函数原本是用来响应webView的，现在复用它
      } else if(msg.action === 'start') {
        this.handleStart(msg);
      } else if(msg.action === 'change') {
        this.handleChange(msg);
      }
    };

    ws.onerror = (e) => {
      console.log('onerror', e);
      ToastAndroid.show('Connection Error', ToastAndroid.LONG);
      if(this.ws && this.ws.readyState !== this.ws.CLOSED && this.ws.readyState !== this.ws.CLOSING) {
        this.ws.close();
      }
    };

    ws.onclose = (e) => {
      console.log('onclose', e);
      ToastAndroid.show('Connection Closed', ToastAndroid.LONG);
      this.ws = null;
      this.setState({
        playerId: '',
        isConnected: false,
        isReady: false,
        isOnlinePlaying: false,
      });
    };
  };

  changeSideAsk = () => {
    let msg = {
      action: 'change',
      status: 'ask',
      roomId: this.state.roomId,
      playerId: this.state.playerId,
    };
    this.setState({isChanging: true});
    this.ws.send(JSON.stringify(msg));
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
      selectMode,
      updateState,
      changeMyReadyState,
      connect,
      changeSideAsk,
    } = this;
    return (
      <>
        <NavigationContext.Provider
          value={{
            self: this,
            game: game,
            handlePress,
            promoteSelectedPawn,
            selectMode,
            updateState,
            changeMyReadyState,
            connect,
            changeSideAsk,
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

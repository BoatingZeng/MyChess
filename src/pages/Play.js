import React from 'react';
import {View, StyleSheet} from 'react-native';

import ChessBoard from 'rsg-chess-rn-graphics';

import MenuIcon from '../components/MenuIcon';
import NewGameIcon from '../components/NewGameIcon';
import NavigationContext from '../components/NavigationContext';
import {colorPalettes} from '../config';
import getSizes from '../scripts/getSizes';
import renderPromotionModal from '../components/PromotionModal';
import renderCheckmateModal from '../components/CheckMateModal';
import renderSelectModeModal from '../components/SelectModeModal';

export default class Play extends React.Component {
  static navigationOptions = {
    drawerLabel: 'Play',
  };

  render() {
    return (
      <NavigationContext.Consumer>
        {data => {
          const {
            width,
            height,
            self,
            game,
            selected,
            showValidMoves,
            handlePress,
            palette,
            rotated,
            promotionParams,
            promoteSelectedPawn,
            checkmate,
            handleReplay,
            selectModeModal,
            selectMode,
          } = data;
          const currentPalette = colorPalettes[palette];
          let sizes = getSizes(width, height);
          return (
            <View
              style={[
                styles.container,
                {backgroundColor: currentPalette.background},
              ]}>
              <MenuIcon
                navigation={this.props.navigation}
                palette={currentPalette}
              />
              <NewGameIcon onPress={handleReplay} palette={currentPalette} />
              <View>
                <ChessBoard
                  self={self}
                  board={game.board}
                  boardWidth={sizes.width}
                  boardHeight={sizes.height}
                  selected={selected}
                  showValidMoves={showValidMoves}
                  pieceSize={sizes.fontSize}
                  onPress={handlePress}
                  {...currentPalette.props}
                  rotated={rotated}
                />
              </View>
              {checkmate &&
                renderCheckmateModal(checkmate, handleReplay, () => {
                  self.setState({checkmate: null});
                })}
              {promotionParams && renderPromotionModal(promoteSelectedPawn)}
              {selectModeModal && renderSelectModeModal(selectMode)}
            </View>
          );
        }}
      </NavigationContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

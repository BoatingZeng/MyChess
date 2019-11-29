import React from 'react';
import {View, StyleSheet} from 'react-native';

import ChessBoard from '../components/ChessBoard';

import MenuIcon from '../components/MenuIcon';
import NewGameIcon from '../components/NewGameIcon';
import NavigationContext from '../components/NavigationContext';
import {colorPalettes} from '../config';
import getSizes from '../scripts/getSizes';
import renderPromotionModal from '../components/PromotionModal';
import renderCheckmateModal from '../components/CheckMateModal';
import SelectModeModal from '../components/SelectModeModal';

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
            updateState,
          } = data;
          const currentPalette = colorPalettes[palette];
          let sizes = getSizes(width, height);
          return (
            <View
              style={[
                styles.container,
                {backgroundColor: currentPalette.background},
              ]}>
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
                  boardRotated={data.side === 'B'}
                />
              </View>
              <MenuIcon
                navigation={this.props.navigation}
                palette={currentPalette}
              />
              <NewGameIcon onPress={() => updateState({selectModeModal: true})} palette={currentPalette} />
              {checkmate &&
                renderCheckmateModal(checkmate, () => updateState({selectModeModal: true}), () => {
                  self.setState({checkmate: null});
                })}
              {promotionParams && renderPromotionModal(promoteSelectedPawn)}
              <SelectModeModal />
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

import React from 'react';
import {View, StyleSheet, TouchableHighlight, Text} from 'react-native';

export default class NewGameIcon extends React.Component {
  render() {
    return (
      <TouchableHighlight
        style={[
          styles.container,
          {backgroundColor: this.props.palette.props.blackCells},
        ]}
        onPress={() => {
          this.props.onPress();
        }}>
        <View>
          <Text style={styles.text}>New Game</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 35,
    top: 7,
    right: 7,
    padding: 7,
    borderRadius: 100 / 10,
    position: 'absolute',
    alignSelf: 'flex-start',
  },
  text: {
    color: 'white',
  },
});

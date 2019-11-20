import React from 'react';
import {View, StyleSheet, TouchableHighlight} from 'react-native';

export default class MenuIcon extends React.Component {
  render() {
    return (
      <TouchableHighlight
        style={[
          styles.container,
          {backgroundColor: this.props.palette.props.blackCells},
        ]}
        onPress={() => {
          this.props.navigation.toggleDrawer();
        }}>
        <View>
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={styles.line} />
        </View>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 35,
    top: 7,
    left: 7,
    padding: 7,
    borderRadius: 100 / 10,
    position: 'absolute',
    alignSelf: 'flex-start',
  },
  line: {backgroundColor: 'white', width: 25, height: 4, marginBottom: 4},
});

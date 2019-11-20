import React from 'react';
import {Text, View, Button, StyleSheet, Modal} from 'react-native';

const renderCheckmateModal = (checkmate, exitCallback, hideCallback) => {
  return (
    <Modal animationType="slide" transparent={true}>
      <View style={styles.mainContainer}>
        <Text style={styles.text}>
          {checkmate !== 'D'
            ? checkmate === 'W'
              ? 'The black player won!'
              : 'The white player won!'
            : 'Draw'}
        </Text>
        <Text>{'\n'}</Text>
        <View style={styles.buttonContainer}>
          <View style={{flex: 1}}>
            <Button title="New Game" onPress={exitCallback} />
          </View>
          <Text>{'  '}</Text>
          <View style={{flex: 1}}>
            <Button title="Hide this" onPress={hideCallback} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 22,
  },
});

export default renderCheckmateModal;

import React from 'react';
import {Text, View, Button, StyleSheet, ScrollView, Modal} from 'react-native';

const renderSelectModeModal = selectModeMethod => {
  return (
    <Modal animationType="slide" transparent={true}>
      <View style={{flex:1}} />
      <View style={styles.mainContainer}>
        <ScrollView>
          <Text style={styles.text}>Choose game mode</Text>
          <Text style={{margin: 4}}>
            Start singleplayer or game versus friend:
          </Text>
          <View style={{margin: 4}}>
            <Button
              title="Start singleplayer"
              onPress={() => {
                selectModeMethod(null);
              }}
            />
          </View>
          <Text style={{margin: 4}}>Play versus AI</Text>
          <View style={styles.optionsRow}>
            <View style={styles.buttonContainer}>
              <Button
                title="Easy"
                onPress={() => {
                  selectModeMethod({depth: 2});
                }}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="Medium"
                onPress={() => {
                  selectModeMethod({depth: 3});
                }}
              />
            </View>
          </View>
          <View style={{margin: 2}}>
            <Button
              title="Hard"
              onPress={() => {
                selectModeMethod({depth: 4});
              }}
            />
          </View>
          <Text style={styles.warningText}>
            Warning: The AI may require longer time to make its turn on the "hard" level!
          </Text>
        </ScrollView>
      </View>
      <View style={{flex:1}} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    margin: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    padding: 1,
  },
  buttonContainer: {
    flex: 1,
    margin: 2,
  },
  warningText: {
    margin: 4,
    color: 'orange',
    fontStyle: 'italic',
  },
});

export default renderSelectModeModal;

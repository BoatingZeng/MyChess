import React from 'react';
import {Text, View, Button, StyleSheet, ScrollView, Modal} from 'react-native';

const renderPromotionModal = promotionCallback => {
  return (
    <Modal animationType="slide" transparent={true}>
      <View style={styles.mainContainer}>
        <ScrollView>
          <Text style={styles.text}>Select a piece to promote to: </Text>
          <Text>{'\n'}</Text>
          <View style={styles.optionsRow}>
            <View style={styles.buttonContainer}>
              <Button
                title="knight"
                onPress={() => {
                  promotionCallback('knight');
                }}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="rook"
                onPress={() => {
                  promotionCallback('rook');
                }}
              />
            </View>
          </View>
          <View style={styles.optionsRow}>
            <View style={styles.buttonContainer}>
              <Button
                title="bishop"
                onPress={() => {
                  promotionCallback('bishop');
                }}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="queen"
                onPress={() => {
                  promotionCallback('queen');
                }}
              />
            </View>
          </View>
        </ScrollView>
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
  text: {
    fontSize: 18,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    padding: 1,
  },
  buttonContainer: {
    flex: 1,
    margin: 2,
  },
});

export default renderPromotionModal;

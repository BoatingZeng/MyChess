import React from 'react';
import {Text, View, Button, StyleSheet, ScrollView, Modal, TextInput, Picker} from 'react-native';

import NavigationContext from '../components/NavigationContext';

export default class SelectModeModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      host: 'localhost',
      port: '18888',
      roomId: 'ai',
    };
  }

  render() {
    return (
      <NavigationContext.Consumer>
        {data => {
          return (
            <Modal animationType="slide" transparent={true} visible={data.selectModeModal}>
              <View style={styles.mainContainer}>
                <ScrollView>
                  <View style={{margin: 2}}>
                    <Button
                      title="Close"
                      onPress={() => {
                        data.updateState({selectModeModal: false});
                      }}
                    />
                  </View>
                  <Text style={styles.text}>Choose game mode</Text>
                  <Text style={{margin: 4}}>
                    Start singleplayer or game versus friend:
                  </Text>
                  <View style={{margin: 4}}>
                    <Button
                      title="Start singleplayer"
                      onPress={() => {
                        data.updateState({side: 'W'}); // 自己玩肯定是白开
                        data.selectMode(null);
                      }}
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Text style={{flex: 1}}>Side：</Text>
                    <Picker
                      style={{flex: 1}}
                      prompt="Side"
                      selectedValue={data.side}
                      onValueChange={(itemValue, itemIndex) =>
                        data.updateState({side: itemValue})
                      }>
                      <Picker.Item label="White" value="W" />
                      <Picker.Item label="Black" value="B" />
                    </Picker>
                  </View>
                  <Text style={{margin: 4}}>Play versus AI</Text>
                  <View style={styles.optionsRow}>
                    <View style={styles.buttonContainer}>
                      <Button
                        title="Easy"
                        onPress={() => {
                          data.selectMode({depth: 2}, null);
                        }}
                      />
                    </View>
                    <View style={styles.buttonContainer}>
                      <Button
                        title="Medium"
                        onPress={() => {
                          data.selectMode({depth: 3}, null, null);
                        }}
                      />
                    </View>
                  </View>
                  <View style={{margin: 2}}>
                    <Button
                      title="Hard"
                      onPress={() => {
                        data.selectMode({depth: 4}, null);
                      }}
                    />
                  </View>
                  <Text style={styles.warningText}>
                    Warning: The AI may require longer time to make its turn on the "hard" level!
                  </Text>
                  <View style={styles.inputRow}>
                    <Text style={{flex: 1}}>HOST：</Text>
                    <TextInput
                      placeholder="input host"
                      style={{flex: 2}}
                      onChangeText={(host) => this.setState({host})}
                      value={this.state.host}
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Text style={{flex: 1}}>PORT：</Text>
                    <TextInput
                      placeholder="input port"
                      style={{flex: 2}}
                      onChangeText={(port) => this.setState({port})}
                      value={this.state.port}
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Text style={{flex: 1}}>ROOM：</Text>
                    <TextInput
                      placeholder="input room id"
                      style={{flex: 2}}
                      onChangeText={(roomId) => this.setState({roomId})}
                      value={this.state.roomId}
                    />
                  </View>
                  <View style={styles.optionsRow}>
                    <View style={styles.buttonContainer}>
                      <Button
                        title="Connect"
                        onPress={() => {
                          data.selectMode(null, {...this.state});
                        }}
                      />
                    </View>
                    <View style={styles.buttonContainer}>
                      <Button
                        title="ChangeSide"
                        onPress={() => {
                          console.log('ChangeSide');
                        }}
                      />
                    </View>
                  </View>
                  <View style={{margin: 2}}>
                    <Button
                      title="Ready"
                      onPress={() => {
                        console.log('Ready');
                      }}
                    />
                  </View>
                </ScrollView>
              </View>
            </Modal>
          );
        }}
      </NavigationContext.Consumer>
    );
  }
}

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
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
});

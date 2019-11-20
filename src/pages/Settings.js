import React from 'react';
import {Picker, Text, View, StyleSheet, Button} from 'react-native';

import NavigationContext from '../components/NavigationContext';
import {colorPalettes} from '../config';

export default class Settings extends React.Component {
  render() {
    return (
      <NavigationContext.Consumer>
        {data => {
          return (
            <>
              <View style={styles.item_view}>
                <Text style={styles.flex1}>Theme：</Text>
                <Picker
                  style={styles.flex2}
                  prompt="Theme"
                  selectedValue={data.palette}
                  onValueChange={(itemValue, itemIndex) =>
                    data.updatePalette(itemValue)
                  }>
                  {Object.keys(colorPalettes).map(key => (
                    <Picker.Item
                      label={colorPalettes[key].name}
                      value={key}
                      key={key}
                    />
                  ))}
                </Picker>
              </View>
              <Button
                title="Back"
                onPress={() => this.props.navigation.navigate('Play')}
              />
            </>
          );
        }}
      </NavigationContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  item_view: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
});

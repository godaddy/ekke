import { Text, View, AppRegistry } from 'react-native';
import React, { Component, Fragment } from 'react';
import { Ekke } from './ekke';

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  }
};

class App extends Component {
  render() {
    return (
      <Fragment>
        <Ekke />

        <View style={ styles.container }>
          <Text style={ styles.welcome }>Welcome to React Native!</Text>
        </View>
      </Fragment>
    );
  }
}

AppRegistry.registerComponent('ekke', () => App);

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigator/AppNavigator';

export default class App extends React.Component {

  render() {
    return (
      <NavigationContainer ref={o => this.navigationRef = o} onStateChange={this.trackingRouteChanged}>
        <AppNavigator />
      </NavigationContainer>
    );
  }
}

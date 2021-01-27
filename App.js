import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppLoading from 'expo-app-loading';
import { Asset } from 'expo-asset';
import styled from 'styled-components';
import AppNavigator from './navigator/AppNavigator';

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #fff;
`;

const LogoImage = styled.Image`
  height: 24px;
`;

export default class App extends React.Component {
  constructor() {
    super();

    this.state = {
      isReady: false,
      isSplashEnd: false,
    };
  }

  onFinish = () => {
    this.setState({ isReady: true });
    setTimeout(() => this.setState({ isSplashEnd: true }), 2000);
  }

  async _cacheResourcesAsync() {
    const images = [require('assets/splash-logo.png')];
    const cacheImages = images.map(image => Asset.fromModule(image).downloadAsync());
    return Promise.all(cacheImages)
  }

  render() {
    if (!this.state.isReady) {
      return (
        <AppLoading
          startAsync={this._cacheResourcesAsync}
          onFinish={this.onFinish}
          onError={console.warn}
        />
      );
    } else if (this.state.isReady && this.state.isSplashEnd) {
      return (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );
    } else {
      return (
        <Container>
          <LogoImage source={require('assets/splash-logo.png')} resizeMode="contain"/>
        </Container>
      );
    }
  }
}

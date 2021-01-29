import React from 'react';
import { BackHandler, Share, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styled, { css } from 'styled-components';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import Modal from 'react-native-modal';
import URL from 'url';

import QrScanner from 'components/QrScanner';

const statusBarHeight = Constants.statusBarHeight;

const Container = styled.View`
  flex: 1;
  padding-top: ${statusBarHeight}px;
  background-color: #fff;

  ${props => props.dark && css`
    background-color: #000;
  `}
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 60px;
  right: 20px;
  z-index: 999;
  padding: 10px 20px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, .6);
`;

const CloseButtonText = styled.Text`
  color: #fff;
  font-size: 20px;
  font-weight: bold;
`;

const injectingJavascript = `
  window.s3app = {
    onRouteNameChange: function(to) {
      const obj = {
        event: 'onRouteNameChange',
        value: to
      };
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    },
    openInAppBrowser: function(url) {
      const obj = {
        event: 'openInAppBrowser',
        value: url
      };
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    },
    openQrScanner: function() {
      const obj = {
        event: 'openQrScanner'
      };
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    },
    share: function(text) {
      const obj = {
        event: 'share',
        value: text
      };
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    },
  }
`;

class Home extends React.Component {
  constructor() {
    super();

    this.state = {
      routeName: null,
      dark: false,
      barStyle: 'default',
      modalVisible: false,
    };
  }

  componentDidMount = () => {
    if (Platform.OS === 'android') BackHandler.addEventListener('hardwareBackPress', this.handleBackButton.bind(this));
  }

  handleBackButton = () => {
    if (this.state.routeName !== 'Home') {
      this.webviewRef.goBack();
      return true;
    }
  }

  handleMessage = async ({ nativeEvent }) => {
    const { data } = nativeEvent;
    const { event, value } = JSON.parse(data);

    if (event === 'onRouteNameChange') this.onRouteNameChange(value);
    else if (event === 'openInAppBrowser') WebBrowser.openBrowserAsync(value);
    else if (event === 'openQrScanner') this.openModal();
    else if (event === 'share') {
      await Share.share({ message: value });
    }
  }

  onRouteNameChange = (to) => {
    const { name, path } = to;
    this.setState({ routeName: name });
    if (path.indexOf('/exchange-center') === 0) {
      this.setState({ dark: true, barStyle: 'light-content' });
    } else {
      this.setState({ dark: false, barStyle: 'default' });
    }
  }

  openModal = () => {
    this.setState({ modalVisible: true });
  }

  closeModal = () => {
    this.setState({ modalVisible: false });
  }

  completeQrScanning = (data) => {
    if (!data) return;
    this.webviewRef.injectJavaScript(`window.s3app.scannedAddress = '${data}'`);
    setTimeout(() => {
      this.closeModal();
    }, 100);
  }

  render() {
    return (
      <Container dark={this.state.dark}>
        <StatusBar barStyle={this.state.barStyle}/>
        <WebView
          source={{ uri: 'https://assemble.sta1.com' }}
          injectedJavaScript={injectingJavascript}
          onMessage={this.handleMessage}
          ref={o => this.webviewRef = o}
        />
        <Modal
          style={{ margin: 0, position: 'relative' }}
          isVisible={this.state.modalVisible}
          onBackButtonPress={this.closeModal}
        >
          <CloseButton onPress={this.closeModal}>
            <CloseButtonText>닫기</CloseButtonText>
          </CloseButton>
          <QrScanner
            complete={this.completeQrScanning}
          />
        </Modal>
      </Container>
    );
  }
}

export default function (props) {
  const navigation = useNavigation();

  return <Home {...props} navigation={navigation} />
}
import React from 'react';
import { StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styled from 'styled-components';
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
`;

const injectingJavascript = `
  window.s3app = {
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
    }
  }
`;

class Home extends React.Component {
  constructor() {
    super();

    this.state = {
      modalVisible: false,
    };
  }

  handleMessage = async ({ nativeEvent }) => {
    const { data } = nativeEvent;
    const { event, value } = JSON.parse(data);

    if (event === 'openInAppBrowser') WebBrowser.openBrowserAsync(value);
    else if (event === 'openQrScanner') this.openModal();
  }

  handleNavigationStateChange = ({
    url,
    title,
    loading,
    canGoBack,
    canGoForward,
  }) => {
    if (!url) return;
    const { pathname } = URL.parse(url);
    // if (pathname.indexOf('/exchange-center') === 0)
  }

  openModal = () => {
    this.setState({ modalVisible: true });
  }

  closeModal = () => {
    this.setState({ modalVisible: false });
  }

  completeQrScanning = (data) => {
    if (!data) return;
    console.log(data);
    this.webviewRef.injectJavaScript(`window.s3app.scannedAddress = '${data}'`);
    setTimeout(() => {
      this.closeModal();
    }, 100);
  }

  render() {
    return (
      <Container>
        <StatusBar barStyle="dark-content"/>
        <WebView
          source={{ uri: 'http://192.168.50.168:8080' }}
          injectedJavaScript={injectingJavascript}
          onMessage={this.handleMessage}
          onNavigationStateChange={this.handleNavigationStateChange}
          ref={o => this.webviewRef = o}
        />
        <Modal
          style={{ margin: 0 }}
          isVisible={this.state.modalVisible}
          onBackButtonPress={this.closeModal}
        >
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
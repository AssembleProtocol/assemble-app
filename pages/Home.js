import React from 'react';
import { BackHandler, Share, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styled, { css } from 'styled-components';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import QrScanner from 'components/QrScanner';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const statusBarHeight = Constants.statusBarHeight;

const Container = styled.View`
  flex: 1;
  padding-top: ${props => props.insetTop}px;
  background-color: #fff;

  ${props => props.dark && css`
    background-color: #000;
  `}
  ${props => props.translucent && css`
    padding-top: 0px;
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
    statusBarHeight: ${statusBarHeight},
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
      translucent: false,
      modalVisible: false,
      expoPushToken: null,
    };
  }

  componentDidMount = () => {
    if (Platform.OS === 'android') BackHandler.addEventListener('hardwareBackPress', this.handleBackButton.bind(this));
    this.registerForPushNotificationsAsync();
    Notifications.addNotificationResponseReceivedListener(this._handleNotificationResponse);
  }

  handleBackButton = () => {
    if (this.state.routeName !== 'Home') {
      this.webviewRef.goBack();
      return true;
    }
  }

  registerForPushNotificationsAsync = async () => {
    if (!Constants.isDevice) return;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('푸시 알림을 받지 않게 설정되었습니다.');
      return;
    }
    const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(expoPushToken);
    this.setState({ expoPushToken });
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  }

  _handleNotificationResponse = (response) => {
    const { notification } = response;
    const { request } = notification;
    const { content } = request;
    const { data } = content;
    console.log(data);
    this.webviewRef.injectJavaScript(`window.assembleRouter.push('/exchange-center')`);
  };

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
      this.setState({ dark: true, barStyle: 'light-content', translucent: false });
    } else if (path.indexOf('/store/products') === 0) {
      this.setState({ dark: false, barStyle: 'default', translucent: true });
    } else {
      this.setState({ dark: false, barStyle: 'default', translucent: false });
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
    const { dark, barStyle, translucent, modalVisible } = this.state;

    return (
      <Container dark={dark} translucent={translucent} insetTop={this.props.insetTop}>
        <StatusBar barStyle={barStyle} translucent={translucent}/>
        <WebView
          source={{ uri: 'http://192.168.50.69:8080' }}
          // source={{ uri: 'https://app.assembleprotocol.com' }}
          injectedJavaScript={injectingJavascript}
          onMessage={this.handleMessage}
          ref={o => this.webviewRef = o}
          textZoom={100}
        />
        <Modal
          style={{ margin: 0, position: 'relative' }}
          isVisible={modalVisible}
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
  const insets = useSafeAreaInsets();
  const { top: insetTop } = insets;

  return <Home {...props} navigation={navigation} insetTop={insetTop}/>
}
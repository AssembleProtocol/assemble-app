import React from 'react';
import styled from 'styled-components';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { BarCodeScanner } from 'expo-barcode-scanner';

const statusBarHeight = Constants.statusBarHeight;

const Container = styled.View`
  flex: 1;
  padding-top: ${statusBarHeight}px;
`;

const Scanner = styled.View`
  flex: 1;
`;

export default class QrScanner extends React.Component {
  constructor() {
    super();

    this.state = {
      scanned: false,
    };
  }

  componentDidMount = async () => {
    await BarCodeScanner.requestPermissionsAsync();
  }

  handleBarCodeScanned = async ({ type, data }) => {
    this.props.complete(data);
    this.setState({ scanned: true });
  }

  render() {
    return (
      <Container>
        <StatusBar backgroundColor='transparent' translucent={true} />
        <Scanner
          as={BarCodeScanner}
          onBarCodeScanned={this.state.scanned ? undefined : this.handleBarCodeScanned}
        />
      </Container>
    );
  }
}
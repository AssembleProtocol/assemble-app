import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import HomePage from 'pages/Home';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator headerMode="none">
      <Stack.Screen name="Home" component={HomePage} />
    </Stack.Navigator>
  );
}
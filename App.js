import HomeScreen from './components/HomeScreen';
import ApartmentScreen from './components/ApartmentScreen';
import RoomScreen from './components/RoomScreen';
import ServicesScreen from './components/ServicesScreen';
import RefundScreen from './components/RefundScreen';
import RefundCalculationScreen from './components/RefundCalculationScreen';
import WebviewScreen from './components/WebviewScreen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  Icon,
} from '@rneui/themed';
import * as NavigationBar from 'expo-navigation-bar';

import { WebView } from 'react-native-webview';

const Tab = createBottomTabNavigator();

const Stack = createNativeStackNavigator();

function HomeScreen1() {
  return (
    <Tab.Navigator>
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            headerShown: false,
            tabBarLabel: 'Приёмка',
            tabBarIcon: ({ color, size }) => (
              <Icon 
              name="ios-toggle" 
              type="ionicon" 
              />
              ),
            }}
            />

        <Tab.Screen 
          name="Refund" 
          component={RefundScreen} 
          options={{
            headerShown: false,
            tabBarLabel: 'Возмещение',
            tabBarIcon: ({ color, size }) => (
              <Icon 
              name="wallet-outline" 
              type="ionicon" 
              
              />
              
            ),
            // tabBarBadge: 3,
          }}
        />

        <Tab.Screen 
          name="Services" 
          component={ServicesScreen} 
          options={{
            headerShown: false,
            tabBarLabel: 'Услуги',
            tabBarIcon: ({ color, size }) => (
              <Icon 
              name="ios-albums-outline" 
              type="ionicon" 
              
              />
              
            ),
            // tabBarBadge: 3,
          }}
        />
    </Tab.Navigator>
  );
}



export default function App() {
 
  NavigationBar.setBackgroundColorAsync("white");
  return (
    <NavigationContainer>
      <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen1} 
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="Apartment" 
        component={ApartmentScreen} 
        options={{title: "Квартира" }}
      />
      <Stack.Screen 
        name="Room" 
        component={RoomScreen}
        options={({ route }) => ({ 
          title: route.params.title, 
        })}
      />
      <Stack.Screen 
        name="RefundCalculation" 
        component={RefundCalculationScreen}
        options={({ route }) => ({ 
          title: route.params.title, 
        })}
      />
      <Stack.Screen 
        name="Webview" 
        component={WebviewScreen}
        options={({ route }) => ({ 
          title: route.params.title,
          tabBarStyle: { display: "none" }, 
        })}
      />
    </Stack.Navigator>
    </NavigationContainer>
  );
}
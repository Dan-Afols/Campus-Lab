import "react-native-gesture-handler";
import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Provider } from "react-redux";
import { HomeScreen } from "../features/home/HomeScreen";
import { AcademicsScreen } from "../features/academics/AcademicsScreen";
import { HostelScreen } from "../features/hostel/HostelScreen";
import { HealthFinanceScreen } from "../features/finance/HealthFinanceScreen";
import { AIScreen } from "../features/ai/AIScreen";
import { NewsScreen } from "../features/news/NewsScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { OnboardingScreen } from "../features/auth/OnboardingScreen";
import { palette } from "../theme/colors";
import { store } from "../store";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.electricBlue,
        tabBarStyle: { height: 62, paddingBottom: 8 }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Academics" component={AcademicsScreen} />
      <Tab.Screen name="Hostel" component={HostelScreen} />
      <Tab.Screen name="Health+Finance" component={HealthFinanceScreen} />
      <Tab.Screen name="AI" component={AIScreen} />
    </Tab.Navigator>
  );
}

function MainApp() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Dashboard" component={Tabs} options={{ headerShown: false }} />
      <Drawer.Screen name="News" component={NewsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);

  return (
    <Provider store={store}>
      <NavigationContainer>
        {onboarded ? <MainApp /> : <OnboardingScreen onContinue={() => setOnboarded(true)} />}
      </NavigationContainer>
    </Provider>
  );
}

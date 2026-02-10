import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#333",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Programs",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>&#x1F3CB;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Start",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>&#x1F4AA;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>&#x1F4CA;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>&#x2699;</Text>
          ),
        }}
      />
    </Tabs>
  );
}

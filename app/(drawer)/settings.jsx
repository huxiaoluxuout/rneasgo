import { useNavigation } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Appbar } from "react-native-paper";
import MyExpoVideoThumbnails from "../components/MyExpoVideoThumbnails";

export default function SettingsScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="设置" />
        <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
      </Appbar.Header>
      <View style={styles.content}>
        <Text>设置页面内容</Text>
          <MyExpoVideoThumbnails></MyExpoVideoThumbnails>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

import { useLocalSearchParams, useNavigation } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Appbar } from "react-native-paper";

export default function HomeScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { category, title, ...item } = params;
  console.log("params-item", item);
  console.log("params", params);
  const openDrawer = () => {
    console.log("openDrawer");
    navigation.openDrawer();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title={title || "列表"} color="white" />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>
      <View style={styles.content}>
        <Text>分类: {category}</Text>
        <Text>标题: {title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#189ACF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

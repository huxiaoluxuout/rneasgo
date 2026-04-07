import { useNavigation } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Appbar } from "react-native-paper";

export default function HomeScreen() {
  const navigation = useNavigation(); // 关键：用这个 hook 获取 navigation
  const openDrawer = () => {
    console.log("openDrawer");
    navigation.openDrawer();
  };
  const openSearchBar = () => {
    console.log("openSearchBar");
  };
  const list = [
    {
      title: "SPORT",
      screen: "programSelection",
      name: "SPORT",
      backgroundColor: "#4A90E2",
    },
    {
      title: "AESTHETIC",
      screen: "programSelection",
      name: "AESTHETIC",
      backgroundColor: "#50E3C2",
    },
    {
      title: "MASSAGE",
      screen: "programSelection",
      name: "MASSAGE",
      backgroundColor: "#59A8EB",
    },
    {
      title: "VASCULAR",
      screen: "programSelection",
      name: "VASCULAR",
      backgroundColor: "#41C5F4",
    },
    {
      title: "PAIN",
      screen: "programSelection",
      name: "PAIN",
      backgroundColor: "#66D7D1",
    },
    {
      title: "REHABILITATION",
      screen: "programSelection",
      name: "REHABILITATION",
      backgroundColor: "#7ED321",
    },
    {
      title: "SUPPORT VIDEOS",
      screen: "programSelection",
      name: "SUPPORT VIDEOS",
      backgroundColor: "#9013FE",
    },
  ];

  const pageItems = list.map((item) => (
    <TouchableOpacity
      key={item.name}
      style={[styles.button, { backgroundColor: item.backgroundColor }]}
      onPress={() =>
        navigation.navigate(item.screen, {
          category: item.name,
          title: item.title,
        })
      }
    >
      <Text style={styles.buttonText}>{item.title}</Text>
    </TouchableOpacity>
  ));

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content color="white" title="首页" />
        <Appbar.Action
          icon="magnify"
          color="white"
          style={{ marginRight: -4 }}
          onPress={openSearchBar}
        />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>
      <View style={styles.content}>{pageItems}</View>
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
  },
  button: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

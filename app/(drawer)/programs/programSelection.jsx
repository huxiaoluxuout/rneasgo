import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, IconButton, Menu } from "react-native-paper";

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { category, title, ...item } = params;
  const [menuVisible, setMenuVisible] = useState(null);

  console.log("params-item", item);
  console.log("params", params);
  const openDrawer = () => {
    console.log("openDrawer");
    navigation.openDrawer();
  };

  const programs = [
    { id: 1, name: "Potentiation", duration: "3:30 min." },
    { id: 2, name: "Endurance", duration: "56:00 min." },
    { id: 3, name: "Resistance", duration: "27:00 min." },
    { id: 4, name: "Strength", duration: "33:00 min." },
    { id: 5, name: "Explosive strength", duration: "32:00 min." },
    { id: 6, name: "Fartlek", duration: "49:00 min." },
    { id: 7, name: "Concentric", duration: "24:00 min." },
    { id: 8, name: "Eccentric", duration: "25:00 min." },
    { id: 9, name: "Plyometry", duration: "28:00 min." },
    { id: 10, name: "Hypertrophy", duration: "31:00 min." },
    { id: 11, name: "Stretching", duration: "12:00 min." },
  ];

  const handleProgramPress = (program) => {
    router.push({
      pathname: "/programs/select-body-zone",
      params: {
        programId: program.id,
        programName: program.name,
        duration: program.duration,
        category,
        title,
      },
    });
  };

  const renderProgramItem = ({ item }) => (
    <TouchableOpacity
      style={styles.programItem}
      onPress={() => handleProgramPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.programInfo}>
        <Text style={styles.programName}>
          {item.id} - {item.name}
        </Text>
        <Text style={styles.programDuration}>{item.duration}</Text>
      </View>
      <Menu
        visible={menuVisible === item.id}
        onDismiss={() => setMenuVisible(null)}
        anchor={
          <IconButton
            icon="dots-vertical"
            size={24}
            color="#189ACF"
            onPress={() => setMenuVisible(item.id)}
          />
        }
      >
        <Menu.Item onPress={() => setMenuVisible(null)} title="Program info" />
        <Menu.Item
          onPress={() => setMenuVisible(null)}
          title="Add to favorites"
        />
      </Menu>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title={title || "列表"} color="white" />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>
      <Text style={styles.sectionTitle}>Select a program</Text>
      <FlatList
        data={programs}
        renderItem={renderProgramItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#189ACF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
    color: "#333",
  },
  listContent: {
    paddingBottom: 20,
  },
  programItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000",
  },
  programDuration: {
    fontSize: 15,
    color: "#666",
    marginTop: 2,
  },
});

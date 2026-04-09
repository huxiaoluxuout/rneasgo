import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Appbar } from "react-native-paper";

export default function SelectBodyZone() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { programId, programName, duration, category, title } = params;

  const openDrawer = () => {
    navigation.openDrawer();
  };

  const handleBodyZonePress = () => {

    router.push({
      pathname: "/programs/select-eletrode-positioning",
      params: {
        programId,
        programName,
        duration,
        category,
        title,
        bodyZone: "selected",
      },
    });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content
          title={programName || "Select Body Zone"}
          color="white"
        />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>
      <View style={styles.content}>
        <Text style={styles.infoText}>Program ID: {programId}</Text>
        <Text style={styles.infoText}>Program Name: {programName}</Text>
        <Text style={styles.infoText}>Duration: {duration}</Text>
        <Text style={styles.infoText}>Category: {category}</Text>
        <TouchableOpacity
          style={styles.sectionTitleContainer}
          onPress={handleBodyZonePress}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Select a body zone</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  sectionTitleContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
    color: "#333",
  },
});

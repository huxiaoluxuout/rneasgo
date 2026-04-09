import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Appbar } from "react-native-paper";

export default function SelectElectrodePositioning() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { programId, programName, duration, category, title, bodyZone } = params;

  const openDrawer = () => {
    navigation.openDrawer();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content
          title="Select Electrode Position"
          color="white"
        />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>
      <View style={styles.content}>
        <Text style={styles.infoText}>Program ID: {programId}</Text>
        <Text style={styles.infoText}>Program Name: {programName}</Text>
        <Text style={styles.infoText}>Duration: {duration}</Text>
        <Text style={styles.infoText}>Category: {category}</Text>
        <Text style={styles.infoText}>Body Zone: {bodyZone}</Text>
        <Text style={styles.sectionTitle}>
          Select electrode positioning
        </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 24,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
    color: "#333",
  },
});

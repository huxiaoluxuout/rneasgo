import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Appbar } from "react-native-paper";

export default function LinkDevice() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { programId, programName, duration, category, bodyZone } = params;

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) parent.setOptions({ swipeEnabled: false });
      return () => {
        if (parent) parent.setOptions({ swipeEnabled: true });
      };
    }, [navigation]),
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content title="Link Device" color="white" />
      </Appbar.Header>
      <View style={styles.content}>
        <Text style={styles.title}>Link Device</Text>
        <Text style={styles.description}>
          Connect your device to start the program
        </Text>
        {programId && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Program Information:</Text>
            <Text style={styles.infoText}>ID: {programId}</Text>
            <Text style={styles.infoText}>Name: {programName}</Text>
            <Text style={styles.infoText}>Duration: {duration}</Text>
            {category && (
              <Text style={styles.infoText}>Category: {category}</Text>
            )}
            {bodyZone && (
              <Text style={styles.infoText}>Body Zone: {bodyZone}</Text>
            )}
          </View>
        )}
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
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  infoContainer: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});

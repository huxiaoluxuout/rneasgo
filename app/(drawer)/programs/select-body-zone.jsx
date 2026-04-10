import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar } from "react-native-paper";

const frontZones = [
  { id: 3, top: "22%", left: "32%" },
  { id: 3, top: "22%", left: "63%" },
  { id: 4, top: "33%", left: "20%" },
  { id: 4, top: "33%", left: "75%" },
  { id: 6, top: "31%", left: "48%" },
  { id: 7, top: "44%", left: "48%" },
  { id: 9, top: "62%", left: "35%" },
  { id: 9, top: "62%", left: "60%" },
  { id: 10, top: "78%", left: "35%" },
  { id: 10, top: "78%", left: "60%" },
];

const backZones = [
  { id: 3, top: "20%", left: "32%" },
  { id: 3, top: "20%", left: "63%" },
  { id: 4, top: "32%", left: "20%" },
  { id: 4, top: "32%", left: "75%" },
  { id: 2, top: "34%", left: "48%" },
  { id: 8, top: "50%", left: "48%" },
  { id: 9, top: "64%", left: "35%" },
  { id: 9, top: "64%", left: "60%" },
  { id: 10, top: "79%", left: "35%" },
  { id: 10, top: "79%", left: "60%" },
];

const zoneInfoMap = {
  6: ["Abdominals", "Obliques"],
  7: ["Lower Back"],
  2: ["Upper Back", "Neck"],
  8: ["Lower Back"],
  3: ["Shoulders", "Deltoids"],
  4: ["Arms", "Biceps/Triceps"],
  9: ["Quadriceps", "Hamstrings"],
  10: ["Calves", "Shins"],
};

export default function SelectBodyZone() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { programId, programName, duration, category, title } = params;
  const [viewMode, setViewMode] = useState("front");
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedZoneForInfo, setSelectedZoneForInfo] = useState(null);

  const openDrawer = () => {
    navigation.openDrawer();
  };

  const openInfoModal = (zoneId) => {
    setSelectedZoneForInfo(zoneId);
    setInfoModalVisible(true);
  };

  const closeInfoModal = () => {
    setInfoModalVisible(false);
    setSelectedZoneForInfo(null);
  };

  const handleZonePress = (zoneId) => {
    router.push({
      pathname: "/programs/select-eletrode-positioning",
      params: {
        programId,
        programName,
        duration,
        category,
        title,
        bodyZone: String(zoneId),
      },
    });
  };

  const currentZones = viewMode === "front" ? frontZones : backZones;
  const imageSource =
    viewMode === "front"
      ? require("../../../assets/images/body/front.png")
      : require("../../../assets/images/body/back.png");

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content
          title={programName || "Select Body Zone"}
          color="white"
        />
        <Appbar.Action
          icon="information-outline"
          color="white"
          onPress={() => openInfoModal(6)}
        />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select a body zone</Text>

        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.bodyImage}
            resizeMode="contain"
          />
          {currentZones.map((zone, index) => (
            <TouchableOpacity
              key={`${viewMode}-${zone.id}-${index}`}
              style={[styles.zoneMarker, { top: zone.top, left: zone.left }]}
              onPress={() => handleZonePress(zone.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.zoneText}>{zone.id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === "front" && styles.viewButtonActive,
            ]}
            onPress={() => setViewMode("front")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewMode === "front" && styles.viewButtonTextActive,
              ]}
            >
              Front View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === "back" && styles.viewButtonActive,
            ]}
            onPress={() => setViewMode("back")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewMode === "back" && styles.viewButtonTextActive,
              ]}
            >
              Back View
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={infoModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeInfoModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Info</Text>
              </View>
              <View style={styles.modalContent}>
                {selectedZoneForInfo &&
                  zoneInfoMap[selectedZoneForInfo]?.map((info, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.modalItem,
                        index < zoneInfoMap[selectedZoneForInfo].length - 1 &&
                          styles.modalItemBorder,
                      ]}
                      onPress={closeInfoModal}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalItemText}>{info}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    marginBottom: 16,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 0.68,
    position: "relative",
    marginBottom: 24,
  },
  bodyImage: {
    width: "100%",
    height: "100%",
  },
  zoneMarker: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#189ACF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -18,
    marginTop: -18,
  },
  zoneText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  viewButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 14,
    borderRadius: 6,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
  },
  viewButtonActive: {
    backgroundColor: "#189ACF",
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
  },
  viewButtonTextActive: {
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "75%",
    maxWidth: 320,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  modalHeader: {
    backgroundColor: "#189ACF",
    paddingVertical: 14,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
  modalContent: {
    backgroundColor: "#fff",
  },
  modalItem: {
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modalItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});

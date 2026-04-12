import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function DevicesWorking() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { programId, programName, duration, category, bodyZone } = params;

  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(205);
  const [deviceA, setDeviceA] = useState({ value: 0, max: 99, active: true });
  const [deviceB, setDeviceB] = useState({ value: 0, max: 99, active: false });

  useEffect(() => {
    let interval;
    if (!isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const adjustValue = (device, delta) => {
    if (device === "A") {
      setDeviceA((prev) => ({
        ...prev,
        value: Math.max(0, Math.min(prev.max, prev.value + delta)),
      }));
    } else {
      setDeviceB((prev) => ({
        ...prev,
        value: Math.max(0, Math.min(prev.max, prev.value + delta)),
      }));
    }
  };

  const openDrawer = () => {
    navigation.openDrawer();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content title={bodyZone || "Shoulder"} color="white" />
        <Appbar.Action
          icon="information-outline"
          color="white"
          onPress={() => {}}
        />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.programTitle}>{programName || "Potentiation"}</Text>
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={SCREEN_HEIGHT > 800 ? 22 : 18}
              color="#189ACF"
            />
            <Text style={[styles.timerText, { fontSize: SCREEN_HEIGHT > 800 ? 24 : 20 }]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>

        <View style={[styles.imageContainer, { flex: SCREEN_HEIGHT > 800 ? 4.5 : 3.8 }]}>
          <Image
            source={require("../../../assets/images/body/front.png")}
            style={styles.bodyImage}
            resizeMode="contain"
          />
        </View>

        <View style={[styles.workSection, { paddingVertical: SCREEN_HEIGHT > 800 ? 14 : 10 }]}>
          <Text style={[styles.workTitle, { fontSize: SCREEN_HEIGHT > 800 ? 17 : 15 }]}>Work</Text>
          <TouchableOpacity
            style={[styles.pauseButton, {
              width: SCREEN_HEIGHT > 800 ? 64 : 54,
              height: SCREEN_HEIGHT > 800 ? 64 : 54,
              borderRadius: SCREEN_HEIGHT > 800 ? 32 : 27,
            }]}
            onPress={() => setIsPaused(!isPaused)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isPaused ? "play" : "pause"}
              size={SCREEN_HEIGHT > 800 ? 34 : 28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.devicesRow, { flex: SCREEN_HEIGHT > 800 ? 2.8 : 2.4 }]}>
          <View style={[styles.deviceCard, deviceA.active && styles.deviceCardActive]}>
            <View style={[styles.deviceHeader, deviceA.active && styles.deviceHeaderActive]}>
              <Text style={[styles.deviceName, deviceA.active && styles.deviceNameActive]}>
                Myofit6 A
              </Text>
            </View>
            <Text style={[styles.deviceValue, { fontSize: SCREEN_HEIGHT > 800 ? 28 : 24 }]}>
              {deviceA.value}/{deviceA.max}
            </Text>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[styles.controlButton, deviceA.active && styles.controlButtonActive, {
                  width: SCREEN_HEIGHT > 800 ? 52 : 44,
                  height: SCREEN_HEIGHT > 800 ? 52 : 44,
                  borderRadius: SCREEN_HEIGHT > 800 ? 26 : 22,
                }]}
                onPress={() => adjustValue("A", -1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={SCREEN_HEIGHT > 800 ? 26 : 22}
                  color={deviceA.active ? "#189ACF" : "#CCC"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, deviceA.active && styles.controlButtonActive, {
                  width: SCREEN_HEIGHT > 800 ? 52 : 44,
                  height: SCREEN_HEIGHT > 800 ? 52 : 44,
                  borderRadius: SCREEN_HEIGHT > 800 ? 26 : 22,
                }]}
                onPress={() => adjustValue("A", 1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={SCREEN_HEIGHT > 800 ? 26 : 22}
                  color={deviceA.active ? "#189ACF" : "#CCC"}
                />
              </TouchableOpacity>
            </View>
            <MaterialCommunityIcons
              name="battery"
              size={SCREEN_HEIGHT > 800 ? 30 : 26}
              color="#189ACF"
              style={styles.batteryIcon}
            />
          </View>

          <View style={[styles.deviceCard, deviceB.active && styles.deviceCardActive]}>
            <View style={[styles.deviceHeader, deviceB.active && styles.deviceHeaderActive]}>
              <Text style={[styles.deviceName, deviceB.active && styles.deviceNameActive]}>
                Myofit6 B
              </Text>
            </View>
            <Text style={[styles.deviceValue, { fontSize: SCREEN_HEIGHT > 800 ? 28 : 24 }]}>
              {deviceB.value}/{deviceB.max}
            </Text>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[styles.controlButton, deviceB.active && styles.controlButtonActive, {
                  width: SCREEN_HEIGHT > 800 ? 52 : 44,
                  height: SCREEN_HEIGHT > 800 ? 52 : 44,
                  borderRadius: SCREEN_HEIGHT > 800 ? 26 : 22,
                }]}
                onPress={() => adjustValue("B", -1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={SCREEN_HEIGHT > 800 ? 26 : 22}
                  color={deviceB.active ? "#189ACF" : "#CCC"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, deviceB.active && styles.controlButtonActive, {
                  width: SCREEN_HEIGHT > 800 ? 52 : 44,
                  height: SCREEN_HEIGHT > 800 ? 52 : 44,
                  borderRadius: SCREEN_HEIGHT > 800 ? 26 : 22,
                }]}
                onPress={() => adjustValue("B", 1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={SCREEN_HEIGHT > 800 ? 26 : 22}
                  color={deviceB.active ? "#189ACF" : "#CCC"}
                />
              </TouchableOpacity>
            </View>
            <MaterialCommunityIcons
              name="battery-outline"
              size={SCREEN_HEIGHT > 800 ? 30 : 26}
              color="#999"
              style={styles.batteryIcon}
            />
          </View>
        </View>
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
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerText: {
    fontWeight: "600",
    color: "#189ACF",
  },
  imageContainer: {
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
    marginBottom: 8,
  },
  bodyImage: {
    width: "100%",
    height: "100%",
  },
  workSection: {
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  workTitle: {
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  pauseButton: {
    backgroundColor: "#189ACF",
    justifyContent: "center",
    alignItems: "center",
  },
  devicesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  deviceCard: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
  },
  deviceCardActive: {
    backgroundColor: "#E3F2FD",
  },
  deviceHeader: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 6,
    alignSelf: "stretch",
  },
  deviceHeaderActive: {
    backgroundColor: "#189ACF",
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  deviceNameActive: {
    color: "#fff",
  },
  deviceValue: {
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  controlButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonActive: {
    borderColor: "#189ACF",
  },
  batteryIcon: {
    marginTop: 2,
  },
});

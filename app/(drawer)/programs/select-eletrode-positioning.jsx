import LevelSlider from "@/components/LevelSlider";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Appbar } from "react-native-paper";
import Swiper from "react-native-swiper";

const ELECTRODE_IMAGES = [
  require("@/assets/images/eletrode-positioning/101.jpg"),
  require("@/assets/images/eletrode-positioning/104.jpg"),
  require("@/assets/images/eletrode-positioning/106.jpg"),
];

export default function SelectElectrodePositioning() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { programId, programName, duration, category, title, bodyZone } =
    params;

  const [level, setLevel] = useState(1);

  const openDrawer = () => {
    navigation.openDrawer();
  };

  const handleStart = () => {
    router.push({
      pathname: "/programs/link-device",
      params: {
        programId,
        programName,
        duration,
        category,
        title,
        bodyZone,
        level: String(level),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content title={programName || "Program"} color="white" />
        <Appbar.Action
          icon="information-outline"
          color="white"
          onPress={() => {}}
        />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>

      <Text style={styles.subtitle}>Select electrode positioning</Text>

      <View style={styles.swiperContainer}>
        <Swiper
          loop={false}
          showsPagination
          paginationStyle={{ bottom: -24 }}
          dotStyle={styles.dot}
          activeDotStyle={styles.activeDot}
        >
          {ELECTRODE_IMAGES.map((img, index) => (
            <View key={index} style={styles.slide}>
              <Image source={img} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </Swiper>
      </View>

      <Text style={styles.levelTitle}>Adjust the level of work</Text>

      {/* <LevelSlider level={1} onLevelChange={setLevel} /> */}
      <LevelSlider />
      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startButtonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  header: {
    width: "100%",
    backgroundColor: "#189ACF",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 12,
    color: "#333",
  },
  swiperContainer: {
    height: 340,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  slide: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 8,
  },
  dot: {
    backgroundColor: "#BDBDBD",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#189ACF",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  levelTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: "#189ACF",
    paddingVertical: 16,
    paddingHorizontal: 120,
    borderRadius: 8,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 40,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

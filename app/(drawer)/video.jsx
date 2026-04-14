import { useNavigation } from "expo-router";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useState, useEffect, useCallback } from "react";
import {
  saveVideoHistory,
  saveVideoProgress,
  getVideoProgress,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
} from "../../utils/storage";

// const VIDEO_URL = "https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov";
const VIDEO_URL = require("../../assets/videos/v1.mp4");
const videoList = [
  {
    id: 1,
    title: "Introduction to EMS Training",
    duration: "5:30",
    category: "Getting Started",
    thumbnail: require("../../assets/images/body/front.png"),
    videoSource: VIDEO_URL,
  },
  {
    id: 2,
    title: "Sport Programs Overview",
    duration: "8:15",
    category: "SPORT",
    thumbnail: require("../../assets/images/body/front.png"),
    videoSource: VIDEO_URL,
  },
  {
    id: 3,
    title: "Aesthetic Programs Guide",
    duration: "6:45",
    category: "AESTHETIC",
    thumbnail: require("../../assets/images/body/front.png"),
    videoSource: VIDEO_URL,
  },
  {
    id: 4,
    title: "Massage Programs Demo",
    duration: "7:20",
    category: "MASSAGE",
    thumbnail: require("../../assets/images/body/front.png"),
    videoSource: VIDEO_URL,
  },
  {
    id: 5,
    title: "Vascular Programs Explained",
    duration: "9:10",
    category: "VASCULAR",
    thumbnail: require("../../assets/images/body/front.png"),
    videoSource: VIDEO_URL,
  },
  {
    id: 6,
    title: "Pain Relief Techniques",
    duration: "10:05",
    category: "PAIN",
    thumbnail: require("../../assets/images/body/front.png"),
    videoSource: VIDEO_URL,
  },
];

export default function VideoScreen() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favList = await isFavorite(0);
      if (favList) {
        setFavorites(new Set(videoList.map((v) => v.id)));
      }
    } catch (error) {
      console.log("Error loading favorites");
    }
  };

  const player = useVideoPlayer(currentVideo?.videoSource);

  useEffect(() => {
    if (modalVisible) {
      player.play();
      saveVideoHistory(currentVideo);
      getVideoProgress(currentVideo?.id).then((progress) => {
        if (progress?.position) {
          // 可以在这里恢复播放位置
        }
      });
    } else {
      player.pause();
      if (currentVideo) {
        saveVideoProgress(currentVideo.id, { position: Date.now() });
      }
    }
  }, [modalVisible]);

  const openDrawer = () => {
    navigation.openDrawer();
  };

  const playVideo = (item) => {
    setCurrentVideo(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    player.pause();
    setModalVisible(false);
    setTimeout(() => {
      setCurrentVideo(null);
    }, 300);
  };

  const toggleFavorite = useCallback(async (item) => {
    try {
      const isFav = favorites.has(item.id);
      if (isFav) {
        await removeFromFavorites(item.id);
        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      } else {
        await addToFavorites(item);
        setFavorites((prev) => new Set(prev).add(item.id));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  }, [favorites]);

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity style={styles.videoCard} activeOpacity={0.7} onPress={() => playVideo(item)}>
      <View style={styles.thumbnailContainer}>
        <Image source={item.thumbnail} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.playButton}>
          <MaterialCommunityIcons name="play" size={40} color="white" />
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{item.title}</Text>
        <Text style={styles.videoCategory}>{item.category}</Text>
      </View>
      <TouchableOpacity
        style={[styles.favoriteButton, favorites.has(item.id) && styles.favoriteButtonActive]}
        onPress={(e) => {
          e.stopPropagation();
          toggleFavorite(item);
        }}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={favorites.has(item.id) ? "heart" : "heart-outline"}
          size={24}
          color={favorites.has(item.id) ? "#FF4757" : "#999"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title="Video" color="white" />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Learn More About Our Programs</Text>
          <Text style={styles.introDescription}>
            Watch our collection of instructional videos to better understand how
            each program works and how to get the most out of your training sessions.
          </Text>
        </View>

        <FlatList
          data={videoList}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.videoList}
          scrollEnabled={false}
        />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.videoModalTitle} numberOfLines={1}>
              {currentVideo?.title}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.videoPlayerContainer}>
            <VideoView
              style={styles.videoPlayer}
              player={player}
              nativeControls
              contentFit="contain"
            />
          </View>

          <View style={styles.videoModalFooter}>
            <Text style={styles.videoModalInfo}>
              {currentVideo?.category} • {currentVideo?.duration}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#772f94ff",
  },
  content: {
    flex: 1,
  },
  introSection: {
    padding: 20,
    backgroundColor: "#F8F8F8",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  introDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  videoList: {
    padding: 16,
  },
  videoCard: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnailContainer: {
    position: "relative",
    height: 200,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(119, 47, 148, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  videoCategory: {
    fontSize: 14,
    color: "#772f94ff",
    fontWeight: "500",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  favoriteButtonActive: {
    backgroundColor: "rgba(255, 71, 87, 0.1)",
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#772f94ff",
  },
  closeButton: {
    padding: 4,
  },
  videoModalTitle: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 12,
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  videoModalFooter: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  videoModalInfo: {
    color: "#aaa",
    fontSize: 14,
  },
});

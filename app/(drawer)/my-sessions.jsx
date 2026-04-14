import { useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const mockPastSessions = [
  {
    id: 1,
    name: "Potentiation",
    date: "2026/04/10-20:24",
    image: require("../../assets/images/body/front.png"),
  },
];

const mockFavorites = [
  {
    category: "SPORT",
    items: [
      { id: 1, name: "1 - Potentiation", duration: "3:30 min." },
      { id: 2, name: "3 - Resistance", duration: "27:00 min." },
    ],
  },
  {
    category: "VASCULAR",
    items: [
      { id: 3, name: "25 - Cramp Prevention", duration: "40:00 min." },
    ],
  },
];

export default function MySessions() {
  const router = useRouter();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("past");

  const openDrawer = () => {
    navigation.openDrawer();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Action
          icon="home"
          color="white"
          onPress={() => router.push("/")}
        />
        <Appbar.Content title="My Sessions" color="white" />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.tabActive]}
          onPress={() => setActiveTab("past")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}>
            Past
          </Text>
          <View style={[styles.tabIndicator, activeTab === "past" && styles.tabIndicatorActive]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.tabActive]}
          onPress={() => setActiveTab("favorites")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "favorites" && styles.tabTextActive]}>
            Favorites
          </Text>
          <View style={[styles.tabIndicator, activeTab === "favorites" && styles.tabIndicatorActive]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "past" ? (
          <View style={styles.sessionList}>
            {mockPastSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionItem}
                activeOpacity={0.7}
              >
                <Image
                  source={session.image}
                  style={styles.sessionImage}
                  resizeMode="cover"
                />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <Text style={styles.sessionDate}>{session.date}</Text>
                </View>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => {}}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={24}
                    color="#189ACF"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.favoritesList}>
            {mockFavorites.map((group) => (
              <View key={group.category} style={styles.categoryGroup}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{group.category}</Text>
                </View>
                {group.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.favoriteItem}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: "/programs/programSelection",
                        params: {
                          category: group.category,
                          title: item.name,
                          itemId: item.id,
                          duration: item.duration,
                        },
                      })
                    }
                  >
                    <View style={styles.favoriteInfo}>
                      <Text style={styles.favoriteName}>{item.name}</Text>
                      <Text style={styles.favoriteDuration}>{item.duration}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => {}}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="dots-vertical"
                        size={24}
                        color="#189ACF"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    position: "relative",
  },
  tabActive: {},
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  tabTextActive: {
    color: "#333",
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: 60,
    height: 3,
    borderRadius: 2,
  },
  tabIndicatorActive: {
    backgroundColor: "#189ACF",
  },
  content: {
    flex: 1,
  },
  sessionList: {
    padding: 12,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sessionImage: {
    width: 56,
    height: 56,
    borderRadius: 6,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: "#888",
  },
  moreButton: {
    padding: 4,
  },
  favoritesList: {
    padding: 12,
  },
  categoryGroup: {
    marginBottom: 20,
  },
  categoryHeader: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
    letterSpacing: 1,
  },
  favoriteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  favoriteDuration: {
    fontSize: 14,
    color: "#888",
  },
});

import { useState } from "react";

import { INDEX_MODEL_MAP } from "@/hooks/config";
import { useNavigation } from "expo-router";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, IconButton ,Portal,PaperProvider } from "react-native-paper";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const openDrawer = () => {
    console.log("openDrawer");
    navigation.openDrawer();
  };

  const openSearchBar = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const categoryDescriptions = [
    {
      title: "SPORT",
      description:
        "EMS (Electrical Muscle Stimulation) programs stimulate slow and fast muscular fibers for targeted muscle strengthening. Choose between programs called endurance, resistance, strengthening and more.",
    },
    {
      title: "AESTHETIC",
      description:
        "Aesthetic programmes provide the solution for everyone who wants to regain and keep the benefits of intense muscular activity. This category allows you to restore and maintain a firm body, shapely figure and toned skin.",
    },
    {
      title: "MASSAGE",
      description:
        "After a long day of work, a strenuous workout, or you just want to relax - this category offers comfort massage programs, muscle relaxation, and more.",
    },
    {
      title: "VASCULAR",
      description:
        "The low frequency current used of the Vascular category significantly improves blood circulation in the stimulated area.",
    },
    {
      title: "PAIN",
      description:
        "Relieve your pain with TENS (Transcutaneous Electrical Nerve Stimulation) electrotherapy programs. Back pain, joint pain... choose the program that suits you!",
    },
    {
      title: "REHABILITATION",
      description:
        "Rehabilitation programs help you recover from injuries and surgeries, restoring mobility and strength.",
    },
  ];
  const list = INDEX_MODEL_MAP;
  // const list = [
  //   {
  //     title: "SPORT",
  //     screen: "programSelection",
  //     name: "SPORT",
  //     backgroundColor: "#4A90E2",
  //   },
  //   {
  //     title: "AESTHETIC",
  //     screen: "programSelection",
  //     name: "AESTHETIC",
  //     backgroundColor: "#50E3C2",
  //   },
  //   {
  //     title: "MASSAGE",
  //     screen: "programSelection",
  //     name: "MASSAGE",
  //     backgroundColor: "#59A8EB",
  //   },
  //   {
  //     title: "VASCULAR",
  //     screen: "programSelection",
  //     name: "VASCULAR",
  //     backgroundColor: "#41C5F4",
  //   },
  //   {
  //     title: "PAIN",
  //     screen: "programSelection",
  //     name: "PAIN",
  //     backgroundColor: "#66D7D1",
  //   },
  //   {
  //     title: "REHABILITATION",
  //     screen: "programSelection",
  //     name: "REHABILITATION",
  //     backgroundColor: "#7ED321",
  //   },
  //   {
  //     title: "SUPPORT VIDEOS",
  //     screen: "programSelection",
  //     name: "SUPPORT VIDEOS",
  //     backgroundColor: "#9013FE",
  //   },
  // ];

  const pageItems = list.map((item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.button, { backgroundColor: item.backgroundColor }]}
      onPress={() =>
        navigation.navigate(item.screen, {
          category: item.name.en,
          title: item.name.en,
          ...item,
        })
      }
    >
      <Text style={styles.buttonText}>{item.name.en}</Text>
    </TouchableOpacity>
  ));

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content color="white" title="Myofit6" />
        <Appbar.Action
          icon="information"
          color="white"
          style={{ marginRight: -4 }}
          onPress={openSearchBar}
        />
        <Appbar.Action icon="menu" color="white" onPress={openDrawer} />
      </Appbar.Header>
      <View style={styles.content}>{pageItems}</View>
          <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={closeModal}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderText}>Myofit6</Text>
                <IconButton
                    icon="close"
                    iconColor="white"
                    size={24}
                    onPress={closeModal}
                />
              </View>
              <ScrollView style={styles.modalContent}>
                {categoryDescriptions.map((item, index) => (
                    <View key={index} style={styles.categoryItem}>
                      <Text style={styles.categoryTitle}>{item.title}</Text>
                      <Text style={styles.categoryDescription}>
                        {item.description}
                      </Text>
                    </View>
                ))}
              </ScrollView>
            </View>
          </Modal>

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
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    backgroundColor: "#189ACF",
    // backgroundColor: "#cf1874",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    // paddingBottom: 16,
  },
  modalHeaderText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  categoryItem: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#189ACF",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  categoryDescription: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    textAlign: "justify",
  },
});

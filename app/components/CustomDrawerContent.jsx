import OpenSansText from "@components/OpenSansText";
import i18n from "@languages/i18n";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { CommonActions } from "@react-navigation/native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { Divider, Drawer, Switch } from "react-native-paper";
export default function CustomDrawerContent(props) {
  const { t, ready } = useTranslation();

  const [isEnabled, setIsEnabled] = useState(false);

  const toggleLanguage = () => {
    if (!i18n.isInitialized) return;
    const newLang = i18n.language === "en" ? "zh" : "en";
    i18n.changeLanguage(newLang);
    setIsEnabled(newLang === "en");
  };

  const navigateAndReset = (screenName) => {
    props.navigation.closeDrawer();
    props.navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: screenName }],
      }),
    );
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
    >
      <Text> Text 这是默认字体的文本</Text>
      <OpenSansText>这是默认字体的文本</OpenSansText>
      <Text style={styles.label}>{t("greeting")}</Text>

      <Divider style={styles.divider} />

      {/* 抽屉菜单项 - 使用 react-native-paper 的 Drawer.Item */}
      <Drawer.Section style={styles.drawerSection}>
        <Drawer.Item
          label="首页"
          icon="home"
          active={props.state.routes[props.state.index].name === "index"}
          onPress={() => navigateAndReset("index")}
        />
        <Drawer.Item
          label="设置"
          icon="cog"
          active={props.state.routes[props.state.index].name === "settings"}
          onPress={() => navigateAndReset("settings")}
        />
        <Drawer.Item
          label="个人资料"
          icon="account"
          onPress={() => {
            console.log("跳转到个人资料");
            props.navigation.closeDrawer();
          }}
        />
      </Drawer.Section>

      {/* 自定义开关和按钮 */}
      <Drawer.Section style={styles.settingsSection}>
        <View style={styles.switchContainer}>
          <Drawer.Item
            label="语言切换"
            icon="logout"
            right={() => (
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
                onValueChange={toggleLanguage}
                value={isEnabled}
              />
            )}
          />
        </View>

        <Drawer.Item
          label="关于"
          icon="information"
          onPress={() => console.log("关于")}
        />

        <Drawer.Item
          label="退出登录"
          icon="logout"
          onPress={() => console.log("退出登录")}
        />
      </Drawer.Section>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userInfoSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
  },
  avatar: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 12,
  },
  divider: {
    marginVertical: 10,
  },
  drawerSection: {
    marginTop: 5,
  },
  settingsSection: {
    marginTop: 5,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    padding: 20,
    alignItems: "center",
    marginTop: "auto",
  },
  version: {
    fontSize: 12,
  },
});

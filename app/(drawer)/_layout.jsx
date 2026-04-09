import { Drawer } from "expo-router/drawer";
import CustomDrawerContent from "../components/CustomDrawerContent";

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: "right", // 右侧抽屉
        headerShown: false, // 隐藏默认头部，使用自定义 Appbar
        swipeEnabled: true, // 允许滑动手势
        drawerStyle: {
          width: "60%", // 抽屉宽度
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "首页",
          drawerLabel: "xx首页",
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "x设置",
          drawerLabel: "y设置",
        }}
      />
      <Drawer.Screen
        name="programs"
        options={{
          title: "程序列表",
          drawerLabel: "程序列表",
        }}
      />
    </Drawer>
  );
}

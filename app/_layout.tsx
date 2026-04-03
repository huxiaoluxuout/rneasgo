import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { DrawerItemList } from '@react-navigation/drawer';
import CustomDrawerContent from './components/CustomDrawerContent';


export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <PaperProvider theme={DefaultTheme}>
                <GestureHandlerRootView style={styles.container}>
                    <Drawer
                        drawerContent={(props) => <CustomDrawerContent {...props} />}
                        screenOptions={{
                            drawerPosition: 'right',     // 右侧抽屉
                            headerShown: false,          // 隐藏默认头部，使用自定义 Appbar
                            swipeEnabled: true,          // 允许滑动手势
                            drawerStyle: {
                                width: '80%',              // 抽屉宽度
                            },
                        }}
                    >
                        <Drawer.Screen
                            name="index"
                            options={{
                                title: '首页',
                                drawerLabel: 'xx首页',
                            }}
                        />
                        <Drawer.Screen
                            name="settings"
                            options={{
                                title: '设置',
                                drawerLabel: '设置',
                            }}
                        />
                    </Drawer>
                </GestureHandlerRootView>
            </PaperProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    drawerContent: {
        flex: 1,
        paddingTop: 20,
    },
});

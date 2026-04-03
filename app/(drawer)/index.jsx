import { View, Text, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from 'expo-router'

export default function HomeScreen() {
    const navigation = useNavigation();  // 关键：用这个 hook 获取 navigation
    const openDrawer = () => {
        console.log('openDrawer')
        navigation.openDrawer()
    }

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Action icon="menu" onPress={openDrawer} />
                <Appbar.Content title="首页" />
            </Appbar.Header>
            <View style={styles.content}>
                <Text>首页内容</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

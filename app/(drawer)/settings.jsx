import { View, Text, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';

export default function SettingsScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
                <Appbar.Content title="设置" />
            </Appbar.Header>
            <View style={styles.content}>
                <Text>设置页面内容</Text>
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

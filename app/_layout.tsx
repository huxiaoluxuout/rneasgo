import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    return (
        // <SafeAreaProvider>
            <PaperProvider theme={DefaultTheme}>
                <GestureHandlerRootView style={styles.container}>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(drawer)" />
                    </Stack>
                </GestureHandlerRootView>
            </PaperProvider>
        // {/*</SafeAreaProvider>*/}
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

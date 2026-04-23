import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';

import { BLEProvider } from '../contexts/BLEContext';

export default function RootLayout() {
    return (
            <PaperProvider theme={DefaultTheme}>
                <BLEProvider>
                    <GestureHandlerRootView style={styles.container}>
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="(drawer)" />
                        </Stack>
                    </GestureHandlerRootView>
                </BLEProvider>
            </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});


import React from 'react';
import { Text, StyleSheet } from 'react-native';
import {useFonts} from "expo-font";

const OpenSansText = ({ style, children, ...rest }) => {
    useFonts({
        'OpenSans-Bold': require('@assets/fonts/OpenSans-Bold.ttf'),
        'OpenSans-Light': require('@assets/fonts/OpenSans-Light.ttf'),
    });
    return (
        <Text {...rest} style={[styles.defaultText, style]}>
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    defaultText: {
        fontFamily: 'OpenSans-Light', // 设置你的默认常规字体
        // 这里还可以设置默认的字号、颜色等
        fontSize:16
    },
});

export default OpenSansText;

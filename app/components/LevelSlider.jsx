import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TRACK_WIDTH = SCREEN_WIDTH - 60; // 轨道总宽度 (左右各留30)
const MIN_VAL = 1;
const MAX_VAL = 5;
const STEP = 1; // 步长为1，即 1, 2, 3, 4, 5

const LevelSlider = () => {
  // 当前数值
  const [currentValue, setCurrentValue] = useState(1);
  // 动画值 (0 到 1)
  const translateX = useRef(new Animated.Value(0)).current;

  // 计算具体的X坐标
  const getXForValue = (val) => {
    return ((val - MIN_VAL) / (MAX_VAL - MIN_VAL)) * TRACK_WIDTH;
  };

  // 计算数值对应的X
  const getValueForX = (x) => {
    const ratio = x / TRACK_WIDTH;
    // 四舍五入到最近的步长
    let val = Math.round(ratio * (MAX_VAL - MIN_VAL)) + MIN_VAL;
    // 限制范围
    val = Math.min(Math.max(val, MIN_VAL), MAX_VAL);
    return val;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // 开始触摸时，停止当前的动画，让用户控制
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        let dx = gestureState.dx + getXForValue(currentValue); // 基于当前值的偏移
        // 限制在轨道范围内
        dx = Math.max(0, Math.min(dx, TRACK_WIDTH));
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        let dx = gestureState.dx + getXForValue(currentValue);
        dx = Math.max(0, Math.min(dx, TRACK_WIDTH));

        // 1. 计算最近的刻度值
        const newVal = getValueForX(dx);
        setCurrentValue(newVal);

        // 2. 动画回弹到准确的刻度位置
        Animated.timing(translateX, {
          toValue: getXForValue(newVal),
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false, // 因为我们需要改变布局样式中的宽度，这里设为false
        }).start();
      },
    }),
  ).current;

  // 动态计算进度条宽度
  const progressWidth = translateX.interpolate({
    inputRange: [0, TRACK_WIDTH],
    outputRange: ["0%", "100%"],
  });

  // 气泡的左侧位置
  const bubbleLeft = translateX.interpolate({
    inputRange: [0, TRACK_WIDTH],
    outputRange: [0, TRACK_WIDTH],
  });

  return (
    <View style={styles.container}>
      {/* 整个滑块区域 */}
      <View style={styles.sliderContainer}>
        {/* 气泡提示 (跟随滑块) */}
        <Animated.View
          style={[
            styles.bubble,
            {
              left: bubbleLeft,
              // 为了让气泡始终居中于滑块，需要减去自身宽度的一半(30)
              marginLeft: -30,
            },
          ]}
        >
          <Text style={styles.bubbleText}>{currentValue}</Text>
          {/* 气泡的小三角 */}
          <View style={styles.bubbleArrow} />
        </Animated.View>

        {/* 轨道背景 (灰色部分) */}
        <View style={styles.trackBackground} />

        {/* 进度条 (蓝色部分) - 宽度随滑块变化 */}
        <Animated.View
          style={[styles.trackProgress, { width: progressWidth }]}
        />

        {/* 滑块按钮 (透明可点击区域覆盖在上面) */}
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX: translateX }],
            },
          ]}
        >
          {/* 这里可以放一个圆点，或者保持透明只为了响应手势 */}
          <View style={styles.thumbCircle} />
        </Animated.View>

        {/* 滑块手势响应层 (透明，覆盖在轨道上) */}
        <View style={styles.touchOverlay} {...panResponder.panHandlers} />
      </View>

      {/* 底部刻度标签 */}
      <View style={styles.labelsContainer}>
        <Text style={styles.label}>1</Text>
        <Text style={styles.label}>5</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  sliderContainer: {
    height: 60, // 预留空间给气泡
    justifyContent: "center",
    marginBottom: 10,
  },

  // 气泡样式
  bubble: {
    position: "absolute",
    top: -45, // 气泡在滑块上方
    width: 60,
    height: 35,
    backgroundColor: "#48CFCB", // 气泡背景色 (青色)
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    // 阴影 (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // 阴影 (Android)
    elevation: 5,
  },
  bubbleArrow: {
    position: "absolute",
    bottom: -6,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 0,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    borderBottomColor: "#48CFCB", // 三角颜色
    transform: [{ rotate: "180deg" }],
  },
  bubbleText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // 轨道样式
  trackBackground: {
    height: 6,
    width: TRACK_WIDTH,
    backgroundColor: "#E0E0E0", // 轨道背景色
    borderRadius: 3,
    position: "absolute",
  },
  trackProgress: {
    height: 6,
    width: 0,
    // 如果要实现渐变色轨道，可以使用 react-native-linear-gradient
    // 这里为了简单使用纯色，如果需要渐变请看下方说明
    backgroundColor: "#48CFCB",
    borderRadius: 3,
    position: "absolute",
  },

  // 滑块按钮
  thumb: {
    position: "absolute",
    width: 40,
    height: 40,
    top: -17, // 垂直居中调整
    justifyContent: "center",
    alignItems: "center",
  },
  thumbCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#48CFCB",
  },

  // 透明覆盖层，用于捕获手势
  touchOverlay: {
    position: "absolute",
    top: -20,
    left: 0,
    width: TRACK_WIDTH,
    height: 60,
  },

  // 刻度标签
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: TRACK_WIDTH,
    paddingHorizontal: 2, // 微调对齐
  },
  label: {
    fontSize: 16,
    color: "#48CFCB",
    fontWeight: "bold",
  },
});

export default LevelSlider;

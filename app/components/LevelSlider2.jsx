import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function LevelSlider({
  level: initialLevel = 1,
  onLevelChange,
}) {
  const [level, setLevel] = useState(initialLevel);
  const [trackWidth, setTrackWidth] = useState(0);

  const translateX = useRef(new Animated.Value(0)).current;
  const levelRef = useRef(initialLevel);
  const trackWidthRef = useRef(0);
  const startXRef = useRef(0);
  const onLevelChangeRef = useRef(onLevelChange);

  useEffect(() => {
    trackWidthRef.current = trackWidth;
  }, [trackWidth]);

  useEffect(() => {
    levelRef.current = level;
    onLevelChangeRef.current?.(level);
  }, [level]);

  useEffect(() => {
    onLevelChangeRef.current = onLevelChange;
  }, [onLevelChange]);

  const computePosition = useCallback((absoluteX) => {
    const tw = trackWidthRef.current;
    if (tw <= 0) return { clampedX: 0, newLevel: 1 };
    const clampedX = Math.max(0, Math.min(tw, absoluteX));
    const ratio = clampedX / tw;
    const newLevel = Math.max(1, Math.min(5, Math.round(ratio * 4) + 1));
    return { clampedX, newLevel };
  }, []);

  const handleTouchStart = useCallback(
    (e) => {
      const touchX = e.nativeEvent.locationX;
      startXRef.current = touchX;
      const { clampedX, newLevel } = computePosition(touchX);
      levelRef.current = newLevel;
      translateX.setValue(clampedX);
      setLevel(newLevel);
    },
    [computePosition, translateX],
  );

  const handleTouchMove = useCallback(
    (e) => {
      const touchX = e.nativeEvent.locationX;
      const dx = touchX - startXRef.current;
      const prevX = ((levelRef.current - 1) / 4) * trackWidthRef.current;
      const absoluteX = prevX + dx;
      const { clampedX, newLevel } = computePosition(absoluteX);
      levelRef.current = newLevel;
      translateX.setValue(clampedX);
      setLevel(newLevel);
    },
    [computePosition, translateX],
  );

  return (
    <View style={styles.sliderContainer}>
      <Animated.View
        style={[styles.levelBadge, { transform: [{ translateX }] }]}
        pointerEvents="none"
      >
        <Text style={styles.levelBadgeText}>{level}</Text>
      </Animated.View>
      <View
        style={styles.sliderTouchArea}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <View
          style={styles.sliderTrack}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <View
            style={[
              styles.sliderFill,
              { width: `${((level - 1) / 4) * 100}%` },
            ]}
          />
        </View>
      </View>
      <View style={styles.labelsRow}>
        <Text style={styles.labelText}>1</Text>
        <Text style={styles.labelText}>5</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    width: "90%",
    marginBottom: 32,
  },
  levelBadge: {
    backgroundColor: "#4FC3C9",
    width: 36,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    elevation: 3,
  },
  levelBadgeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  sliderTouchArea: {
    marginTop: 6,
  },
  sliderTrack: {
    height: 12,
    backgroundColor: "#B2EBF2",
    borderRadius: 6,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#4FC3C9",
    borderRadius: 6,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  labelText: {
    fontSize: 15,
    color: "#189ACF",
    fontWeight: "600",
  },
});

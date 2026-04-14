import { useState } from 'react';
import { StyleSheet, Button, View, Image, Text } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
// const VIDEO_URL = "https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov";
// const VIDEO_URL = "../../assets/videos/v1.mp4";
const VIDEO_URL = "https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov";

export default function MyExpoVideoThumbnails() {
  const [image, setImage] = useState(null);

  const generateThumbnail = async () => {
    try {
      const { uri,height,width } = await VideoThumbnails.getThumbnailAsync(
          VIDEO_URL,
          {
            time: 5000,
          }
      );
      console.log('width',width)
      console.log('height',height)
      setImage(uri);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
      <View style={styles.container}>
        <Button onPress={generateThumbnail} title="Generate thumbnail" />
        {image && <Image source={{ uri: image }} style={styles.image} />}
        <Text>{image}</Text>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  image: {
    width: 200,
    height: 200,
  },
});

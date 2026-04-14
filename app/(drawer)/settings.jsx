import { useNavigation } from "expo-router";
import { StyleSheet, Text, View, Alert, Button, ActivityIndicator } from "react-native";
import { Appbar } from "react-native-paper";
import { useEffect, useState } from "react";

import MyExpoVideoThumbnails from "../components/MyExpoVideoThumbnails";
import {
  downloadFirmware,
  getLocalFileInfo,
  readLocalFileContent,
  checkNetworkAndDownload
} from "../../utils/storage";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [progress, setProgress] = useState(0);

  // 方法1: 直接下载固件
  const downloadHex = async () => {
    if (downloading) return;
    
    setDownloading(true);
    setDownloadStatus('正在下载...');
    setProgress(0);
    
    try {
      const result = await downloadFirmware(
        'https://www.cssmlj.com/Myofit6/ota/LT5009_Main_ADD1_GR5513.hex',
        {
          onProgress: (p) => {
            setProgress(p.percentage);
            setDownloadStatus(`下载中... ${p.percentage}%`);
          }
        }
      );

      if (result.success) {
        console.log('✅ 下载成功:', result.path);
        setDownloadStatus('✅ 下载成功！文件已保存到本地');
      } else {
        console.error('❌ 下载失败:', result.message);
        setDownloadStatus(`❌ 下载失败: ${result.message}`);
      }
    } catch (error) {
      console.error('下载异常:', error);
      setDownloadStatus(`❌ 下载异常: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };
  
  // 方法2: 智能下载（检查是否需要更新）
  const smartDownload = async () => {
    if (downloading) return;
    
    setDownloading(true);
    setDownloadStatus('正在检查更新...');
    
    try {
      const result = await checkNetworkAndDownload(
        'https://www.cssmlj.com/Myofit6/ota/LT5009_Main_ADD1_GR5513.hex',
        { forceDownload: false }
      );

      if (result.alreadyUpToDate) {
        console.log('📦 本地文件已是最新版本');
        setDownloadStatus('📦 本地文件已是最新版本');
      } else if (result.success) {
        console.log('✅ 下载完成:', result.path);
        setDownloadStatus('✅ 下载完成！');
      } else {
        setDownloadStatus(`❌ 失败: ${result.message}`);
      }
    } catch (error) {
      console.error('智能下载异常:', error);
      setDownloadStatus(`❌ 异常: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="设置" />
        <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
      </Appbar.Header>
      <View style={styles.content}>
        <Text style={styles.title}>固件管理</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            title={downloading ? "下载中..." : "下载固件"}
            onPress={downloadHex}
            disabled={downloading}
            style={styles.button}
          />

          <Button
            mode="outlined"
            title="智能下载（检查更新）"
            onPress={smartDownload}
            disabled={downloading}
            style={styles.button}
          />
        </View>

        {downloading && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color="#772f94ff" />
            <Text style={styles.statusText}>{downloadStatus}</Text>
          </View>
        )}

        {!downloading && downloadStatus && (
          <Text style={[styles.statusText, styles.resultText]}>{downloadStatus}</Text>
        )}

        {/* <MyExpoVideoThumbnails></MyExpoVideoThumbnails> */}
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
  progressContainer: {
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  resultText: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});

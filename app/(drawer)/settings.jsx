import { useNavigation } from "expo-router";
import { StyleSheet, Text, View, Alert, ActivityIndicator, TextInput, ScrollView, Platform, Button } from "react-native";
import { Appbar, Button as PaperButton } from "react-native-paper";
import { useEffect, useState } from "react";
import * as DocumentPicker from "expo-document-picker";

import MyExpoVideoThumbnails from "../components/MyExpoVideoThumbnails";
import {
  downloadFirmware,
  getLocalFileInfo,
  readLocalFileContent,
  checkNetworkAndDownload
} from "../../utils/storage";
import http from "../../utils/api";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  // 网络请求相关状态
  const [requestUrl, setRequestUrl] = useState('https://zbb.bfsoft.top/home/page/get-service-list');
  const [requestMethod, setRequestMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseResult, setResponseResult] = useState(null);

  // 从手机文件管理中选择指定格式的文件
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/octet-stream', 'text/plain', '.hex', '.bin'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        console.log('用户取消了选择');
        return;
      }

      const file = result.assets[0];
      console.log('选择的文件:', file);
      
      setSelectedFile({
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimeType: file.mimeType,
      });

      Alert.alert(
        '文件选择成功',
        `文件名: ${file.name}\n大小: ${(file.size / 1024).toFixed(2)} KB\n类型: ${file.mimeType}`,
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('文件选择错误:', error);
      Alert.alert('错误', `文件选择失败: ${error.message}`);
    }
  };

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

  // 发送网络请求
  const sendRequest = async () => {
    if (!requestUrl.trim()) {
      Alert.alert('提示', '请输入请求URL');
      return;
    }

    setLoading(true);
    setResponseResult(null);

    try {
      let result;

      if (requestMethod === 'GET') {
        result = await http.get(requestUrl);
      } else if (requestMethod === 'POST') {
        let body = null;
        try {
          body = requestBody ? JSON.parse(requestBody) : {};
        } catch (e) {
          Alert.alert('错误', '请求体JSON格式不正确');
          setLoading(false);
          return;
        }
        result = await http.post(requestUrl, body);
      }

      console.log('请求结果:', result);
      setResponseResult(result);
    } catch (error) {
      console.error('请求异常:', error);
      setResponseResult({
        success: false,
        error: error.message,
        message: `请求异常: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // 清空响应结果
  const clearResponse = () => {
    setResponseResult(null);
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>固件管理</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={downloadHex}
            disabled={downloading}
            style={styles.button}
            title={downloading ? "下载中..." : "下载固件"}
          >
          </Button>

          <Button
            mode="outlined"
            onPress={smartDownload}
            disabled={downloading}
            style={styles.button}
            title="智能下载（检查更新）"
          >
          </Button>

          <Button
            mode="contained-tonal"
            onPress={pickDocument}
            style={styles.button}
            color="#6200ee"
            title="选择本地固件文件"
          >
          </Button>
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

        {selectedFile && (
          <View style={styles.fileInfoContainer}>
            <Text style={styles.fileInfoTitle}>已选择的文件:</Text>
            <Text style={styles.fileInfoText}>文件名: {selectedFile.name}</Text>
            <Text style={styles.fileInfoText}>大小: {(selectedFile.size / 1024).toFixed(2)} KB</Text>
            <Text style={styles.fileInfoText}>类型: {selectedFile.mimeType}</Text>
            <Text style={styles.fileInfoText} numberOfLines={1}>路径: {selectedFile.uri}</Text>
          </View>
        )}

        {/* 网络请求测试区域 */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>网络请求测试</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>请求URL:</Text>
          <TextInput
            style={styles.input}
            value={requestUrl}
            onChangeText={setRequestUrl}
            placeholder="输入API地址"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.methodRow}>
          <Text style={styles.label}>请求方法:</Text>
          <View style={styles.methodButtons}>
            <PaperButton
              mode={requestMethod === 'GET' ? 'contained' : 'outlined'}
              compact
              onPress={() => setRequestMethod('GET')}
              buttonStyle={styles.methodButton}
              color={requestMethod === 'GET' ? '#4caf50' : undefined}
            >
              GET
            </PaperButton>
            <PaperButton
              mode={requestMethod === 'POST' ? 'contained' : 'outlined'}
              compact
              onPress={() => setRequestMethod('POST')}
              buttonStyle={styles.methodButton}
              color={requestMethod === 'POST' ? '#2196f3' : undefined}
            >
              POST
            </PaperButton> 
          </View>
        </View>

        {requestMethod === 'POST' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>请求体 (JSON):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={requestBody}
              onChangeText={setRequestBody}
              placeholder='{"key": "value"}'
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        <View style={styles.requestButtons}>
          <PaperButton
            mode="contained"
            onPress={sendRequest}
            disabled={loading}
            loading={loading}
            style={styles.sendButton}
            color="#ff9800"
          >
            {loading ? '请求中...' : '发送请求'}
          </PaperButton>
          
          {responseResult && (
            <PaperButton
              mode="outlined"
              onPress={clearResponse}
              style={styles.clearButton}
              color="#f44336"
            >
              清空结果
            </PaperButton>
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#ff9800" />
            <Text style={styles.loadingText}>正在发送请求...</Text>
          </View>
        )}

        {responseResult && (
          <View style={[styles.responseContainer, responseResult.success ? styles.successResponse : styles.errorResponse]}>
            <Text style={styles.responseTitle}>
              响应结果 ({responseResult.success ? '成功' : '失败'})
            </Text>
            
            {responseResult.status && (
              <Text style={styles.responseText}>
                状态码: {responseResult.status} {responseResult.statusText || ''}
              </Text>
            )}
            
            {responseResult.data && (
              <>
                <Text style={styles.responseLabel}>响应数据:</Text>
                <ScrollView style={styles.responseScroll} nestedScrollEnabled>
                  <Text style={styles.responseText}>
                    {typeof responseResult.data === 'object' 
                      ? JSON.stringify(responseResult.data, null, 2) 
                      : responseResult.data}
                  </Text>
                </ScrollView>
              </>
            )}

            {!responseResult.success && responseResult.message && (
              <Text style={styles.errorMessage}>{responseResult.message}</Text>
            )}

            {responseResult.url && (
              <Text style={styles.urlText} numberOfLines={1}>
                请求地址: {responseResult.url}
              </Text>
            )}
          </View>
        )}

        {/* <MyExpoVideoThumbnails></MyExpoVideoThumbnails> */}
      </ScrollView>
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
  fileInfoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  fileInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  fileInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  // 网络请求相关样式
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  methodButton: {
    minWidth: 80,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  sendButton: {
    flex: 1,
  },
  clearButton: {
    flex: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#ff9800',
  },
  responseContainer: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  successResponse: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  errorResponse: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  responseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  responseText: {
    fontSize: 12,
    color: '#444',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  responseScroll: {
    maxHeight: 200,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
    padding: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: '#d32f2f',
    marginTop: 8,
    fontWeight: '500',
  },
  urlText: {
    fontSize: 11,
    color: '#888',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

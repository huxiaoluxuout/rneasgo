import { useNavigation, useRouter } from "expo-router";
import { StyleSheet, Text, View, Alert, ActivityIndicator, TextInput, ScrollView, Platform, ProgressViewIOS } from "react-native";
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
import { useBLE } from '../../contexts/BLEContext';
import { ylxBleOTA } from '../../hooks/useOTA';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  // 通用文件下载相关状态
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [fileDownloadProgress, setFileDownloadProgress] = useState(0);
  const [fileDownloadStatus, setFileDownloadStatus] = useState('');
  const [downloadedFilePath, setDownloadedFilePath] = useState(null);

  // OTA 升级相关状态
  const {
    isInitialized,
    isScanning,
    isConnected,
    devices,
    connectedDevice,
    error: bleError,
    requestPermission,
    startScan,
    stopScan,
    connectToDevice,
    discoverServices,
    disconnect,
    writeCharacteristic
  } = useBLE();

  const [otaStatus, setOtaStatus] = useState('idle'); // idle, scanning, connecting, upgrading, completed, error
  const [otaProgress, setOtaProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [otaMessage, setOtaMessage] = useState('');
  const [selectedDeviceForOTA, setSelectedDeviceForOTA] = useState(null);

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

  // ========== OTA 升级相关方法 ==========
  
  // 配置 OTA 的 writeBLE 方法 - 改进版，带错误处理和重试机制
  const configureOTAWrite = () => {
    let writeRetryCount = 0;
    const MAX_WRITE_RETRY = 3;

    ylxBleOTA.writeBLE = async (data, type) => {
      return new Promise((resolve, reject) => {
        const attemptWrite = async (retryCount = 0) => {
          try {
            // 检查蓝牙连接状态
            if (!isConnected || !connectedDevice) {
              throw new Error('蓝牙设备未连接');
            }

            console.log(`[OTA] 发送数据包 (${retryCount > 0 ? `重试 ${retryCount}/${MAX_WRITE_RETRY}` : '首次'})`, 
              Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));

            await writeCharacteristic(
              null,
              '0000fff0-0000-1000-8000-00805f9b34fb',
              '0000fff2-0000-1000-8000-00805f9b34fb',
              Array.from(data),
              'WithoutResponse'  // OTA 升级使用无响应写入，提高速度
            );
            
            writeRetryCount = 0;  // 重置重试计数
            resolve(true);
          } catch (err) {
            console.error(`[OTA] 写入失败 (尝试 ${retryCount + 1}):`, err);
            
            if (retryCount < MAX_WRITE_RETRY) {
              // 等待一段时间后重试
              setTimeout(() => {
                attemptWrite(retryCount + 1);
              }, 100 * (retryCount + 1));  // 递增延迟
            } else {
              reject(new Error(`写入失败（已重试 ${MAX_WRITE_RETRY} 次）: ${err.message || 'Unknown BLE error'}`));
            }
          }
        };

        attemptWrite(0);
      });
    };
  };

  // 开始 OTA 升级流程 - 简化版，使用已连接的设备
  const startOTAUpgrade = async () => {
    try {
      // 1. 检查蓝牙是否初始化
      if (!isInitialized) {
        throw new Error('蓝牙未初始化，请稍后再试');
      }

      // 2. 检查是否有已连接的设备（关键改动：不再自动扫描连接）
      if (!isConnected || !connectedDevice) {
        Alert.alert(
          '⚠️ 未连接设备',
          '请先在"蓝牙测试"页面连接设备后再进行 OTA 升级\n\n是否前往蓝牙测试页面？',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '前往连接', 
              onPress: () => router.push('/(drawer)/testble')
            }
          ]
        );
        return;
      }

      console.log('[OTA] 使用已连接的设备:', connectedDevice.name || connectedDevice.id);

      // 3. 检查本地文件是否存在
      const fileName = 'LT5009_Main_ADD1_GR5513.hex';
      setOtaStatus('reading');
      setOtaMessage('正在检查固件文件...');
      
      const fileInfo = await getLocalFileInfo(fileName);
      
      if (!fileInfo.exists) {
        Alert.alert('提示', '未找到固件文件 LT5009_Main_ADD1_GR5513.hex\n\n请先点击"下载固件"按钮下载固件文件');
        setOtaStatus('error');
        return;
      }

      console.log('[OTA] 找到固件文件:', fileInfo.path, '大小:', fileInfo.size);

      // 4. 读取文件内容
      setOtaMessage('正在读取固件文件...');
      
      const fileResult = await readLocalFileContent(fileInfo.path);
      if (!fileResult.success) {
        throw new Error('读取固件文件失败: ' + fileResult.error);
      }

      console.log('[OTA] 文件读取成功，长度:', fileResult.content.length);

      // 5. 配置 OTA 写入方法（带重试机制）
      configureOTAWrite();

      // 6. 开始 OTA 升级
      setOtaStatus('upgrading');
      setOtaMessage('正在解析固件文件...');
      
      const deviceInfo = {
        deviceId: connectedDevice?.id,
        serviceId: '0000fff0-0000-1000-8000-00805f9b34fb',
        writeCharId: '0000fff2-0000-1000-8000-00805f9b34fb',
      };

      console.log('[OTA] 开始升级流程，设备信息:', deviceInfo);
      console.log('[OTA] 已连接设备名称:', connectedDevice.name || connectedDevice.localName || '未知');

      ylxBleOTA.startOTA(deviceInfo, fileResult.content, (result) => {
        console.log('[OTA] 固件解析完成:', result);
        setOtaMessage(`✓ 固件解析完成\n共 ${result.totalBty16Packets} 个数据包\n起始地址: 0x${result.startAddress?.toString(16)?.toUpperCase()}\n目标设备: ${connectedDevice?.name || connectedDevice?.id}`);
        
        // 发送握手包
        setTimeout(async () => {
          try {
            // 再次检查连接状态
            if (!isConnected || !connectedDevice) {
              throw new Error('设备已断开连接，请在蓝牙测试页面重新连接');
            }

            setOtaStatus('upgrading');
            setOtaMessage(`正在发送握手包到 ${connectedDevice.name || connectedDevice.id}...`);
            console.log('[OTA] 发送握手包');
            
            ylxBleOTA.sendHandshake();
            
            // 等待握手响应后开始发送数据
            setTimeout(async () => {
              try {
                // 再次验证连接
                if (!isConnected || !connectedDevice) {
                  throw new Error('设备在握手过程中断开连接');
                }

                setOtaStatus('upgrading');
                setOtaMessage(`开始向 ${connectedDevice.name || connectedDevice.id} 发送数据包...\n(这可能需要几分钟时间)`);
                
                console.log('[OTA] 开始发送数据包');
                
                let hasMore = true;
                let consecutiveErrors = 0;
                const MAX_CONSECUTIVE_ERRORS = 5;
                
                while (hasMore && otaStatus === 'upgrading') {
                  try {
                    hasMore = await ylxBleOTA.sendDataPackets(
                      (index, isLastPacket) => {
                        const progress = ylxBleOTA.getProgress();
                        setOtaProgress(progress);
                        setOtaMessage(
                          `正在升级 ${connectedDevice?.name || connectedDevice?.id}...\n` +
                          `${progress.percent}% (${progress.current}/${progress.total} 包)\n` +
                          `预计剩余: ${Math.round((progress.total - progress.current) * 50 / 1000)}秒`
                        );
                        
                        consecutiveErrors = 0;  // 重置连续错误计数
                        
                        if (isLastPacket) {
                          setTimeout(async () => {
                            try {
                              if (!isConnected || !connectedDevice) {
                                throw new Error('设备已断开连接');
                              }

                              setOtaMessage('正在发送结束包...');
                              console.log('[OTA] 发送结束包');
                              
                              await ylxBleOTA.sendFinish();
                              setOtaStatus('completed');
                              setOtaMessage(
                                `✅ OTA 升级完成！\n\n` +
                                `设备: ${connectedDevice?.name || connectedDevice?.id}\n` +
                                `数据包: ${ylxBleOTA.getProgress().total} 个\n\n` +
                                `设备将自动重启并应用新固件`
                              );
                              Alert.alert(
                                '🎉 OTA 升级成功！', 
                                `设备: ${connectedDevice?.name || connectedDevice?.id}\n\n` +
                                `设备将自动重启并应用新固件。\n\n` +
                                `请等待约10-20秒让设备完成重启。`,
                                [{ text: '我知道了', style: 'default' }]
                              );
                            } catch (finishErr) {
                              console.error('[OTA] 发送结束包失败:', finishErr);
                              setOtaStatus('error');
                              setOtaMessage('❌ 发送结束包失败: ' + finishErr.message);
                              Alert.alert('错误', '发送结束包失败: ' + finishErr.message);
                            }
                          }, 1000);
                        }
                      },
                      (error) => {
                        console.error('[OTA] 发送数据包错误:', error);
                        consecutiveErrors++;
                        
                        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                          setOtaStatus('error');
                          setOtaMessage(`❌ 连续发送失败 ${MAX_CONSECUTIVE_ERRORS} 次\n${error.message}\n\n可能原因：设备断开连接`);
                          Alert.alert('错误', `连续发送失败 ${MAX_CONSECUTIVE_ERRORS} 次，可能设备已断开连接\n\n建议返回蓝牙测试页面重新连接`);
                        }
                      }
                    );
                    
                    // 控制发送速度 - OTA 升级需要适当延迟
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                  } catch (packetError) {
                    console.error('[OTA] 数据包发送异常:', packetError);
                    consecutiveErrors++;
                    
                    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                      throw new Error(`连续发送失败 ${consecutiveErrors} 次: ${packetError.message}`);
                    }
                    
                    // 短暂等待后继续
                    await new Promise(resolve => setTimeout(resolve, 200));
                  }
                }
                
                if (otaStatus !== 'completed' && otaStatus !== 'error') {
                  console.log('[OTA] 发送循环正常结束');
                }
                
              } catch (sendErr) {
                console.error('[OTA] 发送数据过程出错:', sendErr);
                setOtaStatus('error');
                setOtaMessage(
                  `❌ 升级过程出错:\n${sendErr.message}\n\n` +
                  `可能原因：\n• 设备断开连接\n• 蓝牙信号不稳定\n• 设备进入保护模式\n\n` +
                  `建议：返回蓝牙测试页面检查连接状态`
                );
                Alert.alert(
                  '升级失败', 
                  `升级过程中出现错误:\n\n${sendErr.message}\n\n建议：\n1. 返回蓝牙测试页面检查设备连接\n2. 重启设备和应用后重试`,
                  [
                    { text: '稍后再说', style: 'cancel' },
                    { text: '返回蓝牙测试', onPress: () => router.push('/(drawer)/testble') }
                  ]
                );
              }
            }, 1500);  // 握手后等待更长时间
          } catch (handshakeErr) {
            console.error('[OTA] 握手失败:', handshakeErr);
            setOtaStatus('error');
            setOtaMessage(
              `❌ 握手失败:\n${handshakeErr.message}\n\n` +
              `可能原因：\n• 设备不支持此命令\n• 设备不在 OTA 模式\n• 蓝牙连接不稳定`
            );
            Alert.alert('握手失败', `与设备握手失败:\n\n${handshakeErr.message}\n\n请确保：\n1. 设备处于 OTA 升级模式\n2. 设备距离手机较近\n3. 尝试重启设备后再试`);
          }
        }, 800);  // 解析完成后等待一段时间再发送握手
      });

    } catch (error) {
      console.error('[OTA] OTA 升级失败:', error);
      setOtaStatus('error');
      setOtaMessage(`❌ OTA 升级失败:\n${error.message}`);
      Alert.alert('OTA 升级失败', error.message + '\n\n请检查：\n1. 固件文件是否正确下载\n2. 蓝牙权限是否允许\n3. 设备是否已连接且在附近');
    }
  };

  // 停止 OTA 升级
  const stopOTAUpgrade = () => {
    setOtaStatus('idle');
    setOtaMessage('');
    setOtaProgress({ current: 0, total: 0, percent: 0 });
    ylxBleOTA.reset();
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

  // 下载文件并保存到本地
  const downloadAndSaveFile = async () => {
    if (isDownloadingFile) return;

    setIsDownloadingFile(true);
    setFileDownloadProgress(0);
    setFileDownloadStatus('正在准备下载...');
    setDownloadedFilePath(null);

    try {
      const fileUrl = 'https://www.cssmlj.com/Myofit6/ota/LT5009_Main_ADD1_GR5513.hex';
      const fileName = 'LT5009_Main_ADD1_GR5513.hex';

      setFileDownloadStatus('正在连接服务器...');

      const result = await downloadFirmware(fileUrl, {
        onProgress: (progressInfo) => {
          setFileDownloadProgress(progressInfo.percentage);
          setFileDownloadStatus(
            `下载中... ${progressInfo.percentage}%` +
            (progressInfo.downloadedBytes && progressInfo.totalBytes 
              ? ` (${(progressInfo.downloadedBytes / 1024 / 1024).toFixed(2)}MB / ${(progressInfo.totalBytes / 1024 / 1024).toFixed(2)}MB)`
              : '')
          );
        },
        fileName: fileName,
        showSuccessAlert: true,
      });

      if (result.success) {
        console.log('✅ 文件下载成功:', result.path);
        setFileDownloadStatus('✅ 文件下载成功！已保存到本地');
        setDownloadedFilePath(result.path);
        setFileDownloadProgress(100);

        Alert.alert(
          '📥 下载成功',
          `文件: ${fileName}\n路径: ${result.path}\n\n文件已保存到本地存储，可以用于 OTA 升级`,
          [{ text: '确定', style: 'default' }]
        );
      } else {
        console.error('❌ 文件下载失败:', result.message);
        setFileDownloadStatus(`❌ 下载失败: ${result.message}`);
        Alert.alert('下载失败', result.message || '无法下载文件，请检查网络连接');
      }

    } catch (error) {
      console.error('文件下载异常:', error);
      setFileDownloadStatus(`❌ 下载异常: ${error.message}`);
      Alert.alert('下载错误', `文件下载过程中出现错误:\n${error.message}`);
    } finally {
      setIsDownloadingFile(false);
    }
  };

  // 查看已下载的文件信息
  const viewDownloadedFileInfo = async () => {
    try {
      const fileName = 'LT5009_Main_ADD1_GR5513.hex';
      const fileInfo = await getLocalFileInfo(fileName);

      if (fileInfo.exists) {
        Alert.alert(
          '📄 本地文件信息',
          `文件名: ${fileName}\n大小: ${(fileInfo.size / 1024).toFixed(2)} KB\n路径: ${fileInfo.path}\n修改时间: ${fileInfo.lastModified || '未知'}`,
          [
            { text: '关闭', style: 'cancel' },
            { 
              text: '使用此文件升级', 
              onPress: () => {
                setSelectedFile({
                  name: fileName,
                  uri: fileInfo.path,
                  size: fileInfo.size,
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('提示', '未找到已下载的固件文件\n\n请先点击"下载固件到本地"按钮下载文件');
      }
    } catch (error) {
      Alert.alert('错误', `获取文件信息失败: ${error.message}`);
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
        
        {/* 网络下载区域 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>网络获取</Text>
          <View style={styles.buttonRow}>
            <PaperButton
              mode="contained"
              onPress={downloadHex}
              disabled={downloading}
              style={styles.flexButton}
              icon="cloud-download"
              loading={downloading}
            >
              {downloading ? '下载中...' : '直接下载'}
            </PaperButton>

            <PaperButton
              mode="outlined"
              onPress={smartDownload}
              disabled={downloading}
              style={styles.flexButton}
              icon="sync"
            >
              智能下载
            </PaperButton>
          </View>
        </View>

        {/* 本地文件管理 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>本地文件</Text>
          <View style={styles.buttonRow}>
            <PaperButton
              mode="contained"
              onPress={downloadAndSaveFile}
              disabled={isDownloadingFile}
              style={[styles.flexButton, styles.downloadFileButton]}
              icon="download"
              loading={isDownloadingFile}
            >
              {isDownloadingFile ? '保存中...' : '下载到本地'}
            </PaperButton>

            <PaperButton
              mode="outlined"
              onPress={viewDownloadedFileInfo}
              style={styles.flexButton}
              icon="folder-open"
            >
              查看本地
            </PaperButton>
          </View>
          
          <View style={styles.buttonRow}>
            <PaperButton
              mode="contained-tonal"
              onPress={pickDocument}
              style={styles.fullWidthButton}
              color="#6200ee"
              icon="file-upload"
            >
              选择其他文件
            </PaperButton>
          </View>
        </View>

        {/* 文件下载进度 */}
        {isDownloadingFile && (
          <View style={styles.fileDownloadProgressContainer}>
            <ActivityIndicator size="large" color="#2196f3" />
            <Text style={styles.fileDownloadStatus}>{fileDownloadStatus}</Text>
            
            {fileDownloadProgress > 0 && fileDownloadProgress < 100 && (
              <View style={styles.downloadProgressBar}>
                <View style={styles.downloadProgressBarBg}>
                  <View 
                    style={[
                      styles.downloadProgressBarFill,
                      { width: `${fileDownloadProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.downloadProgressPercent}>
                  {Math.round(fileDownloadProgress)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 下载完成提示 */}
        {!isDownloadingFile && downloadedFilePath && (
          <View style={styles.downloadSuccessContainer}>
            <Text style={styles.downloadSuccessIcon}>✅</Text>
            <Text style={styles.downloadSuccessText}>文件已保存到本地</Text>
            <Text style={styles.downloadPathText}>{downloadedFilePath}</Text>
            <PaperButton
              mode="text"
              onPress={() => setDownloadedFilePath(null)}
              compact
            >
              隐藏
            </PaperButton>
          </View>
        )}

        <View style={styles.sectionDivider} />

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

        {/* OTA 升级区域 */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>OTA 固件升级</Text>

        {/* 蓝牙连接状态检查 */}
        <View style={styles.bleStatusContainer}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isInitialized ? '#4caf50' : '#ff9800' }]} />
            <Text style={styles.statusText}>蓝牙: {isInitialized ? '已就绪' : '初始化中...'}</Text>
          </View>
          
          {isConnected && connectedDevice && (
            <View style={[styles.connectedDeviceCard, styles.successBorder]}>
              <View style={styles.deviceStatusRow}>
                <View style={[styles.statusDot, { backgroundColor: '#4caf50', width: 14, height: 14 }]} />
                <View>
                  <Text style={styles.connectedDeviceName}>
                    {connectedDevice.name || connectedDevice.localName || '未知设备'}
                  </Text>
                  <Text style={styles.connectedDeviceId}>ID: {connectedDevice.id}</Text>
                </View>
              </View>
              <Text style={styles.readyHint}>✓ 设备已准备就绪，可以开始 OTA 升级</Text>
            </View>
          )}

          {!isConnected && (
            <View style={[styles.notConnectedCard, styles.warningBorder]}>
              <Text style={styles.notConnectedTitle}>⚠️ 未检测到已连接的设备</Text>
              <Text style={styles.notConnectedSubtitle}>
                请先在"蓝牙测试"页面扫描并连接设备
              </Text>
              <PaperButton
                mode="outlined"
                onPress={() => router.push('/(drawer)/testble')}
                icon="bluetooth"
                style={styles.gotoBleButton}
                color="#2196f3"
                compact
              >
                前往蓝牙测试
              </PaperButton>
            </View>
          )}
        </View>

        {/* OTA 操作按钮 */}
        <View style={styles.otaButtonContainer}>
          {(otaStatus === 'idle' || otaStatus === 'completed' || otaStatus === 'error') && (
            <PaperButton
              mode="contained"
              onPress={startOTAUpgrade}
              disabled={!isInitialized}
              style={[styles.otaButton, styles.startOtaButton]}
              color="#2196f3"
            >
              开始 OTA 升级
            </PaperButton>
          )}

          {(otaStatus === 'upgrading' || otaStatus === 'scanning' || otaStatus === 'connecting' || otaStatus === 'reading') && (
            <PaperButton
              mode="outlined"
              onPress={stopOTAUpgrade}
              style={[styles.otaButton, styles.stopOtaButton]}
              color="#f44336"
            >
              停止升级
            </PaperButton>
          )}
        </View>

        {/* OTA 状态和进度 */}
        {otaStatus !== 'idle' && (
          <View style={styles.otaProgressContainer}>
            <ActivityIndicator 
              size="small" 
              color={otaStatus === 'completed' ? '#4caf50' : otaStatus === 'error' ? '#f44336' : '#2196f3'} 
            />
            
            <Text style={[
              styles.otaStatusText,
              otaStatus === 'completed' && styles.successText,
              otaStatus === 'error' && styles.errorText
            ]}>
              {otaMessage}
            </Text>

            {/* 进度条 */}
            {otaStatus === 'upgrading' && otaProgress.total > 0 && (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { width: `${otaProgress.percent}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentText}>
                  {otaProgress.percent}% ({otaProgress.current}/{otaProgress.total})
                </Text>
              </View>
            )}

            {otaStatus === 'completed' && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓ 升级成功</Text>
              </View>
            )}

            {otaStatus === 'error' && (
              <View style={styles.errorBadge}>
                <Text style={styles.errorBadgeText}>✗ 升级失败</Text>
              </View>
            )}
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
  sectionCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  flexButton: {
    flex: 1,
  },
  fullWidthButton: {
    width: '100%',
  },
  button: {
    marginVertical: 4,
  },
  downloadFileButton: {
    backgroundColor: '#2196f3',
  },
  fileDownloadProgressContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginVertical: 10,
  },
  fileDownloadStatus: {
    marginTop: 10,
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
  downloadProgressBar: {
    width: '100%',
    marginTop: 15,
    alignItems: 'center',
  },
  downloadProgressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#bbdefb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  downloadProgressBarFill: {
    height: '100%',
    backgroundColor: '#2196f3',
    borderRadius: 4,
  },
  downloadProgressPercent: {
    marginTop: 5,
    fontSize: 12,
    color: '#1976d2',
  },
  downloadSuccessContainer: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
    marginVertical: 10,
  },
  downloadSuccessIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  downloadSuccessText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  downloadPathText: {
    fontSize: 11,
    color: '#558b2f',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
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
  // OTA 升级相关样式
  bleStatusContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  connectedDeviceCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  successBorder: {
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  deviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  connectedDeviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginLeft: 8,
  },
  connectedDeviceId: {
    fontSize: 12,
    color: '#558b2f',
    marginLeft: 24,
    marginTop: 2,
  },
  readyHint: {
    fontSize: 13,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 4,
  },
  notConnectedCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  warningBorder: {
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  notConnectedTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 6,
    textAlign: 'center',
  },
  notConnectedSubtitle: {
    fontSize: 13,
    color: '#ef6c00',
    textAlign: 'center',
    marginBottom: 10,
  },
  gotoBleButton: {
    marginTop: 4,
  },
  otaButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  otaButton: {
    minWidth: 200,
    paddingVertical: 8,
  },
  startOtaButton: {
    backgroundColor: '#2196f3',
  },
  stopOtaButton: {
    borderColor: '#f44336',
  },
  otaProgressContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  otaStatusText: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  successText: {
    color: '#4caf50',
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196f3',
    borderRadius: 12,
  },
  progressPercentText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  completedBadge: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4caf50',
    borderRadius: 20,
  },
  completedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorBadge: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f44336',
    borderRadius: 20,
  },
  errorBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

import { useNavigation } from "expo-router";
import { StyleSheet, Text, View, Alert, ActivityIndicator, TextInput, ScrollView, Platform, Button, TouchableOpacity, FlatList } from "react-native";
import { Appbar, Button as PaperButton, Card, IconButton } from "react-native-paper";

import { useEffect, useState } from "react";

import useBLE from '../../hooks/useBLE';
export default function TestBLEScreen() {
  const navigation = useNavigation();
  const {
    isInitialized,
    isScanning,
    isConnected,
    devices,
    connectedDevice,
    error,

    requestPermission,
    startScan,
    stopScan,
    connectToDevice,
    discoverServices,

    disconnect,
    readCharacteristic,
    writeCharacteristic,
    startNotification,

    stopNotification,
    receivedFrames,
    rawDataList,
    clearFrames,
  } = useBLE();

  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [services, setServices] = useState([]);
  const [notifications, setNotifications] = useState({});
  const [notificationData, setNotificationData] = useState({});
  const [writeServiceUUID, setWriteServiceUUID] = useState('0000fff0-0000-1000-8000-00805f9b34fb');
  const [writeCharacteristicUUID, setWriteCharacteristicUUID] = useState('0000fff2-0000-1000-8000-00805f9b34fb');
  const [writeData, setWriteData] = useState('AA554252A84755AA');
  const [isWriting, setIsWriting] = useState(false);

  const handleScan = async () => {
    try {
      await requestPermission();
      console.log('开始扫描设备...');
      const foundDevices = await startScan([], { scanTimeout: 5000 });
      // console.log('发现设备:', foundDevices);

    } catch (err) {
      console.error('扫描失败:', err);
      Alert.alert('错误', err.message || '蓝牙扫描失败');
    }
  };

  const handleConnect = async (device) => {
    try {
      setSelectedDeviceId(device.id);
      await connectToDevice(device.id);

      try {
        setTimeout(async () => {
          const discoveredServices = await discoverServices();
          setServices(discoveredServices);
          // console.log('发现的服务:', JSON.stringify(discoveredServices, null, 2));

        }, 2000);
      } catch (serviceErr) {
        console.error('获取服务失败:', serviceErr);
      }

      Alert.alert('成功', `已连接到 ${device.name || device.localName || '未知设备'}`);
    } catch (err) {
      console.error('连接失败:', err);
      Alert.alert('连接失败', err.message || '无法连接到设备');
      setSelectedDeviceId(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      Object.keys(notifications).forEach(key => {
        if (notifications[key]) {
          stopNotification(key.serviceUUID, key.characteristicUUID);
        }
      });

      await disconnect();
      setSelectedDeviceId(null);
      setServices([]);
      setNotifications({});
      setNotificationData({});
      Alert.alert('成功', '已断开连接');
    } catch (err) {
      console.error('断开失败:', err);
      Alert.alert('错误', err.message || '断开连接失败');
    }
  };

  const handleWrite = async () => {
    if (!writeServiceUUID.trim()) {
      Alert.alert('错误', '请输入服务 UUID');
      return;
    }
    if (!writeCharacteristicUUID.trim()) {
      Alert.alert('错误', '请输入特征值 UUID');
      return;
    }
    if (!writeData.trim()) {
      Alert.alert('错误', '请输入要写入的数据');
      return;
    }

    try {
      setIsWriting(true);

      const hexData = writeData.replace(/\s/g, '');

      const bytes = [];
      for (let i = 0; i < hexData.length; i += 2) {
        bytes.push(parseInt(hexData.substr(i, 2), 16));
      }

      await writeCharacteristic(writeServiceUUID, writeCharacteristicUUID, bytes, 'WithResponse');

      console.log('写入数据成功:', {
        serviceUUID: writeServiceUUID,
        characteristicUUID: writeCharacteristicUUID,
        data: hexData,
        bytes: bytes,
      });

      Alert.alert('成功', `数据已写入\n服务: ${writeServiceUUID}\n特征: ${writeCharacteristicUUID}\n数据: ${hexData}`);
    } catch (err) {
      console.error('写入失败:', err);
      Alert.alert('写入失败', err.message || '无法写入数据到设备');
    } finally {
      setIsWriting(false);
    }
  };

  const handleQuickWrite = async (serviceUUID, characteristicUUID) => {
    setWriteServiceUUID(serviceUUID);
    setWriteCharacteristicUUID(characteristicUUID);

    setTimeout(() => {
      handleWrite();
    }, 100);
  };

  const handleToggleNotification = async (serviceUUID, characteristicUUID) => {
    const key = `${serviceUUID}-${characteristicUUID}`;

    try {
      if (notifications[key]) {
        await stopNotification(serviceUUID, characteristicUUID);
        setNotifications(prev => ({ ...prev, [key]: false }));
        Alert.alert('成功', '已停止通知订阅');
      } else {
        await startNotification(
          selectedDeviceId,
          serviceUUID,
          characteristicUUID,
          (base64Value, hexString, completeFrames) => {
            console.log('收到通知数据:', base64Value, hexString, completeFrames);

            setNotificationData(prev => ({
              ...prev,
              [key]: {
                data: hexString,
                timestamp: new Date().toLocaleTimeString(),
              },
            }));
          },
          {
            enableFrameReassembly: true,      // 启用粘包重组
            frameHeader: 'AA55',             // 自定义帧头
            frameTail: '55AA',               // 自定义帧尾
            onFrameComplete: (frameHex) => { // 每收到完整帧时回调
              console.log('完整帧:', frameHex);
            }
          });
        setNotifications(prev => ({ ...prev, [key]: true }));
        Alert.alert('成功', '已开启通知订阅');
      }
    } catch (err) {
      console.error('通知操作失败:', err);
      Alert.alert('错误', err.message || '通知操作失败');
    }
  };

  const formatUUID = (uuid) => {
    if (!uuid) return '';
    return uuid.length > 8 ? `${uuid.substring(0, 8)}...` : uuid;
  };

  const renderServices = () => {
    if (services.length === 0) return null;

    return (
      <View style={styles.servicesContainer}>
        <Text style={styles.sectionTitle}>服务与特征 ({services.length})</Text>

        {services.map((service, serviceIndex) => (
          <Card key={serviceIndex} style={styles.serviceCard}>
            <Card.Content>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceUuid} numberOfLines={1}>
                    服务 UUID: {formatUUID(service.uuid)}
                  </Text>
                  <Text style={styles.fullUuid}>{service.uuid}</Text>
                </View>
                <View style={[styles.badge, service.isPrimary ? styles.primaryBadge : styles.secondaryBadge]}>
                  <Text style={styles.badgeText}>
                    {service.isPrimary ? '主服务' : '次服务'}
                  </Text>
                </View>
              </View>

              {service.characteristics && service.characteristics.length > 0 && (
                <View style={styles.characteristicsContainer}>
                  <Text style={styles.characteristicsTitle}>特征值:</Text>

                  {service.characteristics.map((char, charIndex) => {
                    const key = `${service.uuid}-${char.uuid}`;
                    const isNotifying = notifications[key];
                    const notifyData = notificationData[key];

                    return (
                      <View key={charIndex} style={styles.characteristicItem}>
                        <View style={styles.charHeader}>
                          <Text style={styles.charUuid} numberOfLines={1}>
                            {formatUUID(char.uuid)}
                          </Text>
                          <View style={styles.propertiesRow}>
                            {char.properties.read && (
                              <View style={[styles.propertyBadge, styles.readBadge]}>
                                <Text style={styles.propertyText}>R</Text>
                              </View>
                            )}
                            {char.properties.write && (
                              <TouchableOpacity
                                style={[styles.propertyBadge, styles.writeBadge]}
                                onPress={() => handleQuickWrite(service.uuid, char.uuid)}
                              >
                                <Text style={styles.propertyText}>W</Text>
                              </TouchableOpacity>
                            )}
                            {char.properties.notify && (
                              <TouchableOpacity
                                style={[
                                  styles.propertyBadge,
                                  isNotifying ? styles.activeNotifyBadge : styles.notifyBadge
                                ]}
                                onPress={() => handleToggleNotification(service.uuid, char.uuid)}
                              >
                                <Text style={styles.propertyText}>
                                  {isNotifying ? '●' : 'N'}
                                </Text>
                              </TouchableOpacity>
                            )}
                            {char.properties.indicate && (
                              <View style={[styles.propertyBadge, styles.indicateBadge]}>
                                <Text style={styles.propertyText}>I</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <Text style={styles.fullCharUuid}>{char.uuid}</Text>

                        {isNotifying && notifyData && (
                          <View style={styles.notificationData}>
                            <Text style={styles.notificationLabel}>
                              数据 [{notifyData.timestamp}]
                            </Text>
                            <Text style={styles.notificationValue}>
                              {notifyData.data}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderDeviceItem = ({ item }) => {
    const isConnecting = selectedDeviceId === item.id && !isConnected;
    const isThisDeviceConnected = connectedDevice && connectedDevice.id === item.id;

    return (
      <Card style={styles.deviceCard}>
        <Card.Content>
          <View style={styles.deviceInfoRow}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName} numberOfLines={1}>
                {item.name || item.localName || '未知设备'}
              </Text>
              <Text style={styles.deviceId} numberOfLines={1}>
                ID: {item.id}
              </Text>
              {item.rssi && (
                <Text style={styles.deviceRssi}>
                  信号强度: {item.rssi} dBm
                </Text>
              )}
            </View>

            <View style={styles.deviceAction}>
              {isThisDeviceConnected ? (
                <IconButton
                  icon="link-variant-off"
                  size={24}
                  color="#f44336"
                  onPress={handleDisconnect}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
                  onPress={() => handleConnect(item)}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.connectButtonText}>连接</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isThisDeviceConnected && (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>✓ 已连接</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyList = () => {
    if (isScanning) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.emptyText}>正在搜索附近的蓝牙设备...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📡</Text>
        <Text style={styles.emptyText}>未发现设备</Text>
        <Text style={styles.emptySubText}>点击"扫描设备"按钮开始搜索</Text>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="测试BLE" />
        <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
      </Appbar.Header>

      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusDot, { backgroundColor: isInitialized ? '#4caf50' : '#ff9800' }]}></Text>
          <Text style={styles.statusText}>
            蓝牙: {isInitialized ? '已就绪' : '初始化中...'}
          </Text>
        </View>

        {isConnected && connectedDevice && (
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#4caf50' }]} />
            <Text style={styles.statusText}>
              已连接: {connectedDevice.name || connectedDevice.localName || connectedDevice.id}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>测试BLE连接</Text>

        <View style={styles.buttonRow}>
          <PaperButton
            style={[styles.button, styles.scanButton]}
            mode="contained"
            onPress={handleScan}
            loading={isScanning}
            disabled={isScanning}
            icon={isScanning ? "refresh" : "camera"}
          >
            {isScanning ? '扫描中...' : '扫描设备'}
          </PaperButton>

          {isScanning && (
            <PaperButton
              style={[styles.button, styles.stopButton]}
              mode="outlined"
              onPress={stopScan}
              icon="stop"
            >
              停止
            </PaperButton>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            发现的设备 ({devices.length})
          </Text>
        </View>

        <FlatList
          data={devices}
          keyExtractor={(item, index) => item.id + index}
          renderItem={renderDeviceItem}
          ListEmptyComponent={renderEmptyList}
          scrollEnabled={false}
          contentContainerStyle={styles.deviceList}
        />

        {renderServices()}

        {isConnected && (
          <View style={styles.writeContainer}>
            <Text style={styles.sectionTitle}>写入数据</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>服务 UUID</Text>
              <TextInput
                style={styles.input}
                value={writeServiceUUID}
                onChangeText={setWriteServiceUUID}
                placeholder="例如: 180F"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>特征值 UUID</Text>
              <TextInput
                style={styles.input}
                value={writeCharacteristicUUID}
                onChangeText={setWriteCharacteristicUUID}
                placeholder="例如: 2A19"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>数据 (十六进制)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={writeData}
                onChangeText={setWriteData}
                placeholder="AA554252A84755AA"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                multiline
              />
            </View>

            <PaperButton
              mode="contained"
              onPress={handleWrite}
              loading={isWriting}
              disabled={isWriting || !isConnected}
              icon="send"
              style={styles.writeButton}
            >
              {isWriting ? '写入中...' : '发送数据'}
            </PaperButton>

            <Text style={styles.writeHint}>
              提示: 点击特征值的 W 徽章可快速填入 UUID
            </Text>
          </View>
        )}

        {(receivedFrames.length > 0 || rawDataList.length > 0) && (
          <View style={styles.frameContainer}>
            <View style={styles.frameHeader}>
              <Text style={styles.sectionTitle}>
                📦 完整帧 ({receivedFrames.length})
              </Text>
              <TouchableOpacity onPress={clearFrames}>
                <Text style={styles.clearButton}>清空</Text>
              </TouchableOpacity>
            </View>

            {receivedFrames.slice(-5).reverse().map((frame, index) => (
              <Card key={`frame-${index}`} style={styles.frameCard}>
                <Card.Content>
                  <View style={styles.frameMetaRow}>
                    <Text style={styles.frameTime}>{frame.timestamp}</Text>
                    <View style={[styles.badge, styles.frameBadge]}>
                      <Text style={styles.badgeText}>
                        {frame.totalLength}字节
                      </Text>
                    </View>
                  </View>

                  <View style={styles.frameDataSection}>
                    <Text style={styles.frameLabel}>完整帧 (Hex):</Text>
                    <Text style={styles.frameHexValue} numberOfLines={3}>
                      {frame.raw}
                    </Text>
                  </View>

                  <View style={styles.frameDataSection}>
                    <Text style={styles.frameLabel}>帧头:</Text>
                    <Text style={styles.frameHeaderValue}>{frame.header}</Text>
                  </View>

                  <View style={styles.frameDataSection}>
                    <Text style={styles.frameLabel}>有效载荷 ({frame.payloadLength}字节):</Text>
                    <Text style={styles.framePayloadValue} numberOfLines={2}>
                      {frame.payload}
                    </Text>
                  </View>

                  {frame.parsedFields && (
                    <View style={styles.parsedFieldsContainer}>
                      <Text style={styles.frameLabel}>解析字段:</Text>
                      {frame.parsedFields.commandId !== undefined && (
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldName}>命令ID:</Text>
                          <Text style={styles.fieldValue}>
                            0x{frame.parsedFields.commandHex} ({frame.parsedFields.commandId})
                          </Text>
                        </View>
                      )}
                      {frame.parsedFields.dataLength !== undefined && (
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldName}>数据长度:</Text>
                          <Text style={styles.fieldValue}>{frame.parsedFields.dataLength}</Text>
                        </View>
                      )}
                      {frame.parsedFields.data && frame.parsedFields.data.length > 0 && (
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldName}>数据内容:</Text>
                          <Text style={styles.fieldValue} numberOfLines={2}>
                            {frame.parsedFields.dataHex}
                          </Text>
                        </View>
                      )}
                      {frame.parsedFields.checksum !== undefined && (
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldName}>校验和:</Text>
                          <Text style={styles.fieldValue}>
                            0x{frame.parsedFields.checksumHex}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.frameDataSection}>
                    <Text style={styles.frameLabel}>帧尾:</Text>
                    <Text style={styles.frameHeaderValue}>{frame.tail}</Text>
                  </View>

                  <View style={styles.statsRow}>
                    <Text style={styles.statsText}>
                      总计: {frame.receiveStats?.totalBytes || 0} 字节
                    </Text>
                    <Text style={styles.statsText}>
                      片段: {frame.receiveStats?.fragmentsReceived || 0}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}

            {rawDataList.length > 0 && (
              <View style={styles.rawDataContainer}>
                <Text style={styles.rawDataTitle}>
                  📥 原始片段 ({rawDataList.length})
                </Text>
                {rawDataList.slice(-3).reverse().map((raw, idx) => (
                  <View key={`raw-${idx}`} style={styles.rawDataItem}>
                    <Text style={styles.rawDataTime}>{raw.timestamp}</Text>
                    <Text style={styles.rawDataHex} numberOfLines={1}>
                      {raw.hex}
                    </Text>
                    <Text style={styles.rawDataLength}>{raw.length}B</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}


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

  // 蓝牙设备列表样式
  statusBar: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 4,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  scanButton: {
    flex: 2,
  },
  stopButton: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,

  },
  deviceList: {
    paddingBottom: 20,
  },
  deviceCard: {
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  deviceRssi: {
    fontSize: 11,
    color: '#666',
  },
  deviceAction: {
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectButtonDisabled: {
    backgroundColor: '#90caf9',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  connectedBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  connectedText: {
    color: '#4caf50',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
  },
  // 服务和特征样式
  servicesContainer: {
    marginTop: 20,
  },
  serviceCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fafafa',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 8,
  },
  serviceUuid: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  fullUuid: {
    fontSize: 11,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadge: {
    backgroundColor: '#e3f2fd',
  },
  secondaryBadge: {
    backgroundColor: '#f3e5f5',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  characteristicsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  characteristicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  characteristicItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  charHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  charUuid: {
    fontSize: 13,
    fontWeight: '500',
    color: '#444',
    flex: 1,
    marginRight: 8,
  },
  fullCharUuid: {
    fontSize: 10,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 6,
  },
  propertiesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  propertyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readBadge: {
    backgroundColor: '#e8f5e9',
  },
  writeBadge: {
    backgroundColor: '#fff3e0',
  },
  notifyBadge: {
    backgroundColor: '#e3f2fd',
  },
  activeNotifyBadge: {
    backgroundColor: '#2196f3',
  },
  indicateBadge: {
    backgroundColor: '#fce4ec',
  },
  propertyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  notificationData: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f7ff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  notificationLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  notificationValue: {
    fontSize: 12,
    color: '#1976d2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },
  // 写入数据样式
  writeContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  writeButton: {
    marginTop: 12,
  },
  writeHint: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  // 帧数据展示样式
  frameContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  frameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    flex: 0.5,
    fontSize: 13,
    color: '#f44336',
    fontWeight: '600',
  },
  frameCard: {
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
    backgroundColor: '#fff',
  },
  frameMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  frameTime: {
    fontSize: 11,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  frameBadge: {
    backgroundColor: '#c8e6c9',
  },
  frameDataSection: {
    marginBottom: 6,
  },
  frameLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 2,
  },
  frameHexValue: {
    fontSize: 11,
    color: '#1976d2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  frameHeaderValue: {
    fontSize: 12,
    color: '#4caf50',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  framePayloadValue: {
    fontSize: 11,
    color: '#ff9800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 4,
  },
  parsedFieldsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  fieldName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    width: 70,
  },
  fieldValue: {
    fontSize: 11,
    color: '#333',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statsText: {
    fontSize: 10,
    color: '#999',
  },
  rawDataContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
  },
  rawDataTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7b1fa2',
    marginBottom: 8,
  },
  rawDataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e1bee7',
  },
  rawDataTime: {
    fontSize: 9,
    color: '#999',
    width: 80,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  rawDataHex: {
    fontSize: 10,
    color: '#7b1fa2',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  rawDataLength: {
    fontSize: 10,
    color: '#666',
    width: 35,
    textAlign: 'right',
  },
});

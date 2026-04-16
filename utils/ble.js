import { BleManager, Device, Service, Characteristic } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';

function arrayToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function hexToBytes(hexString) {
  const bytes = [];
  for (let i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16));
  }
  return bytes;
}

class BLEFrameReassembler {
  constructor() {
    this.channelBuffers = new Map();
    this.frameCallbacks = new Map();
    this.frameHeader = 'AA55';
    this.frameTail = '55AA';
  }

  getChannelKey(deviceId, charUuid) {
    return `${deviceId}_${charUuid}`;
  }

  initChannel(deviceId, charUuid, onFrameComplete) {
    const key = this.getChannelKey(deviceId, charUuid);
    if (!this.channelBuffers.has(key)) {
      this.channelBuffers.set(key, {
        buffer: [],
        state: 'IDLE',
        frameData: [],
        expectedLength: null,
        headerFound: false,
      });
    }
    if (onFrameComplete) {
      this.frameCallbacks.set(key, onFrameComplete);
    }
    return key;
  }

  removeChannel(deviceId, charUuid) {
    const key = this.getChannelKey(deviceId, charUuid);
    this.channelBuffers.delete(key);
    this.frameCallbacks.delete(key);
  }

  processIncomingHex(hexString, deviceId, charUuid, frameHeader = 'AA55', frameTail = '55AA') {
    const key = this.initChannel(deviceId, charUuid);
    const channel = this.channelBuffers.get(key);
    const callback = this.frameCallbacks.get(key);

    if (!channel) {
      console.error('通道未初始化:', key);
      return;
    }

    const headerBytes = hexToBytes(frameHeader);
    const tailBytes = hexToBytes(frameTail);
    const incomingBytes = hexToBytes(hexString);

    channel.buffer.push(...incomingBytes);

    const completeFrames = [];

    while (channel.buffer.length > 0) {
      switch (channel.state) {
        case 'IDLE':
        case 'SEARCHING_HEADER': {
          let headerStartIndex = -1;
          for (let i = 0; i <= channel.buffer.length - headerBytes.length; i++) {
            let match = true;
            for (let j = 0; j < headerBytes.length; j++) {
              if (channel.buffer[i + j] !== headerBytes[j]) {
                match = false;
                break;
              }
            }
            if (match) {
              headerStartIndex = i;
              break;
            }
          }

          if (headerStartIndex === -1) {
            channel.buffer = [];
            channel.state = 'SEARCHING_HEADER';
            return completeFrames;
          }

          if (headerStartIndex > 0) {
            channel.buffer = channel.buffer.slice(headerStartIndex);
          }

          channel.state = 'RECEIVING_DATA';
          channel.frameData = [...headerBytes];
          channel.buffer = channel.buffer.slice(headerBytes.length);
          break;
        }

        case 'RECEIVING_DATA': {
          while (channel.buffer.length > 0) {
            const byte = channel.buffer.shift();
            channel.frameData.push(byte);

            if (channel.frameData.length >= tailBytes.length) {
              let isTailMatch = true;
              for (let i = 0; i < tailBytes.length; i++) {
                if (channel.frameData[channel.frameData.length - tailBytes.length + i] !== tailBytes[i]) {
                  isTailMatch = false;
                  break;
                }
              }

              if (isTailMatch) {
                const frameHex = bytesToHex(channel.frameData);
                completeFrames.push(frameHex);

                if (callback) {
                  try {
                    callback(frameHex, deviceId, charUuid);
                  } catch (error) {
                    console.error('帧回调错误:', error);
                  }
                }

                channel.state = 'SEARCHING_HEADER';
                channel.frameData = [];
                break;
              }
            }

            if (channel.frameData.length > 1024) {
              console.warn('帧长度异常，重置缓冲区');
              channel.state = 'SEARCHING_HEADER';
              channel.frameData = [];
              channel.buffer = [];
              break;
            }
          }
          break;
        }

        default:
          channel.state = 'IDLE';
          break;
      }
    }

    return completeFrames;
  }

  clearBuffer(deviceId, charUuid) {
    const key = this.getChannelKey(deviceId, charUuid);
    if (this.channelBuffers.has(key)) {
      const channel = this.channelBuffers.get(key);
      channel.buffer = [];
      channel.frameData = [];
      channel.state = 'IDLE';
    }
  }

  destroy() {
    this.channelBuffers.clear();
    this.frameCallbacks.clear();
  }
}

const bleFrameReassembler = new BLEFrameReassembler();

class BLEService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isConnected = false;
    this.scanning = false;
    this.listeners = new Map();
    this.connectedDevices = new Map();
  }

  getDevice(deviceId) {
    if (deviceId) {
      return this.connectedDevices.get(deviceId) || this.device;
    }
    return this.device;
  }

  async requestBluetoothPermission() {
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;
      
      if (apiLevel >= 31) {
        const scanResult = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        const connectResult = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
        
        if (scanResult === RESULTS.GRANTED && connectResult === RESULTS.GRANTED) {
          return true;
        }
        throw new Error('蓝牙权限被拒绝，请在设置中允许蓝牙权限');
      } else if (apiLevel >= 23) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '蓝牙权限',
            message: '应用需要蓝牙权限来扫描和连接设备',
            buttonNeutral: '稍后询问',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }
        throw new Error('位置权限被拒绝，应用需要此权限才能使用蓝牙');
      }
      return true;
    }
    
    if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
      if (result === RESULTS.GRANTED) {
        return true;
      }
      throw new Error('蓝牙权限被拒绝');
    }
    
    return true;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.manager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          resolve(state);
        }
      }, true);
      setTimeout(() => {
        reject(new Error('蓝牙初始化超时'));
      }, 5000);
    });
  }

  async startScan(serviceUUIDs = [], options = {}) {
    try {
      await this.requestBluetoothPermission();
      this.scanning = true;
      const devices = [];
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.manager.stopDeviceScan();
          this.scanning = false;
          resolve(devices);
        }, options.scanTimeout || 10000);

        this.manager.startDeviceScan(
          serviceUUIDs,
          { allowDuplicates: false },
          (error, device) => {
            if (error) {
              clearTimeout(timeout);
              this.scanning = false;
              reject(error);
              return;
            }

            if (device && device.name) {
              devices.push(device);
              this.emit('deviceFound', device);
            }
          }
        );
      });
    } catch (error) {
      this.scanning = false;
      throw error;
    }
  }

  stopScan() {
    if (this.scanning) {
      this.manager.stopDeviceScan();
      this.scanning = false;
    }
  }

  async connectToDevice(deviceId, options = {}) {
    try {
      this.device = await this.manager.connectToDevice(deviceId, options);
      await this.device.discoverAllServicesAndCharacteristics();
      this.isConnected = true;
      this.connectedDevices.set(this.device.id, this.device);
      this.emit('connected', this.device);
      return this.device;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.device && this.isConnected) {
      try {
        const deviceId = this.device.id;
        await this.device.cancelConnection();
        this.isConnected = false;
        this.connectedDevices.delete(deviceId);
        this.device = null;
        this.emit('disconnected');
      } catch (error) {
        console.error('断开连接失败:', error);
      }
    }
  }

  async discoverServices(deviceId) {
    const device = this.getDevice(deviceId);
    
    if (!device) {
      throw new Error('设备未找到或未连接');
    }
    
    const services = await device.services();
    const servicesWithCharacteristics = [];
    
    for (const service of services) {
      const characteristics = await service.characteristics();
      servicesWithCharacteristics.push({
        uuid: service.uuid,
        isPrimary: service.isPrimary,
        characteristics: characteristics.map(char => ({
          uuid: char.uuid,
          properties: {
            read: char.isReadable,
            write: char.isWritableWithResponse || char.isWritableWithoutResponse,
            notify: char.isNotifiable,
            indicate: char.isIndicatable,
          },
        })),
      });
    }
    
    return servicesWithCharacteristics;
  }

  async readCharacteristic(deviceId, serviceUUID, characteristicUUID) {
    const device = this.getDevice(deviceId);
    
    if (!device) {
      throw new Error('设备未找到或未连接');
    }
    
    const characteristic = await device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );
    return characteristic.value;
  }

  async writeCharacteristic(deviceId, serviceUUID, characteristicUUID, value, writeType = 'WithResponse') {
    const device = this.getDevice(deviceId);
    
    if (!device) {
      throw new Error('设备未找到或未连接');
    }

    const base64Value = typeof value === 'string'
      ? value
      : arrayToBase64(value);

    if (writeType === 'WithResponse') {
      return device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64Value
      );
    } else {
      return device.writeCharacteristicWithoutResponseForService(
        serviceUUID,
        characteristicUUID,
        base64Value
      );
    }
  }

  async startNotification(deviceId, serviceUUID, characteristicUUID, callback, options = {}) {
    const device = this.getDevice(deviceId);

    if (!device) {
      throw new Error('设备未找到或未连接');
    }

    const { enableFrameReassembly = true, frameHeader = 'AA55', frameTail = '55AA', onFrameComplete } = options;

    if (enableFrameReassembly) {
      bleFrameReassembler.initChannel(
        device.id,
        characteristicUUID,
        onFrameComplete
      );
    }

    device.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        if (error) {
          console.error('通知监听错误:', error);
          return;
        }
        if (callback) {
          const base64Value = characteristic.value;
          if (enableFrameReassembly) {
            const bytes = base64ToBytes(base64Value);
            const hexString = bytesToHex(bytes);
            const frames = bleFrameReassembler.processIncomingHex(
              hexString,
              device.id,
              characteristicUUID,
              frameHeader,
              frameTail
            );
            callback(base64Value, hexString, frames);
          } else {
            callback(base64Value);
          }
        }
      }
    );
  }

  processIncomingData(hexString, deviceId, charUuid, frameHeader = 'AA55', frameTail = '55AA') {
    return bleFrameReassembler.processIncomingHex(hexString, deviceId, charUuid, frameHeader, frameTail);
  }

  clearFrameBuffer(deviceId, charUuid) {
    bleFrameReassembler.clearBuffer(deviceId, charUuid);
  }

  async stopNotification(deviceId, serviceUUID, characteristicUUID) {
    const device = this.getDevice(deviceId);
    
    if (!device) {
      throw new Error('设备未找到或未连接');
    }

    return device.cancelMonitoringCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );
  }

  getRSSI(deviceId) {
    const device = this.getDevice(deviceId);
    if (!device) {
      throw new Error('设备未找到');
    }
    return device.readRSSI();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    if (callback) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.set(event, []);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => callback(data));
  }

  destroy() {
    this.stopScan();
    this.disconnect();
    this.manager.destroy();
    this.listeners.clear();
  }
}

export default new BLEService();
export { bleFrameReassembler, BLEFrameReassembler };

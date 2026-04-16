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

class BLEService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isConnected = false;
    this.scanning = false;
    this.listeners = new Map();
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
        await this.device.cancelConnection();
        this.isConnected = false;
        this.device = null;
        this.emit('disconnected');
      } catch (error) {
        console.error('断开连接失败:', error);
      }
    }
  }

  async discoverServices(deviceId) {
    const device = deviceId 
      ? this.manager.deviceForIdentifier(deviceId)
      : this.device;
    
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
    const device = deviceId 
      ? this.manager.deviceForIdentifier(deviceId)
      : this.device;
    
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
    const device = deviceId 
      ? this.manager.deviceForIdentifier(deviceId)
      : this.device;
    
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

  async startNotification(deviceId, serviceUUID, characteristicUUID, callback) {
    const device = deviceId 
      ? this.manager.deviceForIdentifier(deviceId)
      : this.device;
    
    if (!device) {
      throw new Error('设备未找到或未连接');
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
          callback(characteristic.value);
        }
      }
    );
  }

  async stopNotification(deviceId, serviceUUID, characteristicUUID) {
    const device = deviceId 
      ? this.manager.deviceForIdentifier(deviceId)
      : this.device;
    
    if (!device) {
      throw new Error('设备未找到或未连接');
    }

    return device.cancelMonitoringCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );
  }

  getRSSI(deviceId) {
    const device = this.manager.deviceForIdentifier(deviceId);
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

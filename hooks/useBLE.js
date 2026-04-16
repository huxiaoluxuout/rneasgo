import { useState, useEffect, useCallback, useRef } from 'react';
import BLEService from '../utils/ble';

export const useBLE = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [error, setError] = useState(null);

  const [receivedFrames, setReceivedFrames] = useState([]);
  const [rawDataList, setRawDataList] = useState([]);

  useEffect(() => {
    initializeBLE();
    
    return () => {
      BLEService.destroy();
    };
  }, []);

  useEffect(() => {
    BLEService.on('deviceFound', (device) => {
      setDevices(prev => {
        if (prev.find(d => d.id === device.id)) {
          return prev;
        }
        return [...prev, device];
      });
    });

    BLEService.on('connected', (device) => {
      setIsConnected(true);
      setConnectedDevice(device);
    });

    BLEService.on('disconnected', () => {
      setIsConnected(false);
      setConnectedDevice(null);
    });

    BLEService.on('frameReceived', (frame) => {
      console.log('📦 收到完整帧:', frame);
      setReceivedFrames(prev => [...prev.slice(-50), frame]);
    });

    BLEService.on('rawDataReceived', (rawData) => {
      console.log('📥 收到原始数据:', rawData);
      setRawDataList(prev => [...prev.slice(-20), rawData]);
    });


    return () => {
      BLEService.off('deviceFound');
      BLEService.off('connected');
      BLEService.off('disconnected');
      BLEService.off('frameReceived');
      BLEService.off('rawDataReceived');

    };
  }, []);

  const initializeBLE = useCallback(async () => {
    try {
      await BLEService.initialize();
      setIsInitialized(true);
    } catch (err) {
      setError(err.message);
      console.error('BLE 初始化失败:', err);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      await BLEService.requestBluetoothPermission();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);


  const startScan = useCallback(async (serviceUUIDs = [], options = {}) => {
    try {
      setError(null);
      setDevices([]);
      setIsScanning(true);
    
      const foundDevices = await BLEService.startScan(serviceUUIDs, options);
      const uniqueDevices = foundDevices.filter((device, index, self) =>
        index === self.findIndex((d) => d.id === device.id)
      );
      setDevices(uniqueDevices);
      setIsScanning(false);
      
      return uniqueDevices;

    } catch (err) {
      setError(err.message);
      setIsScanning(false);
      throw err;
    }
  }, []);

  const stopScan = useCallback(() => {
    BLEService.stopScan();
    setIsScanning(false);
  }, []);

  const connectToDevice = useCallback(async (deviceId) => {
    try {
      setError(null);
      const device = await BLEService.connectToDevice(deviceId);
      return device;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const discoverServices = useCallback(async () => {
    try {
      return await BLEService.discoverServices();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);


  const disconnect = useCallback(async () => {
    try {
      await BLEService.disconnect();
    } catch (err) {
      setError(err.message);
      console.error('断开连接失败:', err);
    }
  }, []);

  const readCharacteristic = useCallback(async (serviceUUID, characteristicUUID) => {

    try {
      return await BLEService.readCharacteristic(
        null,

        serviceUUID,
        characteristicUUID
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const writeCharacteristic = useCallback(async (serviceUUID, characteristicUUID, value, writeType = 'WithResponse') => {
    try {
      return await BLEService.writeCharacteristic(
        null,

        serviceUUID,
        characteristicUUID,
        value,
        writeType
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }

  }, []);

  const startNotification = useCallback((deviceId, serviceUUID, characteristicUUID, callback, options = {}) => {
    return BLEService.startNotification(
      deviceId || null,
      serviceUUID,
      characteristicUUID,
      callback,
      options
    );
  }, []);

  const stopNotification = useCallback((serviceUUID, characteristicUUID) => {
    return BLEService.stopNotification(
      null,
      serviceUUID,
      characteristicUUID
    );
  }, []);

  const getRSSI = useCallback(async () => {
    return BLEService.getRSSI(null);
  }, []);

  const clearFrames = useCallback(() => {
    setReceivedFrames([]);
    setRawDataList([]);
  }, []);

  return {
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
    getRSSI,
    receivedFrames,
    rawDataList,
    clearFrames,

  };
};

export default useBLE;

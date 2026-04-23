import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import BLEService from '../utils/ble';

const BLEContext = createContext(null);

let globalBLEState = {
  isInitialized: false,
  isScanning: false,
  isConnected: false,
  devices: [],
  connectedDevice: null,
  error: null,
  receivedFrames: [],
  rawDataList: [],
};

let listeners = new Set();

function updateGlobalState(updates) {
  globalBLEState = { ...globalBLEState, ...updates };
  listeners.forEach(listener => listener(globalBLEState));
}

export function BLEProvider({ children }) {
  const [state, setState] = useState(globalBLEState);
  const stateRef = useRef(state);

  useEffect(() => {
    const handleUpdate = (newState) => {
      setState(newState);
      stateRef.current = newState;
    };

    listeners.add(handleUpdate);
    
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  useEffect(() => {
    initializeBLE();
    
    return () => {
      // 不要销毁，保持连接
    };
  }, []);

  const initializeBLE = async () => {
    if (globalBLEState.isInitialized) {
      console.log('[BLEContext] 蓝牙已初始化，跳过');
      return;
    }

    try {
      console.log('[BLEContext] 开始初始化蓝牙...');
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('蓝牙初始化超时'));
        }, 5000);

        BLEService.manager.onStateChange((bleState) => {
          if (bleState === 'PoweredOn') {
            clearTimeout(timeout);
            updateGlobalState({ isInitialized: true });
            resolve(bleState);
          }
        }, true);
      });

      console.log('[BLEContext] 蓝牙初始化成功');
    } catch (err) {
      console.error('[BLEContext] 蓝牙初始化失败:', err);
      updateGlobalState({ error: err.message });
    }
  };

  const requestPermission = useCallback(async () => {
    try {
      await BLEService.requestBluetoothPermission();
      return true;
    } catch (err) {
      updateGlobalState({ error: err.message });
      throw err;
    }
  }, []);

  const startScan = useCallback(async (serviceUUIDs = [], options = {}) => {
    try {
      await requestPermission();
      updateGlobalState({ isScanning: true, devices: [], error: null });
      
      const foundDevices = [];
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          BLEService.manager.stopDeviceScan();
          updateGlobalState({ isScanning: false, devices: foundDevices });
          resolve(foundDevices);
        }, options.scanTimeout || 10000);

        BLEService.manager.startDeviceScan(
          serviceUUIDs,
          { allowDuplicates: false },
          (error, device) => {
            if (error) {
              clearTimeout(timeout);
              updateGlobalState({ isScanning: false, error: error.message });
              reject(error);
              return;
            }

            if (device && device.name) {
              const exists = foundDevices.findIndex(d => d.id === device.id);
              if (exists === -1) {
                foundDevices.push(device);
                updateGlobalState({ devices: [...foundDevices] });
              }
              BLEService.emit('deviceFound', device);
            }
          }
        );
      });
    } catch (error) {
      updateGlobalState({ isScanning: false, error: error.message });
      throw error;
    }
  }, [requestPermission]);

  const stopScan = useCallback(() => {
    if (globalBLEState.isScanning) {
      BLEService.manager.stopDeviceScan();
      updateGlobalState({ isScanning: false });
    }
  }, []);

  const connectToDevice = useCallback(async (deviceId) => {
    try {
      updateGlobalState({ error: null });
      
      const device = await BLEService.connectToDevice(deviceId);
      updateGlobalState({ 
        isConnected: true, 
        connectedDevice: device 
      });
      
      return device;
    } catch (error) {
      updateGlobalState({ 
        isConnected: false, 
        connectedDevice: null,
        error: error.message 
      });
      throw error;
    }
  }, []);

  const discoverServices = useCallback(async () => {
    try {
      const services = await BLEService.discoverServices();
      return services;
    } catch (error) {
      updateGlobalState({ error: error.message });
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await BLEService.disconnect();
      updateGlobalState({ 
        isConnected: false, 
        connectedDevice: null,
        devices: []
      });
      BLEService.emit('disconnected');
    } catch (error) {
      updateGlobalState({ error: error.message });
      console.error('断开连接失败:', error);
    }
  }, []);

  const writeCharacteristic = useCallback(async (deviceId, serviceUUID, characteristicUUID, value, writeType = 'WithResponse') => {
    try {
      return await BLEService.writeCharacteristic(deviceId, serviceUUID, characteristicUUID, value, writeType);
    } catch (error) {
      updateGlobalState({ error: error.message });
      throw error;
    }
  }, []);

  const readCharacteristic = useCallback(async (deviceId, serviceUUID, characteristicUUID) => {
    try {
      return await BLEService.readCharacteristic(deviceId, serviceUUID, characteristicUUID);
    } catch (error) {
      updateGlobalState({ error: error.message });
      throw error;
    }
  }, []);

  const startNotification = useCallback((deviceId, serviceUUID, characteristicUUID, callback, options = {}) => {
    return BLEService.startNotification(deviceId, serviceUUID, characteristicUUID, callback, options);
  }, []);

  const stopNotification = useCallback((deviceId, serviceUUID, characteristicUUID) => {
    return BLEService.stopNotification(deviceId, serviceUUID, characteristicUUID);
  }, []);

  const clearFrames = useCallback(() => {
    updateGlobalState({ receivedFrames: [], rawDataList: [] });
  }, []);

  const value = {
    ...state,
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
    getRSSI: () => BLEService.getRSSI(),
    clearFrames,
  };

  return (
    <BLEContext.Provider value={value}>
      {children}
    </BLEContext.Provider>
  );
}

export function useBLE() {
  const context = useContext(BLEContext);
  
  if (!context) {
    throw new Error('useBLE must be used within a BLEProvider');
  }
  
  return context;
}

export default BLEContext;
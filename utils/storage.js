import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const STORAGE_KEYS = {
  VIDEO_HISTORY: "@video_history",
  VIDEO_PROGRESS: "@video_progress",
  USER_FAVORITES: "@user_favorites",
  USER_SETTINGS: "@user_settings",
  DOWNLOADED_FILES: "@downloaded_files",
};

const FIRMWARE_DIRECTORY = `${FileSystem.documentDirectory}firmware/`;

export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error("Error saving data:", error);
    return false;
  }
};

export const loadData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error("Error loading data:", error);
    return null;
  }
};

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("Error removing data:", error);
    return false;
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing data:", error);
    return false;
  }
};

export const saveVideoHistory = async (video) => {
  try {
    const history = await loadData(STORAGE_KEYS.VIDEO_HISTORY) || [];
    const existingIndex = history.findIndex((item) => item.id === video.id);

    const newEntry = {
      ...video,
      watchedAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }

    history.unshift(newEntry);

    const limitedHistory = history.slice(0, 50);

    await saveData(STORAGE_KEYS.VIDEO_HISTORY, limitedHistory);
    return limitedHistory;
  } catch (error) {
    console.error("Error saving video history:", error);
    return null;
  }
};

export const getVideoHistory = async () => {
  return await loadData(STORAGE_KEYS.VIDEO_HISTORY) || [];
};

export const clearVideoHistory = async () => {
  return await removeData(STORAGE_KEYS.VIDEO_HISTORY);
};

export const saveVideoProgress = async (videoId, progress) => {
  try {
    const allProgress = await loadData(STORAGE_KEYS.VIDEO_PROGRESS) || {};
    allProgress[videoId] = {
      ...progress,
      updatedAt: new Date().toISOString(),
    };
    await saveData(STORAGE_KEYS.VIDEO_PROGRESS, allProgress);
    return true;
  } catch (error) {
    console.error("Error saving video progress:", error);
    return false;
  }
};

export const getVideoProgress = async (videoId) => {
  try {
    const allProgress = await loadData(STORAGE_KEYS.VIDEO_PROGRESS) || {};
    return allProgress[videoId] || null;
  } catch (error) {
    console.error("Error getting video progress:", error);
    return null;
  }
};

export const clearVideoProgress = async (videoId) => {
  if (videoId) {
    try {
      const allProgress = await loadData(STORAGE_KEYS.VIDEO_PROGRESS) || {};
      delete allProgress[videoId];
      await saveData(STORAGE_KEYS.VIDEO_PROGRESS, allProgress);
      return true;
    } catch (error) {
      console.error("Error clearing video progress:", error);
      return false;
    }
  } else {
    return await removeData(STORAGE_KEYS.VIDEO_PROGRESS);
  }
};

export const addToFavorites = async (item) => {
  try {
    const favorites = await loadData(STORAGE_KEYS.USER_FAVORITES) || [];
    if (!favorites.find((fav) => fav.id === item.id)) {
      favorites.push({
        ...item,
        addedAt: new Date().toISOString(),
      });
      await saveData(STORAGE_KEYS.USER_FAVORITES, favorites);
    }
    return favorites;
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return null;
  }
};

export const removeFromFavorites = async (itemId) => {
  try {
    let favorites = await loadData(STORAGE_KEYS.USER_FAVORITES) || [];
    favorites = favorites.filter((fav) => fav.id !== itemId);
    await saveData(STORAGE_KEYS.USER_FAVORITES, favorites);
    return favorites;
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return null;
  }
};

export const getFavorites = async () => {
  return await loadData(STORAGE_KEYS.USER_FAVORITES) || [];
};

export const isFavorite = async (itemId) => {
  const favorites = await getFavorites();
  return favorites.some((fav) => fav.id === itemId);
};

const ensureDirectoryExists = async (directoryPath) => {
  const dirInfo = await FileSystem.getInfoAsync(directoryPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(directoryPath, { intermediates: true });
  }
};

export const downloadFile = async (url, fileName, options = {}) => {
  const {
    onProgress,
    headers = {},
    overwrite = false,
  } = options;

  try {
    await ensureDirectoryExists(FIRMWARE_DIRECTORY);

    const localFilePath = `${FIRMWARE_DIRECTORY}${fileName}`;

    if (!overwrite) {
      const fileInfo = await FileSystem.getInfoAsync(localFilePath);
      if (fileInfo.exists) {
        return {
          success: true,
          path: localFilePath,
          uri: `file://${localFilePath}`,
          message: "文件已存在",
        };
      }
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localFilePath,
      { headers },
      onProgress ? (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress({
          ...downloadProgress,
          progress: Math.min(progress, 1),
          percentage: Math.round(progress * 100),
        });
      } : undefined
    );

    const result = await downloadResumable.downloadAsync();

    if (result) {
      const metadata = {
        url,
        fileName,
        localPath: result.uri,
        downloadedAt: new Date().toISOString(),
        size: result.headers ? result.headers["Content-Length"] : null,
      };

      const downloadedFiles = await loadData(STORAGE_KEYS.DOWNLOADED_FILES) || [];
      const existingIndex = downloadedFiles.findIndex(f => f.fileName === fileName);
      
      if (existingIndex !== -1) {
        downloadedFiles[existingIndex] = metadata;
      } else {
        downloadedFiles.push(metadata);
      }
      
      await saveData(STORAGE_KEYS.DOWNLOADED_FILES, downloadedFiles);

      return {
        success: true,
        path: result.uri,
        uri: result.uri,
        metadata,
        message: "下载成功",
      };
    }

    return {
      success: false,
      message: "下载失败",
    };
  } catch (error) {
    console.error("下载文件错误:", error);
    return {
      success: false,
      error: error.message,
      message: `下载失败: ${error.message}`,
    };
  }
};

export const downloadFirmware = async (url, options = {}) => {
  const fileName = url.split('/').pop() || 'firmware.hex';
  
  const defaultOptions = {
    headers: {
      'Accept': '*/*',
      'User-Agent': 'Myofit-OTA/1.0',
    },
    ...options,
  };

  return await downloadFile(url, fileName, defaultOptions);
};

export const getLocalFileInfo = async (fileName) => {
  try {
    const filePath = `${FIRMWARE_DIRECTORY}${fileName}`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists) {
      return {
        exists: true,
        path: filePath,
        uri: `file://${filePath}`,
        size: fileInfo.size,
        modificationTime: fileInfo.modificationTime * 1000,
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error("获取文件信息错误:", error);
    return { exists: false, error: error.message };
  }
};

export const readLocalFileContent = async (filePath) => {
  try {
    const content = await FileSystem.readAsStringAsync(filePath);
    return {
      success: true,
      content,
    };
  } catch (error) {
    console.error("读取文件内容错误:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const readLocalFileAsBase64 = async (filePath) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return {
      success: true,
      content: base64,
    };
  } catch (error) {
    console.error("读取Base64文件错误:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const readLocalFileAsBase64ByName = async (fileName) => {
  try {
    const filePath = `${FIRMWARE_DIRECTORY}${fileName}`;
    const base64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return {
      success: true,
      content: base64,
    };
  } catch (error) {
    console.error("读取Base64文件错误:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteLocalFile = async (fileName) => {
  try {
    const filePath = `${FIRMWARE_DIRECTORY}${fileName}`;
    await FileSystem.deleteAsync(filePath);

    let downloadedFiles = await loadData(STORAGE_KEYS.DOWNLOADED_FILES) || [];
    downloadedFiles = downloadedFiles.filter(f => f.fileName !== fileName);
    await saveData(STORAGE_KEYS.DOWNLOADED_FILES, downloadedFiles);

    return { success: true, message: "删除成功" };
  } catch (error) {
    console.error("删除文件错误:", error);
    return { success: false, error: error.message };
  }
};

export const getDownloadedFilesList = async () => {
  try {
    const files = await loadData(STORAGE_KEYS.DOWNLOADED_FILES) || [];
    const filesWithStatus = [];

    for (const file of files) {
      const info = await getLocalFileInfo(file.fileName);
      filesWithStatus.push({
        ...file,
        existsOnDisk: info.exists,
        currentSize: info.size || 0,
      });
    }

    return filesWithStatus;
  } catch (error) {
    console.error("获取下载列表错误:", error);
    return [];
  }
};

export const clearAllDownloadedFiles = async () => {
  try {
    const fileList = await getDownloadedFilesList();
    
    for (const file of fileList) {
      if (file.existsOnDisk) {
        try {
          await FileSystem.deleteAsync(file.localPath);
        } catch (e) {
          console.warn(`删除文件失败: ${file.fileName}`, e);
        }
      }
    }

    await removeData(STORAGE_KEYS.DOWNLOADED_FILES);
    
    return { success: true, message: "已清除所有下载文件" };
  } catch (error) {
    console.error("清除下载文件错误:", error);
    return { success: false, error: error.message };
  }
};

export const checkNetworkAndDownload = async (url, options = {}) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return {
        success: false,
        message: `服务器返回错误: ${response.status}`,
        statusCode: response.status,
      };
    }

    const serverFileSize = response.headers.get('content-length');
    const lastModified = response.headers.get('last-modified');

    const fileName = url.split('/').pop();
    const localFile = await getLocalFileInfo(fileName);

    if (localFile.exists && !options.forceDownload) {
      if (serverFileSize && parseInt(serverFileSize) === localFile.size) {
        return {
          success: true,
          path: localFile.path,
          message: "本地文件已是最新",
          alreadyUpToDate: true,
        };
      }
    }

    return await downloadFile(url, fileName, options);
  } catch (error) {
    console.error("检查并下载错误:", error);
    return {
      success: false,
      error: error.message,
      message: `网络请求失败: ${error.message}`,
    };
  }
};

export const getStorageInfo = async () => {
  try {
    const storageInfo = await FileSystem.getInfoAsync(FIRMWARE_DIRECTORY);
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    
    return {
      firmwareDir: storageInfo,
      freeSpace: freeSpace,
      freeSpaceMB: (freeSpace / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.error("获取存储信息错误:", error);
    return null;
  }
};

export { STORAGE_KEYS };
/**
 * 通用辅助函数
 */

/**
 * 获取本地化名称
 * @param {Object} item - 包含多语言名称的对象
 * @param {string} lang - 语言代码 (en, es, fr)
 * @returns {string} 本地化名称
 */
export const getLocalizedName = (item, lang = "en") => {
  if (!item.name) return "";
  if (typeof item.name === "string") return item.name;
  return item.name[lang] || item.name.en || "";
};

/**
 * 根据dec值过滤数组
 * @param {number[]} decValuesToKeep - 要保留的dec值数组
 * @param {Array} array - 要过滤的数组
 * @returns {Array} 过滤后的数组
 */
export const filterByDec = (decValuesToKeep, array) => {
  if (!decValuesToKeep || !array) return [];
  const decSet = new Set(decValuesToKeep);
  return array.filter((item) => decSet.has(item.dec));
};

/**
 * 根据ID获取程序
 * @param {string} programId - 程序ID
 * @param {Array} programs - 程序数组
 * @returns {Object|undefined} 程序对象
 */
export const getProgramById = (programId, programs) => {
  return programs.find((program) => program.id === programId);
};

/**
 * 根据ID获取部位
 * @param {string} partId - 部位ID
 * @param {Array} parts - 部位数组
 * @returns {Object|undefined} 部位对象
 */
export const getPartById = (partId, parts) => {
  return parts.find((part) => part.id === partId);
};

/**
 * 获取图片URL
 * @param {number|string} imageId - 图片ID
 * @returns {string} 图片URL
 */
export const getImageUrl = (imageId) => {
  return `/static/body/${imageId}.jpg`;
};

/**
 * 批量获取图片URL
 * @param {number[]} imageIds - 图片ID数组
 * @returns {string[]} 图片URL数组
 */
export const getImageUrls = (imageIds) => {
  return imageIds.map((id) => getImageUrl(id));
};

/**
 * 创建索引映射
 * @param {Array} array - 要创建映射的数组
 * @param {string} key - 用作键的属性名
 * @returns {Object} 映射对象
 */
export const createMapByKey = (array, key = "id") => {
  return Object.fromEntries(array.map((item) => [item[key], item]));
};

/**
 * 冻结对象防止修改
 * @param {Object|Array} data - 要冻结的数据
 * @returns {Object|Array} 冻结后的数据
 */
export const deepFreeze = (data) => {
  if (typeof data !== "object" || data === null) return data;

  Object.freeze(data);

  Object.values(data).forEach((value) => {
    if (
      typeof value === "object" &&
      value !== null &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });

  return data;
};

/**
 * 数据转换函数
 */

import { deepFreeze } from "./helpers.js";

/**
 * 添加计算属性到部位对象
 * @param {Object} part - 部位对象
 * @returns {Object} 增强后的部位对象
 */
const enhancePart = (part) => {
  const enhanced = { ...part };

  // 如果有子菜单，计算所有图片
  if (enhanced.submenu) {
    enhanced.allImages = enhanced.submenu.flatMap((sub) => {
      const images = [];
      if (sub.f_img) images.push(...sub.f_img);
      if (sub.b_img) images.push(...sub.b_img);
      return images;
    });

    enhanced.partsImg = enhanced.allImages;
  }

  // 合并正面和背面图片
  enhanced.allImages = [
    ...(enhanced.f_img || []),
    ...(enhanced.b_img || []),
    ...(enhanced.partsImg || []),
  ];

  return enhanced;
};

/**
 * 添加计算属性到程序对象
 * @param {Object} program - 程序对象
 * @returns {Object} 增强后的程序对象
 */
const enhanceProgram = (program) => {
  const enhanced = { ...program };

  // 计算总秒数
  enhanced.totalSeconds = Math.round(enhanced.minutes * 60);

  // 确保 levelMinutes 数组存在
  if (!enhanced.levelMinutes && enhanced.minutes) {
    enhanced.levelMinutes = Array(5).fill(enhanced.minutes);
  }

  return enhanced;
};

/**
 * 转换部位数据
 * @param {Array} parts - 原始部位数组
 * @returns {Array} 转换后的部位数组
 */
export const transformParts = (parts) => {
  return deepFreeze(parts.map(enhancePart));
};

/**
 * 转换程序数据
 * @param {Array} programs - 原始程序数组
 * @returns {Array} 转换后的程序数组
 */
export const transformPrograms = (programs) => {
  return deepFreeze(programs.map(enhanceProgram));
};

/**
 * 转换模式数据，关联程序
 * @param {Array} models - 原始模式数组
 * @param {Object} programsMap - 程序映射
 * @returns {Array} 转换后的模式数组
 */
export const transformModels = (models, programsMap) => {
  return deepFreeze(
    models.map((model) => ({
      ...model,
      programs: (model.programIds || [])
        .map((id) => programsMap[id])
        .filter(Boolean),
    })),
  );
};

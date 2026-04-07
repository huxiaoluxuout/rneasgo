/**
 * 治疗等级配置
 */

import { deepFreeze, filterByDec } from "../utils/helpers.js";

// 基础等级数据
const LEVELS_DATA = [
  { id: "00", dec: 0, name: { en: "Level 0", es: "Nivel 0", fr: "Niveau 0" } },
  { id: "01", dec: 1, name: { en: "Level 1", es: "Nivel 1", fr: "Niveau 1" } },
  { id: "02", dec: 2, name: { en: "Level 2", es: "Nivel 2", fr: "Niveau 2" } },
  { id: "03", dec: 3, name: { en: "Level 3", es: "Nivel 3", fr: "Niveau 3" } },
  { id: "04", dec: 4, name: { en: "Level 4", es: "Nivel 4", fr: "Niveau 4" } },
];

// 冻结并导出
export const LEVELS = deepFreeze(LEVELS_DATA);

// 导出只包含基础等级的数组（dec = 0）
export const BASIC_LEVELS = deepFreeze(filterByDec([0], LEVELS_DATA));

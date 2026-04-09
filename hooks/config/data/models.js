/**
 * 治疗模式配置
 */

import { createMapByKey, deepFreeze, filterByDec } from "../utils/helpers.js";
import { PROGRAMS } from "./programs.js";

// 模式定义
const MODELS_DATA = [
  {
    id: "01",
    name: { en: "SPORT", es: "DEPORTE", fr: "SPORT" },
    dec: 1,
    programDecs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: "02",
    name: { en: "AESTHETIC", es: "ESTÉTICA", fr: "ESTHÉTIQUE" },
    dec: 2,
    programDecs: [17, 18, 19],
  },
  {
    id: "03",
    name: { en: "MASSAGE", es: "MASAJE", fr: "MASSAGE" },
    dec: 3,
    programDecs: [20, 21, 22],
  },
  {
    id: "04",
    name: { en: "VASCULAR", es: "VASCULAR", fr: "VASCULAIRE" },
    dec: 4,
    programDecs: [23, 24, 25, 26],
  },
  {
    id: "05",
    name: { en: "PAIN", es: "DOLOR", fr: "ANTIDOULEUR" },
    dec: 5,
    programDecs: [27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  },
  {
    id: "06",
    name: { en: "REHABILITATION", es: "REHABILITACIÓN", fr: "RÉHABILITATION" },
    dec: 6,
    programDecs: [37, 38, 39],
  },
];

// 创建程序映射
const programsMap = createMapByKey(PROGRAMS, "id");

// 转换模式数据，关联程序
export const MODEL_MAP = deepFreeze(
  MODELS_DATA.map((model) => ({
    id: model.id,
    name: model.name,
    dec: model.dec,
    programs: filterByDec(model.programDecs, PROGRAMS),
  })),
);
const COLORS = [
  "#147AB0",
  "#189ACF",
  "#55A6CD",
  "#1BB0D1",
  "#53BFCD",
  "#74C6C7",
  "#5C69AF",
];

// 导出简化版模式映射（不包含程序详情）
export const INDEX_MODEL_MAP = deepFreeze(
  MODELS_DATA.map(({ id, name, dec }, index) => ({
    id,
    name,
    dec,
    screen: "programs",
    backgroundColor: COLORS[index],
  })),
);

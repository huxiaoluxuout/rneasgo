/**
 * 配置文件统一导出入口
 */

// 导出常量
export {
    ALL_FRONTAL_IMAGES,
    ALL_POSTERIOR_IMAGES,
    ANKLE_IMAGES,
    ARM_IMAGES,
    BACK_IMAGES,
    CALF_IMAGES,
    FOREARM_IMAGES,
    GLUTE_IMAGES,
    NECK_IMAGES,
    SHOULDER_IMAGES,
    THIGH_IMAGES,
    TORSO_IMAGES
} from "@/hooks/config/constants/images.js";

export {
    GROUP_CRAMP_PREVENTION,
    GROUP_ENDURANCE,
    GROUP_HEAVY_LEGS,
    GROUP_HYPERTROPHY,
    GROUP_LYMPHATIC,
    GROUP_PAIN_TREATMENT,
    GROUP_RECOVERY,
    GROUP_SHAPING,
    GROUP_STRENGTH,
    GROUP_STRETCHING,
    GROUP_VASCULAR
} from "@/hooks/config/constants/groups.js";

// 导出数据
export { BASIC_LEVELS, LEVELS } from "@/hooks/config/data/levels.js";
export { INDEX_MODEL_MAP, MODEL_MAP } from "@/hooks/config/data/models.js";
export { PARTS } from "@/hooks/config/data/parts.js";
export { PROGRAMS } from "@/hooks/config/data/programs.js";

// 导出工具函数
export {
    createMapByKey,
    deepFreeze,
    filterByDec,
    getImageUrl,
    getImageUrls,
    getLocalizedName,
    getPartById,
    getProgramById
} from "@/hooks/config/utils/helpers.js";

// 导出转换函数
export {
    transformModels,
    transformParts,
    transformPrograms
} from "@/hooks/config/utils/transformers.js";


/**
 * 治疗部位配置
 */

import {
    ANKLE_IMAGES,
    ARM_IMAGES,
    BACK_IMAGES,
    CALF_IMAGES,
    FOREARM_IMAGES,
    GLUTE_IMAGES,
    NECK_IMAGES,
    SHOULDER_IMAGES,
    THIGH_IMAGES,
    TORSO_IMAGES,
} from "../constants/images.js";
import { transformParts } from "../utils/transformers.js";

// 原始部位数据
const PARTS_DATA = [
  {
    id: "01",
    name: { en: "Cervical", es: "Cervical", fr: "Cervicaux" },
    dec: 1,
    b_img: [
      NECK_IMAGES.CERVICAL_FRONT,
      NECK_IMAGES.CERVICAL_BACK,
      NECK_IMAGES.CERVICAL_SIDE,
    ],
    partsImg: [
      NECK_IMAGES.CERVICAL_FRONT,
      NECK_IMAGES.CERVICAL_BACK,
      NECK_IMAGES.CERVICAL_SIDE,
    ],
  },
  {
    id: "02",
    name: { en: "Back", es: "Espalda", fr: "Dos" },
    dec: 2,
    submenu: [
      {
        id: "02-01",
        name: { en: "Spine", es: "Columna", fr: "Colonne vertébrale" },
        b_img: [BACK_IMAGES.SPINE, BACK_IMAGES.SPINE_UPPER],
      },
      {
        id: "02-02",
        name: { en: "Thoracic back", es: "Dorsal", fr: "Dorsaux" },
        b_img: [
          BACK_IMAGES.THORACIC_UPPER,
          BACK_IMAGES.THORACIC_MID,
          BACK_IMAGES.THORACIC_LOWER,
          BACK_IMAGES.THORACIC_LATERAL,
        ],
      },
      {
        id: "02-03",
        name: { en: "Low back", es: "Lumbar", fr: "Lombaire" },
        b_img: [BACK_IMAGES.LUMBAR],
      },
    ],
  },
  {
    id: "03",
    name: { en: "Shoulder", es: "Hombro", fr: "Épaule" },
    dec: 3,
    f_img: [
      SHOULDER_IMAGES.FRONT_DELTOID,
      SHOULDER_IMAGES.ANTERIOR_DELTOID,
      SHOULDER_IMAGES.LATERAL_DELTOID,
      SHOULDER_IMAGES.POSTERIOR_DELTOID,
    ],
    b_img: [
      SHOULDER_IMAGES.TRAPEZIUS_UPPER,
      SHOULDER_IMAGES.TRAPEZIUS_MID,
      SHOULDER_IMAGES.TRAPEZIUS_LOWER,
    ],
    partsImg: [
      SHOULDER_IMAGES.FRONT_DELTOID,
      SHOULDER_IMAGES.ANTERIOR_DELTOID,
      SHOULDER_IMAGES.LATERAL_DELTOID,
      SHOULDER_IMAGES.POSTERIOR_DELTOID,
      SHOULDER_IMAGES.TRAPEZIUS_UPPER,
      SHOULDER_IMAGES.TRAPEZIUS_MID,
      SHOULDER_IMAGES.TRAPEZIUS_LOWER,
    ],
  },
  {
    id: "04",
    name: { en: "Arm", es: "Brazo", fr: "Bras" },
    dec: 4,
    f_img: [ARM_IMAGES.BICEPS_FRONT, ARM_IMAGES.BRACHIALIS],
    b_img: [ARM_IMAGES.TRICEPS_LATERAL, ARM_IMAGES.TRICEPS_MEDIAL],
    partsImg: [
      ARM_IMAGES.BICEPS_FRONT,
      ARM_IMAGES.BRACHIALIS,
      ARM_IMAGES.TRICEPS_LATERAL,
      ARM_IMAGES.TRICEPS_MEDIAL,
    ],
  },
  {
    id: "05",
    name: { en: "Forearm", es: "Antebrazo", fr: "Avant-bras" },
    dec: 5,
    submenu: [
      {
        id: "05-01",
        name: { en: "Elbow", es: "Codo", fr: "Coude" },
        b_img: [FOREARM_IMAGES.ELBOW],
      },
      {
        id: "05-02",
        name: {
          en: "Palmar flexors",
          es: "Flexores palmares",
          fr: "Fléchisseurs palmaires",
        },
        f_img: [FOREARM_IMAGES.PALMAR_FLEXORS],
      },
      {
        id: "05-03",
        name: { en: "Extenders", es: "Extensores", fr: "Extenseurs" },
        f_img: [FOREARM_IMAGES.EXTENSORS],
      },
    ],
  },
  {
    id: "06",
    name: { en: "Thorax", es: "Tórax", fr: "Thorax" },
    dec: 6,
    f_img: [TORSO_IMAGES.PECTORALIS],
    partsImg: [TORSO_IMAGES.PECTORALIS],
  },
  {
    id: "07",
    name: { en: "Abdomen", es: "Abdomen", fr: "Abdomen" },
    dec: 7,
    submenu: [
      {
        id: "07-01",
        name: { en: "Abdominals", es: "abdominales", fr: "Abdominaux" },
        f_img: [TORSO_IMAGES.RECTUS_ABDOMINIS],
      },
      {
        id: "07-02",
        name: { en: "Obliques", es: "oblícuos", fr: "Obliques" },
        f_img: [TORSO_IMAGES.OBLIQUES],
      },
    ],
  },
  {
    id: "08",
    name: { en: "Gluteus", es: "Glúteo", fr: "Fessier" },
    dec: 8,
    b_img: [
      GLUTE_IMAGES.GLUTEUS_MAXIMUS,
      GLUTE_IMAGES.GLUTEUS_MEDIUS,
      GLUTE_IMAGES.GLUTEUS_MINIMUS,
      GLUTE_IMAGES.PIRIFORMIS,
    ],
    partsImg: [
      GLUTE_IMAGES.GLUTEUS_MAXIMUS,
      GLUTE_IMAGES.GLUTEUS_MEDIUS,
      GLUTE_IMAGES.GLUTEUS_MINIMUS,
      GLUTE_IMAGES.PIRIFORMIS,
    ],
  },
  {
    id: "09",
    name: { en: "Thigh", es: "Muslo", fr: "Cuisse" },
    dec: 9,
    submenu: [
      {
        id: "09-01",
        name: { en: "Quadriceps", es: "Cuádriceps", fr: "Quadriceps" },
        f_img: [
          THIGH_IMAGES.RECTUS_FEMORIS,
          THIGH_IMAGES.VASTUS_LATERALIS,
          THIGH_IMAGES.VASTUS_MEDIALIS,
          THIGH_IMAGES.VASTUS_INTERMEDIUS,
          THIGH_IMAGES.SARTORIUS,
          THIGH_IMAGES.ADDUCTORS,
        ],
      },
      {
        id: "09-02",
        name: { en: "Knee", es: "Rodilla", fr: "Genoux" },
        f_img: [THIGH_IMAGES.KNEE_FRONT],
        b_img: [THIGH_IMAGES.HAMSTRINGS],
      },
    ],
  },
  {
    id: "10",
    name: { en: "Calf", es: "Pantorrilla", fr: "Mollet" },
    dec: 10,
    f_img: [
      CALF_IMAGES.GASTROCNEMIUS_LATERAL,
      CALF_IMAGES.GASTROCNEMIUS_MEDIAL,
    ],
    b_img: [CALF_IMAGES.SOLEUS_LATERAL, CALF_IMAGES.SOLEUS_MEDIAL],
    partsImg: [
      CALF_IMAGES.GASTROCNEMIUS_LATERAL,
      CALF_IMAGES.GASTROCNEMIUS_MEDIAL,
      CALF_IMAGES.SOLEUS_LATERAL,
      CALF_IMAGES.SOLEUS_MEDIAL,
    ],
  },
  {
    id: "11",
    name: { en: "Ankle", es: "Tobillo", fr: "Cheville" },
    dec: 11,
    f_img: [ANKLE_IMAGES.ANKLE],
    partsImg: [ANKLE_IMAGES.ANKLE],
  },
];

// 转换并导出
export const PARTS = transformParts(PARTS_DATA);

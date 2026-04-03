// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // 变量和导入相关规则
      "no-unused-vars": "warn", // 未使用的变量改为警告
      "no-unused-imports": "warn", // 未使用的导入改为警告
      "react-hooks/exhaustive-deps": "warn", // React Hooks 依赖检查改为警告

      // 代码风格相关规则
      "prettier/prettier": "off", // 关闭 Prettier 格式化检查
      "react/no-unstable-nested-components": "off", // 允许不稳定的嵌套组件
      "react-native/no-inline-styles": "off", // 允许 React Native 内联样式

      // 其他规则
      "require-await": "off", // 允许 async 函数不使用 await
      "no-console": "off", // 允许使用 console 语句
      "max-len": "off", // 关闭行长度限制
      "no-multiple-empty-lines": "off", // 关闭空行数量限制
      "no-trailing-spaces": "off", // 关闭尾随空格检查
      indent: "off", // 关闭缩进检查
      semi: "off", // 关闭分号检查
      quotes: "off", // 关闭引号风格检查
    },
  },
]);

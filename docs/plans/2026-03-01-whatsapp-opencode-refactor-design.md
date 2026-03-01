# 设计说明：注释与代码风格统一

## 目标

- 为新模块补齐函数级中文注释
- 统一分号与空 catch 的代码风格，满足 ESLint 规则
- 保持行为不变，降低回归风险

## 范围

- src/config、src/utils、src/services、src/bridge、src/index.js、send-test.js、tests/bridge.test.js

## 方案

### 方案A（采用）

- 在每个函数定义前补充简洁的中文函数级注释
- 统一分号与字符串格式，修复 ESLint 报错风险
- 不调整逻辑结构与控制流程

### 方案B

- 在 A 的基础上轻微拆分长函数
- 可读性更强，但改动面更大

## 校验

- npm run lint
- npm test
- npm run test:coverage

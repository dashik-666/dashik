
# 2.11.5 (2024/6/18)

## ✨ feat

- 支持后端文件导入([#142](https://github.com/youlaitech/叨叨电竞/pull/142)) [@cshaptx4869](https://github.com/cshaptx4869)


## 🐛 fix
- vue-dev-tools 插件导致菜单路由切换卡死，暂时关闭 ([28349e](https://github.com/youlaitech/叨叨电竞/commit/28349efe147afab36531ba148eaac3a448fe6c71)) [@haoxianrui](https://github.com/haoxianrui)



# 2.11.4 (2024/6/16)

## ✨ feat

- 操作栏增加render配置参数([#138](https://github.com/youlaitech/叨叨电竞/pull/140)) [@cshaptx4869](https://github.com/cshaptx4869)
- 左侧工具栏增加type配置参数([#141](https://github.com/youlaitech/叨叨电竞/pull/141)) [@diamont1001](https://github.com/diamont1001)

## ♻️ refactor
- 更换权限分配弹窗类型为 drawer 并添加父子联动开关([2d9193](https://github.com/youlaitech/叨叨电竞/commit/2d9193c47fd224f01f82b9c0b2bbeb5e7cb33584)) [@haoxianrui](https://github.com/haoxianrui)



# 2.11.3 (2024/6/11)

## ✨ feat

- 支持默认工具栏的导入([#138](https://github.com/youlaitech/叨叨电竞/pull/138)) [@cshaptx4869](https://github.com/cshaptx4869)
-  添加CURD导入示例([19e7bb](https://github.com/youlaitech/叨叨电竞/commit/eab91effd6a01d5a3d9257249c8d06aa252b3bf8)) [@cshaptx4869](https://github.com/cshaptx4869)

## ♻️ refactor
- 修改导出全量数据选项文本([904fec](https://github.com/youlaitech/叨叨电竞/commit/904fecad65217650482fcdbb10ffb7f3d27eb9ea)) [@cshaptx4869](https://github.com/cshaptx4869)

## 🐛 fix
- 菜单列表未适配el-icon导致图标不显示问题修复([e72b68](https://github.com/youlaitech/叨叨电竞/commit/e72b68337562b5a7ea24ad55bbe00023e1266b40)) [@haoxianrui](https://github.com/haoxianrui)

# 2.11.2 (2024/6/8)

## ✨ feat

- 支持表格远程筛选([#131](https://github.com/youlaitech/叨叨电竞/pull/131)) [@cshaptx4869](https://github.com/cshaptx4869)
- 支持标签输入框([#132](https://github.com/youlaitech/叨叨电竞/pull/132)) [@cshaptx4869](https://github.com/cshaptx4869)
- 表单项支持tips配置([#133](https://github.com/youlaitech/叨叨电竞/pull/133)) [@cshaptx4869](https://github.com/cshaptx4869)
- 前端导出支持全量数据([#134](https://github.com/youlaitech/叨叨电竞/pull/134)) [@cshaptx4869](https://github.com/cshaptx4869)
- 支持选中数据导出([#135](https://github.com/youlaitech/叨叨电竞/pull/135)) [@cshaptx4869](https://github.com/cshaptx4869)
- 表格默认工具栏的导出、搜索按钮增加权限点控制([883128](https://github.com/youlaitech/叨叨电竞/commit/8831289b655f2cc086ecdababaa89f8d8a087c42)) [@cshaptx4869](https://github.com/cshaptx4869)
- 页签title支持动态设置([23876a](https://github.com/youlaitech/叨叨电竞/commit/23876aa396143bf77cb5c86af8d6023d9ff6555a)) [@haoxianrui](https://github.com/haoxianrui)

## ♻️ refactor
- 默认工具栏支持自定义([#136](https://github.com/youlaitech/叨叨电竞/pull/136)) [@cshaptx4869](https://github.com/cshaptx4869)
-  未配置全量导出接口时选项隐藏([eab91ef](https://github.com/youlaitech/叨叨电竞/commit/eab91effd6a01d5a3d9257249c8d06aa252b3bf8)) [@cshaptx4869](https://github.com/cshaptx4869)

## 🐛 fix
- 修复注销登出后redirect跳转路由参数丢失([5626017](https://github.com/youlaitech/叨叨电竞/commit/562601736731afd20bb1a5140d856f6515720159)) [@haoxianrui](https://github.com/haoxianrui)

# 2.11.1 (2024/6/6)

## ✨ feat

- 增加pagination、request、parseData配置参数([#119](https://github.com/youlaitech/叨叨电竞/pull/119)) [@cshaptx4869](https://github.com/cshaptx4869)
- 增加返回顶部功能([#120](https://github.com/youlaitech/叨叨电竞/pull/120)) [@cshaptx4869](https://github.com/cshaptx4869)
- 支持前端导出([#126](https://github.com/youlaitech/叨叨电竞/pull/126)) [@cshaptx4869](https://github.com/cshaptx4869)

## ♻️ refactor
- 重构布局样式(解决页面抖动问题)([#116](https://github.com/youlaitech/叨叨电竞/pull/116)) [@cshaptx4869](https://github.com/cshaptx4869)
- 修改CURD示例编辑弹窗尺寸([#121](https://github.com/youlaitech/叨叨电竞/pull/121)) [@cshaptx4869](https://github.com/cshaptx4869)
- 统一注册vue插件([#122](https://github.com/youlaitech/叨叨电竞/pull/122)) [@cshaptx4869](https://github.com/cshaptx4869)
- 默认主题跟随系统([#128](https://github.com/youlaitech/叨叨电竞/pull/128)) [@cshaptx4869](https://github.com/cshaptx4869)
- 增加"scss.lint.unknownAtRules": "ignore"代码，解决style中使用@apply提示unknow at rules@apply提示问题([Gitee#22](https://gitee.com/youlaiorg/叨叨电竞/pulls/22))  [@zjsy521](https://gitee.com/zjsy521)

## 🐛 fix
- 修复左侧布局移动端菜单弹出样式 ([#117](https://github.com/youlaitech/叨叨电竞/pull/117))  [@cshaptx4869](https://github.com/cshaptx4869)

- 修复编辑后未清空id再新增菜单覆盖的问题([0e78eeb](https://github.com/youlaitech/叨叨电竞/commit/0e78eeb75008fa8e9732b1b4e7d7a1ea345c7a1b)) [@haoxianrui](https://github.com/haoxianrui)
- 修复水印层级问题([#123](https://github.com/youlaitech/叨叨电竞/pull/123))  [@cshaptx4869](https://github.com/cshaptx4869)
- 修复混合布局样式问题([#124](https://github.com/youlaitech/叨叨电竞/pull/124))  [@cshaptx4869](https://github.com/cshaptx4869)
- 修复关闭弹窗时没有clearValidate问题([#125](https://github.com/youlaitech/叨叨电竞/pull/125))  [@andm31](https://github.com/andm31)



# 2.11.0 (2024/5/27)

## ✨ feat
- 菜单添加路由参数设置（author by [haoxianrui](https://github.com/haoxianrui)）
- 增加列表选择组件（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 增加列表选择组件使用示例（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 增加defaultToolbar配置参数（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 表单弹窗支持drawer模式（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 表单项增加computed和watchEffect配置（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 支持switch属性修改（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 表单项增加文本类型支持（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 列表列增加show配置项（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 支持搜索表单显隐控制（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 支持input属性修改（author by [cshaptx4869](https://github.com/cshaptx4869)）
- search配置新增函数能力拓展（author by [xiudaozhe](https://github.com/xiudaozhe)）
- 表格新增列设置控制（author by [haoxianrui](https://github.com/haoxianrui)）
- 搜索添加展开和收缩（author by [haoxianrui](https://github.com/haoxianrui)）
- watch函数增加配置项参数返回（author by [cshaptx4869](https://github.com/cshaptx4869)）

## ♻️ refactor
- 重构图标选择组件（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 重构列表选择组件默认样式 （author by [cshaptx4869](https://github.com/cshaptx4869)）
- 加强对话框表单组件和列表选择组件（author by [cshaptx4869](https://github.com/cshaptx4869)）
- routeMeta增加alwaysShow字段声明（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 分页组件增加溢出滚动效果（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 修正登录表单的Ref类型（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 点击表格刷新按钮不重置页码（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 筛选列超出一定高度滚动（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 优化加强initFn函数，表单项增加initFn函数（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 重构watch、computed、watchEffect调用（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 修改操作成功提示（author by [cshaptx4869](https://github.com/cshaptx4869)）
- PageSearch 改用card作为容器,样式改用unocss写法（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 优化首页 loading 动画效果author by [haoxianrui](https://github.com/haoxianrui)）


## 🐛 fix
- 路由是否始终显示不限制只有顶级目录才有的配置，开放至菜单 （author by [haoxianrui](https://github.com/haoxianrui)）
- sockjs-client 报错 global is not defined 导致开发环境无法打开 WebSocket 页面问题修复 （author by [haoxianrui](https://github.com/haoxianrui)）
- 发送用户重启密码功能，最少为6位字符（小于6位登陆时不允许的问题） （author by [dreamnyj](https://gitee.com/dreamnyj)）
- 修复系统设置面板滚动条问题（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 修复表单插槽失效问题（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 修改tagsview刷新丢失query问题（author by [xiudaozhe](https://github.com/xiudaozhe)）

## 📦️ build
- 升级 NPM 包版本至最新 （author by [haoxianrui](https://github.com/haoxianrui)）

## ⚙️ ci
- 规整脚本执行命令（author by [cshaptx4869](https://github.com/cshaptx4869)）


# 2.10.1 (2024/5/4)

## ♻️ refactor
- 抽离CURD的使用部分代码为Hooks实现（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 修改CURD导入权限点标识名（author by [cshaptx4869](https://github.com/cshaptx4869)）
- cURD表单字段支持watch监听（author by [cshaptx4869](https://github.com/cshaptx4869)）
- cURD表单input支持number修饰（author by [cshaptx4869](https://github.com/cshaptx4869)）
- cURD表单组件支持checkbox多选框（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 优化axios响应数据TS类型提示（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 修改CURD表单组件自定义类型的attrs传值（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 同步重置密码按钮权限标识重命名（author by [haoxianrui](https://github.com/haoxianrui)）
- 重构API为静态方法实现模块化管理，并将types.ts重命名为model.ts用于存放接口模型定义（author by [haoxianrui](https://github.com/haoxianrui)）


## 🐛 fix
- sockjs-client 报错 global is not defined 导致开发环境无法打开 WebSocket 页面问题修复 （author by [haoxianrui](https://github.com/haoxianrui)）
- 主题颜色设置覆盖暗黑模式下el-table行激活的背景色问题修复 （author by [haoxianrui](https://github.com/haoxianrui)）
- 修复因API接口调整而影响的调用页面的问题 （author by [haoxianrui](https://github.com/haoxianrui)）

## 📦️ build
- 升级 NPM 包版本至最新 （author by [haoxianrui](https://github.com/haoxianrui)）


# 2.10.0 (2024/4/26)
## ✨ feat
- 封装增删改查组件（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 集成 vite-plugin-vue-devtools 插件（author by [Tricker39](https://github.com/Tricker39)）
- 增加CURD配置化实现（author by [cshaptx4869](https://github.com/cshaptx4869)）


# 2.9.3 (2024/04/14)
## ✨ feat
- 增加vue文件代码片段（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 菜单 hover 背景色添加值全局SCSS变量进行控制（author by [haoxianrui](https://github.com/haoxianrui)）

## ♻️ refactor
- 加强基础国际化（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 增加语言和布局大小枚举类型（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 增加侧边栏状态枚举类型（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 使用布局枚举替换字面量（author by [haoxianrui](https://github.com/haoxianrui)）
- 控制台使用静态数据循环渲染（author by [april](mailto:april@zen-game.cn)）
- 本地缓存的 token 变量重命名（author by [haoxianrui](https://github.com/haoxianrui)）
- 完善 Vite 环境变量类型声明（author by [haoxianrui](https://github.com/haoxianrui)）

## 🐛 fix
- 修复构建时提示iconComponent.name可能为undefined的报错 （author by [wangji1042](https://github.com/wangji1042)）
- 修复浏览器密码自动填充时可能存在的报错 （author by [cshaptx4869](https://github.com/cshaptx4869)）
- 修复eslint报错（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 移动端下点击左侧菜单节点后关闭侧边栏（author by [haoxianrui](https://github.com/haoxianrui)）
- 添加 size 类型断言修复类型报错（author by [haoxianrui](https://github.com/haoxianrui)）

## 📦️ build
- husky9.x版本适配 （author by [cshaptx4869](https://github.com/cshaptx4869)）
- 升级 npm 包版本至最新（author by [haoxianrui](https://github.com/haoxianrui)）

# 2.9.2 (2024/03/05)
## ✨ feat
- vscode开发扩展推荐（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 完善基础增删改查Mock接口（author by [haoxianrui](https://github.com/haoxianrui)）

## ♻️ refactor
- 修改login密码框功能实现（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 弱化页面进入动画效果（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 取消推荐TypeScript Vue Plugin （author by [cshaptx4869](https://github.com/cshaptx4869)）
- 网站加载动画替换 （author by [haoxianrui](https://github.com/haoxianrui)）
- 优化主题和主题色监听，避免多个页面重复初始化 （author by [haoxianrui](https://github.com/haoxianrui)）

## 🐛 fix
- AppMain 高度在非固定头部不正确导致出现滚动条问题修复 （author by [haoxianrui](https://github.com/haoxianrui)）
- 修复混合模式开启固定Head时的样式问题 （author by [cshaptx4869](https://github.com/cshaptx4869)）
- 设置面板统一字体大小 （author by [cshaptx4869](https://github.com/cshaptx4869)）

## 📦️build
- 通过env配置控制mock服务 （author by [cshaptx4869](https://github.com/cshaptx4869)）
- 升级依赖包至最新版本 （author by [haoxianrui](https://github.com/haoxianrui)）
- 定义vite全局常量替换项目标题和版本 （author by [cshaptx4869](https://github.com/cshaptx4869)）

# 2.9.1 (2024/02/28)
## ♻️ refactor
- 项目配置按钮移入navbar（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 优化user数据定义（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 统一设置栏的 SVG 图标风格

## 🐛 fix
- 规整一些开发依赖（author by [cshaptx4869](https://github.com/cshaptx4869)）
- 修复登录页主题切换问题 （author by [cshaptx4869](https://github.com/cshaptx4869)）

## 🚀 pref

- 压缩图片资源  （author by [cshaptx4869](https://github.com/cshaptx4869)）


# 2.9.0 (2024/02/25)

## ✨ feat
- 引入 animate.css 动画库
- 新增水印和配置
- 动态路由菜单支持 element plus 的图标

## ♻️ refactor
- Layout 布局重构和相关问题修复
- sass 使用 @use 替代 @import 引入外部文件指令

## 🐛 fix
- 修复管理页面部分弹窗无法打开问题
- 主题颜色设置按钮 hover 等未变化问题修复


# 2.8.1 (2024/01/10)

## ✨ feat
- 替换 Mock 解决方案 vite-plugin-mock 为 vite-plugin-mock-dev-server 适配 Vite5

# 2.8.0 (2023/12/27)

## ⬆️ chore
- 升级 Vite4 至 Vite5

# 2.7.1 (2023/12/12)

## ♻️ refactor
- 将打包后的文件进行分类 （author by [ityangzhiwen](https://gitee.com/ityangzhiwen)）

# 2.7.0 (2023/11/19)

## ♻️ refactor
- 代码重构优化
- 修改自动导入组件类型声明文件路径
- 完善 typescript 类型

## 🐛 fix
- 修复管理页面部分弹窗无法打开问题


# 2.7.0 (2023/11/19)

## ♻️ refactor
- 代码重构
- 修改自动导入组件类型声明文件路径
- 完善 typescript 类型

## 🐛 fix
- 修复管理页面部分弹窗无法打开问题


# 2.6.3 (2023/10/22)

## ✨ feat
- 菜单管理新增目录只有一级子路由是否始终显示(alwaysShow)和路由页面是否缓存(keepAlive)的配置
- 接口文档新增 swagger、knife4j
- 引入和支持 tsx

## ♻️ refactor
- 代码瘦身，整理并删除未使用的 svg
- 控制台样式优化

## 🐛 fix
- 菜单栏折叠和展开的图标暗黑模式显示问题修复


# 2.6.2 (2023/10/11)

## 🐛 fix
- 主题设置未持久化问题
- UnoCSS 插件无智能提示

## ♻️ refactor
- WebSocket 演示样式和代码优化
- 用户管理代码重构

# 2.6.1 (2023/9/4)

## 🐛 fix
- 导航顶部模式、混合模式样式在固定 Header 出现的样式问题修复
- 固定 Header 没有持久化问题修复
- 字典回显兼容 String 和 Number 类型

# 2.6.0 (2023/8/24)💥💥💥

## ✨ feat
- 导航顶部模式、混合模式支持（author by [april-tong](https://april-tong.com/)）
- 平台文档(内嵌)（author by [april-tong](https://april-tong.com/)）

# 2.5.0 (2023/8/8)

## ✨ feat
- 新增 Mock（author by [ygcaicn](https://github.com/ygcaicn)）
- 图标 DEMO（author by [ygcaicn](https://github.com/ygcaicn)）

## 🐛 fix
- 字典支持 Number 类型

# 2.4.1 (2023/7/20)

## ✨ feat
- 整合 vite-plugin-compression 插件打包优化(3.66MB → 1.58MB) （author by [april-tong](https://april-tong.com/)）
- 字典组件封装（author by [haoxr](https://juejin.cn/user/4187394044331261/posts)）

## 🐛 fix
- 分页组件hidden无效
- 签名无法保存至后端
- Git 提交 stylelint 校验部分机器报错

# 2.4.0 (2023/6/17)

## ✨ feat
- 新增组件标签输入框（author by [april-tong](https://april-tong.com/)）
- 新增组件签名（author by [april-tong](https://april-tong.com/)）
- 新增组件表格（author by [april-tong](https://april-tong.com/)）
- Echarts 图表添加下载功能 author by [april-tong](https://april-tong.com/)）

## ♻️ refactor
- 限制包管理器为 pnpm 和 node 版本16+
- 自定义组件自动导入配置
- 搜索框样式写法优化

## 🐛 fix
- 用户导入的部门回显成数字问题修复

## ⬆️ chore
- element-plus 版本升级 2.3.5 → 2.3.6

# 2.3.1 (2023/5/21)

## 🔄 refactor
- 组件示例文件名称优化

# 2.2.2 (2023/5/11)

## ✨ feat
- 组件封装示例添加源码地址
- 角色、菜单、部门、字段按钮添加权限控制


# 2.3.0 (2023/5/12)

## ⬆️ chore
- vue 版本升级 3.2.45 → 3.3.1 ([CHANGELOG](https://github.com/vuejs/core/blob/main/CHANGELOG.md))
- vite 版本升级 4.3.1 → 4.3.5

## ♻️ refactor
- 使用 vue 3.3 版本新特性 `defineOptions` 在 `setup` 定义组件名称，移除重复的 `script` 标签

# 2.2.2 (2023/5/11)

## ✨ feat
-  用户新增提交添加 `vueUse` 的 `useDebounceFn` 函数实现按钮防抖节流


# 2.2.1 (2023/4/25)

## 🐛 fix
- 图标选择器组件使用 `onClickOutside` 未排除下拉弹出框元素导致无法输入搜索。


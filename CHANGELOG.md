# CHANGELOG


## Promptee-V1.1 (2026-07-09)

### 新增功能
- **工具更名** — 从"批量生成词工具"正式更名为 Promptee
- **Favicon** — 浏览器标签页显示 Promptee logo
- **Logo 展示** — 标题头左侧显示 65×65 logo，header 高度调整至 76px
- **图片粘贴** — 支持 Ctrl+V 从剪贴板粘贴图片上传
- **JSON 格式化** — 结果区域和模态框显示格式化 JSON（缩进换行）
- **新模型** — 新增 Seed2.1 Turbo 作为默认识图模型
- **新模板** — 新增"全身鞋"和"单鞋"两个提示词模板
- **thinking_type 参数** — Seed2.1 系列自动追加 thinking_type:disabled 关闭深度思考
- **流式输出开关修复** — CSS 修复 toggle 点击区域，开关可正常使用

### UI 优化
- 三栏 23%/54%/23% 等比例布局
- 开始按钮渐变色（#fff600 → #ffe300）
- 缩略图改为 3:4 竖长比例，object-fit:contain 完整显示
- 结果列不再限宽 260px，JSON 代码框增大
- 模板按钮选中态改为绿色（#34c759）
- 模板按钮支持 flex-wrap 自动折行
- 模板数量从 5 个扩展到 7 个

### 版本记录
- 基于 v1.0 稳定版开发
- 开发分支：v1.1-dev
- 共 6 次提交

### 已知问题（与 v1.0 相同）
1. file:// 协议限制 — 直接双击 index.html 打开时 fetch API 不可用
2. 流式输出无前端逐 token 动画
3. Excel 导出依赖 SheetJS 在线加载
4. 刷新页面后所有处理结果丢失
5. 失败图片无法单独重试
6. 内置提示词模板不可在界面中直接编辑

---
## Promptee-V1.0-稳定版 (2026-07-09)

### 版本信息
- 版本号：V1.0
- 版本名称：Promptee-V1.0-稳定版
- 保存日期：2026-07-09
- 项目名称：批量生成词工具（Promptee）

---

### 当前完成的功能

#### 多模型支持
- 支持三种火山方舟视觉模型切换：
  - **Seed2.1 Turbo**（默认）— 推理速度快，禁用深度思考，Token 计费减半
  - **Doubao-vision-pro-32k** — 标准视觉模型
  - **Doubao Seed 2.1 Pro** — 禁用深度思考，长超时
- 各模型独立接入点 ID 配置
- API 地址、API Key、推理接入点 ID 独立配置，持久化到 localStorage

#### 图片处理
- **批量上传** — 支持拖拽/点击选择多张图片（JPG/PNG/WebP）
- **图片压缩** — 可开关，最大边长可选（768/1024/1536/2048px），canvas JPEG 85% 质量
- **图片预览** — 缩略图网格显示，可单独删除

#### 提示词模板
- 六个模板按钮：上衣 / 下装 / 鞋类 / 全身 / 全身鞋 / 单鞋 / 自定义
- 每个模板对应独立的详细提示词 JSON 模板
- 自定义模式支持输入产品描述词

#### API 调用
- 调用参数：model, messages, max_tokens, temperature, stream, thinking_type
- 流式输出可开关
- **指数退避重试** — 3 次重试，1s→16s 指数延迟 + jitter
- **429 限频处理** — 自动读取 Retry-After 头，等待后重试

#### 并发与取消
- 并发数可配置（1-5，默认 2）
- 队列 + worker 模式并行处理图片
- 红色停止按钮中断所有进行中的请求
- 已完成的保留结果，未处理的标记为"已取消"

#### 结果管理
- 结果表格展示：序号、图片缩略图、文件名、生成结果（JSON）、状态
- 状态标签：等待 / 处理中 / 完成 / 失败 / 已取消
- 点击结果行可查看完整 JSON（模态框）
- 单条结果一键复制
- 导出 CSV / Excel

---

### 项目结构

C:\Users\hu.d\Documents\AKA-SIMPLE - 副本\
├── .agents/
├── .git/
├── ark_multimodal.py              # Python SDK 封装（火山方舟视觉模型）
├── ark_multimodal_test.ps1        # PowerShell 测试脚本
├── index.html                     # 主页面（全部前端逻辑）
├── server.js                      # Node.js 代理服务器（端口 3001）
├── server.log
├── server_err.txt
├── server_out.txt
├── server_err2.txt
├── start_server.bat               # 启动脚本（自动找 node）
├── CHANGELOG.md                   # 版本记录
├── README_VERSION.md              # 版本说明

---

### 已实现模块

| 模块 | 描述 | 位置 |
|------|------|------|
| 模型配置 | 三模型定义，含接入点、Token、超时、思考模式 | index.html (JS) |
| 图片上传 | FileReader + base64，去重校验 | index.html (JS) |
| 图片压缩 | canvas 缩放，可开关，可设边长 | index.html (JS) |
| 模板系统 | 6+1 模板按钮，切换激活态（绿色） | index.html (HTML+JS) |
| API 调用 | fetch 封装，流式/非流式，自动路由 | index.html (JS) |
| 重试机制 | 3 次指数退避 + jitter，429 处理 | index.html (JS) |
| 并发队列 | worker 池模式，可设并发数 | index.html (JS) |
| 取消控制 | AbortController 中断请求 | index.html (JS) |
| 结果表格 | 动态渲染，实时状态更新 | index.html (JS) |
| 数据导出 | CSV / Excel（依赖 SheetJS） | index.html (JS) |
| 本地持久化 | localStorage 存 API 配置、压缩设置 | index.html (JS) |
| 代理服务 | 避免 CORS，可选的 Node 中间层 | server.js |
| Python SDK | OpenAI 兼容 SDK 封装 | ark_multimodal.py |

---

### 当前运行方式

**方式一：Node.js 代理服务（推荐）**
  start_server.bat      # 或 node server.js
  访问 http://localhost:3001

**方式二：直接打开**
  双击 index.html（file:// 限制下 fetch 不可用）

**方式三：Python HTTP 服务**
  python -m http.server 3001

---

### 已知问题

1. file:// 协议限制 — 直接双击 index.html 打开时 fetch API 不可用
2. 流式输出无前端逐 token 动画（代码已支持流式收集）
3. Excel 导出依赖 SheetJS 在线加载
4. 刷新页面后所有处理结果丢失（无持久化）
5. 失败图片无法单独重试，需全部清空重新处理
6. 内置提示词模板不可在界面中直接编辑

---

*存档时间：2026-07-09 11:44*


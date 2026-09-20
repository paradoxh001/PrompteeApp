# README_VERSION — Promptee V1.0 稳定版

## 版本概述
版本名称：Promptee-V1.0-稳定版
保存日期：2026-07-09
项目路径：C:\Users\hu.d\Documents\AKA-SIMPLE - 副本

## 如何启动当前版本

### 方式一：Node.js 代理服务（完整功能）
1. 双击 start_server.bat
2. 浏览器打开 http://localhost:3001
3. 在左侧面板配置 API Key 和接入点 ID
4. 上传图片 → 选择模板 → 开始生成

### 方式二：Python HTTP 服务
  python -m http.server 3001
  浏览器打开 http://localhost:3001

### 方式三：直接打开（仅查看界面）
  双击 index.html（API 调用不可用）

## 如何打包当前版本

### 最小部署包（推荐）
复制以下文件即可运行：
- index.html
- server.js
- start_server.bat

### 完整开发包
复制整个项目目录（含 .git/ 及辅助脚本）

## 当前依赖环境

### 运行时
- Node.js（运行 server.js 代理服务）
- 或 Python 3.x（简易 HTTP 服务）
- 现代浏览器（Chrome/Edge/Firefox）

### 前端依赖（运行时加载）
- SheetJS (XLSX) — Excel 导出功能

### API 依赖
- 火山方舟 ARK API Key
- 有效的推理接入点（ep-xxx ID）

### 各模型接入点
| 模型 | 接入点 ID |
|------|-----------|
| Doubao-vision-pro-32k | ep-20260706162916-cwsp4 |
| Seed2.1 Turbo（默认） | ep-20260708192217-zfkkf |
| Doubao Seed 2.1 Pro | ep-20260707145037-qbhn8 |

## 多服务商配置（v2.0-dev）

### 服务商
- **火山方舟 ARK**：默认，使用 ep-xxx 接入点 ID，强制走代理
- **自定义（OpenAI 兼容）**：可填任意 OpenAI 兼容服务商的地址与模型名

### 两种调用方式
1. **代理转发**：浏览器 → 本站 /api/chat → 服务商。可绕开 CORS，但目标域名必须在白名单内
2. **直连**：浏览器 → 服务商。需要在页面里把「通过代理转发」关闭，且对方必须允许浏览器跨域

判断配置是否可用：在 API 配置里点「测试连接」，它会用与真实生成完全相同的链路发一条最小请求，并回显真实错误原因。

### 代理白名单
默认允许以下域名：
ark.cn-beijing.volces.com、api.deepseek.com、api.moonshot.cn、dashscope.aliyuncs.com、
open.bigmodel.cn、api.siliconflow.cn、api.stepfun.com、openrouter.ai、api.openai.com、
api.minimaxi.com、api.apilio.ai

要新增域名，两种方式：
- 在 Vercel 项目设置里添加环境变量 `PROXY_ALLOWED_HOSTS`，值为逗号分隔的域名，然后重新部署
- 或直接修改 `lib/proxy-core.js` 里的 DEFAULT_ALLOWED_HOSTS

### 安全约束（请勿随意放宽）
- 只允许 https，且拒绝内网地址（127/10/192.168/169.254/172.16-31 等），防止 SSRF
- 请不要把代理改成「转发任意地址」，否则会成为开放代理
- 代理按来源 IP 限流，Vercel 函数另有约 4.5MB 请求体上限，大图建议压缩后再传

### 鉴权方式
自定义服务商可选 Authorization: Bearer、x-api-key、api-key 三种写法，按服务商文档选择。
## 后续开发注意事项

### 关键文件说明
- **index.html** — 所有前端代码（HTML + CSS + JS），修改时注意保持三栏 24%/48%/28% 布局
- **server.js** — Node.js 代理，仅做请求转发，一般不修改
- **start_server.bat** — 启动脚本，优先使用 PATH 中的 node，兜底用 Codex 运行时

### 添加新模板
1. 在 index.html 的模板按钮行添加 <button class="tpl-btn" data-tpl="xxx" id="tplXxx">名称</button>
2. 在 textarea 区添加对应的提示词数据 textarea
3. 在 JS 中添加变量 	plXxx、click 事件监听、uildPrompt 分支
4. 更新所有已有模板的 classList.remove("active") 调用

### 添加新模型
1. 在 modelConfig 中添加模型配置（label, endpointKey, endpointDefault, maxTokens, timeout）
2. 在 HTML 的 modelSelect 中添加 <option>
3. 模型支持 	hinkingTypeDisabled:true 标记来禁用深度思考

### 兼容性
- CSS 使用 24%/48%/28% 三栏 flex 布局，768px 以下纵向堆叠
- 所有开关/配置持久化在 localStorage，key 前缀统一管理
- 图片压缩使用 canvas，不支持 IE 等旧浏览器

### 性能
- 并发数建议不超过 5，避免 API 限频
- 图片压缩默认 1024px 边长，JPEG 85% 品质
- API 超时时间：Turbo 45s / vision-pro 60s / Pro 120s

### 注意事项
- 修改 index.html 后建议用 node --check 验证 JS 语法
- API Key 存储在 localStorage，注意安全
- 代理服务器 server.js 仅用于解决跨域，生产环境应使用 HTTPS
- 流式输出当前为全量收集后展示，如需逐 token 展示需改造 UI

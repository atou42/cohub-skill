# Cohub Skill 中文版

[English](README.md) | [简体中文](README.zh-CN.md)

供本地 Agent 配合 Cohub CLI 使用的最小 skill：生成素材，发布本地网页。继续使用熟悉的开发工具，通过 Cohub 获得生成能力和托管链接。

这是个人维护的 skill，不是 Cohub 官方发行版。

## 安装

把下面这段话交给支持 skill 的 Agent：

> 从 https://github.com/atou42/cohub-skill 安装中文版 cohub skill，目录是 zh-CN/skills/cohub，然后引导我完成首次初始化。如果已经安装了 cohub skill，先比较版本，保留我的定制内容，不要直接覆盖。

手动安装时，将整个 `zh-CN/skills/cohub` 目录放进 Agent 支持的技能目录，保留 `SKILL.md` 旁的 `references/` 目录。中英文版名称都为 `cohub`，只安装其中一版；切换语言时保留本地定制和已完成的初始化状态，不要直接覆盖。

skill 带有一次性初始化引导。Agent 会检查 CLI，缺失时经你同意安装，引导登录并验证身份。skill 本身不包含 CLI。也可以手动安装和登录：

```bash
npm install -g @neta-art/cohub-cli
cohub auth login
```

初始化成功后，Agent 只会从获准修改、可写的本地安装副本中移除 init 引导及其标记入口。失败时保留引导，方便重试。源码仓库、共享挂载、插件缓存和只读安装保留引导；公开仓库始终包含完整引导。日常 CLI 和身份检查不会被删除。

## 使用

- 「看看 Cohub 有哪些创作能力，帮我选择合适的流程。」
- 「用 Cohub 生成一张背景图，保存到这个项目的素材目录。」
- 「用 Cohub 公开发布这个本地网站。」
- 「生成素材，接入这个页面，再用 Cohub 公开发布页面。」

[主入口](zh-CN/skills/cohub/SKILL.md) 直接包含创作能力表，并按任务读取独立的[生成](zh-CN/skills/cohub/references/生成.md)和[发布](zh-CN/skills/cohub/references/发布.md)说明。生成本身不包含公开发布授权。

## 直达创作能力

Style、AVG、Fandom、OKP 搜索和 Character Traits 直接列在 `SKILL.md` 中，包含用途、来源 Space ID 和入口路径。Agent 登录后直接读取选中的来源，不经过目录 Space 或目录版本协商，也不在本地打包上游技能。

来源 Space 和外部服务保留各自的权限与依赖。Style 和 Character Traits 当前需要单独取得来源权限；AVG 需要配套运行时和素材，不是只读一段说明就能运行。本版没有付费门，也不保证所有登录用户都有来源权限。新增能力或更换入口需更新 skill；来源内部内容更新不需要重装。原目录 Space 保留，但本 skill 不再调用它。

## 修改

中文版完整内容位于 `zh-CN/skills/cohub/`：`SKILL.md` 是入口和能力清单，`references/init.md` 是一次性初始化引导，`references/生成.md` 和 `references/发布.md` 分别描述两条工作流。

可以按自己的习惯修改安装副本。保留命令、参数名和 init 标记；修改 init 标记内的内容后，Agent 会保留该部分而不是自动清理。仓库中的两种语言版本是独立文件，修改共享行为时需要同步更新，避免说明不一致。

## 范围与兼容性

支持模型实际提供的媒体生成与编辑、本地 HTML 或构建后的静态站点发布，以及所列创作来源的直接访问。不包括内部 Space 治理、Agent 委派、Actions 或 Commerce。本入口不部署具体能力所需的后端，发布静态产物也不会部署其后端。

命令参数已对照 CLI 6.9.1。本地发布要求至少 6.7.0；Home Space 默认值从 6.8.0 起支持。实际使用仍以本机 CLI 帮助和当前模型 schema 为准。打包此 skill 时未执行真实付费生成或端到端 App 发布。

# Cohub Skill

[English](README.md) | [简体中文](README.zh-CN.md)

让本地 Agent 配合 Cohub 做游戏、网页和小应用，生成素材、塑造角色并发布作品。按需使用 Space 组织项目、连接受支持的本地会话，或为 App 接入访客生成与 Actions。保留你的设计、技术栈和本地工作方式。

个人维护，非 Cohub 官方发行。

## 只装一个

只需安装 **cohub**。App Developer 已成为内部按需模块，不需要理解或安装第二个 Skill。

只选一种说明语言：[简体中文](zh-CN/skills/cohub/SKILL.md)或[English](skills/cohub/SKILL.md)。两者功能相同，**不要同时安装**。说明语言不改变 Agent 的对话语言。

## 安装

最新正式版：[Cohub 2.2.0](https://github.com/atou42/cohub-skill/releases/tag/cohub-v2.2.0)。[versions.json](versions.json) 指向已核实的发布标签与提交；正式安装使用该标签，不使用可能更新的 main 工作树。

可以对 Agent 说：

> 从 https://github.com/atou42/cohub-skill 安装最新正式发布的 cohub 简体中文版。先检查你实际会加载的 Skill 目录中是否已有 cohub 或 cohub-app-developer，保留定制内容；不要同时安装中英文版。安装后告诉我版本、说明语言和位置，不改变我们的对话语言。需要时引导安装 CLI 和登录。

安装正式版时，指定已核实正式标签下的 zh-CN/skills/cohub 目录；仅在明确试用开发版时使用 main。完整保留 references、scripts 和 version.json。已有安装、语言切换及旧 App Developer 迁移见[安装与迁移](zh-CN/skills/cohub/references/安装与迁移.md)。不会未经授权删除旧安装。

## 开始使用

- “介绍有哪些创作能力。”只咨询不会触发登录、生成或发布。
- “用当前项目做一个浏览器小游戏，先不要发布。”
- “为这个项目生成背景图，放进素材目录，不公开。”
- “把这个已完成的游戏发布到 Cohub，不重新制作。”
- “给这个 App 接入访客生图，保留现有设计。”
- “解释当前目录的 Space 归属，以及本地对话为什么没有出现在网页里。”

首次初始化成功后，没有明确任务时先介绍生成与编辑、创作知识与流程、应用内 AI 与交互、发布与运行、项目组织与接续，再用相关作品说明这些能力如何组合。游戏、网站等只是例子，不是能力上限。有任务就继续，不要求用户再问能力列表，不会自动生成、发布、创建 Space 或开启同步。成功后可按已有授权清理本地 Init 引导；共享挂载和源码仓库保留。

[Space 与项目](zh-CN/skills/cohub/references/Space与项目.md)同时支持随手使用与按项目组织；[本地接入](zh-CN/skills/cohub/references/本地接入.md)是可选模块，普通 CLI 调用不等于会话同步。CLI 8.4.0 本地接入支持 Pi/Codex，不承诺 Claude Code 会话同步。

纯 Cohub 的 [Explore 公开页面](https://cohub.live/atou/home/w/cohub-explore)与 Skill 的[作品参考](zh-CN/skills/cohub/references/作品参考.md)共用 [案例目录](explore/catalog.json)，不混用 Neta Studio。双语包使用同一个[固定公开 JSON](https://public.cohub.live/p/863b6242-2ba4-47a9-9bfd-e401020a639f/cohub-explore/catalog.json)，日常更新案例无需重新安装 Skill。部署与日常维护见 [Explore 维护](docs/Explore维护.md)。

## 环境与边界

需要可读写文件、执行命令的本地 Agent；CLI 安装需要 Node.js/npm，远端能力需要网络及相应登录权限。只咨询不要求 CLI 就绪。生成和发布示例原核对 CLI 6.9.1，Space 与本地接入核对 8.4.0，实际以本机帮助为准。

Style、Game Maker、Fandom、OKP 和 Character Traits 按任务直达来源。来源权限、外部认证和执行依赖各自独立；读到说明不等于可运行。参见[准备与验收](zh-CN/skills/cohub/references/能力准备.md)。

每次调用检查正式版本，只提示、不自动更新；升级保持说明语言和定制。生成不授权发布，来源 Space 不作写入目标。不负责内部治理或跨 Agent 委派。

## 验证与维护

自动检查覆盖包结构、双语一致性、独立安装引用及升级判断的失败路径；Agent 场景验收见[行为验收](docs/行为验收.md)。没有宣称远程能力、付费生成或访客路径全部通过实测。

[更新记录](CHANGELOG.zh-CN.md) · [维护与发布](docs/维护与发布.md)

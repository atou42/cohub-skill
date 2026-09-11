# Cohub Skill

[English](README.md) | [简体中文](README.zh-CN.md)

让本地 Agent 使用 Cohub 生成素材、制作角色与游戏、发布已有作品，并按需为 App 接入访客生成、Actions 和管理能力。保留你的设计、技术栈和本地工作方式。

个人维护，非 Cohub 官方发行。

## 只装一个

只需安装 **cohub**。App Developer 已成为内部按需模块，不需要理解或安装第二个 Skill。

只选一种说明语言：[简体中文](zh-CN/skills/cohub/SKILL.md)或[English](skills/cohub/SKILL.md)。两者功能相同，**不要同时安装**。说明语言不改变 Agent 的对话语言。

## 安装

当前工作树为 **2.0.0 开发候选版，尚未发布**。正式版由 [versions.json](versions.json) 指向；目前最新正式 cohub 仍为 1.1.0，尚不包含本次合并。不要把 main 候选版当成正式升级。

可以对 Agent 说：

> 从 https://github.com/atou42/cohub-skill 安装最新正式发布的 cohub 简体中文版。先检查你实际会加载的 Skill 目录中是否已有 cohub 或 cohub-app-developer，保留定制内容；不要同时安装中英文版。安装后告诉我版本、说明语言和位置，不改变我们的对话语言。需要时引导安装 CLI 和登录。

明确要试用本次开发候选版时，指定 main 的 zh-CN/skills/cohub 目录。完整保留 references、scripts 和 version.json。已有安装、语言切换及旧 App Developer 迁移见[安装与迁移](zh-CN/skills/cohub/references/安装与迁移.md)。不会未经授权删除旧安装。

## 开始使用

- “介绍有哪些创作能力。”只咨询不会触发登录、生成或发布。
- “为这个项目生成背景图，放进素材目录，不公开。”
- “把这个已完成的游戏发布到 Cohub，不重新制作。”
- “给这个 App 接入访客生图，保留现有设计。”

首次使用按需检查 CLI、引导登录并报告身份。结合当前项目推荐一两个可选动作，不自动执行付费生成或发布。成功后可按已有授权清理本地 Init 引导；共享挂载和源码仓库保留。安装介绍网站仍未实现。

## 环境与边界

需要可读写文件、执行命令的本地 Agent；CLI 安装需要 Node.js/npm，远端能力需要网络及相应登录权限。只咨询不要求 CLI 就绪。CLI 参数原核对版本为 6.9.1，实际以本机帮助为准。

Style、Game Maker、Fandom、OKP 和 Character Traits 按任务直达来源。来源权限、外部认证和执行依赖各自独立；读到说明不等于可运行。参见[准备与验收](zh-CN/skills/cohub/references/能力准备.md)。

每次调用检查正式版本，只提示、不自动更新；升级保持说明语言和定制。生成不授权发布，来源 Space 不作写入目标。不负责内部治理或跨 Agent 委派。

## 验证与维护

自动检查覆盖包结构、双语一致性、独立安装引用及升级判断的失败路径；Agent 场景验收见[行为验收](docs/行为验收.md)。没有宣称远程能力、付费生成或访客路径全部通过实测。

[更新记录](CHANGELOG.zh-CN.md) · [维护与发布](docs/维护与发布.md)

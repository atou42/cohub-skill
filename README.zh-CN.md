# Cohub

[English](README.md) | [简体中文](README.zh-CN.md)

让本地 Agent 配合 Cohub 做游戏、网页和小应用，生成素材、塑造角色并发布作品。按需使用 Space 组织项目、连接受支持的本地会话，或为 App 接入访客生成与 Actions。保留你的设计、技术栈和本地工作方式。

个人维护，非 Cohub 官方发行。当前正式版：[Skill 2.3.0 / 插件 0.6.0](https://github.com/atou42/cohub-skill/releases/tag/cohub-v2.3.0)。

## 按使用环境选择

两种方式使用相同的 Cohub 能力和授权规则。独立 Skill 完整可用；插件增加共同编辑与展示。

| 你在哪里用 | 选择 | 能获得什么 |
| --- | --- | --- |
| 支持 Skill 和本地命令的 Agent | **独立 Skill** | 通过对话和官方 CLI 使用 Cohub，无需插件依赖。 |
| Codex 桌面端或 Codex CLI，希望增加交互工具 | **Cohub 插件** | 同一份 Skill，加上共享草稿与结果工具；可视卡片需要宿主支持。 |
| 多个环境都用 | **分别接入各环境** | 保留需要的独立安装；插件能复用兼容的已有 Skill 时，不再注册重复入口。 |

新用户装插件会自动包含 Skill；已有兼容用户级 Skill 的用户保留原入口。不再让用户在“Cohub”和“Cohub 创作”之间猜区别。App Developer 仍是内部按需模块，无需单独安装。

只选一种说明语言：[简体中文](zh-CN/skills/cohub/SKILL.md)或[English](skills/cohub/SKILL.md)。两者功能相同，**不要同时安装**。说明语言不改变 Agent 的对话语言。

## 安装当前正式 Skill

[公开版本清单](https://raw.githubusercontent.com/atou42/cohub-skill/main/versions.json)指向已核实的发布标签与提交；从该标签安装最新正式版。已有 Skill 安装地址、语言目录、发布标签和更新检查继续有效。

可以对 Agent 说：

> 从 https://github.com/atou42/cohub-skill 安装最新正式发布的 cohub 简体中文版。先检查你实际会加载的 Skill 目录中是否已有 cohub 或 cohub-app-developer，保留定制内容；不要同时安装中英文版。安装后告诉我版本、说明语言和位置，不改变我们的对话语言。需要时引导安装 CLI 和登录。

安装正式版时，指定已核实正式标签下的 zh-CN/skills/cohub 目录；仅在明确试用开发版时使用 main。完整保留 references、scripts 和 version.json。已有安装、语言切换及旧 App Developer 迁移见[安装与迁移](zh-CN/skills/cohub/references/安装与迁移.md)。不会未经授权删除旧安装。

## 安装 Cohub 插件

可以让 Agent 从本仓库已核实的正式标签和提交安装 Cohub 插件，先检查已有安装并保留定制，再在该目录执行下面的命令。安装器需要 Node.js 24+、npm、Git、Codex CLI 和 Cohub CLI。独立 Skill 不继承插件的 Node.js 版本要求或依赖。

先检查安装计划：

```bash
bash scripts/install.sh --language zh-CN --check
```

再安装：

```bash
bash scripts/install.sh --language zh-CN
```

安装器自动复用同版本、同语言且内容一致的用户级独立 Skill；新环境则使用插件内置 Skill。遇到旧版、定制、缺少版本信息或损坏文件，会明确停止，不覆盖独立文件，也不全局禁用。已有旧版 Skill 时，先保留定制并升级，再安装配套插件。只在某个项目内安装的 Skill 不能替代所有项目的插件入口。

指定已知兼容安装时使用 `--skill-mode external --skill-path /绝对路径/cohub`；只有目标宿主没有其他入口时才使用 `--skill-mode bundled`。保留安装器选用的包目录，Codex 可能仍在使用它。重复入口检查与升级见安装指引。应从**已核实的发布标签和提交**运行这些命令，不把未审阅分支当正式安装。

已使用旧插件仓库的用户，按[原仓库升级说明](https://github.com/atou42/cohub-plugin#readme)执行 `git pull --ff-only`，再执行 `bash scripts/install.sh`。兼容入口固定到主仓库已核实的正式版，已有作品和草稿保留。

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

本仓库是两个安装包的统一来源。通用双语 Skill 保留在 `skills/cohub` 与 `zh-CN/skills/cohub`；`plugin/` 包含插件源码及导入的历史。插件打包同一份 Skill，不另写创作 Skill。独立安装无需插件源码和依赖。个人共享技能仓库仅作分发镜像，不再作为另一处内容维护来源。

自动检查覆盖包结构、双语一致性、独立安装引用及升级判断的失败路径；Agent 场景验收见[行为验收](docs/行为验收.md)。没有宣称远程能力、付费生成或访客路径全部通过实测。

[更新记录](CHANGELOG.zh-CN.md) · [维护与发布](docs/维护与发布.md)

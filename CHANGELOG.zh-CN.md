# 更新记录

## 未发布：cohub 1.2.1 / cohub-app-developer 1.1.1

- 两套 Skill 的中英文版加入按需 At Cohub Space 查证流程。
- 优先使用 Skill、CLI 帮助与本地依据；远端只查未解决的问题，得到答案或确认阻塞后停止。
- 保留创作来源正常加载及参考 Space 的只读边界。

## 未发布：cohub 1.2.0 / cohub-app-developer 1.1.0

- 中英文目录以 game-skills Space 替代原独立 AVG 来源。
- AVG、城建和格斗直达对应子模块，其他或未明确类型的游戏使用 game-maker。
- 保留仅发布已有游戏的流程；不删除远端 Space 或源数据。

[English](CHANGELOG.md) | [简体中文](CHANGELOG.zh-CN.md)

两套 Skill 独立编号，中英文版共用同一版本号。
每套 Skill 的发布标签标识其准确的发布修订。

## cohub-app-developer 1.0.0

发布日期：2026-09-11。

- 首个中英文 App Developer 版本。
- 分离发布、能力接入、运行管理与资料核对模块。
- 直达 Style、独立 AVG、Fandom、OKP 搜索与 Character Traits Space。
- 保留已有产品计划和本地开发 Skill，可选能力不扩大任务范围。
- 每次调用只读检查上游版本，只提示、不自动升级。

## cohub 1.1.0

发布日期：2026-09-11。

- 增加安装版本记录和只读升级提示。
- AVG 改为独立 Space，说明 Character Traits 的读取权限。
- 保留已有生成、发布和可移除初始化流程。

更早的仓库修订没有版本号；此记录不表示 cohub 曾发布过 1.0.0。

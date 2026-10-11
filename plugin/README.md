# Cohub 插件

主仓库是 [cohub-skill](https://github.com/atou42/cohub-skill)。先看[统一安装说明](../README.zh-CN.md)，选择独立 Skill 或包含同一份 Skill 的插件。本目录只维护工具与卡片，不另写一份 Skill。

插件包含项目与对话连接、素材创作、游戏和应用制作、发布等通用能力。卡片增强图片、视频、语音和音乐创作。Codex CLI 也可加载插件工具，卡片需要支持显示它的客户端。

## 使用

直接说“用 Cohub 准备一张海岸图片，先不要生成”。在卡片中查看方案、实际提示词、素材及预计费用，修改后点击“确认并生成”。展开设置和返回聊天共用同一份草稿，不必再发确认消息。你也可以继续聊天调整方案，或在明确范围和预算内授权 Agent 自行执行。

多份已准备好的独立草稿可以选择本次自动继续。费用未知、超过预计预算、方案变化或执行失败时停止并保留记录。参考预算不是服务端扣费硬上限。取消会保留并暂停草稿。

## 安装

需要 Node.js 24+、npm、Git、支持插件的 Codex，以及已安装的官方 Cohub CLI。登录只在使用相关能力时进行；安装不会生成作品或上传素材。完整选择和稳定版本说明见[主安装页](../README.zh-CN.md)。

在主仓库所选版本的根目录执行：

```sh
bash scripts/install.sh --language zh-CN --check
bash scripts/install.sh --language zh-CN
```

安装先检查已有 Skill：没有则启用插件内的 Cohub；已有同版同语言且内容一致的用户级独立 Skill 则共用原入口，只新增工具。旧版、定制、损坏或多个入口会明确停止，保留原文件和设置。合法的首次初始化清理不算定制。

检查通过后才下载锁定依赖、构建卡片并注册插件。不要直接把仓库 URL 添加成插件市场。保留安装目录；每次安装使用新的完整包，避免残留旧入口。成功后重启 Codex。

## 已有用户更新

旧 `cohub-plugin` 克隆目录在兼容迁移发布后，继续使用原来的 `git pull --ff-only` 和 `bash scripts/install.sh`；脚本验证主仓库固定正式版本后转交安装。插件身份仍是 `cohub-cards@cohub-cards-local`，不产生第二个插件。

主仓库用户取得并核实[正式版本](../versions.json)后，保留原说明语言重新执行安装命令。不要单独修改插件缓存中的 Skill；插件与随包 Skill 一起更新。共用外部独立 Skill 的用户，先按说明保留定制并更新至匹配版本。

卸载插件使用 `codex plugin remove cohub-cards@cohub-cards-local`。外部独立 Skill 不受影响；使用插件内 Skill 的用户，卸载后需独立安装才能继续调用 Cohub。

## 数据与限制

- 草稿默认保存在 `~/.local/state/cohub-cards`，与安装目录分开。升级、卸载不清理草稿，插件不另存登录凭据。
- 本地参考素材每个不超过 20 MiB，生成提交时会上传到所选空间的公共素材地址。私有素材要求需在提交前说明并另选支持的流程。
- 结果不明的提交不会自动重试，避免重复生成和收费。
- 可用参数和价格读取官方模型说明。Higgs 多音色混合的权重尚未被官方 CLI 支持，会明确阻止。
- 发布通过官方 CLI 执行，插件展示结果；复杂画板继续使用 Cohub 已有 Board。
- 既往卡片在 macOS Codex 桌面验证，其他系统未实测。本次合并的检查范围见[合并验收](../docs/统一安装验收.md)。

## 开发

在本目录执行：

```sh
npm ci --ignore-scripts
npm test
npm run build
```

界面规范见 [DESIGN.md](DESIGN.md)，职责与安装机制见 [ARCHITECTURE.md](ARCHITECTURE.md)。真实账号验收和本地预览不进入发布包。

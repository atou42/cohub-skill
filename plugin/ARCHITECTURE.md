# Cohub 插件架构

插件保存生成前的共享草稿，官方 Cohub CLI 执行生成、上传和发布。Cohub 仍负责生成任务、产物和应用版本。插件不实现 Board、账号系统或另一套任务队列。

## 一个来源，两种安装

主仓库 `cohub-skill` 的 `skills/cohub` 和 `zh-CN/skills/cohub` 是完整通用技能，插件没有第二份作者副本。共同规则与按需插件交互说明均属于可独立安装的技能。

`scripts/package.mjs` 只向新的目标目录打包，逐字复制所选语言包。bundled 模式注册 `skills/cohub`；external 模式使注册目录 `skills/` 为空，把同份技能放入 `bundled-skills/cohub`，共用已有独立入口。包记录语言、版本、模式和技能内容摘要。已有输出不覆盖，构建或依赖失败不注册残缺包。旧 `release/skills/cohub-cards` 不参与新打包。

安装检查列出已检查的用户级及当前目录祖先级搜索位置，解析符号链接并按真实目录去重。external 只接受同版同语言同内容（允许规定的 Init 清理）。旧版本、定制、缺文件、多个真实入口均报错；不自动移动技能或改写全局禁用设置。不能据有限搜索范围声称所有其他项目、其他客户端都无重复。

内部身份、工具名、资源标识与草稿路径保留，界面统一显示 Cohub。旧仓库保留固定正式版本的迁移入口，先发布主仓库再更新旧仓库指针。Codex CLI 也可加载插件工具，无卡片时按同一份草稿文字确认。

## 一份草稿，两种入口

默认显示精简聊天卡。`web/composer.js` 根据宿主 `displayMode` 切换布局，不根据窗口宽度猜测位置。展开调用标准 `requestDisplayMode({mode:"fullscreen"})`，当前 Codex 将它放到右侧面板；返回请求 `inline`。两个布局保留同一个表单、输入和草稿。宿主拒绝或报错时保持实际模式并显示错误，不另开浏览器冒充展开。

`prepare_generation` 创建草稿并附上编辑器。`read_generation_draft`、`update_generation_draft`、`add_generation_reference` 由界面和 Agent 共用。用户确认走 app-only `confirm_generation`，取消走 app-only `cancel_generation`，不通过 `sendMessage` 触发新一轮模型回复。`submit_generation` 保留给获得明确文字授权的 Agent；app-only 可见性由宿主管理，不是独立鉴权边界。

`brief` 保存方案和产出说明，其余字段直接组成完整确认页。确认请求带当前草稿与完整模型声明的 SHA-256 `reviewToken`，服务端读取新模型声明后再次核对，避免悄悄提交未展示的报价或默认值。`reviewPaused` 不能通过普通编辑清除。

`continuationDraftIds` 只关联最多 19 份已准备的同空间独立草稿。用户选择后，由一次 app-only 调用按稳定顺序锁定所有草稿，校验每份版本、token 与预计费用预算，再逐个提交。`batchReview` 保存一次确认的范围与停止结果，不是后台队列。原子替换仅针对单份文件，多文件写入失败会保留已有状态并报错，不自动重建或恢复。提交结果不明不重试；未尝试的子草稿恢复为暂停草稿。范围价格、未知数量或计费单位不能假装为零，按明确原因禁止自动批次。

`src/drafts.mjs` 每份草稿保存一个 JSON 文件，使用版本检查、独占文件锁和原子替换。更新必须带当前 `baseRevision`；冲突返回明确错误，不能覆盖新内容。坏文件和现存锁不自动清理。状态目录独立于插件版本缓存，默认 `~/.local/state/cohub-cards`，支持 `COHUB_CARDS_STATE_DIR` 和 `XDG_STATE_HOME`。

`web/composer.js` 保留未保存输入，可见时读取同一草稿的新版本，关闭或隐藏时停止轮询。`updateModelContext` 仅把草稿引用和摘要带入后续对话，不承担持久化。宿主是否支持工具调用、上下文更新和打开链接，以实际连接时的能力声明为准。

## 模型、素材与提交

`src/models.mjs` 通过官方 CLI 读取模型声明，驱动图片、视频、语音和音乐的输入与校验。列表只执行一次 `models ls`，只有当前选择的模型才读取详细声明，避免无关模型故障阻塞草稿。官方列表未提供分类时直接列出名称；未知或损坏的声明明确报错。CLI 尚不支持 Higgs 多音色混合的素材权重，因此该组合被明确阻止。

`src/references.mjs` 将主动选择的媒体保存到状态目录，验证类型和大小，单个上限 20 MiB。草稿只保存文件编号或 HTTPS 地址。提交时通过官方 CLI 上传本地素材，浏览器不接触 CLI 凭据。

`src/generation.mjs` 在提交前重新校验模型和草稿，并先保存 `submitting` 状态。收到任务编号后保存为 `submitted`；只有该状态可以带 `taskRunId`。提交结果不明则保存为 `unknown`，禁止重复生成。已提交的草稿不可改写；明确继续创作时另建草稿并引用真实产物。仅素材上传失败、尚未执行生成时可以回到可编辑状态。

## 结果与发布

`src/cards.mjs` 校验 Cohub 返回的对象、空间和状态，展示实际生成媒体或 App 封面。`show_generation`、`show_publication` 打开结果卡；`read_card` 只更新已有结果。发布操作仍由 Skill 调用官方 CLI，发布成功和线上功能验收分别记录。

`src/server.mjs` 提供上述工具及一份内嵌资源的页面，`web/app.js` 连接标准 MCP Apps 桥接。

## 界面

视觉遵循 [DESIGN.md](DESIGN.md)，色值取自 Cohub 线上主题。`web/tokens.css` 定义明暗两套变量和共享组件，`web/card.css`、`web/composer.css` 只写各自布局，`web/icons.js` 提供线条图标。构建时把 Geist 与 Geist Mono 的拉丁子集（OFL）内嵌进页面，不在运行时请求字体。

`web/card.js` 导出作品舞台（图片、视频、自定义音频播放条）和生成中的画框，结果卡与创作卡共用。生成中的计时取 Cohub 任务的 `startedAt`，缺失时从卡片首次看到任务开始计。校验结果里 `kind: "missing"` 表示“还差什么”，以提示显示；其余是无效值，以错误显示。保存因版本过旧被拒时，卡片立即读取新版本并让人选择保留哪份，不等下一次轮询。界面错误不会触发重新生成。原生宿主的 inline 展示和交互需要单独验收，浏览器预览及协议测试不能代替它。

## 运行与维护

依赖安装的 Node 24+ 和 Cohub CLI，所有 CLI 参数按数组传入，错误向外返回。`.mcp.json` 使用 `cwd: "."` 和相对脚本路径：本机旧式插件加载器会定位工作目录，但不会展开参数中的 `${PLUGIN_ROOT}`。

运行 `npm test`、`npm run build`。打包只复制运行文件、Skill 和依赖；草稿、参考文件、真实验收记录和凭据不进入插件包。

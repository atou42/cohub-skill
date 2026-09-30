# Explore 维护

## 数据与页面

- 唯一案例作者源：[explore/catalog.json](../explore/catalog.json)。只收录公开 Cohub 作品，保留实际链接、作者、能力、访问/费用/复用条件、验证范围与日期。
- 页面：[explore/index.html](../explore/index.html)，由 `node scripts/build-explore.mjs` 从目录、样式和交互代码生成，不手改作品卡片。
- 预览图：`explore/assets/*.jpg`，来自作品真实公开界面，不补造登录后或付费后的效果。Darkroom 和 Desktop 分别展示真实空白工作区、连接提示，不冒充完成生成或连接后的画面。
- Lucide 图标保留其 `explore/assets/LUCIDE-LICENSE`；作品截图用于注明来源的案例参考，不代表已取得源码、素材或改作授权。

修改案例后构建页面并跑 `node --test tests/*.test.mjs`、`node scripts/build-explore.mjs --check`、`git diff --check`。只有界面、截图或可视内容变化时重做相关浏览器检查，不重复付费生成来证明目录更新。

## Skill 读取

读取器作者源为 `scripts/read-explore.mjs` 和 `scripts/explore-catalog.mjs`，来源配置作者源为 [explore/source.json](../explore/source.json)。运行 `node scripts/sync-explore.mjs` 同步双语发行副本，`--check` 检查漂移。Skill 不包含另一份案例目录。

未公开部署时，来源 `catalogUrl` 与目录 `collectionUrl` 明确为 null，默认读取器返回 `unpublished`，不是已上线或网络成功。

维护者可在仓库内实读本地目录：

```bash
node skills/cohub/scripts/read-explore.mjs --catalog explore/catalog.json
node skills/cohub/scripts/read-explore.mjs --catalog explore/catalog.json --capability generation
```

远端只读最多一次、8 秒超时、256 KiB 上限，不发送凭据或用户请求。坏 JSON、缺字段、重复条目、其他平台链接、HTTP 错误不会被包装成空目录成功。没有匹配案例和读取失败是不同状态。

## 公开部署

公开发布前确认目标 Space、固定公共目录和发布授权。App 使用稳定分享链接；同时使用稳定的公开目录地址承载 JSON、预览资产与页面快照，不把某个带版本哈希的 App 内容 URL 当成长期目录入口。

首次发布时，将目录的 `collectionUrl` 设为目标 App 分享地址；发布后必须以 `apps get` 返回的实际 `publicUrl` 核对，不以拼出的地址作完成证据。构建后只暂存 `index.html`、`catalog.json` 和 `assets/`，不上传来源配置、维护文档或整个仓库。将同一构建发布为 App 并上传到固定公共目录。匿名验证页面、图片、筛选和 JSON，确认返回内容与本地目录一致后，才把实际 JSON 地址写入 `explore/source.json` 并同步发行副本。Skill 的提交、push、release 与安装仍遵守原有发布授权，不因页面已发布而自动执行。

以后增删案例只改目录和必要截图，构建后用同一个暂存产物更新已有 App 和固定公共目录。公共文件更新需明确使用覆盖选项，先核对归属；有 CDN 延迟时检查实际返回内容，不把上传成功当成内容已刷新。固定入口不变时无需重新安装 Skill。新增执行能力仍需核对 Skill 和平台文档，不能把案例中的文案当成新工具契约。

## 当前发布

2026-09-29 经用户授权发布到 ATou 的 Home Space，`863b6242-2ba4-47a9-9bfd-e401020a639f`。

- App：[Cohub Explore](https://cohub.live/atou/home/w/cohub-explore)，ID `ac986581-fc63-4e82-a27b-298ec6250e94`，v2，公开、无 App scopes。
- 固定目录：[catalog.json](https://public.cohub.live/p/863b6242-2ba4-47a9-9bfd-e401020a639f/cohub-explore/catalog.json)，21 个作品，内容与作者源一致；用户指定的 Hogwarts Tower Lofi 排在第一位，使用 Cohub 入口。
- 同目录包含页面快照与真实预览图，方便匿名读取相对资源；不依赖 App 的版本哈希地址。
- 双语开发包来源已同步配置。此次没有提交或推送 Git、创建 Skill Release 或替换本机旧安装。

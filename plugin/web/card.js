import { icon } from "./icons.js";

const LIVE_STATUSES = new Set(["pending", "running"]);
const INLINE_MEDIA_TYPES = {
  image: new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]),
  video: new Set(["video/mp4", "video/webm", "video/ogg"]),
  audio: new Set(["audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "audio/flac"]),
};
const STATUSES = {
  generation: new Set(["pending", "running", "completed", "failed"]),
  publication: new Set(["published", "disabled"]),
};
const LABELS = {
  pending: "排队中",
  running: "正在生成",
  completed: "已完成",
  failed: "生成失败",
  published: "已发布",
  disabled: "已停用",
};
const TONES = { pending: "live", running: "live", completed: "done", failed: "error", published: "done", disabled: "quiet" };
const MEDIA_NOUNS = { image: "图片", video: "视频", audio: "音频" };

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Cohub 返回的 ${field} 缺失或格式不正确。`);
  }
  return value;
}

function optionalString(value, field) {
  return value === undefined ? undefined : requiredString(value, field);
}

function optionalTime(value, field) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error(`Cohub 返回的${field}时间无效。`);
  return value;
}

function httpUrl(value, field) {
  requiredString(value, field);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Cohub 返回的 ${field} 不是有效地址。`);
  }
  if (!new Set(["https:", "http:"]).has(url.protocol)) {
    throw new Error(`Cohub 返回的 ${field} 使用了不支持的地址格式。`);
  }
  return value;
}

function mediaUrl(item) {
  requiredString(item.url, "素材地址");
  if (!item.url.startsWith("data:")) return httpUrl(item.url, "素材地址");
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(item.url);
  if (!match || match[0] !== item.url || !INLINE_MEDIA_TYPES[item.type].has(match[1])) {
    throw new Error("Cohub 返回的内嵌素材格式不受支持。");
  }
  const [, mimeType, data] = match;
  if (item.mimeType !== undefined && item.mimeType !== mimeType) {
    throw new Error("Cohub 返回的素材格式与内容不一致。");
  }
  if (data.length % 4 !== 0 || btoa(atob(data)) !== data) {
    throw new Error("Cohub 返回的内嵌素材内容无效。");
  }
  return item.url;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function resultError(result) {
  const messages = Array.isArray(result?.content)
    ? result.content.filter((item) => item.type === "text" && typeof item.text === "string").map((item) => item.text)
    : [];
  return messages.join("\n") || "Cohub 未能返回结果。";
}

/** Validate the server result before replacing any previously displayed work. */
export function readCardResult(result) {
  if (!object(result)) throw new Error("Cohub 返回了无法读取的结果。");
  if (result.isError) throw new Error(resultError(result));
  const card = result.structuredContent;
  if (!object(card)) throw new Error("Cohub 结果缺少作品信息。");
  if (!Object.hasOwn(STATUSES, card.kind)) throw new Error("Cohub 返回了不支持的作品类型。");
  if (!STATUSES[card.kind].has(card.status)) throw new Error("Cohub 返回了无法识别的作品状态。");
  requiredString(card.spaceId, "空间编号");
  requiredString(card.id, "作品编号");
  optionalString(card.title, "作品名称");
  optionalString(card.prompt, "创作描述");
  optionalString(card.model, "生成模型");
  optionalString(card.error, "错误信息");
  requiredString(card.checkedAt, "查询时间");
  if (!Number.isFinite(Date.parse(card.checkedAt))) throw new Error("Cohub 返回的查询时间无效。");
  optionalTime(card.createdAt, "创建");
  optionalTime(card.startedAt, "开始");
  optionalTime(card.finishedAt, "完成");
  if (!Array.isArray(card.media)) throw new Error("Cohub 结果缺少素材列表。");
  card.media.forEach((item) => {
    if (!object(item) || !["image", "video", "audio"].includes(item.type)) {
      throw new Error("Cohub 返回了无法识别的素材。");
    }
    optionalString(item.mimeType, "素材格式");
    mediaUrl(item);
  });
  if (card.url !== undefined) httpUrl(card.url, "作品地址");
  if (card.version !== undefined && (!Number.isInteger(card.version) || card.version < 1)) {
    throw new Error("Cohub 返回的版本号无效。");
  }
  if (card.visibility !== undefined && !["public", "space"].includes(card.visibility)) {
    throw new Error("Cohub 返回的访问范围无法识别。");
  }
  if (card.billing !== undefined) {
    if (!object(card.billing) || !Number.isFinite(card.billing.amountUsd) || card.billing.amountUsd < 0) {
      throw new Error("Cohub 返回的费用信息无效。");
    }
    requiredString(card.billing.status, "费用状态");
  }
  return card;
}

/** A precise selection, not an instruction to start another paid operation. */
export function continuationPrompt(card) {
  const reference = {
    kind: card.kind,
    spaceId: card.spaceId,
    id: card.id,
    ...(card.version === undefined ? {} : { version: card.version }),
  };
  return `我想继续修改这${card.kind === "publication" ? "个 Cohub 应用" : "份 Cohub 作品"}。请先问我想改哪里，等我说明后再开始生成或发布。\n\n作品引用：${JSON.stringify(reference)}`;
}

/** 0:07, 3:04, 1:02:03 */
export function formatClock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.floor(seconds), h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** Human duration between two instants, or null when either is missing. */
export function elapsedLabel(from, to) {
  const start = Date.parse(from), end = Date.parse(to);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  return rest ? `${minutes} 分 ${rest} 秒` : `${minutes} 分钟`;
}

function makeElement(doc) {
  return (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
}

/**
 * Large media for a finished or partial result. Images and videos share a grid; audio gets players.
 * Pairing between audio and cover images is never inferred.
 */
export function createMediaView(doc, card, { openLink = null, label = "Cohub 作品", maxHeight } = {}) {
  const element = makeElement(doc);
  const root = element("div", "media-view");
  if (card.media.some((item) => item.type === "audio") && card.media.some((item) => item.type !== "audio")) root.classList.add("media-view--with-audio");
  if (maxHeight) root.style.setProperty("--media-max", maxHeight);
  const visual = card.media.filter((item) => item.type !== "audio");
  const audio = card.media.filter((item) => item.type === "audio");
  const players = [];

  function mediaError(figure, item) {
    if (figure.querySelector(".media-error")) return;
    figure.dataset.error = "true";
    const text = item.url.startsWith("data:") ? "预览加载失败：素材内容无法显示。" : "预览加载失败，原始地址仍在详情中。";
    const message = element("p", "media-error", text);
    message.setAttribute("role", "alert");
    figure.append(message);
  }

  if (visual.length) {
    const grid = element("div", `media-grid${visual.length > 1 ? " media-grid--multiple" : ""}`);
    visual.forEach((item, index) => {
      const figure = element("figure", `media-item media-item--${item.type}`);
      const media = element(item.type === "image" ? "img" : "video", "work-media");
      if (item.type === "image") {
        media.alt = `${label}${visual.length > 1 ? ` · ${index + 1}` : ""}`;
        media.decoding = "async";
        media.addEventListener("load", () => figure.classList.add("is-ready"));
      } else {
        media.controls = true;
        media.preload = "metadata";
        media.playsInline = true;
        media.setAttribute("aria-label", `${label} · 视频 ${index + 1}`);
      }
      media.addEventListener("error", () => mediaError(figure, item));
      media.src = item.url;
      figure.append(media);
      if (visual.length > 1) figure.append(element("figcaption", "media-index", String(index + 1).padStart(2, "0")));
      if (openLink && !item.url.startsWith("data:")) {
        const open = element("button", "media-open");
        open.type = "button";
        open.innerHTML = `${icon("open", 12)}<span>原${item.type === "image" ? "图" : "片"}</span>`;
        open.setAttribute("aria-label", `打开${MEDIA_NOUNS[item.type]} ${index + 1} 的原始文件`);
        open.addEventListener("click", () => openLink(item.url));
        figure.append(open);
      }
      grid.append(figure);
    });
    root.append(grid);
  }

  if (audio.length) {
    const list = element("div", "audio-list");
    audio.forEach((item, index) => {
      const name = audio.length > 1 ? `音轨 ${index + 1}` : "音频";
      const player = element("div", "audio-player");
      const media = element("audio", "work-media");
      media.preload = "metadata";
      const toggle = element("button", "audio-toggle");
      toggle.type = "button";
      const head = element("div", "audio-head");
      const title = element("span", "audio-title", name);
      const time = element("span", "audio-time", "--:--");
      head.append(title, time);
      const progress = element("input", "audio-progress");
      progress.type = "range"; progress.min = "0"; progress.max = "1000"; progress.step = "1"; progress.value = "0";
      progress.setAttribute("aria-label", `${name} 进度`);
      const setIcon = (playing) => {
        toggle.innerHTML = icon(playing ? "pause" : "play", 16);
        toggle.setAttribute("aria-label", `${playing ? "暂停" : "播放"}${name}`);
      };
      const update = () => {
        const duration = media.duration, current = media.currentTime || 0;
        time.textContent = Number.isFinite(duration) ? `${formatClock(current)} / ${formatClock(duration)}` : formatClock(current);
        const ratio = Number.isFinite(duration) && duration > 0 ? current / duration : 0;
        progress.value = String(Math.round(ratio * 1000));
        progress.style.setProperty("--progress", `${(ratio * 100).toFixed(2)}%`);
      };
      setIcon(false);
      toggle.addEventListener("click", () => {
        if (player.dataset.error === "true") return;
        if (media.paused) {
          for (const other of players) if (other !== media) other.pause();
          Promise.resolve(media.play()).catch((cause) => mediaError(player, item, cause));
        } else media.pause();
      });
      media.addEventListener("play", () => { player.classList.add("is-playing"); setIcon(true); });
      media.addEventListener("pause", () => { player.classList.remove("is-playing"); setIcon(false); });
      media.addEventListener("ended", () => { player.classList.remove("is-playing"); setIcon(false); });
      media.addEventListener("timeupdate", update);
      media.addEventListener("loadedmetadata", update);
      media.addEventListener("error", () => mediaError(player, item));
      progress.addEventListener("input", () => {
        if (Number.isFinite(media.duration) && media.duration > 0) media.currentTime = (Number(progress.value) / 1000) * media.duration;
      });
      media.src = item.url;
      players.push(media);
      player.append(toggle, head, progress, media);
      list.append(player);
    });
    root.append(list);
  }

  return {
    node: root,
    destroy() { for (const media of root.querySelectorAll("video, audio")) media.pause(); },
  };
}

/**
 * The generating state: a frame in the target shape with a light sweep and a real elapsed clock.
 * `since` is the task's start time when Cohub reports it; otherwise the time this view first saw the task.
 */
export function createProgressView(doc, { status, since, ratio = null, model = "", frameHeight = "180px" }) {
  const element = makeElement(doc);
  const stage = element("div", "cc-canvas cc-progress-stage");
  const frame = element("div", `cc-frame cc-frame--live${ratio ? "" : " cc-frame--free"}`);
  if (ratio) frame.style.setProperty("--frame-ratio", String(Math.min(3, Math.max(1 / 3, ratio))));
  frame.style.setProperty("--frame-height", frameHeight);
  const copy = element("div", "cc-live-copy");
  const title = element("span", "cc-live-title", status === "pending" ? "排队中" : "正在生成");
  copy.append(title);
  frame.append(copy, element("span", "cc-progress-line"));
  const meta = element("p", "cc-live-meta");
  stage.append(frame, meta);
  const start = Number.isFinite(Date.parse(since)) ? Date.parse(since) : Date.now();
  let timer = null, stopped = false;
  const tick = () => {
    if (stopped) return;
    const clock = formatClock(Math.max(0, (Date.now() - start) / 1000));
    meta.textContent = model ? `${clock} · ${model}` : clock;
    timer = setTimeout(tick, 1000);
  };
  tick();
  return {
    node: stage,
    setStatus(next) { title.textContent = next === "pending" ? "排队中" : "正在生成"; },
    destroy() { stopped = true; clearTimeout(timer); timer = null; },
  };
}

/**
 * The same view is used by the MCP App and the local preview.
 * transport: { callTool(name, args), sendMessage(prompt), openLink(url) }
 */
export function mountCard(root, transport) {
  if (!root?.ownerDocument) throw new Error("mountCard requires a DOM root.");
  if (!object(transport)) throw new Error("mountCard requires a transport.");
  root.classList.add("cohub-mount");
  const doc = root.ownerDocument;
  let card = null;
  let refreshError = "";
  let actionError = "";
  let actionNotice = "";
  let busyAction = null;
  let mediaSignature = "";
  let mediaView = null;
  let revision = 0;
  let timer = null;
  let inFlight = false;
  let destroyed = false;
  let firstSeenLive = null;
  let capabilities = {
    callTool: typeof transport.callTool === "function",
    sendMessage: typeof transport.sendMessage === "function",
    openLink: typeof transport.openLink === "function",
  };

  root.innerHTML = `
    <article class="cohub-card cc-shell" aria-label="Cohub 作品">
      <header class="card-rail cc-rail">
        <div class="card-origin cc-origin"><span class="cohub-mark" aria-hidden="true"></span><span class="cohub-wordmark">Cohub</span><span class="card-kind cc-crumb"></span></div>
        <div class="cc-rail-end"><span class="card-status status-pill" role="status"><span class="status-dot" aria-hidden="true"></span><span class="status-label"></span></span></div>
      </header>
      <section class="card-media" aria-label="作品预览"></section>
      <footer class="card-footer">
        <div class="card-caption"><h1 class="card-title"></h1><p class="card-prompt"></p><p class="card-meta"></p></div>
        <div class="card-actions"></div>
      </footer>
      <div class="card-notices" aria-live="polite"></div>
      <details class="card-details cc-details">
        <summary>详情 ${icon("chevron", 14)}</summary>
        <div class="details-content"></div>
      </details>
    </article>`;
  const find = (selector) => root.querySelector(selector);
  const shell = find(".cohub-card");
  const mediaRoot = find(".card-media");
  const actionsRoot = find(".card-actions");
  const detailsRoot = find(".details-content");
  const noticesRoot = find(".card-notices");
  const element = makeElement(doc);

  function stopTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function schedulePoll() {
    stopTimer();
    if (!destroyed && card && LIVE_STATUSES.has(card.status) && capabilities.callTool && !doc.hidden && !inFlight) {
      timer = setTimeout(refresh, 5000);
    }
  }

  async function refresh() {
    stopTimer();
    if (destroyed || !card || doc.hidden || inFlight || !capabilities.callTool) return;
    const requestRevision = revision;
    const args = { kind: card.kind, spaceId: card.spaceId, id: card.id };
    inFlight = true;
    try {
      const result = await transport.callTool("read_card", args);
      if (!destroyed && requestRevision === revision) render(result);
    } catch (error) {
      if (!destroyed && requestRevision === revision) showError(error);
    } finally {
      inFlight = false;
      schedulePoll();
    }
  }

  function notice(text, type = "info") {
    const node = element("p", `card-notice cc-notice cc-notice--${type}`);
    node.innerHTML = icon(type === "error" ? "alert" : "info", 14);
    node.append(element("span", "cc-notice-text", text));
    if (type === "error") node.setAttribute("role", "alert");
    noticesRoot.append(node);
  }

  function drawNotices() {
    noticesRoot.replaceChildren();
    if (refreshError) {
      notice(card ? `暂时未能更新，显示的是上次结果。${refreshError}` : refreshError, "error");
    }
    if (card?.status === "failed") notice(card.error || "这次生成未成功，Cohub 没有返回具体原因。", "error");
    if (actionError) notice(actionError, "error");
    if (actionNotice) notice(actionNotice);
    if (card && LIVE_STATUSES.has(card.status) && !capabilities.callTool) {
      notice("当前聊天不支持自动更新，可在对话中查询生成进度。", "hint");
    }
    if (card && !LIVE_STATUSES.has(card.status) && !capabilities.sendMessage) {
      notice("当前聊天不支持从卡片继续，可直接在对话中描述修改。", "hint");
    }
    if (card && !capabilities.openLink && (card.media.some(item => !item.url.startsWith("data:")) || card.url)) {
      notice("当前聊天不支持打开链接，地址保留在详情中。", "hint");
    }
    noticesRoot.hidden = noticesRoot.children.length === 0;
  }

  function stageCopy(stage, title, note) {
    const copy = element("div", "cc-empty-copy");
    copy.append(element("p", "cc-empty-title", title));
    if (note) copy.append(element("p", "cc-empty-note", note));
    stage.append(copy);
  }

  function drawMedia() {
    const live = card && LIVE_STATUSES.has(card.status);
    const nextSignature = JSON.stringify(card?.media.length
      ? [card.media, capabilities.openLink]
      : [card?.kind, card?.status, card?.title, card?.url, card?.startedAt, Boolean(refreshError)]);
    if (mediaSignature === nextSignature) return;
    mediaSignature = nextSignature;
    mediaView?.destroy();
    mediaView = null;
    mediaRoot.replaceChildren();
    if (card?.media.length) {
      mediaView = createMediaView(doc, card, {
        label: card.title || "Cohub 作品",
        openLink: capabilities.openLink ? (url) => runAction("open-media", () => transport.openLink(url)) : null,
      });
      mediaRoot.append(mediaView.node);
      return;
    }
    if (card?.kind === "publication") {
      const stage = element("div", "cc-canvas publication-stage");
      const plate = element("div", "publication-plate");
      plate.append(element("span", "publication-eyebrow", "网页应用"));
      plate.append(element("p", "publication-name", card.title || "Cohub 应用"));
      if (card.url) plate.append(element("span", "publication-host", new URL(card.url).host));
      stage.append(plate);
      mediaRoot.append(stage);
      return;
    }
    if (live) {
      if (!firstSeenLive) firstSeenLive = new Date().toISOString();
      mediaView = createProgressView(doc, { status: card.status, since: card.startedAt || card.createdAt || firstSeenLive, model: card.model || "" });
      mediaRoot.append(mediaView.node);
      return;
    }
    const stage = element("div", "cc-canvas card-empty-stage");
    if (card?.status === "completed") stageCopy(stage, "生成已完成", "Cohub 未返回可预览的素材");
    else if (card?.status === "failed") {
      const frame = element("div", "cc-frame cc-frame--free cc-frame--failed");
      frame.innerHTML = icon("alert", 18);
      stage.append(frame);
      stageCopy(stage, "这次没有生成成功", "原因见下方");
    } else if (refreshError) stageCopy(stage, "未能显示作品");
    else stageCopy(stage, "等待 Cohub 结果", "作品会显示在这里");
    mediaRoot.append(stage);
  }

  async function runAction(name, operation, successMessage) {
    if (busyAction || destroyed) return;
    busyAction = name;
    actionError = "";
    actionNotice = "";
    draw();
    try {
      const result = await operation();
      if (result?.isError) throw new Error(name === "continue" ? "聊天没有接收这次操作，请直接在对话中继续。" : "链接未能打开，地址保留在详情中。");
      if (!destroyed) actionNotice = successMessage || "";
    } catch (error) {
      if (!destroyed) actionError = errorMessage(error);
    } finally {
      busyAction = null;
      if (!destroyed) draw();
    }
  }

  function action(label, name, supported, operation, { primary = false, arrow = false, notice: successMessage = "" } = {}) {
    const button = element("button", `card-button cc-button${primary ? " card-button--primary cc-button--primary" : ""}`);
    button.type = "button";
    button.dataset.action = name;
    button.disabled = !supported || busyAction !== null;
    button.append(element("span", "", busyAction === name ? "请稍候…" : label));
    if (arrow) button.insertAdjacentHTML("beforeend", icon("open", 14));
    button.addEventListener("click", () => runAction(name, operation, successMessage));
    return button;
  }

  function drawActions() {
    actionsRoot.replaceChildren();
    if (!card || LIVE_STATUSES.has(card.status)) return;
    if (card.kind === "publication" && card.status === "published" && card.url) {
      actionsRoot.append(action("打开作品", "open-publication", capabilities.openLink, () => transport.openLink(card.url), { primary: true, arrow: true }));
    }
    actionsRoot.append(action("继续修改", "continue", capabilities.sendMessage, () => transport.sendMessage(continuationPrompt(card)), { notice: "已带回对话。告诉我想改哪里。" }));
  }

  function detailRow(list, label, value, mono = false) {
    const dd = element("dd", mono ? "is-mono" : "", value);
    list.append(element("dt", "", label), dd);
  }

  function drawDetails() {
    detailsRoot.replaceChildren();
    find(".card-details").hidden = !card;
    if (!card) return;
    const list = element("dl", "details-list");
    if (card.prompt) detailRow(list, "创作描述", card.prompt);
    if (card.model) detailRow(list, "模型", card.model, true);
    if (card.version !== undefined) detailRow(list, "版本", `v${card.version}`, true);
    if (card.visibility) detailRow(list, "访问范围", card.visibility === "public" ? "公开" : "空间内");
    if (card.billing) detailRow(list, "费用记录", `$${card.billing.amountUsd.toLocaleString("en-US", { maximumFractionDigits: 6 })} USD · ${card.billing.status}`, true);
    const took = elapsedLabel(card.startedAt, card.finishedAt);
    if (took) detailRow(list, "生成用时", took);
    detailRow(list, "空间", card.spaceId, true);
    detailRow(list, card.kind === "publication" ? "应用" : "生成任务", card.id, true);
    detailRow(list, "查询时间", new Date(card.checkedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) + "（北京时间）");
    if (card.url) detailRow(list, "作品地址", card.url, true);
    detailsRoot.append(list);
    if (card.media.length) {
      const links = element("div", "media-links");
      card.media.forEach((item, index) => {
        const group = element("div", "media-link");
        const noun = { image: "原图", video: "视频", audio: "音频" }[item.type];
        if (item.url.startsWith("data:")) {
          group.append(element("span", "detail-url", `内嵌${noun} · ${item.url.slice(5, item.url.indexOf(";"))}`));
        } else {
          const open = action(`打开${noun}${card.media.length > 1 ? ` ${index + 1}` : ""}`, `open-media-${index}`, capabilities.openLink, () => transport.openLink(item.url), { arrow: true });
          open.classList.add("cc-button--small");
          group.append(open);
          group.append(element("span", "detail-url", item.url));
        }
        links.append(group);
      });
      detailsRoot.append(links);
    }
  }

  function draw() {
    if (destroyed) return;
    shell.dataset.status = card?.status || (refreshError ? "error" : "waiting");
    shell.dataset.stale = String(Boolean(card && refreshError));
    shell.dataset.kind = card?.kind || "";
    find(".card-kind").textContent = card ? (card.kind === "generation" ? "生成" : "发布") : "";
    const status = find(".card-status");
    status.dataset.tone = refreshError ? "error" : card ? TONES[card.status] : "quiet";
    find(".status-label").textContent = card ? `${LABELS[card.status]}${refreshError ? " · 待更新" : ""}` : (refreshError ? "读取失败" : "等待结果");
    const title = find(".card-title");
    title.textContent = card?.title || (card ? (card.kind === "generation" ? "Cohub 作品" : "Cohub 应用") : "");
    // A cover-less App already shows its name large on the stage.
    title.hidden = Boolean(card?.kind === "publication" && !card.media.length);
    const prompt = find(".card-prompt");
    prompt.textContent = card?.kind === "generation" && card.prompt ? card.prompt : "";
    prompt.hidden = !prompt.textContent;
    const meta = [];
    if (card?.kind === "publication") {
      if (card.url) meta.push(new URL(card.url).host);
      if (card.version !== undefined) meta.push(`v${card.version}`);
      if (card.visibility) meta.push(card.visibility === "public" ? "公开" : "空间内可见");
    } else if (card) {
      if (card.model) meta.push(card.model);
      const took = elapsedLabel(card.startedAt, card.finishedAt);
      if (took && card.status === "completed") meta.push(`用时 ${took}`);
      if (card.media.length > 1) meta.push(`${card.media.length} 份作品`);
    }
    find(".card-meta").textContent = meta.join(" · ");
    find(".card-meta").hidden = meta.length === 0;
    find(".card-footer").hidden = !card;
    drawMedia();
    drawActions();
    drawNotices();
    drawDetails();
  }

  function render(result) {
    if (destroyed) return;
    try {
      const next = readCardResult(result);
      const changedWork = card && (next.kind !== card.kind || next.spaceId !== card.spaceId || next.id !== card.id);
      card = next;
      revision += 1;
      refreshError = "";
      if (changedWork) {
        actionError = "";
        actionNotice = "";
        firstSeenLive = null;
        find(".card-details").open = false;
      }
      draw();
      schedulePoll();
    } catch (error) {
      showError(error);
    }
  }

  function showError(error) {
    if (destroyed) return;
    refreshError = errorMessage(error);
    draw();
  }

  function visibilityChanged() {
    if (doc.hidden) stopTimer();
    else schedulePoll();
  }

  doc.addEventListener("visibilitychange", visibilityChanged);
  draw();

  return {
    render,
    refresh,
    showError,
    setCapabilities(value) {
      capabilities = {
        callTool: value.callTool === true && typeof transport.callTool === "function",
        sendMessage: value.sendMessage === true && typeof transport.sendMessage === "function",
        openLink: value.openLink === true && typeof transport.openLink === "function",
      };
      draw();
      schedulePoll();
    },
    setHostContext(context) {
      if (context.theme === "light" || context.theme === "dark") root.dataset.theme = context.theme;
    },
    destroy() {
      destroyed = true;
      stopTimer();
      mediaView?.destroy();
      doc.removeEventListener("visibilitychange", visibilityChanged);
      root.querySelectorAll("video, audio").forEach((media) => media.pause());
    },
  };
}

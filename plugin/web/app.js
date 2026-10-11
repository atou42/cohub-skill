import { App } from "@modelcontextprotocol/ext-apps";
import { mountCard } from "./card.js";
import { mountComposer } from "./composer.js";

const app = new App({ name: "Cohub", version: "0.5.0" }, { availableDisplayModes: ["inline", "fullscreen"] }, { autoResize: true });
const root = document.getElementById("cohub-card");
const transport = {
  callTool: (name, args) => app.callServerTool({ name, arguments: args }),
  sendMessage: (prompt) => app.sendMessage({ role: "user", content: [{ type: "text", text: prompt }] }),
  openLink: (url) => app.openLink({ url }),
  updateModelContext: (text) => app.updateModelContext({ content: [{ type: "text", text }] }),
  requestDisplayMode: async (mode) => {
    const result = await app.requestDisplayMode({ mode });
    applyHostContext({ displayMode: result.mode });
    return result;
  },
};
let capabilities = { callTool: false, sendMessage: false, openLink: false, updateModelContext: false };
let hostContext = {}, kind = "card", view = mountCard(root, transport);
view.setCapabilities(capabilities);

function applyHostContext(context) {
  hostContext = { ...hostContext, ...context };
  capabilities = { ...capabilities, expand: Boolean(hostContext.availableDisplayModes?.includes("fullscreen")) };
  view.setCapabilities(capabilities);
  view.setHostContext(hostContext);
}

// Register before connecting so an early host result cannot be missed.
app.ontoolresult = (result) => {
  const nextKind = result.structuredContent?.kind === "composer" ? "composer" : result.structuredContent?.kind ? "card" : kind;
  if (nextKind !== kind) {
    view.destroy(); kind = nextKind;
    view = kind === "composer" ? mountComposer(root, transport) : mountCard(root, transport);
    view.setCapabilities(capabilities); view.setHostContext(hostContext);
  }
  view.render(result);
};
app.onhostcontextchanged = applyHostContext;
app.ontoolcancelled = ({ reason }) => view.showError(new Error(reason || "操作已取消，未收到新的结果。"));
app.onteardown = async () => {
  view.destroy();
  return {};
};

try {
  await app.connect();
  const host = app.getHostCapabilities();
  capabilities = { callTool: Boolean(host?.serverTools), sendMessage: Boolean(host?.message?.text), openLink: Boolean(host?.openLinks), updateModelContext: Boolean(host?.updateModelContext?.text) };
  applyHostContext(app.getHostContext() || {});
} catch (error) {
  view.showError(new Error(`无法连接当前聊天：${error instanceof Error ? error.message : String(error)}`));
}

window.addEventListener("pagehide", () => view.destroy(), { once: true });

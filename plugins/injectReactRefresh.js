import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  // 在 JSX 组件中，注入 react-refresh 相关代码
  transform: function injectReactRefresh(content, url) {
    const filePath = join(__dirname, "src", url);
    const matched = content.match(/export default function (.*)\(/);
    const compName = matched && matched[1];
    if (compName) {
      const header = `import RefreshRuntime from "react-refresh";`;
      const footer = `RefreshRuntime.register(
        ${compName},
        "${filePath} ${compName}"
      );
      if (!window.__vite_plugin_react_timeout) {
        window.__vite_plugin_react_timeout = setTimeout(() => {
          window.__vite_plugin_react_timeout = 0;
          RefreshRuntime.performReactRefresh();
        }, 30);
      }`;
      return `
        ${header}
        ${content}
        ${footer}
      `;
    }
    return content;
  },
};

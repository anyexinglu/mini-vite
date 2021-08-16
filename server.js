import express from "express";
import fs from "fs";
import { transform } from "esbuild";
import { watch } from "chokidar";
import { createWebSocketServer } from "./ws.js";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.get("*", async (req, res) => {
  let { url } = req;
  if (url === "/") {
    const content = fs.readFileSync("./src/index.html"); // 返回 index.html 文件
    res.status(200).type("html").send(content);
  } else if (url.startsWith("/@modules/")) {
    // 针对 /@modules/xxx 开头的请求，提供 deps/xxx 文件
    const depName = url.replace("/@modules/", "");
    const content = fs.readFileSync(`./deps/${depName}.js`);
    // 返回 deps/xxx 文件
    res
      .status(200)
      .set({ "Content-Type": "application/javascript" })
      .send(content);
  } else if (url.includes(".js") || !url.includes(".")) {
    if (!url.includes(".")) {
      // js 文件，假设没有后缀 / 后缀含 .js 的都是 JS 文件
      url += ".jsx";
    }
    url = url.split("?")[0]; // 处理 /App.jsx?import&t=1629105298557 格式
    let content = fs.readFileSync("./src" + url, "utf-8");
    content = injectReactRefresh(content, url);
    content = rewriteImport(content);
    content = await transformJSX(content);
    res
      .status(200)
      .set({ "Content-Type": "application/javascript" })
      .end(content);
  }
});

const wsServer = app.listen(5100);
const ws = createWebSocketServer(wsServer);

const watcher = watch(__dirname, {
  ignored: ["**/node_modules/**", "**/.git/**"],
});

watcher.on("change", file => {
  console.log("..file changed", file);
  ws.send({
    type: "update",
    updates: [
      {
        type: "js-update",
        timestamp: new Date().getTime(), // 浏览器动态 import 时，用时间戳避免缓存
        path: file.replace(__dirname, ""), // 形如 "/App.jsx"
      },
    ],
  });
});

// 将 JSX 转化为 JS
async function transformJSX(content) {
  let result = await transform(content, {
    loader: "jsx",
  });
  return result.code;
}

// 提取 `import React from "react"` 中的 react，修改为 /@modules/react
function rewriteImport(content) {
  let result = content.replace(/ from \"(.*)\"/g, ($0, $1) => {
    if ($1.startsWith(".")) {
      return $0;
    } else {
      return ` from "/@modules/${$1}"`;
    }
  });
  return result;
}

// 在 JSX 组件中，注入 react-refresh 相关代码
function injectReactRefresh(content, url) {
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
}

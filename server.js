import express from "express";
import fs from "fs";
import { watch } from "chokidar";
import { createWebSocketServer } from "./ws.js";
import config from "./saber.config.js";

const { plugins } = config;

import { fileURLToPath } from "url";
import { dirname } from "path";

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

    for (const plugin of plugins) {
      if (plugin.transform) {
        content = await plugin.transform(content, url);
      }
    }

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

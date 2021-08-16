import express from "express";
import fs from "fs";
import { transform } from "esbuild";

const app = express();
app.get("*", async (req, res) => {
  let { url } = req;
  if (url === "/") {
    const content = fs.readFileSync("./src/index.html"); // 返回 index.html 文件
    res.status(200).type("html").send(content);
  } else if (url.startsWith("/@modules/")) {
    // 针对 /@modules/xxx 开头的请求，提供 deps/xxx 文件
    const depName = url.replace("/@modules/", "");
    console.log("..depName", depName);
    const content = fs.readFileSync(`./deps/${depName}.js`);
    // 返回 deps/xxx 文件
    res
      .status(200)
      .set({ "Content-Type": "application/javascript" })
      .send(content);
  } else if (url.includes(".jsx") || !url.includes(".")) {
    if (!url.includes(".")) {
      // js 文件，假设没有后缀 / 后缀含 .js 的都是 JS 文件
      url += ".jsx";
    }
    let content = fs.readFileSync("./src" + url, "utf-8");
    content = await transformJSX(content);
    content = rewriteImport(content);
    res
      .status(200)
      .set({ "Content-Type": "application/javascript" })
      .end(content);
  }
});

app.listen(5100);

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
  console.log("...rewriteImport result", result);
  return result;
}

import { transform } from "esbuild";

export default {
  // 将 JSX 转化为 JS
  transform: async function transformJSX(content) {
    let result = await transform(content, {
      loader: "jsx",
    });
    return result.code;
  },
};

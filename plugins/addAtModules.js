export default {
  // 提取 `import React from "react"` 中的 react，修改为 /@modules/react
  transform: function addAtModules(content) {
    let result = content.replace(/ from \"(.*)\"/g, ($0, $1) => {
      if ($1.startsWith(".")) {
        return $0;
      } else {
        return ` from "/@modules/${$1}"`;
      }
    });
    return result;
  },
};

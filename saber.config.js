import injectReactRefresh from "./plugins/injectReactRefresh.js";
import addAtModules from "./plugins/addAtModules.js";
import transformJsx from "./plugins/transformJsx.js";

export default {
  plugins: [injectReactRefresh, addAtModules, transformJsx],
};

// custom typefaces
import "typeface-montserrat"
import "typeface-merriweather"
// normalize CSS across browsers
import "./src/normalize.css"
// custom CSS styles
import "./src/style.css"

// // Highlighting for code blocks
// import "prismjs/themes/prism.css";

// export const onClientEntry = () => {
//   // 获取当前主题
//   const currentTheme = window.localStorage.getItem("theme");

//   // 加载对应的 Prism CSS 主题
//   if (currentTheme === "dark") {
//     import("prismjs/themes/prism-dark.css");
//   }
// };

import { wrapRootElement as wrap } from './wrap-root-element'
export const wrapRootElement = wrap

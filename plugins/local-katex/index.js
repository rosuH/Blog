const visit = require(`unist-util-visit`);
// const katex = require(`katex`);
const remarkMath = require(`remark-math`);
const unified = require("unified");
const parse = require(`rehype-parse`);
require(`katex/dist/katex.min.css`);

module.exports.setParserPlugins = () => [remarkMath];

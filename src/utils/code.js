import React from "react"
import Highlight, { defaultProps } from "prism-react-renderer"
import { themes } from "prism-react-renderer"

const Code = ({ codeString, language, ...props }) => (
  <Highlight {...defaultProps} code={codeString} language={language} theme={themes.github}>
    {({ className, style, tokens, getLineProps, getTokenProps }) => (
      <div className="gatsby-highlight" data-language={language}>
        <pre className={className} style={style}>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      </div>
    )}
  </Highlight>
)

export default Code
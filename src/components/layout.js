import * as React from "react"
import { Link, useStaticQuery, graphql } from "gatsby"


const Layout = ({ location, title, children}) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header
  const data = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            sineYear
          }
        }
      }
    `
  )
  const sineYear = data.site.siteMetadata?.sineYear
  

  if (isRootPath) {
    header = (
      <h1 className="main-heading">
        <Link to="/">{title}</Link>
      </h1>
    )
  } else {
    header = (
      <Link className="header-link-home" to="/">
        {title}
      </Link>
    )
  }

  return (
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <footer>
        © {sineYear}-{new Date().getFullYear()} Powered by
        {` `}
        <a href="https://www.gatsbyjs.com">Gatsby</a> with Custom Theme.
      </footer>
    </div>
  )
}

export default Layout

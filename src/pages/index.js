import * as React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import Seo from "../components/seo"
import "katex/dist/katex.min.css";

const BlogIndex = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const posts = data.allMarkdownRemark.nodes

  if (posts.length === 0) {
    return (
      <Layout location={location} title={siteTitle}>
        <Seo title="rosu's Blog" />
        <Bio />
        <p>
          「積學以儲寶，酌理以富才，研閱以窮照，馴致以懌辭，然后使元解之宰，尋聲律而定墨；獨照之匠，窺意象而運斤」。
        </p>
        <p>——《神思》-《文心雕龍》</p>
      </Layout>
    );
  }

  return (
    <Layout location={location} title={siteTitle}>
      <Seo title="rosu's Blog" />
      <Bio />
      <ol style={{ listStyle: `none` }}>
        {posts.map((post) => {
          const title = post.frontmatter.title || post.fields.slug;

          return (
            <li key={post.fields.slug}>
              <article
                className="post-list-item"
                itemScope
                itemType="http://schema.org/Article"
              >
                <header>
                  <h2>
                    <Link to={post.fields.slug} itemProp="url">
                      <span itemProp="headline">{title}</span>
                    </Link>
                  </h2>
                  <p>{post.frontmatter.date}</p>
                </header>
                <section>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: post.frontmatter.excerpt || post.excerpt,
                    }}
                    itemProp="description"
                  />
                </section>
              </article>
            </li>
          );
        })}
      </ol>
    </Layout>
  );
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        excerpt(truncate: true, pruneLength:70)
        fields {
          slug
        }
        frontmatter {
          date(formatString: "YYYY-MM-DD")
          title
          description
          excerpt
        }
      }
    }
  }
`;

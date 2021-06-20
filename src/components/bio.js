/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react";
import { useStaticQuery, graphql } from "gatsby";
import { StaticImage } from "gatsby-plugin-image";

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      site {
        siteMetadata {
          author {
            name
            summary
          }
          social {
            twitter
            github
          }
        }
      }
    }
  `);

  // Set these values by editing "siteMetadata" in gatsby-config.js
  const author = data.site.siteMetadata?.author;
  const social = data.site.siteMetadata?.social;

  return (
    <div className="bio">
      <StaticImage
        className="bio-avatar"
        layout="fixed"
        formats={["AUTO", "WEBP", "AVIF"]}
        src="../images/profile-pic.jpeg"
        width={50}
        height={50}
        quality={95}
        alt="Profile picture"
        placeholder="blurred"
        href="htttps://rosuh.me"
      />
      <div>
        {author?.name && (
          <p className="bio-autho-name">
            <strong>{author.name}</strong>
          </p>
        )}
        <div className="bio-summary">
          <p>{author?.summary}</p>
          <p>
            <a href={`https://rosuh.me`} className="bio-link">
              <svg
                t="1624199594135"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="2906"
                width="16"
                height="16"
              >
                <defs>
                  <style type="text/css"></style>
                </defs>
                <path
                  d="M647.381333 166.4m-166.272 0a166.272 166.272 0 1 0 332.544 0 166.272 166.272 0 1 0-332.544 0Z"
                  fill=""
                  p-id="2907"
                ></path>
                <path
                  d="M499.626667 310.912s-52.48 35.84-93.354667 108.714667c-46.08 81.834667-32 143.872-134.272 255.786666-52.48 58.794667-211.029333 91.434667-223.829333 100.394667-14.08 8.96-8.533333 152.149333 0 159.829333 6.4 6.4 146.773333-12.8 246.613333-65.28 98.986667-53.333333 170.24-126.72 170.24-126.72s97.706667 51.2 157.013333 122.453334c59.434667 71.68 93.44 153.6 103.68 157.44 10.24 3.84 136.106667-38.4 139.264-55.04 3.285333-16.64-56.192-156.032-125.866666-231.552-69.76-75.392-140.714667-153.429333-140.714667-168.746667 0-14.72 12.8-25.6 29.44-25.6s95.786667 8.32 151.466667 8.32c54.314667 0 152.192-14.634667 161.109333-25.6 8.96-12.8 0-115.029333-12.8-119.466667-10.922667-3.84-121.6 12.8-231.509333 1.877334-110.08-12.8-196.906667-95.914667-196.906667-95.914667v-1.28z"
                  fill=""
                  p-id="2908"
                ></path>
              </svg>
            </a>
            <a
              href={`https://github.com/${social?.github || ``}`}
              className="bio-link"
            >
              <svg
                width="16"
                height="16"
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>GitHub </title>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
            <a
              href={`https://twitter.com/${social?.twitter || ``}`}
              className="bio-link"
            >
              <svg
                width="16"
                height="16"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -2 24 24"
              >
                <title>Twitter icon</title>
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Bio;

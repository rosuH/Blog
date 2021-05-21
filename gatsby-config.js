module.exports = {
  siteMetadata: {
    title: `rosu 的博客`,
    name: `rosu`,
    siteUrl: `https://blog.rosuh.me`,
    description: `你好，这是我的个人博客。`,
    hero: {
      heading: `Checkout this Blog.kt`,
      maxWidth: 652,
    },
    social: [
      {
        name: `HomePage`,
        url: `https://rosuh.me`,
      },
      {
        name: `twitter`,
        url: `https://twitter.com/rosu_h`,
      },
      {
        name: `github`,
        url: `https://github.com/rosuH`,
      },
    ],
  },
  plugins: [
    {
      resolve: "@narative/gatsby-theme-novela",
      options: {
        contentPosts: "content/posts",
        contentAuthors: "content/authors",
        basePath: "/",
        authorsPage: true,
        sources: {
          local: true,
          // contentful: true,
        },
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `rosu's Blog`,
        short_name: `Novela`,
        start_url: `/`,
        background_color: `#fff`,
        theme_color: `#fff`,
        display: `standalone`,
        icon: `src/assets/favicon.png`,
        articlePermalinkFormat: ":year/:month/:day/:slug",
      },
    },
    {
      resolve: `gatsby-plugin-netlify-cms`,
      options: {},
    },
  ],
};

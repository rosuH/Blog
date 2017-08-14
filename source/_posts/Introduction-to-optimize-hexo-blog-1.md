---
title: "Hexo 博客优化入门（一）"
date: 2017-8-6 09:50:24
tags:
- 'Hexo'
- '优化'
- '压缩'
- '网页'

categories:
- '博客折腾指南'
---

昨晚在本地折腾博客的时候，总是对自己博客的加载速度很不满意。
本博客主题用的是 [Hexo material theme](https://material.viosey.com/)，于是想看看 [作者自己的博客](https://blog.viosey.com/) 的资源加载情况。
令我惊异的是，其博客资源的体积都很小...
一张图片竟然在 9k。果然是大佬 hhh。
于是查看了我的博客的资源，决定先从图片压缩开始解决。

# 1. 图片压缩 & 工具推荐

## 图片格式选择

`JPEG`: 作为互联网上使用频度最高的图片格式
  - 无透明效果、颜色丰富的图片
  - 因为每一次压缩均为有损压缩，所以对于线条、文字较多的图片不建议使用

`PNG` ：有多种格式可选
   - 需要透明效果
   - 色块连续、多纯色
   - 所有有时候颜色丰富的图片其大小要大于 `JPEG` 格式图片
   - 可使用无损压缩

`GIF`：目前动画效果支持较好的格式
   - 在 `APNG` 还未普及的又需要引入动画效果图片的时候可以采用此格式

新的更优秀的图片格式，诸如 `WebP`, `APNG`, 仍然未被浏览器很好的支持，所以在此不赘述。



## 图片压缩工具

经过一番查找，发现有如下工具可供使用：

- [TinyPNG](https://tinypng.com/)：`PNG` 格式图片**在线压缩网站**
- [limitPND](http://www.nullice.com/limitPNG/)：优秀的极限 `PNG` 图片压缩**软件**
- [iSparta](http://isparta.github.io/)：开源的 `PNG` 压缩与格式转换工具
- [智图](https://zhitu.isux.us/)：高效优质的图片压缩平台，亦有桌面端软件

上述软件/平台是经过我尝试之后比较**简易**、**高效**同时**免费**的工具，当然我们也可以选择 Photoshop。不过我自己并不精通 PS，所以效果并没有上述的好。

## 压缩前的准备

有时候我的图片是来自[Unsplash](http://unsplash.com/)的原始图片，原本的品质较高，分辨率也较大，相应的体积也就很大了。
这样直接去压缩，就多做了许多重复工作，比如你需要不断压缩压缩...
这样的话，对于分辨率要求不高，图片大小比较小的图片，比如非背景图、头像之类。我们可以先经过下面的预处理步骤：

- Windows 自带画图工具调整分辨率
- 屏幕截图

这两者对精度要求较低的图片进行**野蛮**压缩效果可是很明显的。

## 开始压缩

经过一晚上的实验，并且结合我自己的需求，得出如下结论：

- 格式转换首选：**iSparta**
    - 此软件可将 `PNG` 格式转换为 `WebP`, `APNG` 格式的图片，具有其他软件没有的功能
    - 图片压缩能力一般，某些界面没有进度提示
- 普通需求首选：**limitPNG**
    - 界面赏心悦目，交互简易方便
    - 压缩能力超强！可供选项较多，分无损和有损等等很多细分选项
    - 极低画质压缩能力稍弱
- 极普通需求，又不想下载软件首选：**TinyPNG**
    - 在线无损压缩
    - 缺点就是无法选择输出质量
    - 如果你只是想稍微无损压缩一下一张图片，那么可以选这个了
- 我的首选！**智图**
    - 客户端界面美观、交互也简便
    - 压缩能力超强，支持 10~95 等 14 级压缩选项
    - 多图片操作亦方便
    - 可“递归压缩” --> 不断压缩同一张图片直至很小很小，上面其他软件最低质量有所保留
    - 支持图片格式自动转换：根据图片内容自动转换为合适的格式

图片压缩的第一步已经完成了，也就是上传之前的压缩。


我的图片原来超过 2M，因为之前没去理他...在压缩过后使用首页加载的 4 张图片总体积不超过 70k，虽然离很多优秀的优化还差得远，
但是对于目前的我已经比较满意了。

# 2. HTML, JS, CSS & Image 压缩插件

只是压缩图片显然没法满足需求，因为我注意到首页加载的某些 `js, css` 文件大小也比较大。
所以我们亦需要一些压缩代码的工具。
所以我找到了 Hexo 的插件  ~[hexo-all-minifier](https://github.com/chenzhutian/hexo-all-minifier)~。
此插件目前尚有一些[小问题]()没有解决。
遂找到基于这个插件的另一个新插件，并加入了新的特性：[hexo-filter-cleanup](https://github.com/mamboer/hexo-filter-cleanup)。
这个插件集合了：

> hexo-html-minifier, which is based on HTMLMinifier
> hexo-clean-css, which is based on clean-css
> hexo-uglify, which is based on UglifyJS
> hexo-imagemin, which is based on imagemin
> useref, let hexo parse build blocks in html files.
> favicons, generate favicons on the fly.

四款插件，一次就搞定所有事情。
插件安装和配置而已参看[hexo-all-minifier](https://github.com/chenzhutian/hexo-all-minifier)项目首页。
该插件生效之后，我惊奇的发现我那些图片又被压缩了一点点，意外惊喜...

-----

此篇文章属于经验之谈，不具有多少技术性东西。非常感谢上述工具和项目，有许多甚至都是开源的。
这是世界因为你们变得更好，感谢~

-----
## 参看：
- [前端图片选择问题](http://www.cnblogs.com/observernotes/p/4806218.html)
- [hexo 博客压缩优化](https://segmentfault.com/a/1190000008082288)
- [网站开发中，如何将一张图片压缩得更小？](https://www.zhihu.com/question/20027708)

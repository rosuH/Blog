---
title: "GitHub Page 子域名配置 & 启用 HTTPS"
date: 2017-08-02 17:09:46
tags:
- 'Github page'
- 'HTTPS'
- '子域名'

categories:
  - "技术"

description: "因为本博客迁移到了 GitHub Page，加之个人的 wiki 站点亦是使用 Hexo 托管在 GitHub Page 的，故而想将两个站点都配置到一个域名下面..."
---

因为本博客迁移到了 GitHub Page，加之 [个人的 wiki](https://wiki.rosuh.me) 站点亦是使用 Hexo 托管在 GitHub Page 的，故而想将两个站点都配置到一个域名下面，分为两个子域名：

```shell
blog.rosuh.me
wiki.rosuh.me
```

下面是具体配置步骤：

# 1. 上传 CNAME 到仓库

GitHub Page 支持自定义域名，只需要在仓库的默认分支根目录下创建一个 `CNAME` 文件，里面填上你想要的域名即可。以我的博客为例，我的 `CNAME` 文件内容如下：

```shell
blog.rosuh.me
```

相同的，在我 wiki 站点的目录亦需要添加如下 `CNAME` 文件：

```shell
wiki.rosuh.me
```

 **注意事项** ：如果你为某一个站点设定了子域名，那么意味着你不能在其他站点中填入诸如下面的域名：

```shell
www.rosuh.me
*.rosuh.me
```

因为通配符或者未指定子域名的情况，会和指定子域名的仓库冲突。

# 2. 为域名添加 CNAME 解析

去到你的域名托管商那里，如果并不特别在意中国的载入速度，那么推荐使用 [CloudFlare](https://www.cloudflare.com/) 作为你的域名托管商。益处后文会提及一些。

- 为你的域名添加两个 A 记录分别指向 GitHub 的主机
- 为你的域名添加 CNAME 记录作为子域名的凭据（此处我添加了两个

![添加 CNAME 记录](https://img.ioioi.top/blog-img/163425113.png)

 **注意事项** ：可以看到我的域名为 `rosuh.me` ，而 GitHub page 给我的默认域名为 `rosuh.github.io` （据你的 GitHub 用户名而定），而我要添加的子域名分别为：

```shell
blog.rosuh.me
wiki.rosuh.me
```

耐心等待 DNS 刷新即可。

至此，子域名配置已经可以使用了。接着我们继续配置 HTTPS。

# 3. CloudFlare 提供的 HTTPS 服务

GitHub Page 目前（2017）仍旧没有提供自定义域名的 HTTPS。我们可以使用 [CloudFlare](https://www.cloudflare.com/) 的 CDN 实现 ”曲线救国“。

在 [CloudFlare](https://www.cloudflare.com/) 的 `Crypto` 选项中，我们选择 `Flexible`

![SSL 配置](https://img.ioioi.top/blog-img/163904181.png)

这个选项实现了如下链接：

- User —> HTTPS —> CloudFlare CDN
- CloudFlare —> HTTP —> Hots(GitHub Page)

也就是说，我们使用了 CloudFlare 的 CDN，所以用户链接到其 CDN 时，将会使用 HTTPS 链接，而 CloudFlare 的 CDN 链接到我们的网站也就是 GitHub Page 时，仍旧是 HTTP。

这样的方式也能抵御一部分中间人攻击和网络劫持。

**但是现在，我们的用户依旧可以选择使用 HTTP 的方式链接到我们的网站，因为我们没有设置强制 HTTPS 服务，所以这样依旧有被剥离攻击的危险** 。

*为了验证这个说法，你可以直接输入域名进行访问，你会发现直接执行的是 HTTP 协议* 。

## 3.1 启用强制 HTTPS 访问服务（HSTS）

我们的目标是从两个时间点入手：

- 用户首次次链接到我们的网站
- 用户非首次链接到我们的网站

HSTS 指的是强制使用 HTTPS 服务，但是首次链接并不包含在其中。一般情况下，大部分网站都是使用：

- 首次链接 302 跳转：从 HTTP 到 HTTPS
- 非首次链接：HSTS 生效

这么一来，我们就得先启用链接跳转服务了。

如果是自己搭建的服务器，我们可以在服务器端做跳转和 HSTS 服务，现在我们只需要使用 CloudFlare 提供的服务就行啦。是不是很方便？ ;)

依旧是点开 `Crypto` 页面，下滑找到 `Always use HTTPS` 然后点击 `on` 开启就行了。

接着看到下面的 `HTTP Strict Transport Security (HSTS)` ，仔细阅读完 CloudFalre 给你的提示，然后在 `Enable HSTS` 处切换为 `on` 就大功告成啦。

到现在我们的文章标题就实现得差不多啦。

本文利用了 GitHub page 和 CloudFlare 就轻松完成了从无到有，从有到赞的配置过程。

CloudFlare 是不是很赞啊？下面再介绍一个 CloudFlare 的功能：

如果你细心一些，就会发现如果直接访问不带子域的链接比如我的 `rosuh.me` 是没法访问的。因为你的 GitHub page 设定了子域名，所以这个域名就没办法直接代表一个仓库了。

这样的话，我们可以使用 CloudFlare 的 `Page Rules` 功能来进行跳转操作。

比如我想要访问主域名 `rosuh.me` 的时候直接跳转到我的博客，那么我可以添加一个规则如下：

![page rules](https://img.ioioi.top/blog-img/170044210.png)

这样就可以直接跳转到我的博客啦。

------

参看：

- [在 DNS 提供者上配置 CNAME 记录的技巧](http://wiki.jikexueyuan.com/project/github-pages-basics/tip-cname.html)
- [设置 GitHub Pages 的自定义域名](http://wiki.jikexueyuan.com/project/github-pages-basics/set-custom-domains.html)
- [开启 HSTS 协议让你的站点更加安全](http://swiftcafe.io/post/hsts)

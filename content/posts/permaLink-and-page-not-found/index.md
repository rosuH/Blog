---
title: "修改固定链接导致 404"
date: 2016-08-07
author: rosu
tags:
- 'wordpress'
- '固定链接'
- '404'

categories:
  - "技术" 
---

- 前言
  这绝对是我自己做死....
- 问题描述
  修改了网站的固定链接导致了进入文章时发生404错误
- 问题解析

    1. 先了解什么是[固定链接](https://zh.wikipedia.org/wiki/%E5%9B%BA%E5%AE%9A%E9%93%BE%E6%8E%A5)；固定链接有助于搜索引擎对网页的缓存以及自己网站的SEO
    2. 更改固定链接，实际上是对『默认链接』做一个重定向
- 解决问题
  在很久很久以前（可能是三年前），wordpress修改固定链接还没有现在那么方便。
  如果是Apache，那么需要确认三点：
1. wordpress对目录下的.htaccess拥有读写权限
2. 固定链接的目录结构需要 Apache服务器的mod_rewrite模块支持，所以在Apache配置文件httpd.conf中将 LoadModule rewrite_module modules/mod_rewrite.so设置为启用
3. 同样是Apache配置文件，其中对于站点目录下的AllowOverride None的参数设置为All。当然修改完配置后，一定要重启Apache服务
    如果是Nginx，则直接在配置文件（可能你是单独虚拟机的配置文件）`nginx.conf`，写重定向从『新的固定链接』到『默认链接』。

后来Wordpress更新了新的固定链接修改方法，如果你是用的是[lnmp一键脚本](http://lnmp.org)的话，在部署的时候，就可以选择你的固定链接（伪静态）选项了，这样，下面的配置文件就会自动保存在nginx的conf目录。

```shell
#在nginx的conf中，新建wordpress.conf文件，把下面代码粘贴进去
location / {
try_files $uri $uri/ /index.php?$args;
}
rewrite /wp-admin$ $scheme://$host$uri/ permanent;

#接着，在你的网站的配置文件中，假设你是单独的配置文件:www.123.com.conf
#root那一行，下面加上：
include wordpress.conf
```

接着测试一下配置文件:

```shell
/usr/local/nginx/sbin/nginx/ -t
```

然后重启就行啦。

-----

之所以是做死，是因为，本来我有这个文件，
然而我自己把它删了....
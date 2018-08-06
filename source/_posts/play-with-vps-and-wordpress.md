---
title: "VPS+Wordpress 折腾笔记"
date: 2016-4-27 23:31
tags:
- 'VPS'
- 'Wordpress'

categories:
- '博客折腾指南'
---

****
- 起因
	- 我波澜不惊的内心悄然决定在五月份之前上线的个人博客。之前因为一些问题拖到了现在。
	- 更主要的原因是剁手惯了(捂脸),明明没钱的情况下还是入了...

# 正题

- VPS
	- 买的是*hostus*的，不敢用*搬瓦工*的
	- 买的是特价，以为赚到了...虽然确实便宜，但是一开始没有看清楚，误以为每月有2T的带宽，结果是一年2T...虽然对我来说是够用，毕竟我用*搬瓦工*来科学上网，所以这个也就是跑网站而已。我又不是什么人气王，也不是技术大牛。一个月有**10**个访问量已经算稀奇了。:)
	- 接着开始就安装LNMP环境
		- 一开始准备用LNMP.org这个一键包，但是网站貌似出了问题。所以转而使用其他人的环境包。后来发现找不到php的安装目录...是我太弱鸡...
		- 中午的时候发现可以上LNMP.org了，然后就果断安装了。
- 安装LNMP环境
	- 建议直接去官网看教程会比较详细。我此处只记录一个大概的流程，以及一些错误。
	- 步骤
		1. 下载 && 安装

			```shell
			wget -c http://soft.vpser.net/lnmp/lnmp1.2-full.tar.gz && tar zxf lnmp1.2-full.tar.gz && cd lnmp1.2-full && ./install.sh lnmp
			```

		2. 版本控制
			- 由于我机器配置并不高，所以都选的是默认配置。
		3. 中间有一步需要创建MySQL的数据库。一定要选`y`。还有安装FTP服务器也是需要的。
		4. 安装完成之后就可以添加虚拟主机
			- 执行

			```shell
			lnmp vhost add
			```

			- 添加域名
				- 有`www`和没有`www`的是两种域名，需要额外添加。

			- 创建网站目录，最好是默认目录，比较好找
			- 伪静态

			```shell
			Allow Rewrite rule?(y/n)
			y
			wordpress
			```

			- 设置日志，省事就默认呗
			- 然后添加数据库和数据库用户
			- 然后是FTP账户和密码
		5. 伪静态管理
			- 在LNMP环境下，需要使用`Nginx`伪静态规则
				-如果是在LAMPA或LAMP可以直接使用网站根目录下放`.htaccess`来设置伪静态规则。
			- 打开虚拟主机配置文件

			```shell
			vi /usr/loacl/nginx/conf/vhost/域名.cong
			
			```

			在`root /home/wwwroot/www.域名.com;`这一行后面添加`include wordpress.conf;`
			保存退出，重启`nginx`服务

			```shell
			/etx/init.d/nginx restart
			```

- 安装Wordpress
	- **真-神坑**
		- 一开始总是直接把`Wordpress`压缩包解压传到/wwwroot/www.rosuh.me/，更改权限，然后在浏览器输入`www.rosuh.me/wordpress`进行安装，然后就**悲剧了**!
		- 安装完之后，输入域名**进不去**！必须要在域名后面加上`/wordpress`才行！**NND**。然后开始排查原因。
		- 以为是``nginx`的配置问题，遂修改`/vhost/郁闷.conf`文件，把根目录设为域名后面加上`/wordpress`...哭了..
		- 以为在wordpress后台的*站点地址*和*wordprss地址*设置就行...**呵呵**然后就全都进不去了，还要去数据库修改`wordpress`的数据表。
		- 然后尝试把`wordpress/`里的文件全部放到上级目录即是根目录。然后在后台设置`wordoress`的地址，然后无法登录后台，因为全都跳转到`wordpress/`文件夹下了。虽然有一个奇葩的做法就是把`/wordpress`下的文件copy到上级目录，又或许只需要一个`index.php`...但是我没试，因为这样的解决方法不够**优雅**。
		- 正确的做法，应该是在安装`Wordpress`之前就把`/wordpress`里的文件放到根目录然后再按照...这么简单的问题困扰了我那么久，我的内心是**崩溃**的。

# 写在后面

- 虽然过程折腾，但是搞懂了许多问题，甚至于对LNMP环境的一些配置都有了更深的了解。学习到了许多新的知识。
- Wordpress确实有趣。虽然我现在也对使用`Git+Github+jekyll`很感兴趣，但是还是先玩玩`Wordpress`吧！
- 其实`Wordpress`的主题还没选好呢...

****
*rosuH*

修改了一些 Markdown 语法。

更新于 2018/06/30/

*rosuH*
*于2016/04/27 23:31  书*

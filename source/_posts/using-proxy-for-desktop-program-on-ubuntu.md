---
title: "如何在 Ubuntu 对桌面程序使用代理"
tags:
  - 'Ubuntu'
  - 'proxychains'
  - 'desktop'

categories: 
  - "修复的机体故障"
  - "修复日志"
---
# 问题是什么？
如果你不具备路由器代理的情况，那么我们需要在本地做透明代理。这样的话，对本地代理的使用情况完全取决于第三方程序的支持情况。
有一些程序会自动检测代理，有一些提供配置选项。对于两种而言，设置代理都很方便。
那么还有一些 GUI 软件，但是并不提供代理设置选项，或者在首次启动的时候就必须以代理模式允许并且还**不允许**设置代理（说的就是你 Dropbox）。

# 这个时候该怎么办呢？

我们要理解一个内容就是，对于 Linux 而言，所有程序都可以通过命令行启动的。（此处的”程序”包含二进制文件、脚本等等）

所以，我们基本思路就是：

- 找到程序本体
- 通过命令行 + proxychains 设置代理并启动

# 来吧，解决方法

## 找到程序的本体

#### 用 find
在 linux 下找东西方便得很呢，打开你的 terminal：

```shell

man find

```
这个美妙的工具可以搜索他能搜索到的东西，要找个程序还不是分分钟的事情。
举个例子。我们要找 Dropbox 的二进制文件所在：

```shell
sudo find / -name "dropbox"
```
搜索结果：

```shell

/usr/share/doc/libnet-dropbox-api-perl/examples/dropbox
/usr/share/doc/dropbox
/usr/bin/dropbox

```

结果应该已经出来了。
一般通过 `dpkg` 或者软件管理安装的软件都会将目录放置在 `/usr/local/` 、`/usr/bin/`等目录中。（那个 `doc`就是文档的位置啦，一般放置授权协议、更新日志之类的文档。

所以这里的 `dropbox` 的二进制文件就在 `/usr/bin/dropbox` 中咯。
执行：

```shell
proxychains /usr/bin/dropbox
```

就可以通过代理的方式启动了。


## 能不能不要这么麻烦？

啊，这样很麻烦啊，难道每次都要记住位置，敲那么长的命令才能愉快地食用吗？
**当然不是啊**。
既然本文的标题指的是**桌面程序**，就说明还有更好的方法啊。

当然，对于 `Dropbox` 而言，你首次启动之后，就可以进去设置代理了，也就不需要使用以下方法了。
下面的方法是针对：需要代理但是没有提供代理设置的桌面程序（GUI）。


# 解决方法

**前提是你想通过图标启动，如果你只想通过命令行启动...其实写个脚本也可以。**

其实思路很简单，和[我之前写的这篇文章](https://blog.rosuh.me/2017/11/install-netease-cloud-music-on-ubuntu-17-10/)类似。
桌面应用程序，一般都带有图标啊。点击图标的时候，桌面环境就会读取该程序的`desktop`配置，通过该配置里的内容执行程序咯。
看看你的 `/usr/share/applications`，里面是不是有很多`desktop`配置文件呐。
找到你想启动的应用程序，都会出现类似下面的内容（只多不少，因为有些程序会对本地化作处理

```shell
[Desktop Entry]
Version=1.0
Name=Zeal
GenericName=Documentation Browser
Comment=Simple API documentation browser
Exec=/usr/bin/zeal %u
Icon=zeal
Terminal=false
Type=Application
Categories=Development;
MimeType=x-scheme-handler/dash;x-scheme-handler/dash-plugin;
```

看到 `Exec` 这一行，是不是很熟悉呀，其实这就是指向程序所在的文件夹。如果该程序加入了环境变量，那你就看不到路径咯。
我们要做的就很简单了，在原来路径或程序名前面加上 `proxychains` 就可以咯。或者是其他代理比如`tsocks`，也就会变成 `Exec=proxychains /usr/bin/zeal %u`。
保存之后重启，点击桌面图标就会自动以代理模式启动咯。





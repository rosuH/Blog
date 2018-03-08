---
title: "绕了一大圈的 Android Studio 安装札记"
date: 2017-11-8 14:50:40
tags: 
- "Android Studio"
- "JDK"
- "desktop"
categories:
- "札记" 
- "修复的机体故障"
- "修复日志"
---

# 本文导览

- 蠢哭
- 安装 Android Studio
- 修改 hosts 及更新
- 设置 JDK
- 设置桌面图标

# 0. 蠢哭

直到写本文的时候，才发现自己没有认真看官网的安装说明，导致和“秦王绕柱”一样绕了一大圈。
...（多看官方文档才有出路啊同志们
下文结合自己的经验以及官方指南写出的，某些部分甚至是翻译和引用原文的，请周知。

# 1. 安装 Android Studio

Google 没有提供 Android Studio（后文称为 AS） 的软件源，所以我们直接去官网下载 deb 包自行安装：[Download android studio](https://developer.android.com/studio/install.html).

1. 解压下载的压缩包并移动至目标文件


```shell
unzip xxx.zip -d /usr/local/
```

此处我将解压出来的文件夹移到了 `/usr/local/`中，也就是 AS 的程序所在的路径了。

2. 命令行运行 AS

在命令行执行


```shell
/usr/local/android-studio/bin/studio.sh
```

就会首次运行 AS 了。

# 2. 修改 hosts 及更新

“得益于”本朝严肃的网络环境，我们总是需要在网络方面多下一些功夫。
首次运行 AS 会提示进行一些工具和配置的下载，在此步会大概率遇到网络问题。
不过 Google 的其实一些下载服务在国内是合法运营的。可能是误伤导致 DNS 解析出问题。所以我们只需要把正确的 IP 写进 hosts 里就可以啦。
在 terminal 中执行：

```shell
# 编辑 hosts
sudo vim /etc/hosts

# 加入下面 hosts
203.208.43.66   dl.google.cn

# 保存退出
```

接着刷新一下 DNS

```shell
sudo systemd-resolve --flush-caches
```

现在重新继续运行 AS 就可以更新啦。以后也会从这个 IP 下载文件，速度很快。

# 3. 设置 JDK 

[Set the JDK version](https://developer.android.com/studio/intro/studio-config.html#jdk)

假设你已经打开了一个项目

1. 菜单栏依次选中 “File > Project Structure”
2. 在 SDK location 页面的 JDK location 中选择你 JDK 所在的文件夹
3. 选中 OK 保存

# 4. 设置桌面图标

此处有两种方式可以设置桌面图标：

1. AS 内设置
    1. 运行 AS
    2. 选中 “Tools > Create Desktop Entry ”
2. 自行编写 desktop 条目

由于一开始我没有认真看官方的安装说明，导致我直接使用了第二步的方法。
此处我也顺便记录下吧。
Gnome 桌面的图标条目配置包含在两个文件夹中：

```shell
# 用户文件
~/.local/share/applications/

# 全局文件夹
/usr/share/applications/
```

建议修改全局文件夹。因为前者修改之后并没有生效。

```shell
# 进入配置文件夹中
cd /usr/share/applications/

# 新建一份 android-studio.desktop
vim android-studio.desktop

# 存入如下内容
[Desktop Entry]
Encoding=UTF-8
Version=1.0
Type=Application
Terminal=false
Name=Android-studio
Exec=/usr/local/android-studio/bin/studio.sh -- %u
Comment=Official Android IDE
Icon=/usr/local/android-studio/bin/studio.png
StartupWMClass=studio
Categories=GNOME;GTK;IDE;
MimeType=;
X-Desktop-File-Install-Version=0.22

# 保存并退出
```

在该条目中，你需要修改你的 AS 所在的目录，也就是 `Exec` 以及 `Icon` 条目的值。
保存完毕之后重启电脑就大功告成了。











---
title: "Ubutnu17.10 安装网易云"
date: 2017-11-8 14:50:40
tags: 
- "netease-cloud-music"
- "ubuntu"
- "software"
categories:
- "札记" 
- "修复的机体故障"
- "修复日志"
---

# 前言
网易云目前官方只支持到 Ubuntu 16.04，尚未支持 17.10。但是作为抖脚党是不能就此罢休的。

# 1. 下载与安装

去[官方下载](http://music.163.com/#/download)页面下载 Ubuntu 16.04 的 deb。
在 terminal 执行

```shell
sudo dpkg -i xxx.deb
```

安装该 deb。安装过程将会很顺利，顺利到难以置信。
并且桌面也出现了网易云熟悉的图标。

**但是**，你会发现无法打开客户端。

# 2. 修改 desktop 配置文件

OK，现在我们看看出了什么问题？

打开 terminal，执行： `netease-cloud-music`...嗯...没什么反应嘛。
很奇怪...照道理应该会出错才对。
那么我们尝试 `sudo` 一下： `sudo netease-cloud-music`...

# 唰！

是不是出现了一些错误呢～类似于

```shell
/usr/share/themes/Ambiance/gtk-2.0/apps/mate-panel.rc:30: error: invalid string constant "murrine-scrollbar", expected valid string constant
../../sandbox/linux/seccomp-bpf-helpers/sigsys_handlers.cc:**CRASHING**:seccomp-bpf failure in syscall 0281
Received signal 11 SEGV_MAPERR 000008003119
#0 0x7f774c3dcaeb <unknown>
#1 0x7f7747b27150 <unknown>
#2 0x7f774ed37b73 <unknown>
#3 0x7f774ed36b0b <unknown>
#4 0x7f7747b27150 <unknown>
#5 0x7f7747848c87 epoll_pwait
#6 0x7f774c452728 <unknown>
#7 0x7f774c45032e <unknown>
#8 0x7f774c3d4f9e <unknown>
#9 0x7f774c408ee0 <unknown>
#10 0x7f774c3f736a <unknown>
#11 0x7f774c427de8 <unknown>
#12 0x7f774c42479d <unknown>
#13 0x7f7747b1b7fc start_thread
#14 0x7f7747848b0f clone
  r8: 0000000000000002  r9: 0000000000000008 r10: 0000000000000000 r11: 0000000000000246
 r12: 0000000000000000 r13: 00007f774f60c2e9 r14: 0000000000003119 r15: 00007f7736982228
  di: 0000000000000002  si: 00007f774f60c2e8  bp: 0000000000000119  bx: 0000000000000000
  dx: 0000000000000001  ax: 0000000000003000  cx: 0000000008003119  sp: 00007f7736982210
  ip: 00007f774ed37b73 efl: 0000000000010202 cgf: 002b000000000033 erf: 0000000000000006
 trp: 000000000000000e msk: 0000000000000000 cr2: 0000000008003119
[end of stack trace]
```
之类的错误咯。

虽然看不出是什么问题...但是通过对网上类似问题的总结，我试了一下，关闭 sandbox 环境可以勉强解决。

```shell
sudo netease-cloud-music --no-sandbox %U
```
这样就可以启动了吧？

### 才不要每次都用命令行

那就修改我们的 `desktop` 配置文件咯。

```shell
# 修改网易云的桌面配置文件
vim /usr/share/applications/netease-cloud-music.desktop

# 在 Exec 那一行结尾加上 --no-sandbox %U，也就是变成下面的样子
Exec=/the/path/to/netease-cloud-music --no-sandbox %U

# 你要自己修改自己的网易云路径哦，默认在当前文件夹，也就是如下
Exec=netease-cloud-music --no-sandbox %U
```

这样保存之后重启应该就可以咯。

#### 参看

- [Ubuntu17.10<解决安装完网易云音乐无法打开>](http://blog.csdn.net/gpwner/article/details/78347516)
- [Ubuntu 17.10 can not run netease-cloud-music](https://stackoverflow.com/questions/46885202/ubuntu-17-10-can-not-run-netease-cloud-music/47176481#47176481) -- 这答案其实是我回答的 :P

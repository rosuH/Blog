---
title: "如何在虚拟机安装 MacOS"
date: 2017-9-20 19:59:07
tags:
- '虚拟机'
- 'Mac OS'
- '折腾'

categories:
- '折腾'
---
# 1. 准备阶段

- 虚拟机软件 VMware: 链接: https://pan.baidu.com/s/1o7LcPdg 密码: u433
- 虚拟机补丁 Unlocker208：链接: https://pan.baidu.com/s/1eRSKE3K 密码: sbq5
- MacOS 懒人版镜像 链接: https://pan.baidu.com/s/1nuTmucL 密码: 3ur2
- 安装 Python2.7 到你的电脑。记住安装路径

**友情提示：虚拟机最好保存在 SSD 固态硬盘中，若是在机械硬盘...能把你卡到不能自理**。



# 2. 开始安装

## 2.1 安装 VMware 并打补丁

- 首先正常安装 VMware，然后输入某神秘代码：`GU388-0PG5J-481EZ-ZEQNC-YKU98`
- 打开任务管理器 --> 服务：右键停止 VMware 的服务

![停用 VMware 服务](https://img.rosuh.me/blog-img/191822520.png)

其中某一些需要先结束其余服务才能结束。



- 解压 Unlocker208 文件夹，用编辑器编辑`win-install.cmd`这个文件：

找到下面一行：

```shell
echo Patching...
unlocker.exe
```

改为：

```shell
echo Patching...
C:\Python27\python.exe unlocker.py
```

你可以看到，第二行中`unlocker.py`前面的就是我的 Python2.7 的安装路径了。

保存退出，然后**以管理员身份运行**`win-install.py`进行打补丁操作。

类似输出如下：

![win-install/py](https://img.rosuh.me/blog-img/192332540.png)



- 为什么要打补丁？

VMware 本身并没有 MacOS 系统安装环境，所以国外某些大神写了这个脚本，为 VMware 加了一个 MacOS 环境模板，这样在后面选择系统的时候就会出现 Apple MacOS 的模板了。



## 2.2 创建 MacOS 虚拟机

- 打开你的 VMware，选择新建一个虚拟机。

配置类型选择【经典】即可。

![新建虚拟机](https://img.rosuh.me/blog-img/192648213.png)



- 在【安装程序光盘镜像文件】中选择第一步下载的懒人镜像
- 在打开的【选择文件对话框】，应该选择【所有文件】

![选择镜像](https://img.rosuh.me/blog-img/192759933.png)

![mark](https://img.rosuh.me/blog-img/193013555.png)



- 选择`Apple Mac OS`操作系统，下面的版本选择 OS X 10.11 就行
- 如果这一步没有`Apple Mac OS`给你选择，那么说明你的补丁并没有打上去

![mark](https://img.rosuh.me/blog-img/193101253.png)

- 命名虚拟机与设置虚拟机的保存路径
- 记住这个路径，后面我们需要用到

![mark](https://img.rosuh.me/blog-img/193232522.png)



后面的步骤可以选择默认，也可以自行配置，无碍。



如果你现在就启动虚拟机的话，会出现如下错误：

![mark](https://img.rosuh.me/blog-img/193415078.png)

从错误信息看，是 CPU 没有校验通过。也有的说，是因为引导没有设置好。

我们打开虚拟机保存的路径，也就是上面一步那个路径。找到以`.vmx`结尾的配置文件。比如我是 `Mac.vmx`这个东西，因为我的虚拟机名字为 `Mac` 。

打开该文件，找到`smc.present = "TRUE"`这一行，在该行**下面**加上`smc.version = 0`，保存之后退出。

现在重启虚拟机，你将会看到美妙的苹果商标了。



## 2.3 安装

安装这一步很简单：

- 进去之后点击继续，然后在左上角看到工具 --> 磁盘工具
- 进行分区，然后将 MacOS 安装到该分区即可

下面多图预警：

![mark](https://img.rosuh.me/blog-img/194731319.png)



![mark](https://img.rosuh.me/blog-img/194750417.png)

![mark](https://img.rosuh.me/blog-img/194810854.png)



![mark](https://img.rosuh.me/blog-img/194757735.png)



接下来就是等待了。

至此，我们的安装步骤基本结束了。当然，进入之后，你可能仍要自行设置一下网络。

那些步骤麻烦自行搜索 Vmware 网络模式。



-----

- 本文章所涉及之软件均来自网络，仅供学习使用，不得用于商业用途！
- 懒人版镜像来自：[U_macOS S10.12.5正式版(16f73).dmg原版+cdr懒人版来了！](http://bbs.pcbeta.com/viewthread-1741950-1-1.html)
- 参看：
  - [史上最详细的虚拟机安装 MacOS 图文教程](https://xuanwo.org/2015/08/09/vmware-mac-os-x-intro/)
  - [让你在windows系统也可以用上Mac OS X](https://www.sysceo.com/Article-article_info-id-1552.html)


---
title: "使用 NW.js 创建简单的桌面应用"
date: 2018-3-8 16:40:50
tags:
- 'NWjs'
- 'Memobird'
- '日常'

categories:
- '日常'
---

# 前言

因为早上想用[咕咕机](https://www.memobird.shop/)（Memobird）打印一下天气，发现他还有 Web 版本。然后想着能不能打包成一个`.exe`，直接丢到桌面执行，不想每次都打开浏览器、网页什么的...

然后了解了一下[Electron](https://electronjs.org/) 和 [NW.js](https://nwjs.io/)。然后顺着用了后者尝试打包了一下，发现还是挺简单的。

因为个人不需要添加过多的功能，所以使用门槛较低的 NW.js 来实现。如果你需要添加更多自定义的功能，可以考虑使用前者来完成你的开发工作。

下面是过程。

# 1. 软件准备

不太喜欢每到一步就去下载一个软件，个人喜欢把软件和环境先准备好。

本文章环境为 Win10，使用 Linux 的同学自己应该可以解决这些小问题。

- [NW.js](https://nwjs.io/)（*必要）
  - 本次工作的主体软件
  - 需要下载，然后解压
  - 解压后的目录为我们本次的工作根目录
- [Enigma Virtual Box](http://enigmaprotector.com/en/downloads.html)（*必要）
  - 打包工具，后面用它来打包成可执行`.exe`文件
  - 需要下载并安装
- [IconWorkshop-Pro](https://www.axialis.com/iconworkshop/)（*可选）
  - 用于创建程序的图标资源，需要下载并安装
  - 可以创建各种尺寸一整套图标，如果你没有这样的需求，自己用随便找一张图片转为`icon`格式的也可以
  - 或者直接使用默认的图标
- [Resource Hacker](http://www.angusj.com/resourcehacker/)（*可选）
  - 用于修改程序的 `icon`
  - 需要下载并安装

# 2. 打包

第一步里，我们解压了 NW.js 的压缩包，现在我们进入该目录。然后着手开始我们的工作。

![pic1](https://img.ioioi.top/wiki/explorer_2018-03-08_15-43-42.png)

## 2.1 创建一个项目文件夹

在当前目录下创建一个文件夹并**进入**。文件夹命名随意，比如我命名为`memobird`。

![pic2](https://img.ioioi.top/wiki/explorer_2018-03-08_15-45-08.png)

接着我们在当前目录下，创建两个文件：`index.html`和`package.json`。

![pic3](https://img.ioioi.top/wiki/explorer_2018-03-08_15-47-37.png)

- `index.html`
  - 打包后程序的入口文件，你可以在这个文件里设置一个跳转链接到目标网站

我的内容如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>memobird</title>
</head>
<body>
<script>
    window.location.href = "http://w.memobird.cn/cn/w/login.aspx";
</script>
</body>
</html>
```

可以看到，我设置了一个跳转，跳到咕咕机的 Web 版页面。你只需要把你的目标网站链接替换进去就行了。

- `package.json`
  - NW.js 的配置文件

我的内容如下：

```json
{
    "name": "Memobird",
    "version": "0.01",
    "main": "index.html",
    "window": {
      "width": 1024,
      "height": 768,
      "title": "Memobird"
    }
  }
```

此处只有几个参数，非常简单。

- `name`
  - 应用名称
- `version`
  - 版本号
- `main`
  - 程序入口页面
- `windows`
  - 程序窗口设置

这两个文件编辑好之后，将这两个文件打包为一个`.zip`格式的压缩包，并压缩包后缀改为`.nw`。

![pic](https://img.ioioi.top/wiki/Snipaste_2018-03-08_15-57-35.png)

*图示为使用 7-zip 压缩软件，你可以使用任何能达到同样效果的压缩软件*。

![pic](https://img.ioioi.top/wiki/Snipaste_2018-03-08_15-59-19.png)

![pic](https://img.ioioi.top/wiki/Snipaste_2018-03-08_15-59-30.png)

接着，把`.nw`后缀的文件，复制到上一目录，也即是我们工作的根目录。

![pic](https://img.ioioi.top/wiki/2018-03-08_16-03-00.png)

## 2.2 修改图标

如果你不需要修改图标，那么可以直接跳过这一步。我们在这里需要先修改`nw.exe`的图标，因为待会用`nw.exe`打包之后，默认图标就是`nw.exe`的图标。

打开[IconWorkshop](http://www.iconworkshop.cn/)软件，不需要选择创建`icon`，而是打开一张你选好的图片会比较快。当然，你也可以自己从零开始创建一个`icon`。

![pic](https://img.ioioi.top/wiki/2018-03-08_16-13-21.png)

在图片窗口左上角，找到创建`icon`的功能按钮。

![pic](https://img.ioioi.top/wiki/2018-03-08_16-14-45.png)

在弹出的对话框中，你可以自定义图标的信息。如果没什么要求直接确定即可。

点击确定之后，它会回到刚刚的图标窗口，这时候需要保存一下。

![pic](https://img.ioioi.top/wiki/2018-03-08_16-16-41.png)

这样我们的图标就制作完成了。

接着使用 Resource Hacker 修改 `nw.exe` 的图标。

- 打开 Resource Hacker
- 直接将 `nw.exe`拖入程序窗口
- 在左侧目录中找到`Icon Group`目录，并在子文件中找到默认图标

![pic](https://img.ioioi.top/wiki/2018-03-08_16-18-52.png)

- 接着右击该图标，选择 replace icon
  - 然后选择刚刚我们做的图标并替换即可

![pic](https://img.ioioi.top/wiki/2018-03-08_16-20-13.png)

最后保存更改并退出。

**虽然现在已经更改了，但是因为 windows 存在图标缓存，所以并没有发生变化。你可以将`nw.exe`复制到其他文件夹，就会看到变化了**。

##  2.3 打包文件

在我们工作目录下打开`cmd`，输入如下格式的命令：

```shell
copy /b nw.exe+memobird.nw mimobird.exe
```

![pic](https://img.ioioi.top/wiki/2018-03-08_16-25-06.png)

- `memobird.nw`是我们创建并复制过来的
- `memobird.exe`  将要是打包后并生成的文件的名字

你根据你自己的文件吗进行修改即可。

现在便可以打开`memobird.exe`看看效果了。

目前该文件只能在当前目录下运行，因为他需要一些资源文件。

接着，我们便把资源文件也一并打包进去。

# 3. 构建单文件执行程序

- 打开 Enigma Virtual Box
  - “封包主程”选择刚刚生成的 `memobird.exe`

接着打开我们的工作目录，把所有文件都拖进下面的空白中：

![pic4](https://img.ioioi.top/wiki/2018-03-08_16-31-06.png)

其中：`memobird.exe, memobird.nw`都是不需要的，你可以自己删掉。

然后点击“执行封包”按钮开始封包。

![pic5](https://img.ioioi.top/wiki/2018-03-08_16-32-40.png)

等待封包完成即可。

这样，我们就简单并且快速地完成了创建了一个桌面程序，内部挂载的是原站点。

实际上类似于浏览器的模式。

![pic6](https://img.ioioi.top/wiki/2018-03-08_16-37-34.png)

-----

*参看*：

- [使用NW将我们开发的网站打包成桌面应用](https://www.kancloud.cn/mikkle/thinkphp5_study/467061)
- [修改 node-webkit 的默认图标](http://keenwon.com/1311.html)
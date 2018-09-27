---
title: "如何判断萤石云视频是否可以播放"
date: 2018-09-26 15:23:39
tags:
  - "Android"
  - "视频"
  - "文件类型"
  - "萤石云"
  - "Tika"
  - "FFmpegMediaMetadataRetriever"


categories:
  - "Android"

description: "最近遇到一个需求，需要判断视频文件是否是真正的视频文件。什么意思呢？因为有一些文件虽然后缀是`.mp4`，但是『它的心』却是其他文件的心。所以一旦播放器播放它，可能就会出错了..."
---

最近遇到一个问题，需要判断视频文件是否是真正的视频文件。
什么意思呢？萤石的摄像头是将视频写入 TF 卡的：

> 通过萤石云视频平台将TF卡格式化后，程序会采用预占空间的方式预先将1/4的空间作为视频或者图片的存储空间。

然后他预写入的文件是`.mp4`后缀的，但是是不可播放的文件。所以一旦播放器播放它，可能就会出错了。为了避免这样的情况发生，我们能否在检索视频的时候就识别出无法播放的视频呢？

我一开始的思路是，能否通过判断文件类型的方式来判断是否播放呢？有可能他预格式化的视频文件，虽然后缀是`.mp4`，但是本质上不是一个视频文件呢？

# 判断文件类型
在 Java 中，比较常见的用来判断文件类型的库，就是[Apache Tika](http://tika.apache.org/)。
引入依赖后，使用起来也十分简单：

```java
File file = new File(System.getProperty("user.home")+ "/Downloads/");
        if (file.exists()){
            for (File file1 : Objects.requireNonNull(file.listFiles())){
                if (file1.isDirectory()){
                    continue;
                }
                try {
                    String type = new Tika().detect(file1);
                    System.out.println(file1.getName() + " ======>>> " + type);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
```

下面是输出结果：

```shell
background.svg ======>>> image/svg+xml
new.json ======>>> application/json
mid_top_1.jpg ======>>> image/jpeg
.DS_Store ======>>> application/octet-stream
apache-maven-3.5.4-bin.tar.1.gz ======>>> application/x-gzip
这本来是张 png 图片.mp4 ======>>> image/png
.localized ======>>> application/octet-stream
old.json ======>>> application/json
不学无数 — Java 中 IO 和 NIO - 掘金.pdf ======>>> application/pdf
Layout_Mobile_Whiteframe.ai ======>>> application/pdf
Snipaste_2018-09-22_22-36-21.png ======>>> image/png
background.png ======>>> image/png
hiv00014.mp4 ======>>> video/mp4
SeimiCrawler-master.1.zip ======>>> application/zip
cn_windows_10_business_editions_version_1803_updated_march_2018_x64_dvd_12063730.iso ======>>> application/x-iso9660-image
i_con_permission.png ======>>> image/png
错误.png ======>>> image/png
open_gapps-arm64-9.0-pico-20180923.zip ======>>> application/zip
forPush.sh ======>>> application/x-sh
adbIn.sh ======>>> application/x-sh
Havoc-OS-v2.0-20180923-oneplus3-Official.zip ======>>> application/zip
MockingBot.dmg ======>>> application/octet-stream
```

可以看到，几乎全部格式都识别出来了。而且我这里有一个『浑水摸鱼』的『家伙』，那就是`这本来是张 png 图片.mp4`，人如其名。
这个也识别出来了（`octet-stream`指的是二进制文件）。
那 Tika 究竟是怎么做的呢？让我们来看看源码呗。
篇幅所限，如果你对这个部分有兴趣，可以移步我的另一篇文章[Tika 源码浅析](https://blog.rosuh.me/2018/09/tika-source-code-analysis/)。

*这里假设你已经看过了 Tika 源码...*

现在我们知道了 Tika 通过文件的首部字节、文件后缀判断文件的类型。但是这样依旧无法判断视频是否可以播放。
因为在实际使用中，我发现，有一些个视频文件，虽然是无法播放的，但是它们的首部已经被写入了，成为另一个『空视频文件』。
真的蛋疼。如果单纯使用 Tika 的话，显然会有误差。
那么有没有其他应用层面的 trick 呢？

答案就是 [FFmpegMediaMetadataRetriever](https://github.com/wseemann/FFmpegMediaMetadataRetriever)。

# FFmpegMediaMetadataRetriever 是什么？

之所以说是 trick...是因为 FFmpegMediaMetadataRetriever 是一个获取媒体文件信息的库。
我在使用时发现，如果一个视频只被写了头部，但是没有实际内容的话，该视频是没有编码信息的。
这个想法是来自[MediaInfo](https://zh.wikipedia.org/zh-hans/MediaInfo)这个软件。因为我是先用这个软件测试了一遍，发现是可行的。
然后我找到了在 Android 平台可用的一个类似的库，也就是 FFmpegMediaMetadataRetriever

## 使用

我们引入依赖

```gradle
implementation 'com.github.wseemann:FFmpegMediaMetadataRetriever:1.0.14'
```

然后开始使用：

```java
public static List<String> getAvailableVideoList(String SDCardPath){
    if (TextUtils.isEmpty(SDCardPath)){
        return null;
    }

    List<String> pathList = new ArrayList<>();
    FFmpegMediaMetadataRetriever mediaMetadataRetriever = new FFmpegMediaMetadataRetriever();
    File fileList = new File(SDCardPath);
    if (fileList.exists()) {
        try {
            for (File file : fileList.listFiles()) {
                if (file.getName().endsWith("mp4")){
                    mediaMetadataRetriever.setDataSource(file.getPath());
                    mediaMetadataRetriever.extractMetadata(METADATA_KEY_VIDEO_CODEC);
                    pathList.add(file.getPath());
                }
            }
        } catch (IllegalArgumentException iae) {
            iae.printStackTrace();
        }
    }
    return pathList;
}
```

如果视频文件无效的，FFmpegMediaMetadataRetriever 会抛出一个异常：

```shell
java.lang.IllegalArgumentException: setDataSource failed: status = 0xFFFFFFFF
```

然后我们捕获这个异常，做一些其他的工作就可以。
这个方法就目前的使用来看，是最稳定和准确的方法。
缺点是：

- `setDataSource()`过程有一些耗时，实际上测试，256MB 的视频文件，调用一次需要将近 1s 的时间

- 会抛异常...

# 还有其他办法吗？

最一开始想的，其实是开一个 VideoPlayer，然后在`onError()`设一个监听器，如果播放错误就说明该文件无效。
但是经过我自己的评估，这样的性能实际上更差。

也不知道是否有其他更优的方法，如果有的话，还请不吝赐教~



-----

*参看*

- [How to reliably detect file types?](https://stackoverflow.com/questions/9738597/how-to-reliably-detect-file-types)

- [MediaInfo](https://zh.wikipedia.org/wiki/MediaInfo)
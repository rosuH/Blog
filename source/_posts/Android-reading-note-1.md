---
title: "Android 札记系列(1)：模块化和OKHTTP"
date: 2018-07-24
tags:
- 'Android'
- '札记'
- '模块化'
- 'OkHttp3'

categories:
- 'Android'

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是 Android 中的模块化以及 `OkHttp`的一些用法"
---

## 模块化步骤

1. 新建模块
2. 编写模块内容
3. 在主模块中添加模块（`build.gradle`中添加依赖）

```groovy
implementation project(path: ':downloadlibrary')
```



## OkHttp 与 文件

1. `okhttp`会另起子线程，所以更新 UI 要注意回到主线程更新
2. 文件写入需要写入权限

```xml
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

3. 获取目录的区别

```java
Environment.getExternalStorageDirectory() --> /storage/emulated/0
Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES) --> /storage/emulated/0/Pictures
Context.getFilesDir() --> /data/user/0/com.example.air.downloaddemo/files
```

前两者可以获取 SD 卡里的目录，是独立 App 存在的目录。最后一个获取 App 的私有目录。
---
title: "Android 札记系列 (10)：屏幕适配、ADB 使用和一些异常"
date: 2018-08-14 15:47:03
tags:
  - "Android"
  - "屏幕适配"
  - "ADB"
  - "Android Studio"

categories:
  - "Android"

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是了解屏幕适配的基础、ADB WiFi 调试和其他的一些 tips..."
---

# 屏幕适配资料集合

- [官方文档](https://developer.android.com/guide/practices/screens_support)
- [解释了为什么 1px = 1dp, 160dp 为什么被作为基准线](https://juejin.im/post/5847fe8cac502e006ce7cc6b)
- [ 解释了 dp](https://www.jianshu.com/p/bd3944b56b41)
- [今日头条的屏幕适配方案](https://mp.weixin.qq.com/s/d9QCoBP6kV9VSWvVldVVwA) 
- [宽高限定符适配方案](https://mp.weixin.qq.com/s/X-aL2vb4uEhqnLzU5wjc4Q)


# ADB 使用 tips

## Mac 上设置环境 ADB 环境变量

```shell
echo "export PATH=\$PATH:/Users/${USER}/Library/Android/sdk/platform-tools/" >> ~/.zshrc && source ~/.zshrc
```

## 推送文件到设备

```shell
adb push local/path/file /device/path

# 例子

adb push Typora.dmg /storage/emulated/0/
```

## 从设备拉取文件到电脑

```shell
adb pull devices/path/file /local/path/
# 例子
adb pull storage/emulated/0/Download/tmp.apk ./
```

## 使用 WIFI 进行 Debug

### 如果你能使用 USB 连接设备

用 USB 线连接上你的设备，然后：

```shell
# 电脑终端输入
adb tcpip 5555
# 提示
restarting in TCP mode port: 5555

# 拔出 USB 线，输入
adb connect ip:5555  # 此 ip 是你设备的 ip 地址，自行替换

```

### 如果你没法使用 USB 连接设备

```shell
# 在手机打开终端（或终端模拟器）
su  # 获取最高权限
setprop service.adb.tcp.port 5555   # 设置监听端口
# 重启 adbd 服务
stop adbd  
start adbd
```
然后在你电脑的终端输入：

```shell
# 此 ip 是你设备的 ip 地址，自行替换
adb connect ip:5555
```

### 取消 WiFi debug 模式

```shell
# 连接上手机，在电脑终端输入
adb shell
su
setprop service.adb.tcp.port ""
stop adbd
# 这个时候会断开连接
# 你需要手动去『开发者选项中』，切换一下『USB 调试』，让他重启 adbd 服务
```

*参看*：

- [how to use adb command to push a file on device without sd card](https://stackoverflow.com/questions/20834241/how-to-use-adb-command-to-push-a-file-on-device-without-sd-card)

- [Android WIFI Debug](https://blog.csdn.net/hongjinqun/article/details/27094425)


# OkHttp 调用两次`string()` 抛异常

> java.lang.IllegalStateException: closed
            at com.squareup.okhttp.internal.http.HttpConnection$FixedLengthSource.read(HttpConnection.java:455)
            at okio.Buffer.writeAll(Buffer.java:594)
            at okio.RealBufferedSource.readByteArray(RealBufferedSource.java:87)
            at com.squareup.okhttp.ResponseBody.bytes(ResponseBody.java:56)
            at com.squareup.okhttp.ResponseBody.string(ResponseBody.java:82)

*参看*： 

- [java.lang.IllegalStateException: closed when trying to access response in onResponse(Response response) #1240](https://github.com/square/okhttp/issues/1240)

# 模块被添加两次报异常

`build`的时候抛出如下异常：

>  ...(Duplicate zip entry [android/support/annotation/c.class == support-annotations-22.2.1.jar:android/support/annotation/AnyRes.class]))
:app:transformClassesAndResourcesWithProguardForRelease FAILED

是因为在`build.gradle`中，某个模块被添加了两次。你找到上述报错细节，可以看到是哪个模块被添加了两次。
比如这里是`support-annotations-22.2.1.jar`这个包。

*参看*：

- [Studio 签名打包出现 java.io.IOException: Can't write、Can't read 异常](https://blog.csdn.net/hongjinqun/article/details/27094425)

# 设备一直提示"Waiting For Debugger"

在非调试模式下，也会出现这个提示，解决方法就是重启设备。

*参看*：

- [Why Android Studio says “Waiting For Debugger” if am NOT debugging?](https://stackoverflow.com/questions/20537845/why-android-studio-says-waiting-for-debugger-if-am-not-debugging)







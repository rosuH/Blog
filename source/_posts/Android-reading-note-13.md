---
title: "Android 札记系列 (13)：各种 tips 和 tricks"
date: 2018-09-28 15:35:26
tags:
  - "Android"

categories:
  - "Android"

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来..."
---

# Java 相关

## Java 文件分隔符

1. separator: 跨平台文件分隔符，依据不同平台来取不同的值. Windows 下是`\`，Unix 系统下是`/`

2. separatorChar: 1 的字符形式

3. pathSeparator: 跨平台的路径分隔符. 比如环境变量之间的分隔符，Unix 下是`:`，Windows 下是`;`

4. pathSeparatorChar: 3 的字符形式

*参看*

- [https://stackoverflow.com/questions/27746419/file-separator-vs-file-pathseparator](https://stackoverflow.com/questions/27746419/file-separator-vs-file-pathseparator)

## Java 获取文件大小

我们平时使用的`File.length()`方法，返回是以`byte`为单位的文件大小。
我们需要自行转换成为`MB`或`GB`。

```java
double sizeInKB = (file.length() + .0) / 1024;
double sizeInMB = (file.length() + .0) / 1024 / 1024;
double sizeInGB = (file.length() + .0) / 1024 / 1024 /1024;
```

*参看*

- [how to get size of file in mb?](https://stackoverflow.com/questions/8989746/how-to-get-size-of-file-in-mb)

## Java 格式化字符串

`float`和`double`类型的，需要标注有效位数。比如在`strings.xml`文件中可以这么写：`$1%0.f`。

*参看* ：

- [Android: String format with Double value](https://stackoverflow.com/questions/12169826/android-string-format-with-double-value)

# Android 相关

## 自定义 ProgressBar

*参看*

定义水平进度条

- [How to Customize a Progress Bar In Android](https://stackoverflow.com/questions/16893209/how-to-customize-a-progress-bar-in-android)

定义圆圈型进度条

- [Android Material Design ProgressBar 使用经验（导入，颜色自定义等）](https://blog.csdn.net/csdn393417081/article/details/47749165)

## TextView ellipsize 属性

第一次发现有这个视图属性...可以方便地设置`TextView`的文字超过最大长度之后的显示方式。

- [Android 控件 TextView 中 ellipsize 属性（设置当文字长度超过 textview 宽度时的显示方式）](https://blog.csdn.net/Zhangxichao100/article/details/52139123)

## 获取 Mac 地址

```java
private final static String STATIC_W_LAN0 = "wlan0";
/**
* 获取设备的mac地址，小写！
* 需要 android.permission.ACCESS_WIFI_STATE 权限
* @return 如果获取不到 MAC 地址，将返回 null
*/
public static String getMachineHardwareAddress(){
    Enumeration<NetworkInterface> interfaces = null;
    try {
        interfaces = NetworkInterface.getNetworkInterfaces();
    } catch (SocketException e) {
        e.printStackTrace();
    }
    String hardWareAddress = null;
    NetworkInterface iF;
    while (Objects.requireNonNull(interfaces).hasMoreElements()) {
        iF = interfaces.nextElement();
        try {
            hardWareAddress = bytesToString(iF.getHardwareAddress());
            if(iF.getName().equals(STATIC_W_LAN0)){
                hardWareAddress = hardWareAddress.replace(":","");
                break;
            }
        } catch (SocketException e) {
            e.printStackTrace();
        }
    }
    return hardWareAddress == null ? null : hardWareAddress.toLowerCase() ;
}

/***
* byte转为String
* @param bytes
* @return 如果传入的 byte 数组为空，则返回 null
*/
private static String bytesToString(byte[] bytes){
    if (bytes == null || bytes.length == 0) {
        return null ;
    }
    StringBuilder buf = new StringBuilder();
    for (byte b : bytes) {
        buf.append(String.format("%02X:", b));
    }
    if (buf.length() > 0) {
        buf.deleteCharAt(buf.length() - 1);
    }
    return buf.toString();
}
```

在华为 DUA-AL00 上测试有效。



## Android Studio Locat 配色

*参看*

- [Colored logcat in android studio by colorpid](https://stackoverflow.com/questions/19933731/colored-logcat-in-android-studio-by-colorpid)

## File.listFiles() 返回 null

因为没有申请读取权限...

*参看*

- [File exists and IS directory, but listFiles() returns null](https://stackoverflow.com/questions/20714058/file-exists-and-is-directory-but-listfiles-returns-null)



## Android Studio 注释模板

一开始我是在`class`里面设置的，后来发现直接在`File Header`里设置更好。

```java
/**
* Created by ${USER} on ${DATE}.
* or
* @author ${USER}
* @date ${DATE}
*/
```

*参看* 

- [Change Author template in Android Studio](https://stackoverflow.com/questions/21160288/change-author-template-in-android-studio)


## EditText 获取聚焦

可以调用`EditText.requestFocus()`方法。

*参看* 

- [Set Focus on EditText](https://stackoverflow.com/questions/14327412/set-focus-on-edittext)

## Android 设置屏幕常亮

在视图类里，获取一个`FLAG`标识：

```java
getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

// 不需要的时候可以取消掉
getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
```

*参看* 

- [Android 保持屏幕常亮的几种方法](https://juejin.im/post/592d8f4e0ce46300579e1df7)

## 使用一个全局 Toast 避免多个 Toast 占据太长时间

```java
/**
    * 显示 Toast
    * @param resId 资源 id
    */
private void showToast(int resId){
    if (mToast == null){
        mToast = Toast.makeText(mContext, resId, Toast.LENGTH_SHORT);
    }else {
        mToast.setText(resId);
        mToast.setDuration(Toast.LENGTH_SHORT);
    }
    mToast.show();
}
```

*参看* 

- [android 关于Toast重复显示解决方法](https://www.cnblogs.com/zzw1994/p/5110399.html)

## Android Activity 四种启动模式

- Standard
    - 默认启动模式，一个 Activity 可以有多个实例，比如你在 A 中调用 newIntent(this, A.class)，则会变成 A-->A

- SingleTop
    - 如果栈顶是一个 A 的实例，那么调用 newIntent(this, A.class) 会自动复用这个实例，不会新建一个实例。如果栈顶不是 A，那么新建实例。

- SingleTask
    - 如果该 Activity 没有使用`taskAffinity`指定某个`activity`作为相关栈，则系统会新建一个『任务』，并且这个 Activity 作为根视图（栈底）
    - 如果该 Activity 使用`taskAffinity`指定了相关`activity`，那本 Activity 将会添加到那个相关 Activity 的栈内，并且作为栈顶存在

- SingleInstance
    - 系统为之创建一个新任务给它使用，不允许其他 Activity 存在于该栈。所以如果有其他在该 Activity 打开的任何新 Activity，系统都将新建一个任务并将之添加进去

### 两种声明启动模式的方式的区别

- `AndroidManifest.xml`中`launcherMode`属性，表明所有方式启动本`Activity`都将使用属性声明的方式启动

- `intent.addFlags(int flags)`方式启动的，单次生效

*强烈建议阅读*

- [你真的了解Activity的启动模式吗？](https://www.jianshu.com/p/9dd6d473da76)

## 非视图类调用 getResources()

目前一个可行的方法是在`Application`中实例化一个全局的`context`，然后调用这个`context`。


```java
public class App extends Application {
    public static Resources res;

    @Override 
    public void onCreate() {
        super.onCreate();
        res = getResources();
    }

    public static Context getContext(){
            return mContext;
    }
}

// 使用
App.getContext().getResources();
```

*参看*

- [How can I get a resource content from a static context?](https://stackoverflow.com/questions/4391720/how-can-i-get-a-resource-content-from-a-static-context/4391811#4391811)

## ADB 启动 APP | 测量启动时间

```shell
adb shell am start -W com.package.name/com.package.name.ActivityName
```

结果：

```shell
Status: ok
Activity: me.rosuh.android.jianews/.HomeActivity
ThisTime: 672
TotalTime: 672
WaitTime: 759
Complete
```

*参看*

- [How to start an application using android ADB tools?](https://stackoverflow.com/questions/4567904/how-to-start-an-application-using-android-adb-tools?answertab=active#tab-top)
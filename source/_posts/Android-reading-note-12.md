---
title: "Android 札记系列 (12)：权限动态申请、Rxjava 及其他"
date: 2018-09-09 16:26:24
tags:
  - "Android"
  - "权限"
  - "RxJava"


categories:
  - "Android"

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是了解 Android 动态权限申请、RxJava GUI 线程消息队列、Lottie 动画播放的问题和一些其他的 tips..."
---

# Android 动态申请权限

本以为权限问题了解得应该足够了，但是这几天在实际运用中还是遇到了一些坑。先从原生 API 的使用讲起吧。

## 原生 API 申请范例

在 Android 中，原生申请一般需要用到下面几个方法：

```java
/**
* 检查权限
*/
if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE)
      != PackageManager.PERMISSION_GRANTED){
}

/**
* 申请权限
*/
ActivityCompat.requestPermissions(MainActivity.this,
          new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, REQUEST_CODE);

/**
* 权限申请结果回调
*/
@Override
public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
    if (requestCode == REQUEST_CODE){
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED){
            Toast.makeText(MainActivity.this, "权限申请成功", Toast.LENGTH_SHORT).show();
        }
    }
}

```

系统的 API 三部曲，用起来令人 ~~流连忘返~~。之前用得不熟悉，主要是这些包名、方法名没去记...

其实有很多优秀的第三方权限库，比如 Google 自己的 [easypermissions](https://github.com/googlesamples/easypermissions)，以及链式调用的 [RxPermissions](https://github.com/tbruyelle/RxPermissions)。

一开始以为 [RxPermissions](https://github.com/tbruyelle/RxPermissions) 可以支持 RxJava 链，结果发现两者实际上是分开的。

## Android 8.0 权限组 tips

在 Android 8.0+ 的手机上，属于同一权限组的权限，在需要的时候都要手动申请。
如果组内其他权限已被授予，那么其他权限的申请请求会直接被授予，而不会打扰用户。
比如，你已经向用户申请并获得了了`READ_EXTRAL_STORAGE`权限，那么如果你不申请的话，你是没有`WRITE_EXTRAL_STORAGE`权限的。如果你发起权限申请，系统会自动授予你`WRITE_EXTRAL_STORAGE`，而不会打扰用户。

*参看* :

- [Android 运行时权限管理最佳实践](https://www.jianshu.com/p/fb7a4c307a10)

# RxJava GUI 线程发送消息

我们在 Android 开发中使用 RxJava 时，一般会同时使用 RxAndroid，因为后者可以提供了一个`AndroidSchedulers.mainThread()`调度器，方便我们直接切换回主线程。
但是最近我遇到了一个问题，如果类似于下面的代码：

```java
mTextView.setText("First Set");
Observable
    .just("test")
    .observeOn(AndroidSchedulers.mainThread())
    .map(new Function<String, Object>() {
        @Override
        public Object apply(String s) throws Exception {
            mTextView.setText("Second Set");
            return s;
        }
    })
    .subscribe();
mTextView.setText("Third Set");
```

一开始我以为，`mTextView.setText("Second Set")`已经是在 GUI 线程操作了，所以上述代码会按照顺序执行。
但实际上的顺序却是 1->3->2。也就是在 RxJava 中的视图操作在最后才执行。
这是为什么呢？实际上在 RxJava 内部，并不是在主线程直接执行视图操作，而是在主线程发送消息到`observeOn()`所设定的线程。所以即便是该线程设定为 UI 线程，也是需要经历过消息的发送到接受这一步。
一旦消息被发送出去，当前代码块就执行完毕，就会顺序执行下去，也就是开始执行 3 了，然后才接收到 2 发出的消息。

在实际使用中，可以尽量让视图操作都放在 RxJava 调用链中，这样可以保证视图更新的消息队列正常。

*参看*：

- [详解 RxJava 的消息订阅和线程切换原理](https://juejin.im/post/5b1fbd796fb9a01e8c5fd847)
- [Shouldn't AndroidSchedulers.mainThread() act as Schedulers.immediate() when already on the main thread? #335](https://github.com/ReactiveX/RxAndroid/issues/335)

# 其他

- 视图动画的的可见状态如果是`GONE`，那么首次动画播放时它的`pivot`可能失效，因为父布局无法获取它的宽高

- 循环弹跳动画，包括『延迟--弹跳--延迟』的动画效果，可以使用 RxJava 的`interval`来定时激活动画，以达到循环的效果

- Java 的正则中，`Matcher`对象需要手动调用一次`find()`方法，才会有结果，不然`matcher.group()`就会返回空

- [自定义 Spinne 样式](https://stackoverflow.com/questions/2927012/how-can-i-change-decrease-the-android-spinner-size)

Spinner 的样式大部分取决于内部的`TextView`的样式，所以你更改`TextView`的样式即可。包括最大或最小宽高等等。

- [自定义 ProgressBar](https://stackoverflow.com/questions/16893209/how-to-customize-a-progress-bar-in-android)

- [Lottie](https://github.com/airbnb/lottie-android) 动画需要手动调用`play`

- [面向对象设计原则之开闭原则](https://gof.quanke.name/面向对象设计原则之开闭原则.html)

- [Java 中的 Objects.requireNonNull 是什么？](https://stackoverflow.com/questions/45632920/why-should-one-use-objects-requirenonnull/45632962)

- [OkHTTP log 拦截器，可以帮你迅速定位网络问题](https://stackoverflow.com/questions/34133621/retrofit-400-bad-request)

- [Android 中的格式化字符串和 XML](https://stackoverflow.com/questions/33164886/android-textview-do-not-concatenate-text-displayed-with-settext)







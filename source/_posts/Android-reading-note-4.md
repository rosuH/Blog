---
title: "Android 札记系列(4)：AtomicBoolean, final 和 第三方库"
date: 2018-07-30
tags:
- 'Android'
- 'AtomicBoolean'
- 'final'
- 'PermissionDispatcher'

categories:
- 'Android'

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是`final`关键字的使用，以及一些第三方库"

---

# AtomicBoolean

> A `boolean` value that may be updated atomically. See the `java.util.concurrent.atomic` package specification for description of the properties of atomic variables. An `AtomicBoolean` is used in applications such as atomically updated flags, and cannot be used as a replacement for a `Boolean`.

`AtomicBoolean`是一个值可以被自动更新的原子工具类。其中的一个方法我们用得最多：`compareAndSet(boolean expect, boolean update)`。这个方法最好的地方在于，他的『判断』和『更新操作』是原子的，中间不会被其他线程插入。这样非常适合多线程情况下的判断。

常见的情况是：

```java
boolean isRunning = false;

if (!isRunning){
    //do something
    isRunning = true;
} else{
    // do not work;
}
```

我们经常使用一个`boolean`变量作为标志，判断当前方法是否已经被某个线程调用。如果是的话，那么更新这个标志位`true`，那么其他线程在`if`判断就进不去了。

但是如果是多线程情况下，当`thread1`刚刚执行完`!isRunning`的判断，还没执行到`isRunning = true`的标志位转换语句时，`thread2`已经开始执行判断了，这个时候`thread2`就会通过判断进入`if`代码块。

解决的方法就是使用`AtomicBoolean`的`compareAndSet()`方法。

```java
AtomicBoolean isRuning = false;
if (isRunning.compareAndSet(false, true)){
    // do something
} else {
    // do something
}
```

这个`compareAndSet`方法是原子方法，这个方法被执行时，其他线程无法进入。

这个方法的含义是，第一个参数是预期值，如果`isRunning`符合预期值（即是`isRunning == expect`），那么更新他的值为第二个参数（`isRunning = update`），然后返回`true`，也就是进入`if`代码块。

这样我们就可以避免『判断』和『更新』标志之间有其他线程进入了。

*参看*：

- [AtomicBoolean in Android Developer](https://developer.android.com/reference/java/util/concurrent/atomic/AtomicBoolean)
- [AtomicBoolean 的介绍与使用](https://www.jianshu.com/p/9985810bd8cb)

# final 关键字、修饰类

- `final`声明变量，表示该变量只可读
- `final`声明方法，表示该方法不可被子类重写，编译时绑定
- `final`声明类，表示该类不可被继承

*参看*：

- [深入理解 Java 中的 final 关键字](http://www.importnew.com/7553.html)

# PermissionDispatcher 库

一个通过注解的方式来控制和声明运行时权限的第三方库。

- https://github.com/permissions-dispatcher/PermissionsDispatcher

# Protocol Buffer

一种与语言无关，平台无关，可扩展的序列化结构化数据的方法，用于通信协议，数据存储等。

- https://developers.google.com/protocol-buffers/docs/javatutorial

# RenderScript

> **Renderscript**（渲染脚本）是[Android操作系统](https://zh.wikipedia.org/wiki/Android)上的一套[API](https://zh.wikipedia.org/wiki/%E5%BA%94%E7%94%A8%E7%A8%8B%E5%BA%8F%E6%8E%A5%E5%8F%A3)。它基于[异构计算](https://zh.wikipedia.org/wiki/%E5%BC%82%E6%9E%84%E8%AE%A1%E7%AE%97)思想，专门用于密集型计算。 — Wikipedia



- https://www.developer.com/ws/android/development-tools/writing-native-android-code-ndk-vs.-renderscript.html

- [Renderscript WIkipedia](https://zh.wikipedia.org/wiki/Renderscript)

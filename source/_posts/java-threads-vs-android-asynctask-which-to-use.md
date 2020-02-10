---
title: "「译」Java Thread vs AsyncTask：该用哪个？"
date: 2018-5-15 16:23
tags:
- 'Android'
- 'Java'
- '线程'
- 'AsyncTask'
- 'Thread'

categories:
  - "技术"

description: "在 Android 开发中，有一个非常重要但是较少被讨论到的问题：UI 的响应。这个问题一部分由 Android 系统本身决定，但更多时候是还是开发者的责任。抛开其他问题而言，解决..."
---

> 本文发布于[我的博客](https://blog.rosuh.me/2018/05/java-threads-vs-android-asynctask-which-to-use/)
>
> 此文章为「译文」，原文链接：http://www.mergeconflict.net/2012/05/java-threads-vs-android-asynctask-which.html
>
> 翻译已获原作者授权。水平有限，如有缺漏，恳请指正，谢谢~

# 前言

在 Android 开发中，有一个非常重要但是较少被讨论到的问题：UI 的响应。这个问题一部分由 Android 系统本身决定，但更多时候是还是开发者的责任。抛开其他问题而言，解决 Android 应用 UI 响应问题的关键，就是尽可能地让大部分耗时工作转移到后台执行。众所周知，将耗时任务或是 CPU 密集型任务放到后台运行的方法，基本上只有两个：

- Java Thread
- Android 原生`AsyncTask`辅助类

两者不一定能分出个孰优孰劣，因此了解他们各自的使用场景，对您的优化性能是有一定的好处的。

## AsyncTask 的使用场景

- 不需要下载大量数据的简单网络操作
- I/O 密集型任务，耗时可能几个毫秒以上

## Java Thread 使用场景

- 涉及中等或大量的网络数据操作（包括上传和下载）
- 需要在后台执行的 CPU 密集型任务
- 当你想要在 UI 线程控制 CPU 占用率时

还有一个老生常谈的问题就是，千万不要在 UI 线程（主线程）执行网络操作。你需要使用上述两种方式之一来访问网络。

# 关键点

Java Thread 和 `AsyncTask`最关键的不同点在于，`AsyncTask`运行在 GUI 线程¹  上，所以繁重的 CPU 任务都可能导致 UI 响应性下降。Java Thread  可以拥有不同的线程优先级，使用低优先级的线程来完成非实时运算任务能够很好地为 GUI 操作释放 CPU 时间。这是提高 GUI 响应性的关键点之一。

然而，正如很多 Android 开发者所了解的，你无法在后台线程更新 UI 组件，不然就会抛出异常。这对于 `AsyncTask`来说并不是什么大事² ，但是当你使用的是 Java Thread，那么你必须在你操作结束的时候使用`post()`来更新 UI³ 。

---

译者按原文查找资料注：

1. `AsyncTask`必须在主线程加载，其中除了`doInBackground(Object [])`方法外，其余三个方法都在 UI 线程运行
2. 基于第一点，`AsyncTask`可以在其余三个方法中更新 UI 组件
3. 可以使用`view.post()`方法来更新 UI 组件，这个方法和使用`Activity.runOnUiThread()`方法区别不大

*参看*：

- [Java threads vs. Android AsyncTask: Which to use?](http://www.mergeconflict.net/2012/05/java-threads-vs-android-asynctask-which.html)
- [AsyncTask Android Developers](https://developer.android.com/reference/android/os/AsyncTask)
- [Update UI from Thread](https://stackoverflow.com/questions/4369537/update-ui-from-thread)
- [Android: What's the difference between Activity.runOnUiThread and View.post?](https://stackoverflow.com/questions/10558208/android-whats-the-difference-between-activity-runonuithread-and-view-post) 

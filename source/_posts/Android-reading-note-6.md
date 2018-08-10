---
title: "Android 札记系列(6)：XML、SurfaceView 和动画"
date: 2018-08-08 21:41:25
tags:
- 'Android'
- 'SurfaceView'
- 'View'
- 'ViewPager'

categories:
- 'Android'

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是 XML 编辑器的一些问题、surfaceView、补间动画等"

---

# XML 编辑器补全失效

在 Android Studio 中，我们会使用`Shift`+`Command`+空格 切换智能提示效果，但是今天发现我在 XML 编辑器下面，Android Studio 没有提示属性了。
出现了下面的提示信息：

> Unknown attribute android...

Google  了一番，发现时 Gradle Sync 失败的原因。重新 Sync 就行了。

*参看*：
[Unknown attribute android:layout_width, layout_height, id, gravity, layout_gravity, padding](https://stackoverflow.com/questions/35308735/unknown-attribute-androidlayout-width-layout-height-id-gravity-layout-gravi)

# SurfaceView

今天才了解到`SurfaceView`这个东西，原来还有可以在子线程更新视图的方法。
然后接着了解了 Android 绘图的流程和机制，才了解了一些些。
下面的是我的一些笔记和理解。

## Surface 和 View

很明显，`SurfaceView`就是`Surface`和`View`合成的。那么底层是不是真的有`Surface`这个东西存在呢？
事实确实是有的，而且`Surface`和`View`结合之后就成了`SurfaceView`了。

我们知道`View`是可见的视图，既然是可见，那说明是离用户最近，既是离底层最远。也就是高层视图。
`View`下面就是`Surface`这个组件。
我们可以看到下面这张 Android 官方的视图组件层次图![Android 官方的视图组件层次图](https://google-developer-training.gitbooks.io/android-developer-advanced-course-practicals/images/11-2-p-create-a-surfaceview/dg_Surfaceview_surface.png)，这不是一张『继承图』，而是一张『层次』图。

这里由两个特点：

- `Surface`是在这张图里的最底层
- `SurfaceView`和其他同层的组件是分开的

下面我逐一解释。

### Android 底层绘图逻辑（图形结构）

Android 绘图数据流程，是一个『生产者-消费者』模型。如果你还不了解这个设计模式，建议先了解一下。

一个最大概的数据流向图示是这样的：

```shell
Application --> BufferQueue --> System(Harware) --> User
```

这里我分了三个角色。第一个应用侧、一个是缓冲队列最后一个是系统侧。

我们常说的`View`的绘图的三个流程：`Mesaure, Layout, Draw`就是属于应用侧的绘制。
应用侧绘制完成之后，系统侧将绘制的数据读取回去，在硬件层进一步绘制。
这里的『生产者』是应用侧，缓冲区是『BufferQueue』，消费者是系统侧。
但是应用侧内部也有数据流动，也是『生产者-消费者』模型。而我们要讲的`SurfaceView`就在这里面咯。

#### 应用侧绘制

在 Android 底层部件中，有一个`BufferQueue`部件，见名知意，这个部件就是一个缓冲队列。这个东西充当『生产者-消费者』中的『缓冲区』的角色。

应用侧『生产者』是谁呢？就是`Surface`这个部件了。那么它是怎么生产的呢？
回去看看上面那张图片，`ViewGroup` --> `View` --> `Surface`这个结构。
实际上在`View` --> `Surface`中间是通过`WindowManager`来传递消息的。没想到吧，这还有一个中间人。
此外，`Activity`也并不是我们的视图管理者，其实这个`WindowManager`（还有一个`ViewRoot`）才是视图管理者。`Activity`持有一个`WindowManager`的引用，它只是做一些生命周期和事件控制的工作。视图管理是由`WindowManager`和另外一个`ViewRootImpl`类来实现的。
可以看看[这篇文章](https://github.com/LRH1993/android_interview/blob/master/android/basis/decorview.md)来详细了解哦。
此外，在没有`SurfaceView`的时候，一个 Application 只有一个`Window`哦。这个`Window`里面就有一个`Surface`，`Surface`里面装有`View`。

#### 系统侧绘制

在`View`的测量、布局和绘制完成之后，UI 还没有显示到屏幕上。这个时候，`WindowManager`会向一个叫`SurfaceFlinger`发起通信，向他请求一个`Surface`，而这个请求的`Surface`上面就有一个`BufferQueue`作为缓冲区啦。
这个时候，我们的应用就会将`View`的 UI 数据，写入到该缓冲区里。而`SurfaceFlinger`就会把缓冲区里的数据发给硬件层渲染（『生产者-消费者』）。
等系统侧硬件层渲染完，我们用户就可以在显示屏上看到真正的 UI 了。

## 结果

现在是不是有点了解这些东西了呢。
我们回过头看上面那张层次图片，会发现`SurfaceView`和其他普通`View`是区分开的。
这就是`SurfaceView`的特点啦。`SurfaceView` 其实是`Surface`和`View`的『结合体』。
我们上面说了`Surface`是 UI 数据填充的地方，而顶部的 UI 组件，比如`Button`和`TextView`他们在主线程渲染，也就是说在主线程的`Surface`里面。
我们知道，Android 的所有 UI 交互都是在主线程完成的。如果一项任务阻塞主线程，那么会导致 ANR。那么我们其实可以预想到，如果有一个**复杂**的 UI 视图，在主线程频繁刷新，那么肯定会导致卡顿的情况发生。
因为主线程不单单处理 UI 的事情，他还有处理其他交互，比如事件分发等。如果你 UI 太复杂，然后还频繁调用`invalidate()`方法来刷新视图，那么卡顿是在所难免的。

解决的办法就是使用`SurfaceView`咯。`SurfaceView`和其他视图组件的最大差别是，它自己在子线程创建了一个`Surface`。
我们知道，`Surface`是依附在`Window`上的。所以`SurfaceView`会向`WindowManager`请求创建多一个`Window`，然后在上面创建一个`Surface`来存放 UI 数据...这简直就是『另起炉灶』嘛。

不过得益于这个『炉灶』只有他一个人是使用，不像主线程，还要处理其他事情。所以这个`View`可以专一地处理视图层的工作。这保证了他能够更好地处理频繁刷新的工作。

## 其他

在使用`SurfaceView`的过程中，我也遇到了一些`tips`：

- `Surface`是位于底层的
    这里我说的是`Surface`，而不是`SurfaceView`。对于`SurfaceView`的影响就是不可设置`alpha`属性。严格地说，是只能设置 100% 和 0%，如果你想要实现渐变等效果，是没法做到的。

- `SurfaceView`是一个很重(heavry-weight)的对象，所以不要想着创建多个`SurfaceView`，一般创建一个就好

- 常见的使用场景就是：视频播放、摄像头预览、视频录制等需要频繁更新的场景

*参看*：

- [Difference between SurfaceView and View?](https://stackoverflow.com/questions/1243433/difference-between-surfaceview-and-view)
- [Understanding Canvas and Surface concepts](https://stackoverflow.com/questions/4576909/understanding-canvas-and-surface-concepts)
- [View的invalidate传递与绘制流程分析](http://www.idtkm.com/2016/08/02/9%E3%80%81Invalidate/)
- [Window、Activity、DecorView以及ViewRoot之间的关系](https://github.com/LRH1993/android_interview/blob/master/android/basis/decorview.md)
- [Android 显示原理简介](http://djt.qq.com/article/view/987)
- [Android渲染机制以及渲染性能优化(1501210616 刘璐)](https://mobile100.gitbooks.io/android/paper/androidxuan_ran_ji_zhi_yi_ji_xuan_ran_xing_neng_yo.html)
- [Android Source 图形结构](https://source.android.com/devices/graphics/architecture)
- [设计模式：生产者-消费者](https://blog.csdn.net/u011486491/article/details/77849326)
- [android SurfaceView与SurfaceHolder使用解析](https://wangyantao.github.io/surfaceview/)
- [11.2 Creating a SufraceView object](https://google-developer-training.gitbooks.io/android-developer-advanced-course-practicals/unit-5-advanced-graphics-and-views/lesson-11-canvas/11-2-p-create-a-surfaceview/11-2-p-create-a-surfaceview.html)

# 补间动画（视图动画）

一共有 4 种：

- 平移（Translate）
- 缩放（Scale）
- 旋转（Rotate）
- 透明度（Alpha）

## 共有属性

```xml
android:duration="1000"
android:startOffset ="0"
android:fillEnabled= "false"
android:repeatMode= "restart"
android:repeatCount = "0"
android:interpolator = "@android:anim/overshoot_interpolator"
android:shareInterpolator="true"
```

多种动画配合可以使用`set`标签，内部嵌套不同类型的动画即可：

```xml
<?xml version="1.0" encoding="utf-8"?>
<set xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="1000"
    android:startOffset ="0"
    android:fillEnabled= "false"
    android:repeatMode= "restart"
    android:repeatCount = "0"
    android:interpolator = "@android:anim/overshoot_interpolator"
    android:shareInterpolator="true">

    <scale
        android:fromXScale="1"
        android:fromYScale="1"
        android:toXScale="0"
        android:toYScale="0"
        android:pivotX="90%"
        android:pivotY="90%"/>

    <alpha
        android:fromAlpha="1"
        android:toAlpha="0"/>


</set>
```

## 用法

1. 编写符合规则的`xml`文件，然后在代码中使用`AnimationUtils.loadAnimation()`方法加载进去

2. 在代码中使用对应的动画类新建然后加载

```java
Animation animation = new ScaleAnimation(0.1f, 1f, 0.1f, 1f);
animation.setDuration(1000);
TextView.setAnimation(animation);
```

*参看*：

- [Android 动画：手把手教你使用 补间动画 (视图动画)](https://blog.csdn.net/carson_ho/article/details/72827747)

- [Android 动画：你真的会使用插值器与估值器吗？](https://www.jianshu.com/p/2f19fe1e3ca1)

# ViewPager 缓存页数量

调用`setOffscreenPageLimit()`来设置除了当前页之外，后台的缓存页数。

我们去源码看看他是怎么做的。先来看看调用链：

```shell
setOffscreenPageLimit() --> populate()
```

就这一个调用而已。在`setOffscreenPageLimit()`里面，把接收到的参数赋给变量`mOffscreenPageLimit`。

```java
...
if (limit != mOffscreenPageLimit) {
            mOffscreenPageLimit = limit;
            populate();
}
...
```

`populate()`方法是填充`page`的方法，而在这里方法里面：

```java
...
final int pageLimit = mOffscreenPageLimit;
final int endPos = Math.min(N - 1, mCurItem + pageLimit);

...

if (extraWidthRight >= rightWidthNeeded && pos > endPos){
    ...
}

```

这样子的一个判断逻辑，如果填充页的`pos`已经大于我们的限制，那么就不再填充。

# Java 注释模板

*参看*：

- [JavaDoc 注释模板设置及详解](https://blog.csdn.net/projectNo/article/details/76499374)

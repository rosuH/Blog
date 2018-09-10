---
title: "Android 札记系列 (11)：视频预加载库、屏幕截图和ADB 录屏"
date: 2018-09-09 16:26:24
tags:
  - "Android"
  - "屏幕截图"
  - "ADB"
  - "视频预加载"

categories:
  - "Android"

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是了解如何实现屏幕截图、使用 ADB 录制屏幕以及介绍一个视频缓冲库..."
---

# 屏幕截图

在 Android 中，实现屏幕截图没有官方的接口。所以我们需要另辟蹊径来获取『截图』。

## View.getDrawingCache()

我们通过使用`View.getDrawingCache()`来获取当前`view`的缓存，然后将它存储到`bitmap`中。

### 用法

```java
view.setDrawingCacheEnabled(true);
view.measure(View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
                    View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED));
view.layout(0, 0, view.getMeasuredWidth(), view.getMeasuredHeight());
view.buildDrawingCache(true);
Bitmap bitmap = view.getDrawingCache();
view.setDrawingCacheEnabled(false);
```

先调用`setDrawingCacheEnabled(true)`开启缓存。这个方法实现里，设置了一个标志位`DRAWING_CACHE_ENABLED`，后续再`getDrawingCache()`的时候，会判断一下。
接着这里调了`measure()`和`layout()`方法，强制该视图重新测量和布局，这样避免之前没有缓存而返回空的情况。
然后调用`getDrawingCache()`得到视图的缓存。

我们可以一起看一下源码实现，从`getDrawingCache(boolean)`进去，判断了一下`DRAWING_CACHE_ENABLED`标志位之后，调用了真正的实现`buildDrawingCacheImpl()`方法。
定位到`View.java`中的`buildDrawingCacheImpl()`方法
这个方法的逻辑就是：

1. 通过`AttachInfo`这个类，来获取当前视图的信息

   > A set of information given to a view when it is attached to its parent
   > window

2. 建立一个空`bitmap`

```java
...
final AttachInfo attachInfo = mAttachInfo;
final boolean scalingRequired = attachInfo != null && attachInfo.mScalingRequired;

if (autoScale && scalingRequired) {
    width = (int) ((width * attachInfo.mApplicationScale) + 0.5f);
    height = (int) ((height * attachInfo.mApplicationScale) + 0.5f);
}

final int drawingCacheBackgroundColor = mDrawingCacheBackgroundColor;
final boolean opaque = drawingCacheBackgroundColor != 0 || isOpaque();
final boolean use32BitCache = attachInfo != null && attachInfo.mUse32BitDrawingCache;

final long projectedBitmapSize = width * height * (opaque && !use32BitCache ? 2 : 4);
final long drawingCacheSize =
        ViewConfiguration.get(mContext).getScaledMaximumDrawingCacheSize();
```

这里做了一些判断，也就是是否需要对视图进行缩放(`scale`)。根据视图的宽高、背景透明度和使用的缓存位数来得到`bitmap`所占据的内存空间大小(`projectedBitmapSize`)。


```java
try {
    bitmap = Bitmap.createBitmap(mResources.getDisplayMetrics(),
            width, height, quality);
    bitmap.setDensity(getResources().getDisplayMetrics().densityDpi);
    if (autoScale) {
        mDrawingCache = bitmap;
    } else {
        mUnscaledDrawingCache = bitmap;
    }
    if (opaque && use32BitCache) bitmap.setHasAlpha(false);
}
```

这里对`bitmap`进行设置，包括屏幕的尺寸(`mResources.getDisplayMetrics()`)、`bitmap`的宽高，压缩质量`quality`。

然后根据前面`setDrawingCache(boolean)`传入的布尔值判断是否`autoScale`，如果是，将当前`bitmap`赋给`mDrawingCahce`，否则赋给`mUnscaledDrawingCache`。
通过`opaque`和`use32BitCache`两个变量（是否透明、是否使用 32 位缓存）来设置`bitmap`的透明度。

实际上到这一步依旧没有获取到当前的视图的内容，这里基本都是在设置存放缓存的`bitmap`。

下面开始把当前视图画上去：

```java
Canvas canvas;
if (attachInfo != null) {
    canvas = attachInfo.mCanvas;
    if (canvas == null) {
        canvas = new Canvas();
    }
    canvas.setBitmap(bitmap);
    // Temporarily clobber the cached Canvas in case one of our children
    // is also using a drawing cache. Without this, the children would
    // steal the canvas by attaching their own bitmap to it and bad, bad
    // thing would happen (invisible views, corrupted drawings, etc.)
    attachInfo.mCanvas = null;
} else {
    // This case should hopefully never or seldom happen
    canvas = new Canvas(bitmap);
}

if (clear) {
    bitmap.eraseColor(drawingCacheBackgroundColor);
}

computeScroll();
final int restoreCount = canvas.save();

if (autoScale && scalingRequired) {
    final float scale = attachInfo.mApplicationScale;
    canvas.scale(scale, scale);
}

canvas.translate(-mScrollX, -mScrollY);

mPrivateFlags |= PFLAG_DRAWN;
if (mAttachInfo == null || !mAttachInfo.mHardwareAccelerated ||
        mLayerType != LAYER_TYPE_NONE) {
    mPrivateFlags |= PFLAG_DRAWING_CACHE_VALID;
}

// Fast path for layouts with no backgrounds
if ((mPrivateFlags & PFLAG_SKIP_DRAW) == PFLAG_SKIP_DRAW) {
    mPrivateFlags &= ~PFLAG_DIRTY_MASK;
    dispatchDraw(canvas);
    drawAutofilledHighlight(canvas);
    if (mOverlay != null && !mOverlay.isEmpty()) {
        mOverlay.getOverlayView().draw(canvas);
    }
} else {
    draw(canvas);
}

canvas.restoreToCount(restoreCount);
canvas.setBitmap(null);

if (attachInfo != null) {
    // Restore the cached Canvas for our siblings
    attachInfo.mCanvas = canvas;
}
```

这里使用了一个`Canvas`类，把之前的`bitmap`赋给`Canvas`，一直到`draw(canvas)`从才算是真正才开画。

也就是说，真正画上去的部分，实际在`draw(Canvas canvas)`函数里实现。这个函数比较长，我挑一些对我有利的来讲 ∠( ᐛ 」∠)＿

我们先看一下注释：

>  Manually render this view (and all of its children) to the given Canvas.
    The view must have already done a full layout before this function is
    called.  When implementing a view, implement

可以看到，这里是说，把当前视图及其子视图，手动赋给传入的`canvas`变量，并且这个视图必须**已经完成了`layout`步骤**。
所以我们在最开始用的时候，最好就主动调用`measure()`和`layout()`这两个方法。

再看注释：

>  /*
         * Draw traversal performs several drawing steps which must be executed
         * in the appropriate order:
         *
         *      1. Draw the background
         *      2. If necessary, save the canvas' layers to prepare for fading
         *      3. Draw view's content
         *      4. Draw children
         *      5. If necessary, draw the fading edges and restore layers
         *      6. Draw decorations (scrollbars for instance)
         */

其实后续的源码已经分别标注了是哪一部分了。
先画背景，如果需要的情况下，保存`canvas`的层次状态，然后在第 5 步恢复，正常情况下忽略这两步。
接着画视图的内容、子视图，最后画其余挂件（滚动条等）

在这里我就不一一列出来了。有时间再把它仔细解析清楚（#Flag #坑）。

### Tips

1. 调用的时候尽量主动调用`measure()`和`layout()`方法
2. 如果调用了`setDrawingCache(true)`那就不需要自己`destroyDrawingCache()`
3. `getDrawingCache()`并不是最好的方法，因为它的性能稍差。原本对视图进行缓存是为了提高性能，但是这种方式在配置好、开启了硬件加速的机器上来说已经没那么必要了，这个方法在 API 28 也被废弃了，转而使用`getPixel()`
4. 对于继承`Camcera`或大部分视频播放视图，这个方法无法获取到那些视图的缓存。因为他们在底层都是用了另一个`SurfaceView`来渲染，这和当前`View`不在同一个`SurfaceViwe`上

*参看*：

- [[Android]DrawingCache到底干了什么？](https://www.jianshu.com/p/09e32f10b394)

- [Android 札记系列 (6)：XML、SurfaceView 和动画](https://blog.rosuh.me/2018/08/Android-reading-note-6/)

- [Android 普通View截图 RecyclerView截图 ScrollView截图分享](https://juejin.im/post/5a37d8436fb9a04522079d33)


# ADB 录屏

```shell
adb shell screenrecord /sdcard/demo.mp4
```

*参看* ：

- [adb 截屏和录屏命令](https://blog.csdn.net/gdutxiaoxu/article/details/69802895)



# AndroidVideoCache

[AndroidVideoCache](https://github.com/danikula/AndroidVideoCache)一个视频预缓存库，通过一个本地代理来把网络视频流操作得想本地文件流一样舒服~



附上一个主动`Cache`的示例。



- [Can I cache video without using videoview? #59](https://github.com/danikula/AndroidVideoCache/issues/59)
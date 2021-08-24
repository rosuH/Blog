---
title: 自定义布局其二：初始化、测量和布局
filename: custom-viewgroup-2-initialization-measure-and-layout
date: 2021-08-24
excerpt: 首先说一下思路，自定义布局其实不难，核心点就是我们熟知的 measure 和 layout。这个和我们编写 XML
  布局几乎是一致的，只是换了一种实现方式。如果我们用 Kotlin DSL 封装一下，可读性会大大提高。
---
首先说一下思路，自定义布局其实不难，核心点就是我们熟知的 measure 和 layout。这个和我们编写 XML 布局几乎是一致的，只是换了一种实现方式。如果我们用 Kotlin DSL 封装一下，可读性会大大提高。

我自己的实现流程一般为：
1. 确定控件以及初始化
2. 重写 measure，为子控件测量尺寸，同时设置当前 ViewGroup 尺寸
3. 重写 layout
4. 根据业务内容重写其他方法或定制接口。比如[触摸事件处理](https://github.com/rosuH/EasyWatermark/blob/732fb957ca47a58148ff42d6dc4db7c61af58e0c/app/src/main/java/me/rosuh/easywatermark/widget/LaunchView.kt#L347-L378)、[布局转换](https://github.com/rosuH/EasyWatermark/blob/732fb957ca47a58148ff42d6dc4db7c61af58e0c/app/src/main/java/me/rosuh/easywatermark/widget/LaunchView.kt#L332-L345)等

## 确定控件和初始化
这一步说的是如何贴合业务确定子控件及其初始化时机。一般我们使用如下方式来声明一个子控件：

```kotlin
val ivPhoto: ImageView by lazy {
    ImageView(context, null, 0, android.R.style.Widget_ActionButton).apply {
        layoutParams =
            MarginLayoutParams(
                LayoutParams.WRAP_CONTENT,
                LayoutParams.WRAP_CONTENT
            ).also { it.setMargins(0, 20.dp, 0, 0) }
        setImageResource(R.drawable.ic_picker_image)
    }
}
```
1. 这里使用 lazy 委托进行延迟初始化。是否延迟初始化视乎情况而定，如果你的子控件非常多，并且不是全都会在首次用到，那么建议使用 `lazy` 进行延迟初始化操作。但是如果作为 RecyclerView 的 item，我不建议使用 `lazy` 操作，这样在快速滑动的情况下可能会降低性能。
	- 因为 `lazy` 内部使用 `synchronized` 关键字对 `get` 方法进行同步保护，所以在性能敏感场景，不如直接创建来得快。
	- 另一方面，RecyclerView 存在[回收机制](https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:recyclerview/recyclerview/src/main/java/androidx/recyclerview/widget/RecyclerView.java;l=6756-6761?q=RecyclerView.java)，在不恰当的时机 `addView` 可能导致不可预期的问题。（仅猜测，待确认）
2. `ImageView(context, null, 0, android.R.style.Widget_ActionButton)` 这个构造函数允许我们传入自定义的 `Style`，这有助于我们复用控件的样式。
3. 此处没有加入 `addView()` 的调用，表示我们将在使用到的时候手动进行 `addView` ，而不是现在。

如果我们的场景不适合，或者不需要延迟初始化，那么一种更加常见的声明方式如下：

```kotlin
val ivPhoto: ImageView =
    ImageView(context, null, 0, android.R.style.Widget_ActionButton).apply {
        layoutParams =
            MarginLayoutParams(
                LayoutParams.WRAP_CONTENT,
                LayoutParams.WRAP_CONTENT
            ).also { it.setMargins(0, 20.dp, 0, 0) }
        setImageResource(R.drawable.ic_picker_image)
        addView(this)
    }

```

在 ViewGroup 创建时，同时创建子控件，并且调用 `addView()`。此时的 `addView` 并不会触发 `requestLayout`，因为 ViewGroup 还未 attach 到 window 中。

## measure

测量难吗？其实大部分业务场景并不难。很多人也看过自定 View 的相关文档和文章，尤其对测量模式（[MeasureSpec](https://developer.android.com/reference/android/view/View.MeasureSpec)）印象深刻。其中的 `UNSPECIFIED`、`EXACTLY` 和 `AT_MOST` 以及各种情况排列组合形成了一张复杂的 $4 \times 4$ 表格，让人头昏眼花 😵‍💫 。

但实际上我们在大部分情况下，并不需要去处理相关逻辑。在此文章中，我也让不会将上述测量模式全都讲清楚，但是我们至少需要知道如下知识：
1. `onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int)` 中的 `widthMeasureSpec` 和 `heightMeasureSpec` 保存了测量模式（高两位）和 ViewGroup 的布局对当前 ViewGroup 的尺寸要求（低 30 位）。
2. `onMeasure` 的两个参数，代表当前 View 的父布局对当前 View 的尺寸要求。父布局并不知道我们最终的尺寸，他只是给我们一个预期要求，希望我们遵守。如果我们不遵守，那他可能强行修改我们的尺寸。所以我们尽量遵守父布局的要求，这样对大家都好 :)
3. View 的尺寸是结合父布局的要求来确定的。什么是父布局的「要求」呢？父布局会根据它自己的父布局的要求，以及在 XML 中取到的要被测量的子 View 的 `layout_width` 和 `layout_height` 这两个属性；根据其布局的特性（比如 LinearLayout 和 FrameLayout 就是不同的）计算出最后的 MeasureSpec。后面我们会举例子详述。


我们先来看一段代码，非常简单：

```java
override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
}
```

上述是 ViewGroup 的默认实现。最后将走到 View 中的 [`onMeasure`](https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/android/view/View.java;l=25539-25542?q=View.java) 方法:

```java
// View#onMeasure()
protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    setMeasuredDimension(getDefaultSize(getSuggestedMinimumWidth(), widthMeasureSpec),
            getDefaultSize(getSuggestedMinimumHeight(), heightMeasureSpec));
}

// View#getSuggestedMinimumWidth()
// 这里主要考虑背景的大小是否有所影响
protected int getSuggestedMinimumWidth() {
    return (mBackground == null) ? mMinWidth : max(mMinWidth, mBackground.getMinimumWidth());
}

// View#getDefaultSize()
// 默认的尺寸处理逻辑
public static int getDefaultSize(int size, int measureSpec) {
    int result = size;
    int specMode = MeasureSpec.getMode(measureSpec);
    int specSize = MeasureSpec.getSize(measureSpec);

    switch (specMode) {
	// 父布局对当前 View 没有要求，当前 View 直接是当前的测量结果
    case Measure Spec.UNSPECIFIED:
        result = size;
        break;
	// 父布局对当前 View 有要求，最大值或者具体值，直接取父布局的要求
	// 所以 View 可能会变得比预期更大
    case MeasureSpec.AT_MOST:
    case MeasureSpec.EXACTLY:
        result = specSize;
        break;
    }
    return result;
}
```

解释一下：
1. ViewGroup 是 View 的子类，测量方法也是用的 View 的测量方法，所以默认实现不会根据子 View 的最终大小来实现。
2. `setMeasuredDimension` 保存当前 View 的计算尺寸。如果我们重写了 `onMeasure`，自定义尺寸后，需要调用它来保存。

### 测量流程
测量我们需要解决三个问题：
1. 要怎么测量？
2. 测量哪些？
3. 测量顺序？

#### 1. 要怎么实现测量？
来看一个简单的布局：

```
[LinearLayout, w: 50]
    [ViewGroup_1, w: wrap_content, orientation: horizontal]
        <TextView_1, w: 20>
        <TextView_2, w: 20>
        <TextView_3, w: 20>
    [ViewGroup_1]
[LinearLayout]
```

我们将重写 `ViewGroup_1` 的 `onMeasure` 方法，实现自定义测量过程。我们上文讲到过，`onMeasure(widthMeasureSpec, heightMeasureSpec)`的两个参数，是父布局对我们的要求。对于 `ViewGrou_1` 来说，XML 中标注是 `wrap_content`，但因为父布局 LinearLayout 的宽度为 $50dp$，所以最终  `ViewGrou_1` 的 `onMeasure` 收到的测量模式将是：`mode = AT_MOST`, `size = 50.dp`。

同样的，我们也需要处理自身与子 View 的尺寸关系。这个关系说难也不难，说简单也有点麻烦。Android 封装了一个样板方法，你可以直接看[源码](https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/android/view/ViewGroup.java;l=6979?q=ViewGroup.getChildMeasureSpec&sq=)，比我文字描述更加直白。
该方法允许子 View 尽量无限制地去测量出最佳大小。所以我们在实现测量的时候，直接调用 `measureChildWithMargins` 方法即可。

-  `measureChildWithMargins`是什么？
    - 它是 Android 给我们提供的样板方法，可以非常方便地测量子布局
    - 原理在 [View#getChildMeasureSpec](https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/android/view/ViewGroup.java;l=6979?q=ViewGroup.getChildMeasureSpec&sq=)；注释讲得非常清楚，此方法会根据父布局要求的测量模式和尺寸，以及自己的实际尺寸，计算出 Spec。
	- 此方法总是会给被测量的子 View 最佳的尺寸，也就是无限制的情况下的最佳尺寸。因为大部分控件我们都不会去做限制。
	- 计算出来 Spec 后，此方法内部调用 `child.measure(spec, spec)` 让子 View 去测量并保存尺寸
- `heightUsed` 和  `widthUsed` 是啥？ 
	- 表示已经被使用了的宽或高。每当某个控件占据了一部分宽高，就需要在下一个控件测量时告诉它已经被使用的宽高，以便正确分配剩余空间

```
// 水平布局
[ViewGroup, w: 50, orientation: horizontal]
    <TextView_1, w: 20> --> available 50, widthUsed 20, actual 20
    <TextView_2, w: 20> --> available 30, widthUsed 40, actual 20
    <TextView_3, w: 20> --> available 10, widthUsed 50, actual 10
[ViewGroup]
```

在构建水平布局时，ViewGroup 宽度只有 $50dp$。三个 TextView 优先级相等。那么：
- TextView_1 ：ViewGroup 已经被使用了 $0dp$，有 $50dp$ 的可用空间，最后只用了 $20dp$
	- `measureChildWithMargins(it, widthMeasureSpec, 0, heightMeasureSpec, heightUsed)`
- TextView_2 ：ViewGroup 已经被使用了 $20dp$，可用空间有 $30dp$，但只用了 $20dp$
	- `measureChildWithMargins(it, widthMeasureSpec, 20.dp, heightMeasureSpec, heightUsed)``
- TextView_3：ViewGroup 已经被使用了 $40dp$；期望 $20dp$，但只有 $10dp$ 可用，所以只能用 $10dp$
	- `measureChildWithMargins(it, widthMeasureSpec, 40.dp, heightMeasureSpec, heightUsed)`

一句话总结：**`widthUsed` 和 `heightUsed` 就是已经被使用的空间。如果剩下的控件是按剩余空间分配的，那么就需要传递这两个值以便计算；如果不是按剩余空间分配，那么这两个值就是 0**。

讲完 `measureChildWithMargins` 其实就已经差不多了。测量的核心就在这里。一般情况下我们都不需要自己判断测量模式。如果真到了需要自己判断测量模式的时候，再去仔细研究也不迟。

#### 2. 需要测量哪些？

View 的显隐性不会影响其宽高，我们依然可以测量 `View.GONE` 的控件并获得正确尺寸。所以我们需要根据业务场景自己判断哪些不需要被测量。

- 一般来说我们需要忽略 `View.GONE` 的控件，这样才符合大多数开发者的习惯。
- 根据业务需求，延迟测量不需要显示的控件。这个是可选的，如果在此时延迟测量，那么后续视情况可能需要重新布局，要看具体场景和取舍。

#### 3. 测量顺序

在 Android 布局中，总是需要约束来决定控件的优先级。举个例子：

```
[CustomViewGroup, orientaion: vertical]
  <TextView_1, visibility: View.GONE>
  <TextView_2, constraint: optional>
  <TextView_3, constraint: force>
[CustomViewGroup]
```

此处用 `constraint` 表示显示约束。

- `TextView_1` 是隐藏的，我们不测量
- `TextView_2` 是可选的，当分配完 `TextView_3` 后的剩余空间就给它，否则就不显示
- `TextView_3` 是强制的，优先级最高。优先保证它显示完全，如果还有剩余空间，再让其他控件分配
我们将要实现如图所示的测量方式：

```kotlin
override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    var heightUsed = 0
    var widthUsed = 0
	// 遍历所有子控件
    children
        .filter {
			// 过滤 View.GONE 控件
            it.visibility != View.GONE
        }
        .forEach {
			// 先测量优先级最高的
            if (it.constraint == Force) {
				// 按照无限制尺寸去测量
                measureChildWithMargins(it, widthMeasureSpec, 0, heightMeasureSpec, heightUsed)
				// 垂直布局，所以高度叠加，
                heightUsed += it.measuredHeight
				// 垂直布局，宽度以最大子控件宽度为准
                widthUsed = Math.max(widthUsed, it.measuredWidth)
            }
        }
	// 再测量优先级较低的 optional 列表
	getOptionsList().forEach {
		// 传递 widthUsed，子控件自己根据剩余空空间来计算尺寸
		// 而不再是无限制测量
		measureChildWithMargins(it, widthMeasureSpec, widthUsed, heightMeasureSpec, heightUsed)	
		// 垂直布局，所以高度叠加，
		heightUsed += it.measuredHeight
		// 垂直布局，宽度以最大子控件宽度为准
		widthUsed = Math.max(widthUsed, it.measuredWidth)

	}
	// 保存当前 ViewGroup 的尺寸
	setMeasuredDimension(widthUsed, heightUsed)
}

```


measure 的理论知识部分到这里就差不多了。更多的需要自己动手去尝试，去真正的实现，才能有更深的体会。后续会有文章介绍部分实践内容，敬请期待。接下来我们可以看下 layout 部分。


#### 最后，如果你遇到...
>`android.view.ViewGroup$LayoutParams cannot be cast to android.view.ViewGroup$MarginLayoutParams`

不用担心，这个是因为我们在前面都没有讨论 margin 测量问题。其实这个也很简单。
如果你的子 View 都是自己构建的，那么给子 View 设置 `layoutParams` 为 `MarginLayoutParams` 即可。或者重写 `generateDefaultLayoutParams` 方法：

```kotlin
override fun generateDefaultLayoutParams(): LayoutParams {  
    return MarginLayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)  
}
```

如果你仍有子 View 是来自 XML 的，当该 View 没有设置 `layour_margin` 相关属性时，系统默认为 `ViewGroup.LayoutParams`。那么我们直接在 `onMeasure` 时判断即可：

```kotlin
override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    var heightUsed = 0
    var widthUsed = 0
    children
        .filter { it.visibility != View.GONE }
        .forEachIndexed { index, view ->
			// 判断 LayoutParams 类型
            if (view.layoutParams is MarginLayoutParams) {
                measureChildWithMargins(
                    view,
                    widthMeasureSpec,
                    widthUsed,
                    heightMeasureSpec,
                    heightUsed
                )
            } else {
                measureChild(view, widthMeasureSpec, heightMeasureSpec)
            }
            widthUsed = max(widthUsed, view.measuredWidth)
            heightUsed += view.measuredHeight + view.marginTop + view.marginBottom
        }
    setMeasuredDimension(widthUsed, heightUsed)
}
```


## layout
layout 比 measure 更加简单。不需要做太多的比较和判断。我们在重写 `onLayout` 的过程中，一般关注：
1. 控件的排列顺序与互相位置约束
2. `margin` 和 `padding` 的处理

对于 child 的布局，直接调用 `child.layout(0, 0, 0, 0)` 即可完成。在此部分更关注业务上的 UI 实现。比如一个简单的垂直的布局，可以这么写：

```kotlin
ooverride fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    var heightUsed = 0
    children
        .filter { it.visibility != View.GONE }
        .forEachIndexed { index, it ->
            it.layout(0, heightUsed, it.measuredWidth, it.measuredHeight + heightUsed)
            heightUsed = it.bottom
        }
}
```

是不是非常简单🤓 ～ 当然，这里需要你对 `View` 的位置关系有所了解。比如我常用 `View.bottom` 这类属性来作为上下左右约束。就像上述代码一样。

不过有些场景，这是不够的：
- 对于我们前面提到的 Chip 之类的标签布局，还需要考虑换行。这种时候就需要根据行的剩余宽度，与即将 layout 的子 View 比较，如果放不下，那么就要移到下一行去处理。
- 对于约束在右边的控件，比如对其右边界此种，需要做一下减法计算。

$x =  this@CustomViewGroup.measuredWidth - this@CustomViewGroup.paddingEnd - (it.measuredWidth + it.marginStart + it.marginEnd)$

你可以抽象成一个函数，不过可能不便于其他维护者理解，这里就不赘述了。

当然，还有更复杂的布局。比如环绕、圆形、瀑布流等等异型布局，就需要我们根据实际情况去实现啦。但是原理都是类似的。

## 总结
我们从子控件初始化开始，讲到如何利用 `measureChild` 实现测量，以及如何布局。几乎把（我遇到的）常见的业务 UI 都包含在内，你能看到这里，相信即便没有完全掌握渲染流程，也了解了六七分了。但是仅有理论总归是不够的，我后续将会分享实践相关的文章，用一些简单方便入手的例子，帮助你快速掌握自定义 ViewGroup 的渲染流程。期待与你再见～
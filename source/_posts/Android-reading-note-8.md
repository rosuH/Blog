---
title: "Android 札记系列 (8)：TextSwitch 和 RxJava"
date: 2018-08-14 15:47:03
tags:
  - "Android"
  - "TextSwitch"
  - "compose"
  - "RxJava"

categories:
  - "Android"

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是 Android 原生的文本切换控件 TextSwitch，RxJava 中的 compose 操作符的一些 tips..."
---

# TextSwitch

最近遇到了要实现好看的文本切换效果的情况，如果 `TextView` 存在于某个类似聊天气泡的背景中时，直接对 `TextView` 使用的动画就显得力不从心了。
这个时候我才发现了原来 Android 原生有类似的控件，就是 `TextSwitch`。

## 上手

`TextSwitch` 的使用真的很简单啊，和平时使用 `TextView` 实际上没有很大的区别。

```java
// 实例化 TextSwitch
mSwitcher = findViewById(R.id.switcher);
// 设置一个工厂类，用于生产 TextView
mSwitcher.setFactory(mFactory);

Animation in = AnimationUtils.loadAnimation(this,
				android.R.anim.fade_in);
Animation out = AnimationUtils.loadAnimation(this,
				android.R.anim.fade_out);
// 设置进出场动画
mSwitcher.setInAnimation(in);
mSwitcher.setOutAnimation(out);
// 设置文本
mSwitcher.setText();
// 设置文本但是不显示动画
mSwitcher.setCurrentText();


// 工厂类
private ViewFactory mFactory = new ViewFactory() {
	@Override
	public View makeView() {
		// 每次都新建一个 TextView
		TextView t = new TextView(MainActivity.this);
		t.setGravity(Gravity.TOP | Gravity.CENTER_HORIZONTAL);
		t.setTextAppearance(MainActivity.this, android.R.style.TextAppearance_Large);
		return t;
	}
  };
}
```

## 源码小勘

`TextSwitch` 继承了 `ViewSwitch`，其中在使用的时候有一个比较需要注意的地方。
那就是在 `ViewSwitch` 的 `setFactory()` 里面：

```java
public void setFactory(ViewFactory factory) {
	mFactory = factory;
    obtainView();
    obtainView();
}
```

这里直接调用了两次 `obtainView()` 方法，那我们可以看看 `obtainView()` 方法做了什么事情：

```java
private View obtainView() {
    View child = mFactory.makeView();
    LayoutParams lp = (LayoutParams) child.getLayoutParams();
    if (lp == null) {
        lp = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
    }
    addView(child, lp);
    return child;
}
```

这里先调用了 `mFactory().makeView()`，也就是我们传入的工厂类里面 `makeView()` 方法。
接着是设置布局，最后调用了一个 `addView()` 方法，见名知意，这就是一个添加子 `view` 的方法。
所以我们可以知道，`ViewSwitch` 会默认调用 ** 两次 **`Factory.makeView()` 来添加两个子视图。
比如，我们使用 `TextSwitch` 控件，每次调用 `setText()`，就会生产一个 `TextView` 出来。那么如果你只调用一次，也会生产两个出来，只不过第二个是空 `TextView`。

之所以这里需要注意，是因为如果你想尝试复用这个 `TextView` 的话，就需要注意一下了，初始化的时候会调用两次。

## tips

实际使用的时候还有一个问题，那就是 `TextSwitch` 不会变小了。当前一个 `TextView` 的字符串较大，那么他的视图会拉伸到适应它，如果下一个 `TextView` 字符串比较少，这个时候却不会变小。

这个问题比较匪夷所思，后面查了一下资料，发现原因是 `ViewSwitch` 会自动测量所有子视图的大小，并把它自己的视图大小设置为最大子视图的大小。上面我们说到的，它会自动生成两个子视图。
解决方法就是不让他自动测量所有子视图的大小：

```java
mSwitcher.setMeasureAllChildren(false);
```

这样就解决问题了。

*参看*：

- [TextSwitcher Tutorial With Example In Android Studio](https://abhiandroid.com/ui/textswitcher)
- [ViewSwitcher and layout height in Android](https://stackoverflow.com/questions/3558320/viewswitcher-and-layout-height-in-android)
- [Smooth text change in android animation](https://stackoverflow.com/questions/41715142/smooth-text-change-in-android-animation)
- [Switching Text with Animation](https://medium.com/@elye.project/switching-text-with-animation-f129eef83786)


# 如何从命令行停止 Android  程序进程

```shell
adb shell am kill com.your.package
```

*参看*：

- [Stopping an Android app from console](https://stackoverflow.com/questions/3117095/stopping-an-android-app-from-console)

# RxJava compose 操作符

又来了解一下 `RxJava` 迷人的操作符哦，这次是 `compose()`。实际上是表示『自定义操作符』的意思。
你传入一个 `FlowableTransformer` 进入，然后做一些你想做的事情，接着返回一个『全新』的 `Flowable`。

这个操作符在 `Retrofit` 中结合使用是相当方便的。网络上一些文章所举的例子，是复用网络请求时频繁切换线程的操作。
具体你可以参看下面的文章：

- [RxJava 之 compose 操作符](http://heiscoding.com/blog/2017/05/10/rxjava-operator-compose/)

这篇文章简述了 `compose` 的使用，但是我一开始看还是非常不理解。也没法运用到实际中去。
因为他这里没有涉及更多的上游 `Flowable` 的转换，只是切换了一下线程。
下面是我写的例子，涉及到了更多的上游转换工作。


因为是网络请求，所以这里的 `DataBean` 是一个 `JavaBean` 类：

```java
public class DataBean {
	private String code;
	private String messga;
	private ResultBean data;

	public ResultBean getData(){
		return this.data;
	}
	// 省略其他 getter 和 setter
}
```

可以看到，这里的 `DataBean` 里包含了 `code`、`message` 和真正的数据 `data`，所以我们请求的接口要这么写：

```java
public interface IGetData {
	@GET
	Flowable<DataBean<ResultBean>> getData();
}
```

那么不使用 `compose` 的情况下，是这样的：

```java
IGetData igetData = mRetrofit.create(IGetData.class);
ResultBean result = igetData
	.get(BASE_URL)
	// 转换
	.flatMap(new Function<DataBean<ResultBean>, Publisher<ResultBean>>() {
                @Override
                public Publisher<ResultBean> apply(DataBean<ResultBean> dataBean) throws Exception{
                    return Flowable.just(dataBean.getData());
                }
            })
	.subscribeOn(...);
```

这里需要使用 `flatMap()` 操作符把 `ResultBean` 从 `DataBean` 中提取出来。这样做的好处是，你可以在这里顺便判断 `code` 是否请求成功，不成功直接进入 `onError()`。
很明显，这里的数据转换是可以被复用的，因为程序中的其他 `JavaBean` 也是被包在这样的格式里面的。
那么如果有其他类型，类似于 `ResultBean` 的，比如 `ImageBean`、`ProductBean` 也被包在这样的格式里面，那么其实我们可以使用泛型定义 `DataBean`。

```java
public class DataBean {
	private String code;
	private String messga;
	private T data;

	public T getData(){
		return this.data;
	}
	// 省略其他 getter 和 setter
}
```

这样程序中除了请求接口之外的其他地方基本不用修改。因为你取出来的依然是原来的各种 `JavaBean` 对象。

所以这样做的复用价值是非常高的。那么使用 `compose` 操作符来复用，应该怎么做呢？

`compose` 操作符接受一个 `FlowableTransformer` 对象，我们只要创建一个方法，返回这个对象就成。
我们把要对上游做的转换，预先定义好在这个对象里面，接着传给 `compose()`，之后，他就会帮我们做好转换，并返回一个转换好的 `Flowable` 对象。

所以我们可以定义下面的方法。
这个方法分两部分：

1. 第一个 `return` 返回的是我们新建的 `FlowableTransformer` 对象
	- 特别要注意泛型类型要正确，第一个参数是上游对象，也就是 `Retrofit` 的返回结果
2. 在 `FlowableTransformer` 的 `apply()` 方法里面，使用 `flatMap` 操作符进行转换

可以看到

```java
public static <T> FlowableTransformer<DataBean<T>, T> getDataFromDataBean(){
        return new FlowableTransformer<DataBean<T>, T>() {
            @Override
            public Publisher<T> apply(Flowable<DataBean<T>> upstream) {
                return upstream.flatMap(new Function<DataBean<T>, Publisher<T>>() {
                    @Override
                    public Publisher<T> apply(DataBean<T> tDataBean) throws Exception {
						// 可以做错误判断
                        if (tDataBean.isError()) return Flowable.error(new Exception(tDataBean.getMsg()));
						// 实际转换
                        return Flowable.just(tDataBean.getData());
                    }
                });
            }
        };
    }
```

这样下来原本的请求链可以简化如下：

```java
ResultBean result = igetData
	.get(BASE_URL)
	// 转换
	.compose(getDataFromDataBean())
	.subscribeOn(...);
```

而且在其他需要转换的地方可以直接复用，效率提高不止一点点。



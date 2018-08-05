---
title: "Android 札记系列(5)：ButterKnife, RxJava 和 XML"
date: 2018-08-05 21:41:25
tags:
- 'Android'
- 'ButterKnife'
- 'RxJava'
- 'XML'

categories:
- 'Android'

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是 ButterKnife, RxJava 和 XML 文件的问题..."


---

# ButterKnife

## 在 Fragment 中使用 ButterKnife

在`Fragment`中使用`ButterKnife`，只需要在`onCreateView()`方法中绑定视图就可以了。

```java
private Unbinder mUnbind;
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        super.onCreateView(inflater, container, savedInstanceState);
        View view = inflater.inflate(R.layout.fragment_no_man, container, false);
        ...
        mUnbind = ButterKnife.bind(this, view);
        return view;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        mUnbinder.unbind();
    }
```

## ButterKnife 点击监听

使用`ButterKnife`也可以直接为按钮等控件设置监听。

```java
@OnClick(R.id.test_btn)
void test(){
        // do something
    }
```

这样就不用写很多的代码啦。
*参看*：

- [ButterKnife在activity和Fragment中使用的区别](https://blog.csdn.net/qq_33210042/article/details/76019504)

# RxJava

在本周的使用过程中，逐步又学会了一些`RxJava`的有趣的用法。

## RxJava 中的 FlatMap 的神奇用法

如果你还不了解`RxJava`或者`FlatMap`的一些概念或用法，推荐看下面的文章：

- [给 Android 开发者的 RxJava 详解](https://gank.io/post/560e15be2dca930e00da1083)
- [这可能是最好的RxJava 2.x 教程（完结版）](https://www.jianshu.com/p/0cd258eecf60)

`flatMap()`这个有趣的函数...我是刚领略他的美妙啊...当然，我只是了解了很基础的使用。

如果你了解了`Map()`你就知道，`Map()`函数，你应该知道我们可以在`Map()`函数里面实现对数据的转换。
`flatMap()`也是用来实现转换功能的，不过它是直接转换一整个`Observable`对象，相当于生成了一个全新的`Observable`对象。

```java
Observable
    .just(2)
    .subscribeOn(AndroidSchedulers.mainThread())
    .flatMap(new Function<Integer, ObservableSource<?>>() {
        @Override
        public ObservableSource<?> apply(Integer integer) throws Exception {
            // do someing here
            // 转换当前 Observable 为新的 Observable
            return Observable
                    .interval(integer, TimeUnit.SECONDS)
                    .take(1);
        }
})
.observeOn(AndroidSchedulers.mainThread())
.subscribe();
```

像上面这样操作的话，就可以将原本的任务转换为另一个新的任务。在过去的那一周里，大量用到了这个方法，来实现定时器。

## RxJava 的时间操作符

我也是用到了才知道，`RxJava`中有`timer()`, `interval()`和`delay()`等『时间操作符』。

你可以看[这篇文章](https://www.jianshu.com/p/7e28c8216c7d)来了解他们的区别。其实该作者总结得非常不错了。

大部分文章都会使用官方的[marble diagrams](http://reactivex.io/documentation/observable.html)来描述操作符，所以建议你好好理解一下图里的标记含义。

下面是我自己的理解笔记，可以适当忽略。

- 操作符的操作对象是谁

这只是我个人的理解，并不一定非常正确。

- `delay()`这个操作符是**『接受了`Observable`对象的事件流』**之后，平滑推移**『指定时间』**后再将事件发射出去
  - `delay()`没有直接操作`Observable`对象，而是对事件流进行操作
- `timer()`是直接返回一个**『在指定时间后发射一个 0 值的`Observable`对象』**
  - `timer()`生成了一个新的`Observable`，这个对象会自己延迟一段时间发射事件

现在是不是清楚了很多了呢~

*参看*：

- [ReactiveX/RxJava文档中文版](https://mcxiaoke.gitbooks.io/rxdocs/content/)

# XML 文件的一些问题

前几天遇到一个编译项目的时候遇到一个错误：

> ic_launcher.xml:3: AAPT: error: resource drawable/ic_launcher_background (aka android.example.com/ic_launcher_background) not found.

我百思不得其解啊…为什么默认的图标文件会报错呢…即便将这个`XML`文件删除了，依旧会报其他`XML`文件的错误...

后面我自己每个资源文件都看了，发现…我某个文件里是这样子的：

```xml
<?xml version="1.0" encoding="utf-8"?>
<?xml version="1.0" encoding="utf-8"?>
```

多写了一行`XML`声明...

> @BindView-annotated class incorrectly in Android framework package

后来 Google 后，才发现，如果你使用了`ButterKnife`，那么你的包名中不能是这样的：`android.*`或`java.*`。
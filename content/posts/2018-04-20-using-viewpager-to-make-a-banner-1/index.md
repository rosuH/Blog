---
title: "手动实现轮播图（一）：ViewPager 入门实践"
date: 2018-04-20
author: rosu
slug: "using-viewpager-to-make-a-banner-1"
tags:
- 'Android'
- 'viewpager'
- '轮播图'
- 'banner'
- 'fragment'

categories:
  - "技术"

description: "本文是系列文章第一篇，先来简单上手 ViewPager"
---

# 简介

`Viewpager`是 Android 提供的布局管理器，常被用来实现左右滑动的页面、视图。

在实际工程中，有许多都是用来实现轮播图功能的。

今天，我们从零开始造一个简易轮播图组件。

本系列文章面向的读者，是刚学完 Android 教材的初学者，旨在：

- 简单介绍`ViewPager`原理并如何快速上手
- 使用简单的代码结构，完成一个初级的轮播图组件

> 文章作者毕竟经验不多，水平有限，所以缺漏在所难免，希望路过读到本文的前辈们不吝赐教，谢谢~

接下来，我们就从`Viewpager`是什么开始，慢慢来了解他。

# 1. Viewpager 上手

[官方开发文档：android.support.v4.view.ViewPager](https://developer.android.com/reference/android/support/v4/view/ViewPager.html)

- `ViewPager`是一个布局管理器，可以作为根布局
  - 因为他继承于`ViewGroup`，常见的布局管理器还有`FrameLayout`, `LinearLayout`等
  - 当他作为根布局时，每一个页面都将占据整个布局

- `ViewPager`该怎么使用
  - 在布局文件中添加一个`<ViewPager>`标签，此位置作为`ViewPager`容器主体所在
  - 创建一个新的布局文件，作为内嵌页面的布局
    - 如果使用`fragment`的话，我们只需要创建一个模板，之后所有内嵌页面都使用这个模板来生成即可
    - 如果单单使用布局文件，那么我们每一个页面项都要创建一个布局文件，之后手动添加`ViewPager`容器
    - 所以本文章均使用`fragment`来实现
  - 在`activity`中，实例化`ViewPager`
  - 为`ViewPager`设置`Adapter`
    - 类似于`RecyclerView`，我们也是使用`Adapter`来和`ViewPager`进行通信
    - 这样大大方便了我们使用

上述步骤中，前几步几乎是组件/布局实例化的常规操作，所以我们真正要做的其实非常少。

接下来我们开始动手来使用`ViewPager`。

## 创建 ViewPager 容器和子页面布局文件

我们新建一个项目之后，打开默认创建的`activity_main.xml`布局文件中，将内容改为以下代码：

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <android.support.v4.view.ViewPager
        android:id="@+id/view_pager_inside"
        android:layout_width="400dp"
        android:layout_height="400dp"
        android:background="@android:color/darker_gray"
        android:layout_centerInParent="true">
    </android.support.v4.view.ViewPager>
</RelativeLayout>
```

可以看到，布局文件中仅有一个根布局`RelativeLayout`和一个`ViewPager`。

这里的`ViewPager`就是容器主体所在。

接着我们创建嵌入的页面布局文件：

新建一个`view_pager_fragment.xml`文件，内容如下：

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:gravity="center"
    android:orientation="vertical">

    <android.support.v7.widget.CardView
        android:id="@+id/card_view"
        android:layout_width="300dp"
        android:layout_height="300dp"
        app:cardCornerRadius="10dp"
        android:elevation="5dp">
        <TextView
            android:id="@+id/text_view_fragment"
            android:layout_gravity="center"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"/>
    </android.support.v7.widget.CardView>

</LinearLayout>
```

这里面是常规布局，有一个卡片`CardView`和内藏一个的`TextView`。

到时候，滑动的每一个页面的布局模板都来自这个文件，我们只需要在代码里稍微修改，就可以生成特定的页面了。

现在，我们回到`MainActivity.java`文件中，实例化我们刚刚的`ViewPager`。

```java
public class MainActivity extends AppCompatActivity {
    // 定义一个 Viewpager 变量
    private ViewPager mViewPager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        ...
        // 实例化 ViewPager
        mViewPager = findViewById(R.id.view_pager_inside);
    }
}
```

接下来我们该干什么呢？当然是为`ViewPager`添加页面了。

那么页面从哪里来呢？当然是我们之前创建的那个布局`view_page_fragment.xml`了。

- 我们的`ViewPager`主体位于`activity_main.xml`布局中
  - 我们在`MainActivity.java`中使用`setContentView(R.layout.activity_main);` 设置两者关联
  - 然后我们可以在`MainActivity.java`里面实例化`ViewPager`并使用它
- 同理，我们要创建一个`Fragment`，将它和`view_page_fragment.xml`关联起来，并在它里面实例化页面的布局

不理解`Fragment`的同学，可以看一下文档里的 [片段](https://developer.android.com/guide/components/fragments.html) 哦。

创建一个`PageFragment.java`类，继承于`android.support.v4.app.Fragment`，这里特别注意要使用`v4`包里的`Fragment`。

现在这个类里空荡荡，让我们来填充一些有意思的内容。

1. 关联`PageFragment.java`和`view_page_fragment.xml`

使用`Alt + Insert`，选择`Override Methods`，然后重写`onCreateView`如下：

```java
    private TextView mTextView;
    private CardView mCardView;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.view_pager_fragment, container, false);

        mTextView = view.findViewById(R.id.text_view_fragment);
        mCardView = view.findViewById(R.id.card_view);
        return view;
    }
```

我们使用了`LayoutInflater`来将`view_page_fragment.xml`加载为代码里的`View`对象，然后再从`view`对象里，找到我们放置的两个组件：`CardView`和`TextView`。

如果不理解`LayoutInflater`可以看看如下两位的文章：

- [Android LayoutInflater原理分析，带你一步步深入了解View(一)](https://blog.csdn.net/sinyu890807/article/details/12921889)
- [理解Android中的LayoutInflater](https://www.jianshu.com/p/81a698aaf05c)

这样就算是关联起来了，系统在创建`PageFrament.java`对象的时候，就会实例化`view_page_fragment.xml`布局了。

接着我们为`PageFragment.java`创建一个静态生成器（方法）。为什么要静态生产类呢？

因为我们每生成一个页面，其实就是创建一个`PageFragment.java`的对象，然后我们还要向这个对象传递数据。

为了不做重复的工作，我们写一个静态生成器，这样每次外部类只要调用这个静态生成器，就可以很简单地创建对象了。

看看代码：

```java
public class PageFragment extends Fragment {

    public static Fragment newInstance(){

        return new PageFragment();
    }
    public View onCreateView ...
}
```

如果你写过静态`Intent`生成方法，相信这个类生成器也很容易理解了。

上面代码就是在返回时，先创建一个`PageFragment`对象再返回去。就这一句代码，有必要写一个静态方法吗？

当然有，因为我们还没有把他真正的用处挖掘出来呢！

前面说到的，我们之所以只需要创建一个布局模板文件，而不需要每一个页面就定制一个，就是我们要在代码里动态定制页面。

我们这里子页面模板里，只有一个`TextView`可以写东西，所以我们用它来作为区分页面的标志，比如`T1`、`T2`这样。

那问题就是，我们如何动态定制页面呢？

我们来看看现在的情况吧：

![pic](https://img.ioioi.top/wiki/chrome_2018-04-20_22-28-55.png)

可以看到，这是典型的 MVC 结构，在这里面呢，`PageFragment`唯一地通过`MainActivity.java`来创建，虽然我们还没有实现这一步。

也即是说，我们要在这一步里，向`PageFragment`传递定制化的数据，比如页面一传递`T1`，页面二传递`T2`这样子。

接着在`PageFragment`只需要使用同一套代码就可以生成不同的页面了。

问题的难点在于如何向一个`Fragment`传递数据。当然，这样的文章已经写了很多了，相信你稍微搜索一下，就知道我们即将使用的是`Fragment Arguement`的方法。其实就是在`fragment`对象上附加一个参数。

这种方法是不是很像`Intent`的附加参数呢？

下面是实现代码：

```java
public class PageFragment extends Fragment {

    private static final String ARGS_TITLE = "argsTitle";
    private CardView mCardView;
    private TextView mTextView;

    public static Fragment newInstance(String title){
        Bundle args = new Bundle();
        args.putString(ARGS_TITLE, title);
        PageFragment pageFragment = new PageFragment();
        pageFragment.setArguments(args);
        return pageFragment;
    }
    public View onCreateView ...
}
```

在这里面，我们使用了`Bundle`对象来存储要传递的数据，然后使用`setArguement()`方法来把参数附加到新建的`pageFragment`对象里面。

最后返回这个对象即可。

接下来我们就可以在`MainActivity.java`里面使用这个静态生成器。（我只列出了新增的代码哦）

```java
public class MainActivity extends AppCompatActivity {
    ...

    private String[] mStringList = {
            "T1", "T2", "T3", "T4", "T5"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        ...
        FragmentManager fm = getSupportFragmentManager();      
        mViewPager.setAdapter(new FragmentPagerAdapter(fm) {

            @Override
            public Fragment getItem(int position) {

                String title = mStringList[position];

                return PageFragment.newInstance(title);
            }

            @Override
            public int getCount() {
                return mStringList.length;
            }


        });
    }
}
```

这里我们先定义了一个字符串数组，来存储文字字符串。也就是之前图片的【模型】区域。

```java
FragmentManager fm = getSupportFragmentManager();
```

这句代码是获取一个`FragmentManager`，也就是`fragment`的管理器。接下来在`ViewPager`中需要用这个管理器来管理`fragment`。（别担心，这里系统已经帮你做好了，你只要传入一个管理器就行。

```java
mViewPager.setAdapter(new FragmentPagerAdapter(fm) {
    ...
});
```

这一句也好理解，前面说了，`ViewPager`也需要一个对应的`Adapter`来和他通信，幸运的是系统已经为我们提供了两个非常好用的`Fragment`的`Adapter`。

- `FragmentPagerAdapter`
  - 会提前自动创建：前中后，三个页面
  - 适合页面布局简单的情况
- `FragmentStatePagerAdapter`
  - 只会创建一个页面
  - 适合页面布局复杂的情况

所以我们这里使用了`FragmentPagerAdapter`咯。

使用这个`FragmentPagerAdapter`，最少只需要重写两个方法：

- `getItem()`
  - 通过`position`参数，返回一个创建好的页面
  - 我们就要在这里面做页面的创建工作哦
- `getCount()`
  - 要创建的页面的数量

理解到这里，我们只需要在这段代码后面，轻轻加上一句：

```java
mViewPager.setCurrentItem(0);
```

然后构建、运行，这个 Demo 就做好啦！

快试试效果吧~

试完了吗？是不是感觉哪里不对劲？

### TextView 呢？

对啊，因为你虽然在`newInstance`里存放了数据，但是你并没有取出来呀~

来到`PageFragment`里取出来吧。

```java
@Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.view_pager_fragment, container, false);
        mTextView = view.findViewById(R.id.text_view_fragment);
        mCardView = view.findViewById(R.id.card_view);

        String title = getArguments().getString(ARGS_TITLE);
        mTextView.setText(title);

        return view;
    }
```

现在不就可以了嘛~

什么？你嫌一个`TextView`太单调？...

那你干嘛不加一个`ImageView`进去啊，然后传入一些令人**心旷神怡**的图片还不是美滋滋？

![Viewpager](https://img.ioioi.top/wiki/viewpagerdemo.gif)

-----

- 本项目地址[**ViewPagerDemo**](https://github.com/rosuH/ViewPagerDemo)

- 感谢下列参考文章

  - [Android ViewPager 无限循环左右滑动（可自动） 实现](https://blog.csdn.net/u012760183/article/details/52230786)

  - [Android ViewPager实现循环滚动](https://www.jianshu.com/p/8744f1ace3be)

    ​

接下来的文章会实现**无限循环滑动**、**页面指示器**，敬请期待~

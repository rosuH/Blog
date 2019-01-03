---
title: "手动实现轮播图（二）：循环滚动、定时切换与指示器"
date: 2018-4-21 19:29:57
tags:
- 'Android'
- 'viewpager'
- '轮播图'
- 'banner'
- 'fragment'

categories:
- 'Android'
- 'ViewPager'

description: "本文是系列文章第二篇，这一次我们开始来造轮子啦..."

---

# 前言

在上一篇文章[手动实现轮播图（一）：ViewPager 入门实践](https://blog.rosuh.me/2018/04/using-viewpager-to-make-a-banner-1/)中，我们认识了`ViewPager`这个布局，也简单上手了一下。

接下来这篇文章，我们会进一步朝着轮播图的方向前进。

> 原来的文章末尾，我使用了 Glide 加载 Gif 图片作为轮播图的内容，所以现在也是基于那个代码继续下去的。
>
> 如果对这部分比较陌生，建议回去看一下文章末尾仓库地址里的代码哦

本文章中我们将会实现：

- 循环滚动
- 切换指示器
- 定时切换

接下来就让我们开工吧。

# 1. 循环滚动

`ViewPager`虽然好用，但是并不原生支持循环滚动，也就是你：

- 第一个往左滑，会跳到最后一个
- 从最后一个往右滑，会调回第一个

我们之前实现的效果里，第一个就无法再往左滑了，最后一个就无法再往右滑了。这样轮播图就不是“轮”播了。

所以我们需要自己来实现循环滚动这个效果。

该怎么实现呢？目前也有比较成熟的三个做法：

## 多页面假循环

- 创建很多个页面，即便我们真正需要展示的时候只有 5 个页面
  - 把起始点放在队列中间，如果到了要展示的第一个页面，继续往左的时候，我们把接下来就把页面设置为最后一个的样式
  - 这样不管用户往左还是往右滑，只要是正常情况下，用户都是滑不到头的，造成视觉上的循环
    - 正常 App 中，即便你使用一个这样的页面队列来显示，用户也没有耐心一直滑下去

假设我们现在创建了 1000 个页面的`ViewPager`，然后我们实际需要展示的只有 5 个页面，那么实现的效果如下：

我们把第一个展示的页面设置为 500，那用户需要滑动 499 才会到头。

![pic](https://img.ioioi.top/wiki/2018-04-21_10-22-02.png)

### 这样性能会不会很差？

- 不会

因为虽然说的是“创建1000”个页面，但是实际上我们只是告诉`ViewPager`的`Adapter`我们会使用这么多个，不代表他会创建这么多个。

我们会在`Adapter`的`getCount`方法里返回 1000，这个方法只是帮助`Adapter`获取正确的`position`的，并不是真正创建出来。（通过阅读`PagerAdapter` 的源码得出）

记得前面我们说过的，`FragmentPagerAdapter`会默认帮我们创建三个页面，所以这里也只会创建三个页面，超过前中后的其他页面都会被回收。

### 其余两种实现方法

我们主要使用第一种，理解起来简单易懂，也没有明显的短板。

其余两种方法描述看下面这篇文章：[Android实现真正的ViewPager【平滑过渡】...](https://blog.csdn.net/zhengxiaoyao0716/article/details/48805703)

---

介绍完实现思路，我们就可以开始实现了。

打开`MainActivity.java`，修改代码如下：

```java
public class MainActivity extends AppCompatActivity {
    private static final int MAX_NUMBER = 1000;
    private static final int START_POSITION = MAX_NUMBER/2;
    ...
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        ...
        mViewPager.setAdapter(new FragmentPagerAdapter(fm) {

            // 存储通过 position 计算出正确的数组索引
            private int mIndex;

            @Override
            public Fragment getItem(int position) {
                mIndex = Math.abs(position - START_POSITION) % mStringList.length;

                if (position < START_POSITION && mIndex != 0){
                    mIndex = mStringList.length - mIndex;
                }

                return PageFragment.newInstance(mIndex);
            }

            @Override
            public int getCount() {
                return MAX_NUMBER;
            }


        });

        mViewPager.setCurrentItem(START_POSITION);

        ...
    }
}
```

- 定义两个常量，分别是
  - `MAX_NUMBER`：页面总数，一共 1000 个
  - `START_POSITION`：起始的页面，从中间第 500 个开始

```java
mIndex = Math.abs(position - START_POSITION) % mStringList.length;

if (position < START_POSITION && mIndex != 0){
    mIndex = mStringList.length - mIndex;
}
```

- 计算当前位置`position`和起始位置（`START_POSITION`）的距离，然后把结果和真正要展示的页面数量（此处暂时使用`mStringList`的长度代替）取余
  - 距离有正负，所以取了绝对值。但是如果只是绝对值然后去取余的话，左滑的时候，就不是 1->5 -> 4 这样子，而是 1 ->2 ->3 这样。这是取余运算的结果，不熟悉的同学可以回忆一下取余的结果
  - 所以我们加了判断
    - 页面`position`大于起始位置 ，那就直接用相对距离取余
    - 如若小于起始位置，那么用实际页面数量减去取余结果，就可以实现倒数的效果了

```java
@Override
public int getCount() {
    return MAX_NUMBER;
}
```

- 此处告诉`Adapter`一共有多少个页面

记得设置起始页面哦：

```java
mViewPager.setCurrentItem(START_POSITION);
```

这样我们的循环滚动就完成了~快试试看吧。

![pic](https://img.ioioi.top/wiki/unlimited-circle.gif)

# 2. 页面指示器

许多轮播图都有一个小指示器，用来标志当前的页面。我们现在就来做一个。

做了前面的循环滚动，这样的页面指示器原理应该不难理解。

思路是：

- 创建控件样式
  - 选中的样式
  - 未选中的样式
- 添加控件到视图里面
- 当页面滑动的时候，修改指示器的样式

## 创建控件样式

在`res/drawable`文件夹里，创建两个文件：

正常样式：*dot_normal.xml*

```xml
<?xml version="1.0" encoding="utf-8" ?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <size android:width="5dp"
        android:height="5dp"/>
    <solid android:color="@android:color/holo_red_dark"/>
</shape>
```

被选中样式：*dot_selected.xml*

```java
<?xml version="1.0" encoding="utf-8" ?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <size android:width="5dp"
        android:height="5dp"/>
    <solid android:color="@color/colorPrimary"/>
</shape>
```

接着在`activity_main.xml`里加入一个`LinearLayout`布局，后面我们使用代码的方式把小点加入进去：

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

    <LinearLayout
        android:id="@+id/ll_inside"
        android:layout_below="@+id/view_pager_inside"
        android:layout_width="match_parent"
        android:layout_height="30dp"
        android:orientation="horizontal"
        android:gravity="center"/>

</RelativeLayout>
```

## 添加控件到视图中

> 此处的代码思路来自[Android ViewPager 无限循环左右滑动（可自动） 实现](https://blog.csdn.net/u012760183/article/details/52230786)。

回到`MainActivity.java`中，

```java
public class MainActivity extends AppCompatActivity {
    private List<TextView> mTextViews;
    private LinearLayout mLinearLayout;

    ...
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mViewPager = findViewById(R.id.view_pager_inside);
        mLinearLayout = findViewById(R.id.ll_inside);

        initCircle();
        ....
    }

    ...
    private void initCircle() {
        mTextViews = new ArrayList<>();
        int d = 20;
        int m = 7;

        for (int i = 0; i < mStringList.length; i++){
            TextView textView = new TextView(this);
            if (i == 0){
                textView.setBackgroundResource(R.drawable.dot_selected);
            }else {
                textView.setBackgroundResource(R.drawable.dot_normal);
            }

            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(d, d);

            params.setMargins(m, m, m, m);
            textView.setLayoutParams(params);
            mTextViews.add(textView);
            mLinearLayout.addView(textView);
        }
    }
    ...
}
```

- 定义两个变量
  - `mTextViews`：存放小点的列表
    - 我们的小点其实是由`TetxView`构成，然后背景颜色设置为圆形的
  - `mLinearLayout`：引用刚刚创建的`LinearLayout`布局
- 创建一个`initCIrcle()`方法
  - 使用代码的方式创建`TextView`视图，为每个视图设置宽高、外边距和背景等属性
    - 背景样式就是刚刚创建的两个`.xml`文件
  - 使用 `addView`方法把小点添加到布局当中

在`Oncreate()`方法中调用之后，我们就会看到小点已经出现了。

现在我们需要根据页面来修改样式，以达到指示器的作用。

```java
public class MainActivity extends AppCompatActivity {

    ...
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        ...
        mViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            @Override
            public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {

            }

            @Override
            public void onPageSelected(int position) {
                changePoints(position % mStringList.length);
            }

            @Override
            public void onPageScrollStateChanged(int state) {
            }
        });  
    }

    private void changePoints(int pos){
        if (mTextViews != null){
            for (int i = 0; i < mTextViews.size(); i++){
                if (pos == i){
                    mTextViews.get(i).setBackgroundResource(R.drawable.dot_selected);
                }else {
                    mTextViews.get(i).setBackgroundResource(R.drawable.dot_normal);
                }
            }
        }
    }
}
```

- 为`mViewPager`添加一个状态监听器`ViewPager.OnPageChangeListener`
  - 重写`onPageSelected()`方法：该方法会在页面被选中的时候调用
  - 在该方法内，我们调用`changePoint()`方法来改变指示器的样式

我们在调用`changePoint()`的时候，传入的是`position % mStringList.length`。这里是有问题的。

如果直接使用`position`对`mString.length`进行取模，在这个例子里是没问题，因为我们起始位置（500）恰好是`mString.length`的倍数。所以此时会从 0 开始。但如果我们以后修改了起始位置亦或者修改了展示图片的数量的话，这里就会出错了。

所以我们还是使用和之前一样的方式来获得索引值。修改一下`onPageSelected()`方法：

```java
private int mIndex;

@Override
public void onPageSelected(int position) {
    mIndex = Math.abs(position - START_POSITION) % mStringList.length;
    if (position < START_POSITION && mIndex != 0){
        mIndex = mStringList.length - mIndex;
     }
    changePoints(mIndex);

}
```

这里为了方便，就直接使用这段代码了。有时间的同学可以自己优化一下，提高复用率。

按照道理，现在应该就可以了。

![indicator](https://img.ioioi.top/wiki/indicator.gif)

# 3. 定时播放

轮播图的其中一个特点，就是定时播放。

我们已经实现了这么多效果了，定时播放应该也是小菜一碟。

我们可以使用`Handle`调用`setCurrentItem()`即可。

> 以下代码思路来自[Android ViewPager 无限循环左右滑动（可自动） 实现](https://blog.csdn.net/u012760183/article/details/52230786)。

修改我们的`MainActivity.java`

```java
private Handler mHandler = new Handler();

protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        ...
        mHandler = new Handler();
        mHandler.postDelayed(new TimerRunnable(),5000);
    }

    class TimerRunnable implements Runnable{

        @Override
        public void run() {
            int curItem = mViewPager.getCurrentItem();
            mViewPager.setCurrentItem(curItem+1);
            if (mHandler!=null){
                mHandler.postDelayed(this,5000);
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mHandler = null; //此处在Activity退出时及时 回收
}
```

# 4. 修改过渡动画

调用`ViewPager.setPageTransformer()`方法即可自行设置动画。

让我们先新建一个动画类`PhotoTransformer.java`

```java
package me.rosuh.android.viewpagernew;

import android.support.annotation.NonNull;
import android.support.v4.view.ViewPager;
import android.view.View;


public class PhotoTransformer implements ViewPager.PageTransformer {
    @Override
    public void transformPage(@NonNull View page, float position) {
        int pageWidth = page.getWidth();

        if (position < -1){
            page.setAlpha(1);
        }else if (position <= 1){
            page.setPivotX(position < 0f ? page.getWidth() : 0f);
            page.setPivotY(page.getHeight() * 0.5f);
            page.setRotationY(90f * position);

        }else {
            page.setAlpha(1);
        }
    }
}

```

然后为`mViewPager`设置动画：

```java
...
FragmentManager fm = getSupportFragmentManager();

mViewPager.setPageTransformer(true, new PhotoTransformer());

mViewPager.setAdapter(...)
```

设置这个动画，最好把`CardView`的阴影属性设置为 0。
然后稍微修改一下布局。（在此不列出，可以到代码仓库自己看一下）。
下面是效果：

![transformer](https://img.ioioi.top/wiki/transformer.gif)

# 结语

本项目地址[**ViewPagerDemo**](https://github.com/rosuH/ViewPagerDemo)。

目前为止，我们的轮播图就已经做好了。

这两篇文章的目标读者是刚入门的同学，所以有许多地方还有改进的空间。

但是不碍于我们掌握。

> 文章作者毕竟经验不多，水平有限，所以缺漏在所难免，希望路过读到本文的前辈们不吝赐教，谢谢~

感谢一下参考文章和资料：

- [**android-viewpager-transformers**](https://github.com/geftimov/android-viewpager-transformers)
- [Android实现真正的ViewPager【平滑过渡】...](https://blog.csdn.net/zhengxiaoyao0716/article/details/48805703)
- [Android ViewPager 无限循环左右滑动（可自动） 实现](https://blog.csdn.net/u012760183/article/details/52230786)

![cat](https://img.ioioi.top/wiki/loadcat.gif)

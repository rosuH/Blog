---
title: "21 章编程挑战：SeekBar 的使用"
date: 2018-3-18 16:02:01
tags:
- 'Android'
- 'seekbar'
- 'soundpool'
- 'Android 编程权威指南'

categories:
- 'Android'


description: "本文章记录的是，『Android编程权威指南』第 21 章的编程挑战。目的是记录下自己实现的过程，以便日后回头看看当初自己的实现方法有什么不足之处，也顺便给没有头绪的其他读者一些可能的思路。"
---

# 前言

一下子就来到了第 21 章。（其实第 17 章的我都没做完呢哈哈，中间有事情耽搁了）。

我们一起来看看这一章的编程挑战是什么？



# 问题：使用 SeekBar 控制播放速率

> 让用户快速多听一些声音，请给BeatBox应用添加播放进度控制功能。完成后的界面如图
> 下图所示。提示：在 BeatBoxFragment 中，使用 SeekBar 组件（developer.android.com/reference/
> android/widget/SeekBar.html）控制 SoundPool 的 play(int, float, float, int, int, float)
> 方法的播放速率参数值。



![](https://img.ioioi.top/wiki/SumatraPDF_2018-03-27_08-22-18.png)

请诸位一定要好好阅读题目...此处只讲了使用`seekbar`控制播放的速率参数。没有说要做其他的功能。

当时我脑袋瓜子可能没转过弯，于是想着顺便把播放控制都做出来...于是设计了下面的界面：

![](https://img.ioioi.top/wiki/studio64_2018-03-27_08-39-30.png)





然后逐渐开始工作的时候，发现了一个致命的问题...

### soundpool 不支持进度控制！

原设计来说，`soundpool`就是用来播放短促的音效的，所以也就没有了播放进度控制的功能。这样的话，也就必须舍弃掉上面的功能了。

废话不多说，我们先来看看该怎么做这个编程挑战。



##  seekbar 了解一下？

我们可以直接去看看[官方文档](https://developer.android.com/reference/android/widget/SeekBar.html)怎么说：



> A SeekBar is an extension of ProgressBar that adds a draggable thumb. The user can touch the thumb and drag left or right to set the current progress level or use the arrow keys. Placing focusable widgets to the left or right of a SeekBar is discouraged.

简短解释一下，`seekbar`是`progressBar`的扩展，它添加了可拖放的滑块。用户可以触摸滑块以及将它左右拖动来改变进度。

接下来我们看看怎么用。

> Clients of the SeekBar can attach a `SeekBar.OnSeekBarChangeListener` to be notified of the user's actions.

意思是，我们可以通过给`seekbar`添加一个`onSeekBarChangeListener`监听器来通知用户对进度做了哪些改变。然后可以在监听器里做一些响应动作。



###  seekBar  Demo

我们写一个小 Demo 做一下示范。新建一个`SeekBarDemo`项目。

- 布局文件如下



*activity_main.xml*

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <TextView
        android:id="@+id/ll_text_view"
        android:layout_width="match_parent"
        android:layout_height="48dp" />
    <android.support.v7.widget.AppCompatSeekBar
        android:id="@+id/ll_seek_bar"
        android:layout_width="match_parent"
        android:layout_height="30dp" />
</LinearLayout>
```

布局文件挺简单，一个`TextView`用来展示 `SeekBar`的`progress`，还有一个`SeekBar`。



- 控制器文件如下



*MainActivity.java*



```java
public class MainActivity extends AppCompatActivity {

    private SeekBar mSeekBar;
    private TextView mTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mSeekBar = findViewById(R.id.ll_seek_bar);
        mTextView = findViewById(R.id.ll_text_view);

        mSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                mTextView.setText("Progress = " + progress);
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
                Toast.makeText(MainActivity.this, "SeekBar 触碰中...", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                Toast.makeText(MainActivity.this, "SeekBar 停止触碰...", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
```



这里的内容也简单，先实例化`TextView`和`SeekBar`组件，然后为后者添加一个`setOnSeekBarChangeListener`监听器。

监听器内共三个方法，按**执行顺序**排列如下：



- `onStartTrackingTouch`
  - 当触碰到`SeekBar`时，此方法被调用
  - 文件中为弹出一个 `Toast`
- `onProgressChanged`
  - 当`SeekBar`进度改变时（拖动滑块），此方法被调用
  - 文件中为`TextView`设置显示内容
- `onStopTrackingTouch`
  - 当手离开`SeekBar`时，此方法被调用
  - 文件中为弹出一个 `Toast`



效果如下：

![seekbarDemo](https://img.ioioi.top/wiki/seekbarDemo.gif)



学会了如何使用`SeekBar`，接下来我们就可以开始做我们的编程调整了。



## 完成挑战

回顾一下书里的项目代码，我们的思路如下：

- 在布局中添加一个`SeekBar`
  - 在哪个布局文件里面添加？
- 实例化`SeekBar`并为之添加一个监听器
  - 在哪个控制文件里实例化？
- 在监听器中控制播放的速率
  - 如何是操作更人性化？



### 在哪个布局里面添加 SeekBar 呢？

我的建议是在`activity_fragment.xml`文件里，这个文件是托管`fragment`的`acitivity`的布局文件。

根布局的选择上，我建议使用`RelativeLayout`会比较容易控制位置。具体实现就看你的个人选择了。

我给出我的布局文件，因为我添加了三个控制按钮，所以嵌套多了一层。你可以选择不添加那三个按钮。

*activity_fragment.xml*



```xml
<RelativeLayout android:layout_width="match_parent"
    android:layout_height="match_parent"
    xmlns:android="http://schemas.android.com/apk/res/android">
    <FrameLayout android:id="@+id/fragment_container"
        xmlns:android="http://schemas.android.com/apk/res/android"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <RelativeLayout
        android:layout_alignParentBottom="true"
        android:layout_width="match_parent"
        android:background="#2e2e3a"
        android:layout_height="120dp">
        <TextView
            android:id="@+id/play_control_title"
            android:layout_alignParentTop="true"
            android:layout_width="match_parent"
            android:textColor="#fff"
            android:textAlignment="center"
            android:layout_height="wrap_content"/>
        <LinearLayout
            android:layout_below="@+id/play_control_title"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center">
            <ImageButton
                style="@style/Base.Widget.AppCompat.Button.Borderless"
                android:id="@+id/play_control_left"
                android:layout_width="60dp"
                android:layout_height="60dp"
                android:src="@drawable/ic_action_left"
                android:scaleType="centerCrop"
                android:contentDescription="Jump to last one"/>
            <ImageButton
                style="@style/Base.Widget.AppCompat.Button.Borderless"
                android:id="@+id/play_control_start"
                android:layout_width="60dp"
                android:layout_height="60dp"
                android:src="@drawable/ic_action_play"
                android:scaleType="centerCrop"
                android:contentDescription="play or stop"/>
            <ImageButton
                style="@style/Base.Widget.AppCompat.Button.Borderless"
                android:id="@+id/play_control_right"
                android:layout_width="60dp"
                android:layout_height="60dp"
                android:src="@drawable/ic_action_right"
                android:scaleType="centerCrop"
                android:contentDescription="Jump to next one" />
        </LinearLayout>
        <android.support.v7.widget.AppCompatSeekBar
            android:id="@+id/seek_bar"
            android:layout_alignParentBottom="true"
            android:layout_width="match_parent"
            android:layout_height="56dp" />
    </RelativeLayout>

</RelativeLayout>


```





### 实例化 SeekBar 并为之添加一个监听器

我选择在`BeatBoxFragment.java`文件中实例化。

*BeatBoxFragment.java*



```java
public class BeatBoxFragment extends Fragment {
    private SeekBar mSeekBar;		// seekbar 引用
    private TextView mPlayTitle;	// 显示播放速率的 TextView
    private float mProgress;		// 保存 progress
    private Sound mSound;			// 保存 sound 变量
    ...
    
    // 在 onCreateView 方法中实例化 SeekBar
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState)
    {
        ...
     	mSeekBar = getActivity().findViewById(R.id.seek_bar);
        mSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
               
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
               
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                
            }
        });
    }
}
```





现在我们实例化好了`SeekBar`，也为之添加了一个空的监听器。接下来我们要考虑如何在监听器中操作播放速率，并且如何让操作更加人性化。



### 实现监听器

我们要实现的功能是调节播放速率。所以有如下的判断：

- 点击音效按钮，使用正常速率播放，`SoundPool`的`rate`参数值为 1
- 拖动`Seekbar`，设置新的播放速率
  - 触碰时，播放暂停
  - 触碰结束后，使用新的播放速率自动开始播放以展示效果

所以我们的`SeekBar` 和`BeatBox`类的交互如下：

![SeekBar 交互](https://img.ioioi.top/wiki/chrome_2018-03-27_09-34-41.png)



于是，我们得到的判断：

- 在`onStartTrackingTouch`中向`BeatBox`发送停止播放指令
  - 同时在`seekBar`里获取正在播放的`sound`变量
  - 为了防止播放的音效文件时长太低，而导致无法获取“正在播放”的`sound`，我们可以每次播放方法执行时，就将那个`sound`变量保存起来
- 在`onProgressChanged`方法中，获取用户调整之后的`progress`，然后保存至实例变量`mProgress`
  - 同时设置`mPlayTitle`提示信息
- 在`onStopTrackingTouch`调用`BeatBox.play(sound)`方法进行播放



现在我们可以开始用代码实现了。

- 首先，我们实现`BeatBox`里面，对`sound`变量的保存和返回



*BeatBox.java*



```java
public class BeatBox
{
    private float mRate;	// 实例变量，保存用户调整的播放速率
    private Sound mSound;	// 实例变量，保存正在或将要播放的 sound 变量
    
    public void play(Sound sound)
    {
        Integer soundId = sound.getSoundId();
        if (soundId == null){
            return;
        }
        mSoundPool.play(soundId, 1.0f, 1.0f, 1, 0, this.getRate());
        mSound = sound;
    }
    
    
    public Sound getSound()
    {
        return mSound;
    }
    ...
}
```



这里我们做了两步，在`play`方法中，把每一次的`sound`变量都赋给`mSound`，这样，就不用担心播放时长太短，获取不到正在播放的`sound`了。

然后为`mSound`设置一个`getter`方法就行了。



- 然后是监听器实现



*BeatBoxFragment.java*



```java
mSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener()
{
    @Override
    public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) 
    {
        if (progress == 0)
        {
            mProgress = 0.5F;
        }
        else 
        {
            mProgress = progress * 0.015F + 0.5F;
        }
        
        mPlayTitle.setText("Rate: " + mProgress + " x");
        mBeatBox.setRate(mProgress);
    }

    @Override
    public void onStartTrackingTouch(SeekBar seekBar) 
    {
        mSound = mBeatBox.getSound();
    }

    @Override
    public void onStopTrackingTouch(SeekBar seekBar) 
    {
        mBeatBox.play(mSound);
    }
});
```



这里的实现就和我们思路里说的差不多了。此处就不再赘述。

有一点需要注意的是，`SoundPool.play()`参数`rate`是有范围限制的。

> 1.0 = normal playback, range 0.5 to 2.0

也就是说范围是在`0.5~2.0`之间，然后必须给出为`float`数。而我们的`seekBar`默认范围是`0~100`，所以的计算方法是：`progress * 0.015F + 0.5F`，先乘以比例系数，再加上 0.5。

实测的时候，低于 0.5 也是可以的，但是时长非常长，并且`0.0001`之类的参数可能会出错，所以我们还是用推荐数值。

现在，我们的编程挑战就已经完成了。

你可以启动程序试试看那些惊悚的声音通过不同倍速播放出来的感觉...有点滑稽。哈哈。



-----

我利用了书里的例子，照猫画虎实现了目标功能。但是由于资历尚且、水平有限，可能存在诸多缺漏和不恰当的地方，还请诸君多多指正！谢谢~








































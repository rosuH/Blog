---
title: "Android 札记系列(2)：this 关键字和线程切换"
date: 2018-07-25
tags:
- 'Android'
- '札记'
- 'this'
- '线程'

categories:
- 'Android'
---

## 什么时候使用 `this`

三种情况下我们使用`this`关键字

### 1. 区分对象对象属性和局部变量

```java
class A {
    private int age;
    
    public void setAge(int age){
        this.age = age;
    }
}
```

这里区分外部调用传入的`age`变量和对象的属性`age`。如果我们对象属性有良好的命名格式区分的话，那就可以不用`this`。

```java
class A {
    private int mAge;
    
    public void setAge(int age){
        mAge = age;
    }
}
```



2. 将当前对象作为参数传递给其他方法时

```java
class B {
    
    A.download(this);
}
```



3. 构造器重载时

```java
class A {
    public A(){
        this("Constructor");
    }
    
    public A (String str){
        System.println(str);s
    }
}
```

- 参看[When should I use “this” in a class?](https://stackoverflow.com/questions/2411270/when-should-i-use-this-in-a-class)



## 从子线程切换回 UI  线程

### 1. 使用`runOnUiThread`方法

通过`Activity`使用`runOnUiThread`方法来切换回主线程，进行 UI 更新的操作

```java
MainActivity.this.runOnUiThread(new Runnable(){
    @Override
    public void run(){
        //do something here
    }
});
```

内部原理同样是使用`Handler`机制，源码如下：

```java
    @Override
    public final void runOnUiThread(Runnable action) {
        if (Thread.currentThread() != mUiThread) {
            mHandler.post(action);
        } else {
            action.run();
        }
    }
```

先判断调用此方法的线程是否是UI线程，如果是的话，那就直接`run()`；如果不是，那就用 UI 的`Handler`也就是`mHandler`执行这个动作。

`mHandler`是在`Activity.java`文件中，初始化的操作`mHandler = new Handler()`是在主线程中执行的（即是说，实例化操作是在主线程的`Looper`中执行的），所以他获取到的是主线程的`Hanlder`。

而`Handler`会隐式关联（implicitly associated）实例化它的`Looper`，所以使用它来执行的动作的话，就会在主线程队列中执行了。



### 2. `View.post()`方法

这个方法实际上原理也是和`runOnUiThread()`方法一样，我们看一下源码：

```Java
/**
     * <p>Causes the Runnable to be added to the message queue.
     * The runnable will be run on the user interface thread.</p>
     *
     * @param action The Runnable that will be executed.
     *
     * @return Returns true if the Runnable was successfully placed in to the
     *         message queue.  Returns false on failure, usually because the
     *         looper processing the message queue is exiting.
     *
     * @see #postDelayed
     * @see #removeCallbacks
     */
    public boolean post(Runnable action) {
        final AttachInfo attachInfo = mAttachInfo;
        if (attachInfo != null) {
            return attachInfo.mHandler.post(action);
        }

        // Postpone the runnable until we know on which thread it needs to run.
        // Assume that the runnable will be successfully placed after attach.
        getRunQueue().post(action);
        return true;
    }
```

在注释中，我们看到了：

> 因为 Runnable 已经被添加到 message queue，所以 runnable 将会在 ui 线程运行

这里其实源码中给的是`attachInfo.mHandler.post`，那让我们看一下这个`attachInfo`是什么意思，然后为什么他的`mHandler`就是和主线程的`looper`相关联的。

`attachInfo`变量是由`mAttachInfo`赋予的，两者都是`AttachInfo`的实例变量，下面看看一些`AttachInfo`的源码：

```java
    /**
     * A set of information given to a view when it is attached to its parent
     * window.
     */
    final static class AttachInfo {
        ...
        
        /**
         * Creates a new set of attachment information with the specified
         * events handler and thread.
         *
         * @param handler the events handler the view must use
         */
        AttachInfo(IWindowSession session, IWindow window, Display display,
                ViewRootImpl viewRootImpl, Handler handler, Callbacks effectPlayer,
                Context context) {
            mSession = session;
            mWindow = window;
            mWindowToken = window.asBinder();
            mDisplay = display;
            mViewRootImpl = viewRootImpl;
            mHandler = handler;
            mRootCallbacks = effectPlayer;
            mTreeObserver = new ViewTreeObserver(context);
        }
    }
```

这里我只截取了`AttachInfo`的构造器部分。我们先看最开头的注释：

> 当 view 附加到它的父窗口时，view 得到的一些信息的集合

然后我们来看构造器的注释：

> 使用指定的事件 handler 和 线程来创建一个新的信息集合

这个方法就是父节点附加本节点的时候会调用的方法，传入父节点的信息。父节点是 UI，那么他的操作肯定是在 UI 线程操作的，所以这里的`mHandler`传入的也即是与主线程`Looper`相关联的`handler`了。

所以其实这里的原理和第一步里的也是一样的。这里获取了父节点的`handler`，然后用它执行动作。（有可能父节点是递归向上获取`handler`直到获取`Activity`的`handler`）



### 3. 手动使用`Handler`

前两者内部原理都是`Handler`，我们理解了原理之后，其实我们也可以自己实现这么一个操作。并且可以更加灵活。

我们得首先了解一下，如何切换回主线程。我们前面知道的，`action`是由`hanlder`管理，`handler`将`action`加入到和`hanlde`相关联的`message queue`中。所以我们切换回主线程操作的关键步骤就是获取主线程的`looper`，然后利用这个`looper`来创建一个`handler`然后来管理和执行`action`。幸而获取主线程的`Looper`非常简单，只需要两句：

```java
Handler mHander = new Hander(Looper.getMainLooper());
```

这样得到的`handler`就是和主线程相关联的`handler`了。

于是我们就可以在子线程切换回主线程并更新 UI：

```java
// 子模块
Handler mHandler = new Handler(Looper.getMainLooper());
mHander.post(new Runnable(){
    @Override
    public void run() {
        // update ui
    }
});
```

是不是超级简单啊。不要觉得这个方法很奇怪哦，`AsyncTask`内部也是这么写的哦：

```java
private static Handler getMainHandler() {
        synchronized (AsyncTask.class) {
            if (sHandler == null) {
                sHandler = new InternalHandler(Looper.getMainLooper());
            }
            return sHandler;
        }
    }

```

*资料索引*

- [Android Developer ThreadLocal](https://developer.android.com/reference/java/lang/ThreadLocal)

- [说说 getMainLooper](http://www.icodeyou.com/2015/10/11/2015-10-11-getMainLooper/)
- [Understanding Android Core: Looper, Handler, and HandlerThread](https://blog.mindorks.com/android-core-looper-handler-and-handlerthread-bd54d69fe91a)
- [Understanding Activity.runOnUiThred()](https://medium.com/@yossisegev/understanding-activity-runonuithread-e102d388fe93)



# OKHTTP 下载文件频繁切换线程导致性能开销

我在写下载模块的时候，使用`OkHTTP`作为网络框架。下载操作实现基本都差不多，但是实际中遇到的问题是，更新下载进度的时候，CPU 开销飙升到 50%+。

经过排查发现，我的代码中，每当接受到一个`bytes[]`时，就会计算百分比并更新进度条。实际上因为网速良好的情况下，接受字节块几乎是每时每刻都在进行，然后计算出来及时更新，会频繁切换主副线程从而导致 CPU 占用率飙升。

找到问题之后，我的做法是：

1. 添加一个变量存储之前的进度值
2. 计算出当前进度值之后进行对比，如果进度值相同，那么不更新

为什么进度值会相同呢？因为我们的进度条是 100%，刻度单位是 1%，所以如果进度是在 1 ~ 2 之间的大小的话，他们取整的结果是一样的，而原本的做法是即便一样也会更新，导致了更新频率高的问题。

后面修改了之后，CPU 占用立刻下来了，即便是峰值也不到 25%。应该是正常水平了。



# 线程池的使用

1. 创建线程池之后，可以使用`for`循环，在里面执行



*资料索引*：

- [Java 四种线程池的用法分析](https://blog.csdn.net/u011974987/article/details/51027795)



# 接口与回调相关

1. 子模块定义接口
   1. 子模块本身调用时，创建一个接口变量，并在构造器获取一个实例化的接口实现赋予该变量
2. 主模块实现实现接口并传入实现好的接口
3. 子模块调用，传入参数
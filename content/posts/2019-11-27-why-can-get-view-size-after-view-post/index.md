---
author: rosu
slug: why-can-get-view-size-after-view-post
title: 为什么使用 View.postDelay() 就可以拿到宽高？
date: 2019-11-27
tags:
  - Android
hero: https://unsplash.com/photos/jnuiQZixZNg/download?force=true&w=640
categories:
  - 技术
description: 本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来
---

`View.postDelay()`并不是立刻在 `Handler`  中被调用的。如果当前 View 还没有依附到一个 Window 上，那么这个消息将会先保存在 View 中，直到`dispatchAttachToWindow()`方法被调用时才会把消息加到 Handler 队列中。

下面我们来一步步捋清这个过程。

## View.postDelay()

```java
public boolean postDelayed(Runnable action, long delayMillis) {
    final AttachInfo attachInfo = mAttachInfo;
    if (attachInfo != null) {
        return attachInfo.mHandler.postDelayed(action, delayMillis);
    }

    // Postpone the runnable until we know on which thread it needs to run.
    // Assume that the runnable will be successfully placed after attach.
    getRunQueue().postDelayed(action, delayMillis);
    return true;
}
```

这里判断了`attachInfo`是否为空，如果是那么将消息先存放到 View 自己的内部变量`mRunQueue(HandlerActionQueue)` 内，后者的类型为`HandlerActionQueue`。

`HandlerActionQueue` 这个类只是一个消息队列包装类，即便是执行消息的`executeActions(Handler handler)`方法，也是用外部传入的`handler`来执行的。此处先按下不表。

## 拿到 AttachInfo 的时机

为什么要根据`attachInfo`来决定是否执行呢？因为一个`View`必须要依附到一个 Window 上，由后者逐步调用到（`ViewRootImpl`）执行`measure`,`layout`和`onDraw`。而 AttchInfo 就是由 Window 传递给 View 的信息。

这是从意义的层面去解读，我们接着从源码角度看看 Android 是如何保证 `attchinfo` 不为空后，View 就有意义的。

当然，我们最先看 View 中的`attachInfo`是何时赋值的。

无论是 Activity 或者 Dialog，他们都需要 Window 来承载 View 的显示。比如在 Activity 的`setContentView()`中，就如下代码：

```java
public void setContentView(@LayoutRes int layoutResID) {
    getWindow().setContentView(layoutResID);
    initWindowDecorActionBar();
}
```

这里拿到 window 然后把布局 ID 设置进去，而 Activity 的 window 是在 `attach`方法中拿到的：

```java
final void attach(Context context, ActivityThread aThread,
        Instrumentation instr, IBinder token, int ident,
        Application application, Intent intent, ActivityInfo info,
        CharSequence title, Activity parent, String id,
        NonConfigurationInstances lastNonConfigurationInstances,
        Configuration config, String referrer, IVoiceInteractor voiceInteractor,
        Window window, ActivityConfigCallback activityConfigCallback) 
{
    attachBaseContext(context);

    mFragments.attachHost(null /*parent*/);

    mWindow = new PhoneWindow(this, window, activityConfigCallback);
    mWindow.setWindowControllerCallback(this);
    mWindow.setCallback(this);
    mWindow.setOnWindowDismissedCallback(this);
    mWindow.getLayoutInflater().setPrivateFactory(this);
    ...
    mWindow.setWindowManager(
                (WindowManager)context.getSystemService(Context.WINDOW_SERVICE),
                mToken, mComponent.flattenToString(),
                (info.flags & ActivityInfo.FLAG_HARDWARE_ACCELERATED) != 0);
    ...
}
```

这里窗口已经被创建出来并等待使用。

在 Activity 的 `onResumne()` 阶段，Activity 中的 DecorView 和 Window 中的属性会被设置进 WindowManager，此时 DecorView 才被设置为可见。

`ActivityThread::handleResumeActivity()`

```java
@Override
public void handleResumeActivity(
    IBinder token, 
    boolean finalStateRequest, 
    boolean isForward,
    String reason) 
{
    ...
    r.activity.mVisibleFromServer = true;
    mNumVisibleActivities++;
    if (r.activity.mVisibleFromClient) {
        r.activity.makeVisible();
    }
		...
}
```

`Activity::makeVisible()`

```java
void makeVisible() {
    if (!mWindowAdded) {
        //  getWindowManager() 将从 Activity 的 mWindow.getWindowManager() 拿到 WindowManager
        // 而后者是在 attach 中赋值的，看上面的代码哦
        ViewManager wm = getWindowManager();
        wm.addView(mDecor, getWindow().getAttributes());
        mWindowAdded = true;
    }
    mDecor.setVisibility(View.VISIBLE);
}
```

注意这里的`wm.addView(mDecor, getWindow().getAttributes());`很明显是把`DecorView` 和 Activity 创建的 Window 添加到 `WindowManager` 中。而整个`getWindowManager()`返回的自然就是`Activity `中新建的`PhoneWindow`实例的`WindowManager`。

回顾`attach`中的代码，你会发现赋值`WindowManager`的语句：

`Activity::attach`

```java
mWindow.setWindowManager(
                (WindowManager)context.getSystemService(Context.WINDOW_SERVICE),
                mToken, mComponent.flattenToString(),
                (info.flags & ActivityInfo.FLAG_HARDWARE_ACCELERATED) != 0);
```

点进去看看：

`Window::setWindwManager`

```java
public void setWindowManager(WindowManager wm, IBinder appToken, String appName,
        boolean hardwareAccelerated) {
    mAppToken = appToken;
    mAppName = appName;
    mHardwareAccelerated = hardwareAccelerated
            || SystemProperties.getBoolean(PROPERTY_HARDWARE_UI, false);
    if (wm == null) {
        wm = (WindowManager)mContext.getSystemService(Context.WINDOW_SERVICE);
    }
    // 重点看看这个
    mWindowManager = ((WindowManagerImpl)wm).createLocalWindowManager(this);
}
```

最后一行代码中将返回一个`WindowManagerImpl`类，他是`WindowManager`的实现类。

到了此处，我们再看看之前那句：

`Activity::makeVisiable`

```java
wm.addView(mDecor, getWindow().getAttributes());
```

这里的`wm`实际上是一个`WindowManagerImpl`实例，接着调用的`addView()`方法是`WindowManagerImpl`内部的一个`mGlobal`（`WindowManagerGlobal`）去执行的。至于`WindowManagerGlobal`具体是个啥，我们先按下不表。

我们追踪到这里的原因，只是找到最终实现`addView`的那个类，然后再来看看这个类里有做哪些有意思的事情：

`WindowManagerGlobal::addView()`

```java
// 传进来的这个 View 就是 Activity 传过来的 decorView 
public void addView(View view, ViewGroup.LayoutParams params,Display display, Window parentWindow) {
    ...
    // 新建一个 ViewRootImpl 实例 
	root = new ViewRootImpl(view.getContext(), display);
	view.setLayoutParams(wparams);
    mViews.add(view);
	mRoots.add(root);
    mParams.add(wparams);    
    // do this last because it fires off messages to start doing things
    try {
        // 把 View 设置给 ViewRootImpl
        // 执行这一步之后才真正开始 View 层操作
        root.setView(view, wparams, panelParentView);
    } catch (RuntimeException e) {
        // BadTokenException or InvalidDisplayException, clean up.
        if (index >= 0) {
            removeViewLocked(index, true);
        }
        throw e;
    }   
}
```

接着当然是看看`setView`做了什么了：

`ViewRootImpl::setView	`

```java
public void setView(View view, WindowManager.LayoutParams attrs, View panelParentView) {
    ...
    // Schedule the first layout -before- adding to the window
    // manager, to make sure we do the relayout before receiving
    // any other events from the system.
    requestLayout();
    ...
}
@Override
public void requestLayout() {
    if (!mHandlingLayoutInLayoutRequest) {
        checkThread();
        mLayoutRequested = true;
        scheduleTraversals();
    }
}
void scheduleTraversals() {
    if (!mTraversalScheduled) {
        // 遍历标志位值为 true
        mTraversalScheduled = true;
        mTraversalBarrier = mHandler.getLooper().getQueue().postSyncBarrier();
        mChoreographer.postCallback(
                Choreographer.CALLBACK_TRAVERSAL, mTraversalRunnable, null);
        if (!mUnbufferedInputDispatch) {
            scheduleConsumeBatchedInput();
        }
        notifyRendererOfFramePending();
        pokeDrawLockIfNeeded();
    }
}
```

没想到吧...这里竟然先调用了`requestLayout()`方法。那么这个方法是做啥的呢？你跟着继续看，就可以在`scheduleTraversals()`方法中看到一个`mTraversalScheduled`被置为了`true`。而这个标志位被`doTraversal()`方法用来判断是否执行遍历。终于到了这个重要的方法了：

```java
	ViewRootImpl::doTraversal
void doTraversal() {
    if (mTraversalScheduled) {
        mTraversalScheduled = false;
        mHandler.getLooper().getQueue().removeSyncBarrier(mTraversalBarrier);

        if (mProfile) {
            Debug.startMethodTracing("ViewAncestor");
        }
		// 执行遍历
        performTraversals();

        if (mProfile) {
            Debug.stopMethodTracing();
            mProfile = false;
        }
    }
}
ViewRootImpl::performTraversals
// 代码很长，我摘几句主题相关的拿出来
private void performTraversals() {
    ...
    // 这个 mView 就是 setView 里面那个 DecorView    
    final View host = mView;
    ...
    // ①
    // 开始分发 AttachToWindow 消息，此时将会走  View.dispatchAttachedToWindow() 
    // 这时候 View.onAttachedToWindow() 将会被调用
    host.dispatchAttachedToWindow(mAttachInfo, 0);
    ...
    // Execute enqueued actions on every traversal in case a detached view enqueued an action
    // 这句是执行 ViewRootImpl 自己的消息，不是 host 的消息    
    getRunQueue().executeActions(mAttachInfo.mHandler);  
    ...
    if (!mStopped || mReportNextDraw) {
    	...
    	// ②
    	// 执行 Measure
    	performMeasure(childWidthMeasureSpec, childHeightMeasureSpec);
    	...
	}
	if (didLayout) {
		// 执行 Layout
        performLayout(lp, mWidth, mHeight);
     }
     ...
     // 执行 Draw
     performDraw();
	 ...
}

View::dispatchAttachedToWindow
void dispatchAttachedToWindow(AttachInfo info, int visibility) {
	...
	// ③
	// 使用 View.postDelay 的消息将在此被发送到 handler 中
    if (mRunQueue != null) {
        mRunQueue.executeActions(info.mHandler);
        mRunQueue = null;
    }
    // 调用 onAttachedToWindow() 回调
    performCollectViewAttributes(mAttachInfo, visibility);
    onAttachedToWindow();
	
}

```

或许到此你可能有疑问，明明先执行的 ① 处的代码，按照执行顺序，③ 处的会接着执行，也就是执行`View.postDely` 中的 `Runnable` ；最后才是 `Measure` 、`Layout` 和`Draw`。意味着`View.postDelay`并不一定能到宽高。难道这是面向运气编程？

肯定不是啊😂...你注意看`dispatchAttachedToWindow`里的执行是`mRunQueue.executeActions(info.mHandler);`：

`HandlerActionQueue::executeActions()`

```java
public void executeActions(Handler handler) {
    synchronized (this) {
        final HandlerAction[] actions = mActions;
        for (int i = 0, count = mCount; i < count; i++) {
            final HandlerAction handlerAction = actions[i];
            // 还是在 handler 上发送消息
            handler.postDelayed(handlerAction.action, handlerAction.delay);
        }

        mActions = null;
        mCount = 0;
    }
}
```

这个 `handler` 是主线程的`handler`，而主线程都没有把`performTraversals`执行完，哪能轮到你刚加进来的`View.postDelay`的消息呢...乖乖排队去吧。

所以这里其实用到了异步操作，利用消息队列保证了`Measure`、`Layout`和`Draw`总在`dispatchAttachedToWindow()`后面执行。而`attachInfo`没有拿到的话，`View.postDelay`又是不会执行的。

`View::postDelay`

```java
public boolean postDelayed(Runnable action, long delayMillis) {
    final AttachInfo attachInfo = mAttachInfo;
    if (attachInfo != null) {
        return attachInfo.mHandler.postDelayed(action, delayMillis);
    }

    // Postpone the runnable until we know on which thread it needs to run.
    // Assume that the runnable will be successfully placed after attach.
    getRunQueue().postDelayed(action, delayMillis);
    return true;
}
```
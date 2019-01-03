---
title: "Android 札记系列(3)：Java 异常和 WeakReference"
date: 2018-07-27
tags:
- 'Android'
- '异常'
- 'Java'
- 'WeakReference'

categories:
- 'Android'

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是 Java 中的异常机制、如何在捕获子线程抛出的异常以及对弱引用的一些阐述"

---

# 子线程抛异常的问题

在尝试使用子线程抛出异常的时候，整个应用都会 crash 掉。

## Java Exception 入门

### 受查异常和运行时异常

- 受查异常指的是可以被编译器检查出来的，指的是『在正常工作中可能会发生的错误』，比如像是网络连接错误、IO 错误等等；这些错误不是程序的逻辑错误，而是其他因素导致的。这类异常是必须被处理的
- 运行时异常指的一般是程序逻辑缺漏，比如用户输入错误、某些配置文件错误等等，是可以通过程序进行避免的，这种异常应该尽量减少，编译器也不会检查

#### 1. 在方法声明使用`throws`表明此方法会抛出异常

这种方法需要调用者**主动捕获**异常，而编写者不需要担心这些事情。

```java

...
public A() throws RuntimeException{
    ...
}

// the caller

try {
    A a = new A();
}catch(RuntimeException re){
    ...
}
```

> **Throws抛出异常的规则：**
>
> ​    1) 如果是不可查异常（unchecked exception），即Error、RuntimeException或它们的子类，那么可以不使用throws关键字来声明要抛出的异常，编译仍能顺利通过，但在运行时会被系统抛出。
>
> ​    2）必须声明方法可抛出的任何可查异常（checked exception）。即如果一个方法可能出现受可查异常，要么用try-catch语句捕获，要么用throws子句声明将它抛出，否则会导致编译错误
>
> ​    3)仅当抛出了异常，该方法的调用者才必须处理或者重新抛出该异常。当方法的调用者无力处理该异常的时候，应该继续抛出，而不是囫囵吞枣。

#### 2. **主动抛出**异常

> throw总是出现在函数体中，用来抛出一个Throwable类型的异常。程序会在throw语句后立即终止，它后面的语句执行不到，然后在包含它的所有try块中（可能在上层调用函数中）从里向外寻找含有与其匹配的catch子句的try块。

*参看*：

- [深入理解 Java 异常处理机制](https://blog.csdn.net/hguisu/article/details/6155636)

## Handle 子线程异常

如果捕获子线程异常呢？子线程在抛出异常之后，会引发整个程序的 crash，所以我们需要在主线程捕获异常之后进行一定的处理。

在 Java 中，可以使用`Thread.setUncaughtExceptionHandler()`为子线程设置一个`Handelr`，以便在抛出异常的时候有`Handler`可以处理这个异常。

```java

private Thread.UncaughtExceptionHandler mUncaughtExceptionHandler;


    @Override
    protected void onCreate(Bundle savedInstanceState) {

        mUncaughtExceptionHandler = new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread t, Throwable e) {

                e.getCause().printStackTrace();
            }
        };
    }

    private void exception(){
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                throw new RuntimeException("===Test===");
            }
        });
        thread.setUncaughtExceptionHandler(mUncaughtExceptionHandler);
        thread.start();
    }
```

这样的话，当子线程抛出异常之后，`mUncaughtExceptionHandler`会捕获该异常。我们是在主线程`new`了一个`handler`，所以该异常会在主线程捕获并处理。

*参看*：

- [The *exception hierarchy* in Java](https://www.javamex.com/tutorials/exceptions/exceptions_hierarchy.shtml)
- [Java Docs setUncaughtExceptionHandler](https://docs.oracle.com/javase/6/docs/api/java/lang/Thread.html#setUncaughtExceptionHandler%28java.lang.Thread.UncaughtExceptionHandler%29)

# 同一线程收发消息

遇到的情况是：

1. 子线程使用`runOnUiThread()`发送消息
2. 然后在主线程又使用`runOnUiThread()`接受消息

结果造成了线程阻塞，UI 不更新。

# ButterKnife 忘记 bindView()

一直忘记在`Activity`调用这个方法。

# WeakReference 和 WeakHashMap

使用弱引用和`WeakHashMap`来防止内存泄露。

## WeakReference 使用方法

1. 在主模块实例化`WeakReference`对象，把这个对象传给子模块
2. 子模块调用`WeakReference.get()`方法，获得存在里面的对象
   - 这个时候有可能获取不到，所以要做`null`判断

这样的方式来防止子模块一直持有主模块的某些引用，而可能导致内存泄露的问题。

对于`WeakReference`：

```java
...
// 新建一个含有 object1 的 WeakReference 对象
WeakReference<Object>() weakRef = new WeakReference<>(object1);
// 使用
Object object = weakRef.get();
if (object != null){
    // do something...
}else{
    throw new RuntimeException("object is null")
}
```

上述的使用方法，`object1`如果在其他地方没有使用，那么它是有可能会被回收的。

但是如果，在`WeakReference`之外，还有其他的`Strong Reference`的话，那它是不会被回收的。这样我们的工作就白做了。

例如：

```java
...
// 使用
Object object = weakRef.get();
if (object != null){
    // do something...
}else{
    throw new RuntimeException("object is null")
}
// 其他地方还有强引用
Object obj2 = object1;
```

*参看*：

- [不只是给面试 Java WeakReference 理解](http://puretech.iteye.com/blog/2008663)

## WeakHashMap 用法

观看`WeakHashMap`的源码，其实用法和`HaspMap`是差不多的：

> Hash table based implementation of the Map interface, with
> weak keys.

基于`Hash Table`基类，`Map`接口的实现类，使用了`weak`的`key`。

> When a key has been discarded its entry is effectively removed from the map,
>
> so this class behaves somewhat differently from other Map implementations.

当某个`key`已经被抛弃不用，那么该`key`对应的`value`会自动从`map`中删去。

自动删除的操作是在`expungeStaleEntries()`方法中实现的：

```java
/**
     * Expunges stale entries from the table.
     */
    private void expungeStaleEntries() {
        for (Object x; (x = queue.poll()) != null; ) {
            synchronized (queue) {
                @SuppressWarnings("unchecked")
                    Entry<K,V> e = (Entry<K,V>) x;
                int i = indexFor(e.hash, table.length);

                Entry<K,V> prev = table[i];
                Entry<K,V> p = prev;
                while (p != null) {
                    Entry<K,V> next = p.next;
                    if (p == e) {
                        if (prev == e)
                            table[i] = next;
                        else
                            prev.next = next;
                        // Must not null out e.next;
                        // stale entries may be in use by a HashIterator
                        e.value = null; // Help GC
                        size--;
                        break;
                    }
                    prev = p;
                    p = next;
                }
            }
        }
```

# OKHTTP3 线程池与异步请求

## OKHTTP3 内部的线程池

用的时候才知道，它内部确实维护了一个线程池，想要实现多文件同时下载的话，只需要写个循环调用`call.enqueue()`就可以了。

下面是最基本的用法，这里，`OkHttpClient`实现了`Call`接口。

```java
OkHttpClient client = new OkHttpClient();
Request request = new Request.Builder().get().url(url).build();
Call call = client.newCall(request);
```

内部的调用链是这样的：

1. `OkHttpClient.newCall()` --> `RealCall.newRealCall(client, request, forWebSocket)`
2. `RealCall`实现了`Call`接口之后，返回一个`call`的实例

在该实例里面，有这么一个方法`enqueue`：

```java
@Override public void enqueue(Callback responseCallback) {
    synchronized (this) {
      if (executed) throw new IllegalStateException("Already Executed");
      executed = true;
    }
    captureCallStackTrace();
    eventListener.callStart(this);
    client.dispatcher().enqueue(new AsyncCall(responseCallback));
}
```

这就是`call.enqueue()`所调用的方法。在这个方法里面，先检查该`call`有没有执行，如果没有那就加入通过`dispatcher().enqueue`加入队列中。

`AsyncCall`类是`RealCall`的内部类，是一个`NamedRunnable`的实现类。（后者是`Runnable`的实现类，主要是给线程加上名字。

这个`AsyncCall`主要是执行一些回调操作。真正的执行操作是在`dispatcher()`中的：

```java
synchronized void enqueue(AsyncCall call) {
    if (runningAsyncCalls.size() < maxRequests && runningCallsForHost(call) < maxRequestsPerHost) {
      runningAsyncCalls.add(call);
      executorService().execute(call);
    } else {
      readyAsyncCalls.add(call);
    }
  }
```

这里先判断一些限制，如果没问题那就调用`OkHttp3`实现的线程池的`execute()`方法来执行。如果超过限制，那就加入`readyAsyncCalls`这个双向队列中，进行排队。

我们来看`executorService()`这个方法：

```java
public synchronized ExecutorService executorService() {
    if (executorService == null) {
      executorService = new ThreadPoolExecutor(0, Integer.MAX_VALUE, 60, TimeUnit.SECONDS,
          new SynchronousQueue<Runnable>(), Util.threadFactory("OkHttp Dispatcher", false));
    }
    return executorService;
  }
```

这个方法就是新建了一个自定义的线程池，我挑几个重要的讲：

- 核心线程数 = 0
- 最大线程数 = $2^{31} -1$（`Integer.MAX_VALUE`就是保存了这个值）
- `SynchronousQueue<>()`队列

### corePoolSize VS maximumPoolSize

为什么核心线程数可以为 0？为什么还要设置`maximumPoolSize`这个参数呢？

- 核心线程指的是线程池最基础的线程数，即便全部都是空闲的，他也会拥有这么多的线程
- 最大线程数指的是最大可创建的线程数

当一个任务被添加进来，如果当前线程数少于**核心线程数**，那么即便其他是空闲的，也会创建一个新的线程来管理这个任务。

如果当前线程数已经达到核心线程数了，那么会先判断当前这些线程的**任务队列**是否满了，如果队列没有满，那么将任务添加到队列中。如果已经满了，那么尝试创建新的线程，这一条线程就是要看是否大于最大线程数了。

所以`OkHttp3`中，核心线程数是 0 ，那么线程池空闲时就是没有线程的；一旦有任务进来，就会新建线程。

*参看*：

- [Class ThreadPoolExecutor](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html)
- [聊聊并发（三）——JAVA线程池的分析和使用](http://www.infoq.com/cn/articles/java-threadPool)
- [OkHttp3 如何取消请求](http://ngudream.com/2016/07/22/okhttp-call-cancel/)

## OkHTTP3 使用 header 控制下载起始点

`OKHTTP3`可以添加自定义头部，使用`addHeader`：

```java
request = new Request.Builder()
                .addHeader("RANGE", "bytes=" + downloadFileLength + "-")
                .get().url(remoteUrl).build();

```

这样构建了一个`request`，会从`downloadFileLength`开始接收数据。这样我们其实就间接地实现了下载的暂停与恢复功能——我们只需要从存储中读取上次下载的文件的大小，跳过这一部分，并在新建文件流的时候把模式设为『追加』模式即可：

```java
File file = new File(localUrl, fileName);
fileOutputStream = new FileOutputStream(file, true);
```

*参看*：

- [okHttp重试机制](https://blog.csdn.net/fengrui_sd/article/details/79004691)
- [OKHTTP3 实现下载、暂停和删除](https://blog.csdn.net/yozhangxin/article/details/78912432)

## Java 文件批量删除

```java
for(File file: dir.listFiles())
    if (!file.isDirectory())
        file.delete();
```

*参看*：

- [Delete all files in directory (but not directory) - one liner solution](https://stackoverflow.com/questions/13195797/delete-all-files-in-directory-but-not-directory-one-liner-solution)
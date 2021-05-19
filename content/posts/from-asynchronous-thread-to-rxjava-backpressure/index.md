---
title: "从异步线程到 RxJava 的背压控制"
date: 2018-09-28
author: rosu
tags:
  - "Android"
  - "RxJava"
  - "Flowable"
  - "背压"
  - "异步"
  - "多线程"

categories:
  - "技术" 
---

# 1. RxJava 中的异步控制

在以前也遇到了类似的场景，那时候还是再使用`AsyncTask`的时候。
我们知道`AsyncTask`中有`doInBackground()`方法是一个子线程的异步方法。我们一般在里面执行耗时操作。
但是我们会在`doInBackground()`中执行一个耗时的异步操作吗？看看下面的例子

```java
...
protected boolean doInBackground(String... urls) {
        loadImageFromNetwork(urls[0], targetObej);
        return true;
}
...    
```

这里的示例中，我们调用`loadImageFromNetwork()`方法，将第一个参数中的图片下载下来，然后填充到`targetObjet`这个对象中去。
但是这里调用的实际上是一个异步操作，程序调用了`loadImageFromNetwork()`就顺序执行了，返回了一个`true`值。
这样的话再加载情况未知的情况下，程序逻辑已经继续执行下去了。

如果只是使用`RxJava`来控制业务逻辑的话，那么异步线程里再开一个子线程的问题也会遇到同样问题呀：

```java
/**
 * @author rosu on 2018/10/27
 * 这个类用于展示 Rxjava 中异步操作中继续调用异步方法的情况
 */
public class FlatMapWithChildProcess {
    public static void main(String[] args) {
        Observable
                .create((ObservableOnSubscribe<Integer>) emitter -> {
                    System.out.println("Create1 ===>>> 创建并发射事件");
                    System.out.println("当前线程====>>> 1" + Thread.currentThread().getName());
                    emitter.onNext(1);
                })
                .flatMap((Function<Integer, ObservableSource<Integer>>) integer -> {
                    System.out.println("当前线程====>>> 2" + Thread.currentThread().getName());
                    hardWork();
                    System.out.println("顺序执行了");
                    return Observable.just(integer);
                })
                .subscribe(new Observer<Integer>() {
                    @Override
                    public void onSubscribe(Disposable d) {
                        System.out.println("onSubscribe =======>>> 开始订阅事件");
                    }

                    @Override
                    public void onNext(Integer integer) {
                        System.out.println("onNext ======>>> " + integer);

                    }

                    @Override
                    public void onError(Throwable e) {

                    }

                    @Override
                    public void onComplete() {
                        System.out.println("onComplete ========>>> ");
                    }
                });
    }

    private static void hardWork(){
        new Thread(() -> {
            try {
                System.out.println("当前线程====>>> 3" + Thread.currentThread().getName());
                Thread.sleep(10000);
                System.out.println("睡眠完成的子线程");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

输出为：

```shell
onSubscribe =======>>> 开始订阅事件
Create1 ===>>> 创建并发射事件
当前线程====>>> 1main
当前线程====>>> 2main
当前线程====>>> 3Thread-0
顺序执行了
onNext ======>>> 101
睡眠完成的子线程
```

虽然例子看起来有点长，但内容不多。我们只是尝试在`flatMap()`调用了`hardWork()方法`，该方法中中起了一个耗时子线程。
看到输出的结果也在我们的意料之中，原有的工作逻辑在调用了`hardWork()`之后就继续执行了，因为他无法得知那个方法是个异步的方法，也无法获得该方法的执行状态。

例子比较简单，在实际的工作中我们可能会遇到一些情况，考虑这样一个例子：

1. 利用 RxJava 循环发射一些事件，常见是用`fromArray()`或`intervalRange()`这样的方法
    - 此处我们发射一个`url`链接数组的元素
2. 我们利用了 RxJava 本身的特性来控制业务逻辑，包括对每个事件的处理
    - 此处，我们可能是对`url`做一些拼接或者判断有效性的工作
3. 之后我们需要利用发射的事件做耗时操作
    - 此处，我们是利用`url`来下载文件，假设调用了`download(url:Int)`方法
4. 最后在`onComplete()`方法中完成视图操作    

这看起来是非常正常的业务逻辑，唯一值得注意的地方应该是耗时操作这个地方。我们先来看看例子的简易代码示例：

```java
public class FlatMapWithChildProcess {
    public static void main(String[] args) {
        Observable
                .fromArray(1, 2, 3, 4, 5, 6)
                .flatMap((Function<Integer, ObservableSource<Integer>>) integer -> {
                    download(integer);
                    return Observable.just(integer);
                })
                .subscribe(new Observer<Integer>() {
                    @Override
                    public void onSubscribe(Disposable d) {
                        System.out.println("onSubscribe =======>>> 开始订阅事件");
                    }

                    @Override
                    public void onNext(Integer integer) {
                        System.out.println("onNext ======>>> " + integer);

                    }

                    @Override
                    public void onError(Throwable e) {

                    }

                    @Override
                    public void onComplete() {
                        System.out.println("onComplete ========>>> RxJava 事件完成了");
                        UpdateUI();
                    }
                });
    }

    private static void download(int pos){
        new Thread(() -> {
            try {
                System.out.println("接到工作 ===>>> " + pos);
                Thread.sleep(10000);
                System.out.println("完成工作 ===>>> " + pos + "\n 时间：" + System.currentTimeMillis());
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

看一下输出：

```shell
onSubscribe =======>>> 开始订阅事件
接到工作 ===>>> 1
onNext ======>>> 1
接到工作 ===>>> 2
onNext ======>>> 2
接到工作 ===>>> 3
onNext ======>>> 3
接到工作 ===>>> 4
onNext ======>>> 4
onNext ======>>> 5
接到工作 ===>>> 5
onNext ======>>> 6
接到工作 ===>>> 6
onComplete ========>>> RxJava 事件完成了
完成工作 ===>>> 1
 时间：1543916254101
完成工作 ===>>> 4
 时间：1543916254103
完成工作 ===>>> 6
 时间：1543916254103
完成工作 ===>>> 3
 时间：1543916254103
完成工作 ===>>> 2
 时间：1543916254103
完成工作 ===>>> 5
 时间：1543916254103
```

这里可以看到我们耗时操作还没做完，`RxJava`就已经回调了`onComplete()`了。所以这显然是不行的。

# 2. Flowable 能拯救这段代码吗？

众所周知...RxJava2 带来了`Flowable`这个新的观察者。又一个众所周知，`Flowable`是一个带有背压控制的观察者。
那么背压控制，能解决这个问题吗？

## 2.1 Flowable 的背压误区？FlatMap 初探

于是我随手写了这段代码：

```java
public class FlowableWithBackPressure {
    public static void main(String[] args) {
        Flowable
                .fromArray(1, 2, 3, 4, 5)
                .flatMap((Function<Integer, Publisher<Integer>>) integer -> {
                    download(integer);
                    return Flowable.just(integer);
                })
                .map(integer -> integer + 20)
                .subscribe(new FlowableSubscriber<Integer>() {
                    @Override
                    public void onSubscribe(Subscription s) {
                        
                    }

                    @Override
                    public void onNext(Integer integer) {
                        System.out.println("RxJava =======>>> onNext");
                    }

                    @Override
                    public void onError(Throwable t) {

                    }

                    @Override
                    public void onComplete() {
                        System.out.println("RxJava =======>>> 时间完成了");
                    }
                });


    }

    private static void download(int pos){
        new Thread(() -> {
            try {
                System.out.println("接到工作 ===>>> " + pos);
                Thread.sleep(500);
                System.out.println("完成工作 ===>>> " + pos + "\n 时间：" + System.currentTimeMillis());
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

看一下输出：

```shell
接到工作 ===>>> 1
接到工作 ===>>> 2
接到工作 ===>>> 3
接到工作 ===>>> 4
接到工作 ===>>> 5
完成工作 ===>>> 1
 时间：1543918837921
完成工作 ===>>> 3
 时间：1543918837924
完成工作 ===>>> 4
 时间：1543918837924
完成工作 ===>>> 2
 时间：1543918837924
完成工作 ===>>> 5
 时间：1543918837926
```

咦？貌似有什么地方出了问题啊。按照我~~们~~的平时认知，没有调用`Subscription.request()`，就不会发射事件才对啊。
为啥这里还是调用了呢？当然熟悉的人一下子就看出来了。
问题出在与`flatmap()`方法。

实际上对于`flatMap()`之类的方法，是将原来的事件流转换为新的类型的事件流。问题就在这里了。
转换的步骤，根据文档的说明是，`flatMap()`会将每个事件重新包装，最后再将所有事件合并发射。这样的话，实际上就是又构造了一个新的事件发射器，也就是一个新的『上游』

### 事件的『上游』和『下游』

我之前粗浅的认知里，以为第一个发射的源头是上游，其他都是下游。实际上『上下游』是一个相对的概念，比如这里的`flatMap()`，他重新包装了事件并重新发射了，他就是一个新的『上游』。这样的话，肯定所有事件不需要`request()`就可以直接发射到这个`flatMap()`方法里面了。


## 2.2 Flowable 和 背压控制


我们了解了『上下游』概念之后，其实横在我们面前的是，如何**正确地**动态控制事件发射呢？
众所周知，Flowable 带来的背压控制的概念。我们前面也提到了通过`Subscription.request()`来控制上游发射。
但是类似 2.1 中举的例子，在上游你是无法控制的。而且我们又要利用`RxJava`来控制业务逻辑，也就是对每个链接进行处理。
这样的话，实际上我们只能在下游动态拉取才行。动态拉取就是`Subscription.request()`啊？
那该怎么做呢？
其实很简单，我们把耗时操作放在`onNext()`里就行了：

```java
public class FlowableWithBackPressure {
    private static Subscription mSubscription;

    public static void main(String[] args) {
        Flowable
                .fromArray(1, 2, 3, 4, 5)
                .map(integer -> integer + 20)
                .subscribe(new FlowableSubscriber<Integer>() {
                    @Override
                    public void onSubscribe(Subscription s) {
                        mSubscription = s;
                        mSubscription.request(1);
                    }

                    @Override
                    public void onNext(Integer integer) {
                        System.out.println("onNext() =======>>> 调用 download() 方法");
                        download(integer);
                    }

                    @Override
                    public void onError(Throwable t) {

                    }

                    @Override
                    public void onComplete() {
                        System.out.println("RxJava =======>>> 时间完成了");
                    }
                });


    }

    private static void download(int pos){
        new Thread(() -> {
            try {
                System.out.println("接到工作 ===>>> " + pos);
                Thread.sleep(3000);
                System.out.println("完成工作 ===>>> " + pos + "\n 时间：" + System.currentTimeMillis() + "\n 准备拉取");
                mSubscription.request(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

可以看到，任务执行到`onNext()`方法，然后我们在里面调用了一个异步的耗时操作，等到耗时操作完成之后，采取拉取下一个事件发射。

这是输出结果：

```java
onNext() =======>>> 调用 download() 方法
接到工作 ===>>> 21
完成工作 ===>>> 21
 时间：1543983837259
 准备拉取
onNext() =======>>> 调用 download() 方法
接到工作 ===>>> 22
完成工作 ===>>> 22
 时间：1543983840264
 准备拉取
onNext() =======>>> 调用 download() 方法
接到工作 ===>>> 23
完成工作 ===>>> 23
 时间：1543983843269
 准备拉取
onNext() =======>>> 调用 download() 方法
接到工作 ===>>> 24
完成工作 ===>>> 24
 时间：1543983846275
 准备拉取
onNext() =======>>> 调用 download() 方法
RxJava =======>>> 时间完成了
接到工作 ===>>> 25
完成工作 ===>>> 25
 时间：1543983849278
 准备拉取
```

这样我们就完成了原来的目标，既用了`RxJava`控制业务逻辑，又在其中做了耗时操作并动态拉取事件，也就是背压控制。
如果耗时操作并不是业务最下游，那么我们可以使用`doOnNext()`方法来达到同样的效果：

```java
public class FlowableWithBackPressure {
    private static Subscription mSubscription;

    public static void main(String[] args) {
        Flowable
                .fromArray(1, 2, 3, 4, 5)
                .map(integer -> integer + 20)
                .doOnNext(new Consumer<Integer>() {
                    @Override
                    public void accept(Integer integer) throws Exception {
                        System.out.println("doOnNext() =======>>> 调用 download() 方法");
                        download(integer);
                    }
                })
                .subscribe(new FlowableSubscriber<Integer>() {
                    @Override
                    public void onSubscribe(Subscription s) {
                        mSubscription = s;
                        mSubscription.request(1);
                    }

                    @Override
                    public void onNext(Integer integer) {
                        System.out.println("onNext()2 =======>>>");
                    }

                    @Override
                    public void onError(Throwable t) {

                    }

                    @Override
                    public void onComplete() {
                        System.out.println("RxJava =======>>> 时间完成了");
                    }
                });


    }

    private static void download(int pos){
        new Thread(() -> {
            try {
                System.out.println("接到工作 ===>>> " + pos);
                Thread.sleep(3000);
                System.out.println("完成工作 ===>>> " + pos + "\n 时间：" + System.currentTimeMillis() + "\n 准备拉取");
                mSubscription.request(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

这是输出：

```shell
doOnNext() =======>>> 调用 download() 方法
接到工作 ===>>> 21
onNext()2 =======>>>
完成工作 ===>>> 21
 时间：1543984443387
 准备拉取
doOnNext() =======>>> 调用 download() 方法
onNext()2 =======>>>
接到工作 ===>>> 22
完成工作 ===>>> 22
 时间：1543984446390
 准备拉取
doOnNext() =======>>> 调用 download() 方法
onNext()2 =======>>>
接到工作 ===>>> 23
完成工作 ===>>> 23
 时间：1543984449396
 准备拉取
doOnNext() =======>>> 调用 download() 方法
onNext()2 =======>>>
接到工作 ===>>> 24
完成工作 ===>>> 24
 时间：1543984452400
 准备拉取
doOnNext() =======>>> 调用 download() 方法
onNext()2 =======>>>
RxJava =======>>> 事件完成了
接到工作 ===>>> 25
完成工作 ===>>> 25
 时间：1543984455406
 准备拉取

```

`doOnNext()`可以注册一个回调，每当`Observable`的`onNext()`调用之前就会调用本方法。

# 3. 还有一点小问题

我们把耗时操作放在了`onNext()`中调用，也就是调用了`download()`方法。
但是这样的还是有两个明显的问题：

1. `download()`方法和 RxJava 流耦合了，因为用到了`Subscription.request()`

2. 最后的一个事件依旧是还未`download()`完就调用了`onComplete()`，这是肯定的。因为最后一个事件之后，并不在需要`request()`了。所以事件流就结束了
    - 看一下上面的输出，先输出了`RxJava =======>>> 事件完成了`

看到这两个问题，其实我们就该思考这种做法一开始就存在了问题。本身`RxJava`就良好地支持了异步回调控制的功能，如果非要在异步中再加上异步，造成的问题就是子线程状态难以控制。

其实我们一开始就可以把`download()`方法写成同步方法，这样的话，利用`RxJava`本身对线程的控制能力，我们一样可以轻松地实现类似的业务需求。












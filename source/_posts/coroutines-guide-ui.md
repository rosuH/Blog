---
title: "【翻译】协程在 UI 编程中的使用指南"
date: 2019-01-09 09:25
tags:
  - "Android"
  - "Coroutine"
  - "协程"
  - "翻译"
categories:
  - "技术"
---

> 原文链接：https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/coroutines-guide-ui.md#basic-ui-coroutines
>
> 原文开源协议：https://github.com/Kotlin/kotlinx.coroutines/blob/master/LICENSE.txt



本指南假设您已经对协程这个概念有了基础的理解，如果您不了解，可以看看 [Guide to kotlin.coroutines](https://github.com/Kotlin/kotlinx.coroutines/blob/master/docs/coroutines-guide.md)，它会给出一些协程在 UI 编程中应用的示例。

所有 UI 应用程序库都有一个普遍的问题：他们的 UI 均受限于一个主线程中，所有的 UI 更新操作都必须发生在这个特定的线程中。对于此类应用使用协程，这意味您必须有一个合适的协程调度器，将协程的执行操作限制在那个特定的 UI 线程中。

对于此，`kotlin.coroutine`有三个模块，他们为不同的 UI 应用程序库提供协程上下文。

- [kotlinx-coroutines-android](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-android) -- `Dispatchers.Main` Android 应用程序上下文
- [kotlinx-coroutines-javafx](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx) -- `Dispatcher.JavaFx` JavaFx UI 应用程序上下文
- [kotlinx-coroutines-swing](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-swing) -- `Dispatcher.Swing` Swing UI 应用程序上下文

`kotlin-coroutines-core`库里的`Dispatcher.Main`提供了可用的 UI 分发器实现，而[`ServiceLoader`](https://docs.oracle.com/javase/8/docs/api/java/util/ServiceLoader.html) API 会自动发现并加载正确的实现（Android，JavaFx 或 Swing）。举个例子，如果您正在编写 JavaFx 应用程序，您可以使用`Dispatcher.Main`或`Dispatcher.JavaFx`扩展，他们是同一个对象。

本指南同时涵盖了所有的 UI 库，因为每个模块只包含一个长度为几页的对象定义。您可以使用其中任何一个作为示例，为您喜欢的 UI 库编写相应的上下文对象，即便它未被本文写出来。



## 目录

- 设置
  - [JavaFx](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/coroutines-guide-ui.md#javafx)
  - [Android](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/coroutines-guide-ui.md#android)
- 基础 UI 协程
  - 启动 UI 协程
  - 取消 UI 协程
- 在 UI Context 中使用 actors
  - 扩展协程
  - 最多仅有一个协程 job
  - 事件合并
- 阻塞操作
  - UI 卡顿问题
  - 结构化并发、生命周期和协程亲子继承
  - 阻塞操作
- 进阶提示
  - 不使用分发器在 UI 事件控制器中启动协程

## 设置

本指南中可运行的例子将使用 JavaFx 实现。这么做的好处是，所有的示例可以直接在任何操作需要上运行而不需要安装任何模拟器或类似的东西，并且他们是完全独立的。



### JavaFx

这个基础的 JavaFx 示例程序由一个名为`hello`并使用`Hello World!`进行初始化的文本标签以及一个名为`fab`的桃红色的位于右下角的原型按钮组成。

![ui-example-javafx](https://i.loli.net/2019/01/09/5c34cb074b9de.png)

JavaFx 的 `start`函数将会调用`setup`函数，并将`hello`和`fab`这两个节点的引用作为参数传递给 `setup` 函数。`setup` 函数是本指南中存放各种代码的地方：

```kotlin
fun setup(hello:Text, fab: Circle) {
    // 占个位
}
```



> 点击[此处](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-basic-01.kt)查看完整代码

您可以从 GitHub `clone`  [kotlinx.coroutines](https://github.com/Kotlin/kotlinx.coroutines) 项目到您本地，然后用 IDEA 打开。本指南的所有例子都在 [`ui/kotlinx-coroutines-javafx`](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx) 模块的 `test`文件夹中。这样您便可以运行并观察每一个例子的运行情况以及修改项目来进行实验。



## Android

跟着 [Getting Started With Android and Kotlin](https://kotlinlang.org/docs/tutorials/kotlin-android.html) 这份指南，在 Android Studio 中创建 Kotlin 项目。我们也推荐您使用 [Kotlin Android Extensions](https://kotlinlang.org/docs/tutorials/android-plugin.html)  中的扩展特性。

在 Android Studio 2.3 中，您会得到下面的类似的应用程序界面：

![ui-example-android](https://i.loli.net/2019/01/09/5c34cb1ef0bda.png)

到`context_main.xml`文件中，为您的`TextView`分配`hello`的资源 ID，然后使用`Hello World!`来初始化它。

那个桃红色的浮动按钮资源  ID 是`fab` 。

在`MainActivity.kt`中，移除掉`fab.setOnclickListener{...}`，接着在`onCreate()`方法的最后一行添加一行`setup(hello, fab)`来调用它。

然后在`MainActivity.kt`文件的尾部，给出`setup()`函数的实现：

```kotlin
fun setup(text: TextView, fab: FloatingActionButton){
    // 占位
}
```



在您`app/build.gradle` 的`dependecies{...}`块中添加依赖：

```xml
implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.1.0"
```

Android 的示例存放在  [`ui/kotlinx-coroutines-android/example-app`](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-android/example-app) ，您可以`clone`下来运行。

# 基础 UI 协程

这个小节将展示协程在 UI 应用程序中的基础使用。

## 启动 UI 协程

`kotlinx-coroutines-javafx` 模块包含了[Dispatchers.JavaFx](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-javafx/kotlinx.coroutines.javafx/kotlinx.coroutines.-dispatchers/-java-fx.html) 分发器，该分发器分配协程操作给 JavaFx 应用线程。

我们将之导入并用`Main`作为其别名，以便所有示例都可以轻松地移植到 Android 上：

```kotlin
import kotlinx.coroutines.javafx.JavaFx as Main
```

主 UI 线程的协程可以在 UI 线程上执行任何更新 UI 的操作，并且可以不阻塞主线程地挂起（suspend）操作。举个例子，我们可以编写命令式代码（imperative style）来执行动画。下面的代码将使用 [launch](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) 协程构造器，从 10 到 1 进行倒数，每隔 2 秒倒数一次并更新文本。

```kotlin
fun setup(hello: Text, fab: Circle) {
    GlobalScope.launch(Dispatchers.Main) { // launch coroutine in the main thread
        for (i in 10 downTo 1) { // countdown from 10 to 1 
            hello.text = "Countdown $i ..." // update text
            delay(500) // wait half a second
        }
        hello.text = "Done!"
    }
}
```

> 您可以[在此](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-basic-02.kt)获取完整的代码

那么，上面究竟发生了什么呢？因为我们在 UI 线程启动（launching）了协程，所以我们可以在该协程内自由地更新 UI 的同时还可以调用挂起函数（suspend functions），比如  [delay](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/delay.html) 。当 `delay` 在等待时（waits），UI 并不会卡住（frozen），因为 `delay` 并不会阻塞 UI 线程 —— 这就是协程的挂起。

> 相应的 Android 应用代码是一样的。您只需要复制`setup`函数内的代码到 Android 项目中的对应函数中即可

## 取消 UI 协程

当我们想要停止一个协程的时候，我们可以持有一个由 `launch`函数返回的 [Job](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 对象并利用它来取消（cancel）。

让我们通过点击桃红色的按钮来停止协程：

```kotlin
fun setup(hello: Text, fab: Circle) {
    val job = GlobalScope.launch(Dispatchers.Main) { // launch coroutine in the main thread
        for (i in 10 downTo 1) { // countdown from 10 to 1 
            hello.text = "Countdown $i ..." // update text
            delay(500) // wait half a second
        }
        hello.text = "Done!"
    }
    fab.onMouseClicked = EventHandler { job.cancel() } // cancel coroutine on click
}
```

> 您可以在[这里](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-basic-03.kt)获取完整代码

现在实现的效果是：当倒数正在进行时，点击圆形按钮将会停止倒数。请注意，[Job.cancel](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/cancel.html) 方法线程安全并且非阻塞。它只是给协程发送取消信号，而不会等待协程真正终止。

[Job.cancel](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/cancel.html) 该方法可以在任何地方调用，而如果在已经取消或者完成的协程上，该方法不做什么事情。

> 相应的 Android 代码示例如下

```kotlin
fab.setOnClickListener{job.cancel()}
```



# 在 UI Context 中使用 actors

在一节中，我们将会展示 UI 应用程序是如何在其 UI 上下文（Context）中使用 actors ，以确保启动的协程数量不会无限增长。

## 协程扩展

我们的目标是编写一个名为`onClick`的扩展协程构建器函数，这样每当圆形按钮被点击的时候，都会执行一个倒数动画：

```kotlin
fun setup(hello: Text, fab: Circle) {
    fab.onClick { // start coroutine when the circle is clicked
        for (i in 10 downTo 1) { // countdown from 10 to 1 
            hello.text = "Countdown $i ..." // update text
            delay(500) // wait half a second
        }
        hello.text = "Done!"
    }
}
```

我们的第一个`onClick`版本：在每一个鼠标事件上启动一个新的协程，并将之对应的鼠标事件传递给动作使用者：

```kotlin
fun Node.onClick(action: suspend (MouseEvent) -> Unit) {
    onMouseClicked = EventHandler { event ->
        GlobalScope.launch(Dispatchers.Main) { 
            action(event)
        }
    }
}
```

> 您可以[在此](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-actor-01.kt)获取完整的代码

请注意，每当圆形按钮被点击，它便会启动一个新的协程，这些新协程会竞争地更新文本。这看起来并不好，我们会在后面解决这个问题。

> 在 Android 中，可以为 `View` 类编写对应的扩展函数代码，所以上面 `setup` 函数中的代码可以不需要另作更改就直接使用。Android 中没有 `MouseEvent`，所以此处略过

```kotlin
fun View.onClick(action: suspend () -> Unit) {
    setOnClickListener { 
        GlobalScope.launch(Dispatchers.Main) {
            action()
        }
    }
}
```



## 最多只有一个协程 Job



我们可以在开启一个新的协程之前，取消掉一个正在运行（active）的 Job，以此来确保最多只有一个协程在执行倒计时工作。然而，通常来说这并不是一个最好的解决方法。[cancel](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/cancel.html) 函数仅仅发送一个取消信号去中断一个协程。取消的操作是合作性的，在现在的版本中，当协程在做一件不可取消的或类似的事件时，它是可以忽略取消信号的。

一个更好的解决方法是使用一个 [actor](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/actor.html) 来确保协程不会同时进行。让我们修改`onClick`扩展实现：

```kotlin
fun Node.onClick(action: suspend (MouseEvent) -> Unit) {
    // 启动一个 actor 来接管这个节点中的所有事件
    val eventActor = GlobalScope.actor<MouseEvent>(Dispatchers.Main) {
        for (event in channel) action(event) //传递事件给 action
    }
    // install a listener to offer events to this actor
    onMouseClicked = EventHandler { event ->
        eventActor.offer(event)
    }
}
```



> 您可以[在此](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-actor-02.kt)获取完整代码

整合 `actor` 协程和常规事件控制（event handler）的关键点，在于 [SendChannel](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-send-channel/index.html) 中有一个不中断（no wait）的  [offer](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-send-channel/offer.html)  函数。如果发送消息这个行为可行的话，[offer](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-send-channel/offer.html)  函数会立即发送一个元素给 `actor` ，否则该元素将会被丢弃。`offer` 函数会返回一个 `Boolean` 作为结果，不过在此该结果被我们忽略了。

试着重复点击这个版本的代码中的圆形按钮。当倒数都动画正在执行时，该点击操作会被忽略掉。这是因为 `actor` 正忙于动画而没有从 channel 接受消息。默认情况下，一个 `actor` 的消息信箱（mailbox）是由 `RendezvousChannel`实现的，后者的 `offer`操作仅在 `receive` 活跃时有效。

> 在 Android 中，`View` 被传递给 `OnClickListener`，所以我们把 `view` 当作信号（signal）传递给 `actor` 。对应的 `View` 类扩展如下：

```kotlin
fun View.onClick(action: suspend (View) -> Unit) {
    // launch one actor
    val eventActor = GlobalScope.actor<View>(Dispatchers.Main) {
        for (event in channel) action(event)
    }
    // install a listener to activate this actor
    setOnClickListener { 
        eventActor.offer(it)
    }
}
```



## 事件合并

有时候处理最新的事件比忽略掉它更合适。 [actor](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/actor.html) 协程构建器接受一个可选的 `capacity` 参数来控制用于消息信箱（mailbox）的 channel 的实现。所有有效的选项均在 [`Channel()`](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-channel/index.html) 工厂函数中有所阐述。

让我们修改代码，传递 [Channel.CONFLATED](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-channel/-c-o-n-f-l-a-t-e-d.html) 这个 capacity 参数来使用  `ConflatedChannel` 。只需要更改创建 actor 的那行代码即可：

```kotlin
fun Node.onClick(action: suspend (MouseEvent) -> Unit) {
    // launch one actor to handle all events on this node
    val eventActor = GlobalScope.actor<MouseEvent>(Dispatchers.Main, capacity = Channel.CONFLATED) { // <--- Changed here
        for (event in channel) action(event) // pass event to action
    }
    // install a listener to offer events to this actor
    onMouseClicked = EventHandler { event ->
        eventActor.offer(event)
    }
}
```



> 您可以[在此](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-actor-03.kt)获取完整的 JavaFx 代码。在 Android 上，您需要修改之前示例中的 `val eventActor = ...` 这一行。

现在，如果动画正在进行时圆形按钮被点击了，动画将会在结束之后重新启动。仅会重启一次。当动画进行时，重复的点击操作将会被合并，而仅有最新的事件会被处理。

这对于那些需要接收高频率事件流，并基于最新事件更新 UI 的 UI 应用程序而言，也是一种合乎需求的行为（ a desired behaviour ）。使用  `ConflatedChannel` 的协程可以避免由事件缓冲（buffering of events）带来的延迟。

您可以试验不同的  `capacity`  参数来看看上面代码的效果和行为。设置 `capacity = Channel.UNLIMITED` 将创建一个 `LinkedListChannel` 实现的信箱，这会缓冲所有事件。在这种情况下，动画的执行次数和圆形按钮点击次数保持一致。



# 阻塞操作

这一小节将解释如何在 UI 协程中完成线程阻塞操作（thread-blocking operations）。



## UI 卡顿问题

> The problem of UI freezes

如果所有 API 接口函数均以挂起函数（suspending functions）来实现那是最好不过的事情了，这样那些函数将永远不会阻塞调用它们的线程。然而，事实往往并非如此。比如，有时候您必须做一些消耗 CPU 的计算操作，或者只是需要调用第三方的 API 来访问网络，这些行为都会阻塞调用函数的线程。您无法在 UI 线程或是 UI 线程启动的协程直接做上述操作，因为那会直接阻塞 UI 线程从而导致 UI 界面卡顿。

下面的例子将会展示这个问题。我们将使用 `onClick` 扩展和上一节中的 *UI 限制性事件合并 actor* 来处理 UI 线程的最后一次点击。

举个例子，我们将进行 [斐波那契数列](https://en.wikipedia.org/wiki/Fibonacci_number) 的简单演算：

```kotlin
fun fib(x: Int): Int = 
	if (x <= 1) x else fib(x - 1) + fib(x - 2)
```



每当圆形按钮被点击，我们都会进行更大的斐波那契数的计算。为了让 UI 卡顿变得明显可见，将会有一个持续执行的快速的计数器动画，并在 UI 分发器（dispatcher）更新文本：



```kotlin
fun setup(hello: Text, fab: Circle) {
    var result = "none" // the last result
    // counting animation 
    GlobalScope.launch(Dispatchers.Main) {
        var counter = 0
        while (true) {
            hello.text = "${++counter}: $result"
            delay(100) // update the text every 100ms
        }
    }
    // compute the next fibonacci number of each click
    var x = 1
    fab.onClick {
        result = "fib($x) = ${fib(x)}"
        x++
    }
}
```



> 您可以在[这里](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-blocking-01.kt)获取完整的 JavaFx 代码。您只需要复制 `fib` 函数及 `setup` 函数体内代码到您的 Android 项目即可

试着点击例子中的圆形按钮。大概第在 30~40 次点击后，我们的计算将会变得缓慢，接着您会立刻看到 UI 卡顿，因为倒数动画在 UI 卡顿的时候停止了。



## 结构化并发、生命周期和协程亲子继承

一个典型的 UI 应用程序拥有许多生命周期元素。Windows、UI 控制、activities，views，fragments 以及其他可视化元素将会被创建和销毁。一个长时间运行的协程，在后台执行着诸如 IO 或计算操作，如果它持有 UI 元素的引用，那么可能导致 UI 元素生命周期过长，继而阻止那些已经销毁并且不再显示的 UI 树被 GC 收集和回收。

一个自然的解决方法是将一个 [Job](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html)  对象关联到 UI 对象，后者拥有生命周期并在其上下文（Context）中创建协程。但是传递已关联的 [Job](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 对象给所有线程构造器容易出错，而且这个操作容易被遗忘。故此，[CoroutineScope](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 接口可以被 UI 所有者所实现，然后每一个在  [CoroutineScope](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 上定义为扩展的协程构造器都将继承 UI 的 Job，而无需显式声明。为了简单起见，可以使用 [MainScope()](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-main-scope.html) 工厂方法。它会自动提供  `Dispatchers.Main` 及其父级 job 。

举个例子，在 Android 应用程序中，一个 `Activity` 在 *created* 中被初始化，而当其不再被需要或者其内存必须被释放时，该对象被*销毁*（*destroyed*)。一个自然的解决方法是为一个 `Activity` 实例对象附加一个 `Job` 实例对象：

```kotlin
abstract class ScopedAppActivity: AppCompatActivity(), CoroutineScope by MainScope() {
    override fun onDestroy() {
        super.onDestroy()
        cancel() // CoroutineScope.cancel
    } 
}
```

现在，继承 `ScopedAppActivity` 来让一个 activity 和一个 job 关联起来：

```java
class MainActivity : ScopedAppActivity() {

    fun asyncShowData() = launch { // Is invoked in UI context with Activity's job as a parent
        // actual implementation
    }
    
    suspend fun showIOData() {
        val deferred = async(Dispatchers.IO) {
            // impl      
        }
        withContext(Dispatchers.Main) {
          val data = deferred.await()
          // Show data in UI
        }
    }
}
```



每个从`MainActivity`中启动（launched）的协程都将拥有它的 job 作为其父亲，当 activity 被销毁时，协程将会被立刻取消（canceled）。

可以使用多种方法，来将 activtiy 的 scope 传递给它的 Views 及 Presenters：

- [coroutineScope](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 构造器提供一个嵌套的 scope
- 在 presenters 方法中接收一个  [CoroutineScope](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html)  参数
- 在 [CoroutineScope](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 中进行函数扩展（仅适用于顶级函数）



```kotlin
class ActivityWithPresenters: ScopedAppActivity() {
    fun init() {
        val presenter = Presenter()
        val presenter2 = ScopedPresenter(this)
    }
}

class Presenter {
    suspend fun loadData() = coroutineScope {
        // Nested scope of outer activity
    }
    
    suspend fun loadData(uiScope: CoroutineScope) = uiScope.launch {
      // Invoked in the uiScope
    }
}

class ScopedPresenter(scope: CoroutineScope): CoroutineScope by scope {
    fun loadData() = launch { // Extension on ActivityWithPresenters's scope
    }
}

suspend fun CoroutineScope.launchInIO() = launch(Dispatchers.IO) {
   // Launched in the scope of the caller, but with IO dispatcher
}
```



jobs 间的亲子关系形成了层级结构。一个代表视图在后台执行工作的协程，可以进一步创建子协程。当父级 job 被取消的时候，整个协程树都将被取消。协程指南中的“[子协程](https://github.com/Kotlin/kotlinx.coroutines/blob/master/docs/coroutine-context-and-dispatchers.md#children-of-a-coroutine)”用一个例子阐述了这些用法。



## 阻塞操作

使用协程可以非常简单地解决 UI 线程上的阻塞操作。我们将把我们的“阻塞” `fib` 函数转换为挂起函数，然后通过使用 [withContext](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-context.html) 函数来将把后台运算部分的线程的执行上下文（execution context）转换为 [Dispatchers.Default](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html) 。 [Dispatchers.Default](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html) 由一个后台线程池（ background pool）实现。请注意，`fib`函数现在标有 `suspend` 修饰符。这表示无论它怎么被调用都会不会阻塞协程，而是在后台线程执行计算时，挂起它的操作。

```kotlin
suspend fun fib(x: Int): Int = withContext(Dispatchers.Default) {
    if (x <= 1) x else fib(x - 1) + fib(x - 2)
}
```

> 您可以在[这里](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-blocking-02.kt) 获取完整代码。

您可以运行上述代码然后确认在计算较大的斐波那契数时 UI 不会被卡住。然而，这段 `fib`计算代码速度稍慢，因为每一次都是通过 `withContext` 来递归调用的。这在练习中并不是什么大问题，因为  `withContext` 能够机智地检查该协程是否已经在所需的上下文中，然后避免过度分发（dispatching）协程到不同的线程。尽管如此，这仍是一种开销。它在原生代码（primitive code）上是可见的，并且它除了调用  `withContext`  之间提供整数以外，不做其他工作。对于一些实际性的代码， `withContext`  的开销不会很明显。

尽管如此，这个特定实现的可在后台线程工作的 `fib` 函数也可以变得和没有使用挂起函数时一样快，只需要重命名原来的 `fib` 函数为 `fibBlocking` 然后定义一个用  `withContext`  包装在 `fibBlocking` 顶部的 `fib` 函数即可：

```java
suspend fun fib(x: Int): Int = withContext(Dispatchers.Default) {
    fibBlocking(x)
}

fun fibBlocking(x: Int): Int = 
    if (x <= 1) x else fibBlocking(x - 1) + fibBlocking(x - 2)
```

> 您可以在[这里](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-blocking-03.kt) 获取完整代码。

您现在可以享受全速（full-speed）的原生斐波那契数计算而不会阻塞 UI 线程了。我们仅仅需要 `withContext(Dispatchers.Default)` 而已。

请记住，因为在我们代码中 `fib` 函数是被单个 actor 所调用的，故而在任何时间都最多只有一个并行运算。所以这份代码在资源利用上有着天然的限制性。它最多只能占用一个 CPU 核心。



# 进阶提示

这个小结覆盖了多种进阶提示。

## 不使用分发器在 UI 事件控制器中启动协程

让我们用下列 `setup` 函数中的代码来形象展示协程从 UI 中启动的执行步骤：

```kotlin
fun setup(hello: Text, fab: Circle) {
    fab.onMouseClicked = EventHandler {
        println("Before launch")
        GlobalScope.launch(Dispatchers.Main) {
            println("Inside coroutine")
            delay(100)
            println("After delay")
        } 
        println("After launch")
    }
}
```

> 您可以在[这里](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-advanced-01.kt)获取完整的  JavaFx  代码。

当我们运行代码并点击桃红色的圆形按钮，控制台将会打印出如下信息：

```shell
Before launch
After launch
Inside coroutine
After delay
```

正如您所见，[launch](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) 后的操作被立刻执行了，而发布到 UI 线程的协程则在其之后才执行。所有在  `kotlinx.coroutines` 的分发器都是如此实现的。为什么要这样呢？

基本上，这是在 “JavaScript 风格”异步方法（异步操作总是被延迟给事件分发线程执行）和 “C# 风格”异步方法（异步操作在调用者线程遇到第一个挂起函数时被执行）之间的选择。尽管 C# 风格看起来更有效率，但是它最终建议诸如“如果您需要时请使用 `yield` ...”的信息。这样是容易出错的。JavaScript 风格的方法更加一致，它也不要求编程人员去思考什么时候该或不该使用 `yield` 。

然而，当协程从事件控制器（event handler）启动，并且没有其周围没有其它的代码，这中特殊情况下，此种额外的分派确实会带来额外的开销，并且没有其他的附加价值。在这样的情况下， [launch](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html)、[async](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) 和 [actor](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/actor.html) 三种协程构造器均可以传递一个可选的  [CoroutineStart](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-start/index.html) 参数来优化性能。传递  [CoroutineStart.UNDISPATCHED](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-start/-u-n-d-i-s-p-a-t-c-h-e-d.html) 参数将会实现：遇到首个挂在函数便立刻执行协程的效果。正如下面代码所示：

```kotlin
fun setup(hello: Text, fab: Circle) {
    fab.onMouseClicked = EventHandler {
        println("Before launch")
        GlobalScope.launch(Dispatchers.Main, CoroutineStart.UNDISPATCHED) { // <--- Notice this change
            println("Inside coroutine")
            delay(100)                            // <--- And this is where coroutine suspends      
            println("After delay")
        }
        println("After launch")
    }
}
```

> 您可以[在此](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/kotlinx-coroutines-javafx/test/guide/example-ui-advanced-02.kt)获取到完整的 JavaFx 代码。

当点击时，下面的信息将会被打印出来，可以确认协程中的代码被立刻执行：

```kotlin
Before launch
Inside coroutine
After launch
After delay
```


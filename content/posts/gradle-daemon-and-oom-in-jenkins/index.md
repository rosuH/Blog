---
title: Gradle daemon 与 OOM
filename: gradle-daemon-and-oom-in-jenkins
date: 2021-07-23
---
 我们项目使用了 Jenkins 作为构建系统，用于构建提测和最终发布的安装包。最近在我升级了 JDK 版本后，那台机器构建表现一直不稳定，直接表现为：
 1. 启动后立刻失败
 2. 构建最后阶段整台机器失去响应，SSH 也无法连上，最后失败

第一种情况构建日志中可供参考的信息几乎为无：
> Build step 'Invoke Gradle script' changed build result to FAILURE
> Build step 'Invoke Gradle script' marked build as failure

第二种情况会在构建开始抛出警告：

> Starting a Gradle Daemon, 1 busy and 6 stopped Daemons could not be reused, use --status for details

根据直观表现，我猜测可能是因为 Jenkins 在构建期间 OOM 了。Jenkins 本身运行内存大概占了 30% （2.4G）左右。
而 Daemon 的占用也不高，不过几十 MB 的程度（默认最大可到 512MB），那为啥会那么容易引发 OOM 呢？结合第二种情况的日志，我猜测是因为 daemon 进程过多导致的。

要想知道 daemon 是否会过多，就得知道 daemon 创建和复用。

## Gradle daemon 的复用
Gradle 利用一个持续存在的 daemon 进程来避免重复初始化导致的性能开销，可以直接地提高我们的构建速度，所以在 Gradle 3.x 版本以上就默认开启。在执行第一次构建时，Gradle 会默认启动一个 daemon 进程。

但是可能因为下述不同，非常容易导致多个 daemon 进程同时存在的问题。比如：
- Gradle 版本不同，每个不同版本都需要一个相对应的 daemon
- Java 版本不同，启动 Gradle 的 Java 版本不同也需要重新创建一个新的 daemon
- JVM 参数不同，比如相同项目，但是设置了不同的内存参数（`-Xmx1024M`，这个在实际构建中可能存在）、不同的字符编码、不同的语言环境等

对于 Android 构建来说，不同项目的 Gradle 不一致是常有的事，这非常容易导致多个 Gradle daemon 同时存在进程中。Gradle 也对此的应对方法就是，给 daemon 超时停止的机制。一旦 daemon 空闲超过 3h，那么就会被结束掉。

这样来看，多 daemon 占用内存问题应该不至于导致 OOM 才对。问题出在哪呢？

## JDK 升级引发 OOM？

因为问题发生始于我对 Jenkins 的运行环境升级到了 JDK11，而原本的 Gradle 构建 JDK 版本仍然是 JDK 1.8。执行第一次构建后，引发了第一次 OOM。因为问题已经解决且事故现场几乎不可逆，导致无法完全重现这个问题，目前仅能基于我的猜想：

1. Jenkins 运行环境为 JDK11，Gradle 构建为 JDK 1.8，在执行 Gradle 任务时 JVM 参数（相较 JDK 1.8）有所变化，导致 daemon 不兼容。所以重新建立的 daemon 进程，继而导致 daemon 进程过多。
2. 同时运行两个 JVM，对内存造成更大压力

在构建期间引发 OOM ，于是 Gradle 构建就失败了。

### OOM 后的 daemon
当 OOM 之后，Gradle 的 daemon 可能进入异常状态，这在 `gradle --status` 中将表现为 `BUSY`。

这也是 Gradle 构建时提示 `1 busy and 6 stopped Daemons could not be reused` 的原因。可能是在我切换 JVM 导致 OOM 之后，所有已存在的 Gradle daemon 都进入异常（Lock）状态，加上后续不断重新构建，daemon 数量有增无减，导致内存占用居高不下，而频繁 OOM?

## 解决方法
每个 daemon 运行后，会在 `/var/lib/Jenkins/.gradle/daemon` 中写入注册表和 log 文件，我在机器中看到这个文件夹中一共有多个 Gradle 版本，包括异常状态的 daemon 版本，他们将不会被 Gradle 默认的清除策略所清除。

在我直接删除 `.gradle/daemon` 下的所有版本，重新开启构建即可。经过多日测试，发现再无 OOM 的情况发生。

## 2021/08/10 更新
一段时间后该 OOM 还是 OOM，考虑可能是 Gradle 版本升级后对内存占用提升了。建议升级机器... >_<

---
- [java.lang.OutOfMemoryError: GC overhead limit exceeded on Android 1.4](https://stackoverflow.com/questions/32133013/java-lang-outofmemoryerror-gc-overhead-limit-exceeded-on-android-1-4)
- [Starting a Gradle Daemon, 1 busy and 6 stopped Daemons could not be reused, use --status for details](https://stackoverflow.com/a/58195352/7293728)
- [The Gradle Daemon](https://docs.gradle.org/5.5/userguide/gradle_daemon.html)
- [The Directories and Files Gradle Uses](https://docs.gradle.org/current/userguide/directory_layout.html)




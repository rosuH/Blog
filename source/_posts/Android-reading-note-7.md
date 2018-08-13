---
title: "Android 札记系列(7)：IJKPlayer、Retrofit和其他"
date: 2018-08-13 20:57:40
tags:
  - "Android"
  - "IJKPlayer"
  - "Retrofit"
  - "时间戳"
  - "gradle"

categories:
  - "Android"

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是开源播放器 IJKPlayer 的使用、Retrofit 上手..."
---

# IJKPlayer

前几天有机会看了 Bilibili 开源的[IJKPlayer](https://github.com/Bilibili/ijkplayer)播放器。并且尝试上手了一下。下面是上手的过程和一些 tips。

## 上手

这个开源库并没有文档，全部用法都得使用者去看官方的[example](https://github.com/Bilibili/ijkplayer/tree/master/android/ijkplayer/ijkplayer-example)。在这个 example 里面，位于[media](https://github.com/Bilibili/ijkplayer/tree/master/android/ijkplayer/ijkplayer-example/src/main/java/tv/danmaku/ijk/media/example/widget/media)里的[IjkVideoView](https://github.com/Bilibili/ijkplayer/blob/master/android/ijkplayer/ijkplayer-example/src/main/java/tv/danmaku/ijk/media/example/widget/media/IjkVideoView.java)是官方写的播放器视图控件。
上手有两种方式，第一个是把`media`拷贝到你自己的项目中，然后尝试调用。
再一种是自己写一个播放器控件。我个人推荐第二种，比较便于你理解和扩展。
网上已有比较合适的上手文章，我在此便不赘述。
_参看_：

- [Android 超好用的播放器](https://www.jianshu.com/p/c5d972ab0309)
- [Android 鬼点子-近期项目总结（3）-ijkplayer](https://juejin.im/post/59e6b45e6fb9a0451d408e7b)

## tips

下面是一些我在使用这个播放器的时候遇到的一些问题。

### 循环播放和音量设置

其本身有暴露的方法可以使用：

```java
IjkMediaPlayer.setLooping(true);

IMediaPlayer.setVolume(left, right);
```

音量的两个参数分别是左右声道，而且音量区间是`0L ~ 1L`。然后其实际音量是按照当前系统音量来比例划分的。
比如当前系统的媒体音量是 70，那么`setVolume(1l, 1l)`就意味着播放的音量为 70。

### 播放进度回调

如果你看了他的回调，你就会发现，有两个播放播放完成回调：`OnSeekCompleteListener()`和`OnCompletionListener()`。

- 当循环播放时，每一次播放完成都只会回调`onSeekCompleteListener()`而不会回调另一个

- 当非循环时，播放完成只会回调`OnCompletionListener()`，而不会调用另一个

# Retrofit

大名鼎鼎的网络请求库，最近才有机会使用它。刚上手还有点不适应，后面就感觉非常舒服了，特别是可以结合`RxJava`来使用。

## 上手

`Retrofit`是基于`Okhttp`的封装，使用更方便，但是扩展性稍差一些。
我们熟悉的`OkHttp`库，创建请求的步骤是比较直观的：

```java
kHttpClient client = new OkHttpClient();

String run(String url) throws IOException {
  Request request = new Request.Builder()
      .url(url)
      .build();

  Response response = client.newCall(request).execute();
  return response.body().string();
}
```

可以看到，每一步都比较符合我们的直观感觉。对于`Retrofit`，我们需要从另一个角度来创建请求了。

### REST

首先我们得了解什么是`REST`和`RESTFUL`。知乎的[这篇问答](https://www.zhihu.com/question/28557115)下的答案讲得非常不错，建议大家去看看。
了解了什么是`REST`，可以帮你理解后续`Retrofit`一些设计的想法。

### 接口和请求

对于`REST`，我们知道，她是『就是用 URL 定位资源，用 HTTP 描述操作』（来自知乎用户[Ivony](https://www.zhihu.com/people/Ivony)）。`Retrofit`遵循这样的原则来创建请求。

所以在`Retrofit`中，我们定义一个接口来实现我们的『HTTP 描述操作』。

```java
// GetDataInterface
public interface GetDataService{
    @Get("example/data.json")
    Call<ResponseData> getData();
}
```

在这个接口中，使用注解`@Get()`来表示本次请求使用`GET`方式，URL 是`example/data.json`,这个 URL 之前还有个`BASE_URL`，这个我们在创建请求的时候加上就可以。
`Call<ResponseData>`中的`ResponseData`是用来接收数据的类，我们在下一步来创建。

```java
// ResponseData 类

public class ResponseData{
    private String name;
    private String age;

    //省略 getter() 和 Setter() 方法
    ...
}
```

这个类其实就是我们熟悉的`JavaBean`。

接着我们使用`Retrofit`来创建一个请求：

```java
Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("http://example.com/") //设置网络请求的Url地址
                .addConverterFactory(GsonConverterFactory.create()) //设置数据解析器
                .build();
GetDataService service = retrofit.create(GetDataService.class);

// 发起请求

Call<ResponseData> call = service.getdata();
// 同步请求
ResponseData response = call.execute().body();
// 异步请求
call.enqueue(new Callback<ResponseData>() {
  @Override
  public void onResponse(Call<ResponseData> call, 		Response<ResponseData> response) {

  }
  @Override
  public void onFailure(Call<ResponseData> call, Throwable t) {

  }
});
```

这就完成了很基本的创建请求操作了。使用起来的流程其实是比`OKHTTP`更加清晰的，因为他把具体的操作和发起请求的操作区分开了，所以一般情况下，我们只需要关注操作接口和接收数据类就行。

如果你尝试结合`RxJava`，会发现更加便利。篇幅所限，这里就按下不表了。

下面是两篇不错的`Retrofit`文章，可以去深入了解一下。
*参看*：

- [Retrofit 用法详解](http://duanyytop.github.io/2016/08/06/Retrofit%E7%94%A8%E6%B3%95%E8%AF%A6%E8%A7%A3/)
- [这是一份很详细的 Retrofit 2.0 使用教程（含实例讲解）](https://blog.csdn.net/carson_ho/article/details/73732076)

## tips

数据接收类实际上就是`JavaBean`，所以内部的属性名一定要和返回的数据熟悉名相同。不然会报错。


# Unix 时间戳

> UNIX时间，或称POSIX时间是UNIX或类UNIX系统使用的时间表示方式：从协调世界时1970年1月1日0时0分0秒起至现在的总秒数，不考虑闰秒[1]。 在多数Unix系统上Unix时间可以透过date +%s指令来检查。
[UNIX 时间 --Wikipedia]](https://zh.wikipedia.org/wiki/UNIX%E6%97%B6%E9%97%B4)

## 10 位和 13 位时间

最近遇到了才知道，时间戳原来是有两种位数格式的，一种是 10 位，另一种是 13 位。

如果是 10 位，那么在转换成标准时间的时候需要乘以`1000L`。

## Java 时间戳转换

```java
// 如果是 10 位时间戳需要乘以 1000L，Java 下面的方法返回 13 位时间戳，故而不转换
long time = System.currentTimeMillis();
SimpleDateFormat.getDateTimeInstance()
                        .format(new Date(time))
```

# Build filed

>Could not download dom4j.jar (dom4j:dom4j:1.6.1): No cached version available for offline mode

这个错误应该是网络的原因。解决问题的步骤是：

1. 进去 Setting ，搜索 Offline Work，找到`Gradle`中的这个选项

2. 取消勾选`Offline Work`

3. 重试一遍

## proxy 问题

尽管在 Android Studio 项目设置已经选择`No Proxy`，但是全局配置文件并没有更改过来，导致我`sync`的时候一直`Read time out`。

进入当前项目的根目录，找到`.gradle`文件夹，进入后修改`build.gradle`，看看是不是设置了代理。


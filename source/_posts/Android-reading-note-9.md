---
title: "Android 札记系列 (9)：HTTP 请求方法、Retrofit 注解和其他"
date: 2018-08-14 15:47:03
tags:
  - "Android"
  - "HTTP"
  - "Retrofit"
  - "UTC"
  - "toString"

categories:
  - "Android"

description: "本系列是笔者在实践过程中学习或复习到的一些 tips，为了避免忘记，特地记下来。本节记录的是 Retrofit 动态 URL 拼接以及注解的使用，UTC 时间格式的转换和其他的一些 tips..."
---

# HTTP 请求方法

## URL 和  URI 的区别

URI 是某种协议的定位符，可以确定唯一的某个资源或实体。URL 是 URI 的其中一种实现。
*参看*：
- [HTTP 协议中 URI 和 URL 有什么区别？](https://www.zhihu.com/question/21950864)

## GET：获取资源

GET 方法是最常见的请求方法，它被用来请求已被 URL 识别的内容。也就是在 URL 中显示出现的资源文件。
比如`www.baidu.com/index.html`，这个`index.html`就是显示出现的文件。
服务端会根据请求的资源文件做适当处理并返回，比如请求的是文本文件，那么保持原样直接返回。

## POST：传输实体主体

GET 方法也可以传输实体，但是一般不用 GET 方法进行实体传输请求，而是使用 POST 方法。POST 方法的含义就是客户端将一些信息传输给服务端，然后服务端根据这些信息返回结果。

## PUT：传输文件

PUT 方法用来传输文件给服务端，如果传输成功，一般服务端会返回 204 状态码，但是没有消息内容。

## HEAD：请求头部内容
HEAD 方法用于请求某个资源文件对应的头部信息。

## DELETE：删除文件
请求删除 URL 所标识的资源。

以上是比较常用的几种请求方法。

# Retrofit 中 URL 的使用场景

## 拼接 URL

```java
Retrofit retrofit = new Retrofit.Builder()
    .baseUrl("https://www.baidu.com/")
    .build();

```
我们的`baseURL`是这样的，但是很多时候需要在根据不同的请求接口来设置 URL，所以我们设置一个`baseURL`之后，就需要在请求接口中设置后续的路径。
比如：

```java

public interface BaiduService {
    @GET("this/is/example/url")
    Call<ResponseBody> get();
}
```
这是拼接 URL 的情况。

## @Path 参数

更多时候，我们需要根据当前的需求来动态更新我们的 url，比如根据用户的不同，我们要请求的 URL 也不一样。

```java

public interface UserService {
    @GET("/example/for/{user}/")
    Call<ResponseBody> getUser(@Path("user") String user);
}
```

典型的场景之一，就是我们需要根据当前的用户名来获取发起请求。这里使用`@Path`参数，来告诉`Retrofit`，其中的`{user}`是预设的缺省值，是需要被传入的参数替换的。
所以我们发起创建请求的时候：

```java
UserService userService = retrofit.create(UserService.class);
// 传参数
Call<ResponseBody> call = userService.getUser("ExampleUser");
```

## @Query

如果是 URL 后加查询参数的，那么需要使用`@Query`：

```java

public interface UserService {
    @GET("/example/for/query/")
    Call<ResponseBody> getUser(@Query("id") String id);
}
// 最终 url
https://www.baidu.com/example/for/query/?id=123
```

*参看*：

- [Retrofit2.0中注解使用套路](https://www.jianshu.com/p/7c907686f6c5)
- [Android：Retrofit 2.0 使用攻略（含实例讲解）](https://juejin.im/post/5acac7375188255c93239124)

# UTC 时间格式转换

最近接触到了时间字符串中带有`TZ`字符的情况，一查才知道是 UTC 统一时间。其实在转换的时候，只需要在`SimpleDateFormat("")`的传入参数中，设好格式即可。

比如时间字符串`2018-08-23T10:46:00Z`:

```java
public class Main {
    public static void main(String[] args){
        String utcTime = "2018-08-23T10:46:00Z";

        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
        df.setTimeZone(TimeZone.getDefault());
        Date date;

        try {
            date = df.parse(utcTime);
            System.out.printf(date.toString());
        }catch (ParseException pe){
            pe.printStackTrace();
        }

    }
}

```

*参看*：

- [java UTC时间格式化 时间带TZ](http://www.weizhixi.com/user/index/article/id/70.html)

# Android Studio toString 快捷键

- Windows

`Ctrl + N --> toString`

- Mac

`Command + N --> toString`











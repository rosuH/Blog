---
title: 'WebView 广告拦截浅析'
date: 2019-2-12 22:53
layout: 'post'
tags:
  - "Android"
  - 'WebView'
  - 'ADBlocker'

categories:
  - 'Android'
---

# 前言

[查豆瓣](https://github.com/rosuH/SearchInDouban) 使用的是 WebView 加载页面，在豆瓣的移动页面中存在两到三个的广告轮播图，比较影响阅读体验。所以开始着手看看怎么屏蔽掉广告。

在 WebView 中有以下三个方法可以考虑：

```kotlin
fun onPageFinished(view: WebView, url: String)
fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? 
fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean 
```

- `onPageFinished`方法会在页面加载完毕后回调

- `shouldInterceptRequest`方法会通知 `host Application`，也就是启动 WebView 的应用返回`WebResourceResponse`。如果本地应用返回`null`，则`webView`会正常加载资源

- `shouldOverrideUrlLoading`会在`Url`被加载前被回调。实现此方法，返回`true`时`WebView`将不会加载该`Url`，否则将会正常加载`Url`

  - 此方法仅在**主动或被动调用**`WebView.load(url)`方法时才会回调，而页面中的资源加载时是不会被回调的
    - 比如主动显式调用：`webview.load(url)`
    - 被动则是页面中点击链接之后加载
  - 此方法不适用于`POST`请求

  基于上述三个方法，我们看看能否做到：

  1. 禁止加载广告域名
  2. 给广告域名请求返回空的数据
  3. 在页面加载完毕后消除广告占位的`div`或类似元素

# 1. 禁止加载广告域名

根据`shouldOverrideUrlLoading()`方法的特性，我们几乎无法用之来屏蔽页面中加载的广告。

  在实践中，一般在这处理网页对本地资源的调用，比如最常见的拉起 APP 的操作。

  ```kotlin
  override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
      val url = request.url.toString()
      if (url.startsWith("douban:")) {
          // 拉起豆瓣 APP
          handleAppRequest(view, url)
          return true
      }
      return super.shouldOverrideUrlLoading(view, request)
  }
  ```

此方法看起来应该是不行了。这一步也应该没法轻易办到。

# 2. 给广告域名请求返回空的数据

我们把目光聚集到了`shouldInterceptRequest()`方法，实际上这个方法的功劳最大。我们很轻易就是实现了广告拦截。

```kotlin
override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
    return if (isAdDomain(request.url.toString())) {
        createEmptyResource()
    } else super.shouldInterceptRequest(view, request)
}

fun createEmptyResource(): WebResourceResponse {
    return WebResourceResponse("text/plain", "utf-8", ByteArrayInputStream("".toByteArray()))
}

fun isAdDomain(url: String): Boolean {
    return (!url.contains("douban")) or url.contains("baidu")
}
```

前面提起的，此方法会在请求数据前回调。所以我们可以自己构建`WebResourceResponse`对象返回。

豆瓣的移动端对接的是百度的推广，所以基本上广告域名都带有`baidu`的关键字。所以我这样就已经足够了。

更一般的情况，我们可以自己维护规则列表或者，使用一些公开的[规则列表](https://easylist.to/easylist/easylist.txt)。或者自己收集一下常见的大的推广联盟的链接就可以了。

# 3. 消除空白广告元素

我们给广告请求返回了空数据，但是原有的广告占位元素依然存在。所以我们要用到

`onPageFinished()`方法，来删除广告占位标签。

```kotlin
override fun onPageFinished(view: WebView, url: String) {
    webView.evaluateJavascript(
        "javascript:(" +
                "    function() {" +
                "            var len = document.getElementsByClassName('Advertisement').length; " +
                "            for(var i = 0; i < len; i ++){" +
                "                document.getElementsByClassName('Advertisement')[i].style.display = 'none'" +
                "            }" +
                "        }" +
                ")()"
    ) {
        print(it)
    }
}
```

这里利用了`WebView.evaluateJavascript()`方法，执行了一段 JavaScript 代码：

```javascript
javascript:(
    function() {
            var len = document.getElementsByClassName('Advertisement').length;
            for(var i = 0; i < len; i ++ ){
                document.getElementsByClassName('Advertisement')[i].style.display = 'none'
            }
        }
)()
```

这里的代码需要你根据不同的页面来维护规则。比如豆瓣的移动端广告都用`Advertisement`作为类名。

所以获取了个数之后，降之隐藏。

# 结语

至此，我们简单的实现了对豆瓣移动端网页的拦截。

参考链接：

- [WebView Android Developer](https://developer.android.com/reference/android/webkit/WebView)

- [how to get html content from a webview?](https://stackoverflow.com/questions/8200945/how-to-get-html-content-from-a-webview)

- [Any way to hide elements from webview? (android)](https://stackoverflow.com/questions/3029926/any-way-to-hide-elements-from-webview-android)
- [Android block ads in webview](https://stackoverflow.com/questions/24547446/android-block-ads-in-webview)
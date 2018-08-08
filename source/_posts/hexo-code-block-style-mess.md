---
title: "Hexo 博客优化入门（一）"
date: 2018-08-08 11:15:18
tags:
- 'Hexo'
- 'prism'
- '代码块'

categories:
- '博客折腾指南'

description: "之前一段时间都被 Hexo 的代码块格式问题困扰..."
---

# 问题描述

在之前的很长一段时间里，我的博客渲染出来的代码块格式都有问题，总是会莫名其妙地将换行符搞丢。导致格式错乱，阅读体验很差。
大概的样子就是下面这样：

```java
// Normal 正常样式
class A {
    public A(){
        // code in here
    };
}

// 错乱的渲染格式
class A {public A() {
    // code in here
}}
```

在我更换了博客主题之后问题依旧没有好转。才想起是不是代码渲染插件的问题。
后面我把`hexo-prism-plugin`删除了之后，使用`Hexo`默认的渲染主题就没问题了。

*搞得我还去换了主题*...
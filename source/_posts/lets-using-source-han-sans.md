---
title: "来使用思源黑体吧！"
date: 2016-12-24
tags:
- '思源黑体'
- 'Adobe'
- 'Wordpress'

categories:
- '博客折腾指南'
---



## 思源黑体

大概是在去年，[Adobe 与合作伙伴 Google宣布推出 思源黑体](http://blog.typekit.com/alternate/source-han-sans-chs/)。这是一款开源的具有七个字重的字体家族。
我个人非常喜欢，感觉非常利落、优雅。但是你要让我说出那里好哪里不好，我是说不出的 :P
总之，在那之后就一直想着想要给博客换上这个字体。
在一番寻找之后，发现 Adobe 自家的 [Typekit](Typekit.com) 就很方便~
下面就一起来尝试这款优雅的字体吧~

## 订阅 Adobe 的套餐 x 推送你的 KIT

Typekit 的实现方式应该是向他自己的服务器发送请求，之后再渲染网页中的字体。比较加载整套字体会快很多。
1. **首先你得有一个 Adobe 的账户**。
2. 接着去 [Typekit](Typekit.com) 寻找这个字体

![](https://ws3.sinaimg.cn/large/ae96f529gw1fb2548oietj20yc0ngaep.jpg)

找到之后，点击左边的『WEB USE: ADD TO KIT』

![](https://ws3.sinaimg.cn/large/ae96f529gw1fb258eqbl4j21dw04umy8.jpg)

然后会出现选择 KIT 的 界面。如果你没有创建过那就需要新建一个。
![](https://ws4.sinaimg.cn/large/ae96f529gw1fb25suedxmj21840guacp.jpg)
**免费套餐只能推送到一个 KIT。一个 KIT 貌似只能用一个字体，但是一个 KIT 可以用于多个域名。**
![](https://ws2.sinaimg.cn/large/ae96f529gw1fb25unk5ycj20pz0fwmzp.jpg)
接着会出现一个`js`的细节页面，你需要把那段`js`代码复制下来，稍后黏贴到所需网页的`<head>`标签中间。
![](https://ws3.sinaimg.cn/large/ae96f529gw1fb25vxpbe1j20pt0djdj8.jpg)
接着回弹出一个敲定细节的窗口，你可以决定推送的字体的字重之类。决定好了之后就可以点击左边的『Use font in CSS』
![](https://ws2.sinaimg.cn/large/ae96f529gw1fb25cmtl7fj20wm0qan4b.jpg)
等他出现『Updating ...』的提示，之后就可以去网站贴`js`了。

## Wordpress 的 header.php
我用的是博客系统是 Wordpress，并且我需要每一个页面都使用这个字体，所以我在当前主题的`header.php`粘贴这段代码。
![](https://ws3.sinaimg.cn/large/ae96f529gw1fb25z6dtr3j20x90e2q7v.jpg)
之后刷新页面就可以看到效果啦。














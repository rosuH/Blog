---
title: "启用 HTTPS 札记"
date: 2016-08-11
tags:
- 'HTTPS'
- 'Wordpress'
- 'SSL'

categories:
- '博客折腾指南'

description: "本文主要讲述我对 HTTPS 的了解的一些过程，包括如何给网站上 HTTPS..."
---
# 1.0 什么是HTTPS？

1. [HTTPS](https://zh.wikipedia.org/wiki/%E8%B6%85%E6%96%87%E6%9C%AC%E4%BC%A0%E8%BE%93%E5%AE%89%E5%85%A8%E5%8D%8F%E8%AE%AE) == HTTP + [SSL](https://en.wikipedia.org/wiki/Transport_Layer_Security)

2. [数字证书认证机构](https://zh.wikipedia.org/wiki/%E6%95%B0%E5%AD%97%E8%AF%81%E4%B9%A6%E8%AE%A4%E8%AF%81%E6%9C%BA%E6%9E%84)、[数字证书](https://zh.wikipedia.org/wiki/%E9%9B%BB%E5%AD%90%E8%AD%89%E6%9B%B8)

## 1.1 客户端通过HTTPS和服务器通信过程

经过上面的一些资料的补充，相信你已经对HTTPS有了基本的认知了，下面我简介一下HTTTPS通信、证书和认证的一些细节

1. CA(数字证书认证机构)和你服务器的关系
    - 你向CA递交你域名的证书申请；
    - CA验证你对你的域名和服务器有控制权：可能是发邮件或在你的服务器绑定证书
    - CA向你发放证书
    - 将证书保存在服务器上（针对于VPS）
    - 当用户访问你的网站时，你的服务器会先向用户（的浏览器）发送你的证书以及公钥
    - 你用户的浏览器根据保存在浏览器中的**根受信任的颁发者列表**查询你网站的可信任信息并验证
      请看下图：
      ![201012272252173749.png](https://ooo.0o0.ooo/2016/08/12/57ad97cd8ebeb.png)
      *图片来自[浅谈https\ssl\数字证书](http://www.cnblogs.com/P_Chou/archive/2010/12/27/https-ssl-certification.html)*

2. 通信过程（SSL加密过程）//*假设用户为A，你的网站B*
    - B生成私玥和与之对应的公钥（不同用户生成不同公玥）
    - A使用B的公钥加密信息发送给B
    - B使用密钥解密
      值得注意的是，上述中，只有与之对应的密钥才能解密，而又因为不同客户端得到了不同的公钥，故而别人无法使用其他密钥进行解密。
      如果你有一个疑问，那就是『HTTPS能否被劫持吗？』
      那么我们假设黑客（*他的服务器为C*）想要获取我们的加密信息内容，他大概可以这么入手（肯定有其他方式，然而我不是黑客我想不到...）:

- 获取私玥
    - **反向解密出私玥**：目前基本不可能做到...
    - **拿下CA**:获得所有其名下的证书、私玥。基本不可能，但是还是该选一家靠谱的CA才行...

- 欺骗服务器和浏览器
    - 第一种方式：C作为中间人，替换服务器发下的公钥为C的假公钥；C接受客户端利用假公钥加密的信息并使用自己的私钥解密。
    - 第二种方式：大致同上，但是此时C和服务器形成HTTPS然而客户端和C只是HTTP，也就是剥离ssl层。

- 解密（一定需要私钥）
    我就不班门弄斧了，总之就是现在，比较安全就是了。
    你可以参看下面的资料：
1. [https可能被这样劫持吗](http://www.zhihu.com/question/22795329)
2. [使用HTTPS的网站也能被黑客监听到数据吗？](http://www.zhihu.com/question/22779469)
3. [基于SSLStrip的HTTPS会话劫持](http://wenku.baidu.com/view/def00c6858fafab069dc02f1.html)

# 2.0 部署HTTPS

部署HTTPS有简单也有稍显麻烦，更有一劳永逸的；我尝试*雨露均沾*一下...
同时，我下面写的一般都是**DV证书**，也就是域名核准证书。
这一类证书**只验证域名所有权，加密链接；并不会验证申请者的真实身份或组织**。
这是比较简单的一种方式。一般来说，个人网站并不太在意（如果你的网站需要交易除外）。但是也有一些CA不看好DV证书，因为这样的证书降低了犯罪成本（罪犯们可以随意申请证书以增加页面的可信度）。
但是另一方面，这样也可以普及HTTPS的使用，有利有弊。
最重要的原因，**这是免费的...**
而且，主流浏览器的状态栏都会显示小绿锁。
DV和OV型证书在用户查看证书的详情是，OV型证书会在证书的Subject中显示域名+单位名称等信息；DV型证书只会在证书的Subject中显示域名。

## 2.1 商业CA的免费DV证书申请

这一类算是比较简单的，步骤都可以简述出来：

1. 递交申请
2. 验证域名所有权
3. 服务器绑定证书
   比较常见 DV 证书提供方有~~[沃通](https://freessl.wosign.com/)~~、~~[Strat ssl](https://www.startssl.com/)~~、[Let’s Encrypt](https://letsencrypt.org/)和[COMODO](http://www.instantssl.cn/)

-----

*update 2016-11-11*:

**谷歌和火狐相继宣布停止信任沃通和 StartCom 的证书，在 2016 年 10 月 21 日后被签发的证书都将不被信任**。

- 现在阿里和腾讯都有赛门铁克的一年免费DV证书，推荐使用这一个，很简便
- 或者使用 Let's Encrypt 申请证书

## 2.2  利用[CloudFlare](https://www.cloudflare.com/) 部署HTTPS

为什么要把这个单独出来讲呢？因为我觉得CloudFlare确实比较良心和方便...(以至于我一直被坑...

- 此处的 CF 颁发的证书属于自签证书，只被 CF 自己认可
- 如果你不是使用 CF 的 CDN 的话，这个证书的没法使用的

// update 2017年7月7日10:34:07

**推荐直接使用 Let's Encrypt 申请证书，可以自签也可以选择一键脚本**。

// end

### 2.2.1 利用[CloudFlare](https://www.cloudflare.com/)签发并部署DV证书

1. **把域名托管在[CloudFlare](https://www.cloudflare.com/)**

2. **进入『Crypto』**
   ![sp160812_183102.png](https://ooo.0o0.ooo/2016/08/12/57ada5ca32ea1.png)

3. **把『ssl』选项设为『FULL』或者『FULL(strict)』**
   ![sp160812_183327.png](https://ooo.0o0.ooo/2016/08/12/57ada622f17d8.png)
   **注意：**在这里解释一下三个选项的意思

   - Flexible
     - 浏览者到 CDN 是使用 HTTPS 的，但是 CDN 到你的服务器则是 HTTP
     - **注意！此时 CND 会强制使用 HTTP 访问，意味着如果你在你的服务器使用 301 跳转到 HTTPS，就会导致无限的重定向！**
   - FULL
     - 浏览者-->HTTPS-->CDN-->VPS
     - CF 不会验证你的证书
     - 一般适用于自签证书
   - FULL(strict)
     - 浏览者-->HTTPS-->CDN-->VPS
     - CF 会和 CA 验证证书
     - 一般适用于 CA 签发的证书

   ​

   无论你选择了是『Full』或是『FULL(strict)』
   如果你在添加域名(add site)的时候，选择了他的CDN加速服务比如下图：
   ![sp160813_110954.png](https://ooo.0o0.ooo/2016/08/12/57ae8fc07bc52.png)
   此时你在浏览器的证书详情里，显示的会是他的CND的域名。你是看不到你的域名的：
   ![sp160812_100948.png](https://ooo.0o0.ooo/2016/08/12/57ae90cb70a57.png)
   而且此时，你去[SSL评分](https://www.ssllabs.com/ssltest/index.html)的时候，也只会显示此CND的评分:
   ![sp160812_102305.png](https://ooo.0o0.ooo/2016/08/12/57ae9125e3c94.png)
   ​

4. 选择『Create Certificate』

**如果你选择的是 CF 的证书（如下图），是一种 CF 自己发行的 TLS 证书，安全系数并不高**。最好自己购买上面说的那些。

![sp160813_112021.png](https://ooo.0o0.ooo/2016/08/12/57ae922467cb0.png)

5. 选择『ECDSA』算法，并且选择你的服务器类型。这里我选了Nginx。

![sp160813_112245.png](https://ooo.0o0.ooo/2016/08/12/57ae930ae7d4e.png)
![sp160813_112344.png](https://ooo.0o0.ooo/2016/08/12/57ae930adf76e.png)

那个证书期限默认就行，你也可以自己定义一个日期。无所谓。
接着你会得到一个根证书(Original Certificate)和一个私钥(Private Key)。文件格式选择PEM即可：

![sp160813_115249.png](https://ooo.0o0.ooo/2016/08/12/57ae9a461c1f8.png)
复制里面的字符，保存到名字相对应的pem文件中，或者直接下载也行。
然后上传文件到你的nginx服务器
接着进行：

6. Nginx服务配置

思路就是，

- 把原来的网站端口（默认80端口）改为443端口
- 开启SSL
- 设置证书和私钥
- 将80端口重定向至443端口，强制开启HTTPS
  实施：
  由于我的网站配置是在单独的配置文件中的，位于`/usr/local/nginx/conf/vhost/www.rosuh.me.conf`，所以我直接修改这个文件。如果你是把网站服务写在nginx的主配置中的，那就修改`/usr/local/nginx/conf/nginx.conf`
- 修改端口

```shell
#原来的配置
server{
    listen 80;
    server_name ...
    ...
    }
#修改之后
server{
    listen 443;
    server_name ...
}
```

原来通过80端口（http）的访问已经失效了，必须指定443端口访问才行。

- 开启ssl并进行基础配置

```shell
#从上面的配置接下去，而不是重新写一个server
server{
    listen 443;
#如果你还想你的http能正常使用的话，可以加上80端口并存
#    listen 80;
    server_name ...
    ssl     on;
    ssl_certificate   /home/www/ssl/OriginalCertificate.pem;
    ssl_certificate_key    /home/www/ssl/PrivateKey.pem;
    ...
}
```

这只是基础配置，评分不高，但是先测试是否可行。

```shell
service nginx -t &&service nginx -s reload
```

- 重定向80端口
  完成至此，也只是让https可用，也就是用户必须再你的域名前面加上https才行，这样很不友好并且不安全。同时此时你的http不可用哦，因为我们把80端口删掉了，你也可以加上80端口，这样会保证https不可用的时候http还能正常使用。
  如果是不需要80端口，想强制HTTPS访问的，就需要
  配置重定向：

```shell
server {
    listen 80;
    server_name www.rosuh.me  rosuh.me;
    location / {
        rewrite ^/(.*)$ https://rosuh.me/$1 permanent;
    }
}
```

至此，基础配置HTTPS就算完成了。照道理现在应该可以的了。
下面介绍另一种方法：

### 2.2.2 使用 Let's Encrypt 证书部署HTTPS

这一步和上述有所不同，你需要自行创建私钥和证书申请文件。

动手能力强的可以选择下面的教程中的自签，如果想省事可以直接使用`amce.sh`一键脚本。

> [acme.sh](https://github.com/Neilpang/acme.sh)

对于自己动手，我们的思路是：

1. 创建私钥和申请文件
2. 验证所有权
3. CloudFlare设置
   **注意：**在进行之前，我假设你已经把域名托管在CloudFlare，为什么要这样做呢？后面我会解释的。

**这些步骤网上教程很多，我也是从网上的前辈那里学习的，尚不能自己完整地写出来。为了避免写错，耽误各位，还是请诸君务必自行移步到下面的网址查看**
[Let's Encrypt，免费好用的 HTTPS 证书](https://imququ.com/post/letsencrypt-certificate.html)
这位作者的教程很详尽，并且很完整；同时他的博客内有很多文章都是很棒的，对我们的此次行动有很多指导意义。
我狗尾续貂一下，关于上面文章中有讲过两个可能发生的错误的一些解决方法：

- 『提示没有找到openssl.cnf』
  由于环境配置不一，可以使用`find`命令进行查找：

```shell
find / -name openssl.cnf
```

然后替换原来教程的命令行中即可

- 『获取网站证书失败』
  提示：
>ValueError: Wrote file to /home/xxx/www/challenges/oJbvpIhkwkBGBAQUklWJXyC8VbWAdQqlgpwUJkgC1Vg, but couldn't download http://www.yoursite.com/.well-known/acme-challenge/oJbvpIhkwkBGBAQUklWJXyC8VbWAdQqlgpwUJkgC1Vg

原作者也说了，是因为域名在国外无法解析。我发现也是这个原因，所以我才在开头说，要把域名托管在Cloudflare上。并且由于域名DNS服务器换了之后，需要一定时间更新缓存，所以需要耐心等待才行...

- 『crontab not found』
  crontab没有安装的缘故，使用下面命令进行安装：

```shell
yum install cronie
```

接着我们要进行Cloudflare的设置才能正常访问，并且获得测试的正确结果。
或者在申请完证书之后，就把域名DNS修改为其他的服务商，比如阿里。

- 进行ssl评测的必要条件
    - 没有使用CDN
    - Cloudflare的ssl选项选择『off』
      具体可以参照我前面的图片。
- 正常访问
    - 可以开启CDN
    - SSL选项不能选择『Flexible』，此时无论如何你都无法使用HTTPS访问你的网站，会造成301重定向循环
    - 最好开启HSTS，如果你的DNS修改了，那就自行在nginx配置中加入
      ![sp160813_150841.png](https://ooo.0o0.ooo/2016/08/13/57aec7ac392cf.png)
      HSTS指的是，只要该用户曾经使用过HTTPS链接你的网站，那么以后就会一直使用HTTPS链接。如果你证书过期了...就不能连上了。
      **注意：**在Cloudflare的『OverView』选项中：
      ![sp160813_151241.png](https://ooo.0o0.ooo/2016/08/13/57aec8c6b3b78.png)
      如果你不需要Cloudflare的其他功能，只想让他实现一个DNS的功能，那就选择『Pause』，该选项会停止他的其他服务。

现在，大致可以了。你可以先去评分，然后完善你的配置。
可以同样参看[Jerry Qu](https://imququ.com)的配置：
[本博客 Nginx 配置之完整篇](https://imququ.com/post/my-nginx-conf.html)

-----

一些额外的补充：
如果你是用的是wordpress的话，相信你需要迁移一些文件，并且修改一些设置。
你可以参看：
[WORDPRESS全站开启HTTPS方法](https://chencool.com/228)

-----

# 3.0 年轻时犯的错误

最初作为一个连 nginx 是什么的年轻人，折腾这个小绿锁确实用了一些时间，吃过一些苦头...

1. 不知道什么是HTTPS
2. 不理解CA、证书、公钥和私钥之类的基础知识
3. 不懂nginx配置里都是什么意思
4. 不理解DNS服务商、CDN和一些常识
   ...

不过解决的方法归结起来就一句话？

『不会就谷歌』

-----

一些你可能有用处的参考资料：

1. [浅谈https\ssl\数字证书](http://www.cnblogs.com/P_Chou/archive/2010/12/27/https-ssl-certification.html)
2. [关于启用 HTTPS 的经验分享](https://imququ.com/search.html?s=%E5%85%B3%E4%BA%8E%E5%90%AF%E7%94%A8+HTTPS+%E7%9A%84%E7%BB%8F%E9%AA%8C%E5%88%86%E4%BA%AB)
3. [SSL的公钥、私钥、证书都有些啥后缀？](https://www.zhihu.com/question/29620953)

-----

此片博文是我自己的经验总结，难免有所缺漏和错误，敬请指正，在此先行谢过。
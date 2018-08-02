---
title: "启用 HTTPS 札记（续）"
date: 2016-09-21
tags:
- 'HTTPS'
- 'Wordpress'
- 'SSL'

categories:
- '博客折腾指南'

description: "为我的新站点启用HTTPS但是仍然遇到了一些障碍..."
---
为我的新站点启用HTTPS但是仍然遇到了一些障碍
说明还有一些问题没有搞清楚...

1. cloudflare申请的origin certificate无法直接作为服务器证书文件，应该在服务器制作证书，然后上传，由cloudflare签发
2. 使用ssl.md进行签发速度很快，需要到邮件中收取crt文件，即可
3. 增强安全性

```
SSLProtocol             all -SSLv2 -SSLv3

SSLCipherSuite          ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA

SSLHonorCipherOrder on
```
4. 使用HSTS
  - 本想直接用cloudflare的，但是还是自己搞靠谱一点...
  - 报文长度修改

```
//在HTTPS中
Header always set Strict-Transport-Security "max-age=63072000; includeSubdomains; preload"
```
  - 强制重定向/重写(觉得重定向的性能高一点？...)

```
ServerName example.com
  Redirect permanent / https://example.com/
```




2016年10月3日01:05:47
使用acme.sh创建的fullchain.cer文件，就是网站的证书+中间证书，直接部署在ssl_certificate就行了

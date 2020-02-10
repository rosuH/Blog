---
title: "修复 oh-my-zsh 和 Git 的搭配错误"
date: 2017-8-4 13:12:40
tags: 
- "zsh"
- "git"
- "oh-my-zsh"
- "Cygwin"
 
categories:
  - "技术" 
---
> OS: Win10
> Shell: Babun 1.2.0

这个问题发生在我执行`Git`命令之后，错误提示为：

```shell
compdef: unknown command or service: git
```

如果执行 `zsh` 命令，会直接输出`.zshrc`文件内容并且有以下提示：

```shell
compdef: unknown command or service: git
compdef: unknown command or service: grep
compdef: unknown command or service: git
```

这个问题可能是 Git 版本相关，具体原因不清楚，由此引发的 zsh 运行出错。

# 解决方法

在 oh-my-zsh 的 issue 中有很多人有如下解决方法：

```shell
rm -f ~/.zcompdump
compinit
```

[zsh-doc](http://www.csse.uwa.edu.au/programming/linux/zsh-doc/zsh_23.html)里面介绍了`compinit`和`.zcompdump`之作用，大家可以自行查阅。
我理解的意思就是，`compinit`为手动初始化`zsh`的命令，而为了加快`zsh`运行速度，`zsh`会自动生成一个`.zcompdump`文件进行使用。可能是类似于缓存文件的作用。
一般情况下，上述两个命令进行手动初始化之后就没问题。不过后来版本的`zsh`貌似会对`.zcompdump`进行重命名，也就是生成带有版本号的`.zcompdump`诸如：`.zcompdump-modhelius-dell-5.0.2`。
可能是在特殊环境下需要采用这样的做法，比如在 Cygwin 中。

# Cygwin 中解决方法

执行：

```shell
compinit
cp .zcompdump .zcompdump-$HOSTNAME-$ZSH_VERSION
```

这样就生成了特定版本的`.zompdump`文件。此时应该就恢复正常了。

-----
*参看*：

- [compdef: unknown command or service: git](https://github.com/robbyrussell/oh-my-zsh/issues/630)
- [Babun FAQ](http://babun.github.io/faq.html)
- [Completion System](http://www.csse.uwa.edu.au/programming/linux/zsh-doc/zsh_23.html)
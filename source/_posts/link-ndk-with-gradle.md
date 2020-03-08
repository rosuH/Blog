---
title: "将 ndk-build 关联到 Gradle"
date: 2020-03-08
tags:
  - 'Android'
categories:
  - "技术"
description: "最近在倒腾 Mpg123-Android 的时候，尝试了把 ndk-build 关联到 Gradle 中。不需要单独执行 `ndk-build` 指令来构建 `so` 了。在使用此种方式后，有些小发现，和诸君分享。"
---

## 前言
最近在倒腾[Mpg123-Android](https://github.com/rosuH/MPG123-Android)的时候，尝试了把 ndk-build 关联到 Gradle 中。不需要单独执行 `ndk-build` 指令来构建 `so` 了。在使用此种方式后，有些小发现，和诸君分享。

## 怎么关联
在模块级别的`build.gradle`文件中指定如下：

    android {
    	...
    	externalNativeBuild {
            ndkBuild {
    						// native 编译配置文件位置
                path file('src/main/jni/Android.mk')
    						// so 产物输出文件夹，编译后会输出到 $buildStagingDirectory/ndkBuild/.. 下面
                buildStagingDirectory "src/main/libs"
            }
        }
    }

## 优劣

- 优势：IDE 支持跳转、语法检测、编译运行直接生效，不需要自己执行 `ndk-build` 生成新的 `so` 文件。（开发这个 Native 项目的时候）提高开发效率
- 劣势：重新构建项目的时候会编译这些 Native 项目，（不开发这个 Native 项目的时候）直接降低了开发效率

## 使用场景和解决方法

- 开源库：建议关联 Gradle，理由：
    1. 一般情况下开发这个 Native 就是唯一的工作，所以不存在编译影响开发效率的情况
    2. 不需要手动生产 So，即便是创建 release，用户拉取你的库的时候，也会自动编译 so，和手动编译放到库里没有差别。

其他时候，主要看项目大小和核心功能。一般来说

- 项目比较大，功能丰富，不总是需要对这个 Native 开发的时候，那么不要关联是最好的。因为项目总是需要频繁重新构建，如果耗费大量时间去编译无关迭代的模块，肯定很不值得
- 核心和此 Native 相关，频繁迭代，或者是模块负责人，那么肯定关联最好了。

---
参看：
- [Link Gradle to your native library](https://developer.android.com/studio/projects/gradle-external-native-builds#configure-gradle)
- [NdkBuildOptions](http://google.github.io/android-gradle-dsl/current/com.android.build.gradle.internal.dsl.NdkBuildOptions.html)
---
title: 从小事情看大问题
date: 2017-07-31 16:33:03
tags: 
- "日志"
- "耻辱柱"
categories: 
- "耻辱柱"
- "日志"
---

最近生活简直可以使用腐朽来形容...>_>

Android 没怎么看，一门心思投入到美化 Gnome 桌面上。真是罪过。然而 Ubuntu 对我的无线网卡支持有问题，总是断流，加上 CS:GO 一直闪退。实在不能忍，于是又转回 Win10 了。

但是很多开发环境在 Linux 下比较好用呐，所以还是使用虚拟机的模式。

# 1. 问题 & 用什么来实现？

言归正传。就在我折腾的时候，以前的一位老师找到我，想让我帮他解决一个小问题：

> 写一个随机排列座位表的程序

一开始我以为是得写一个桌面程序，得用 Java（我只会这个...总不能写个命令行吧？

然后听他说了一阵，说什么以前某个老师说用的是 Excel？

难道是二次开发？类似 Solidwork 和 AutoCAD？

然后我自己看了一下，应该是使用 VBA 进行 Excel 操作。

于是我在网上找了一些例子和 VBA 的基础语法，发现利用 VBA 来操作 Excel 简直不要太方便啊  。

于是我便开始了入门 VBA 的过程...



# 2. VBA 和 Excel 的友情

大致浏览了语法和实例，发现 VBA 在操作 Excel 方面简直就是神器。各种单元格、区域、行列，各种复制、剪切、粘贴等等基础操作，结合上 VBA 的一些编程特性比如变量、控制语句等，就可以很便利地完成这个任务啦。

我参考的资料有以下：

- 入门：[如何能有效地学习 VBA？](https://www.zhihu.com/question/26078625) ，一个知乎问答
  - 问答的形式，会让答案更加规整、形式化和结构化
- 基础索引：[Excel 2010 中的 VBA 入门](https://msdn.microsoft.com/zh-cn/library/office/ee814737(v=office.14).aspx)
  - 来自 MSDN 的基础介绍，里面内容虽然基础，但是对理解很有帮助
- 高级索引：[Excel VBA 参考](https://msdn.microsoft.com/zh-cn/library/ee861528.aspx)
  - 同样来自 MSDN 的官方资料，内容较多，较全。
  - 建议辅以搜索引擎，多查看实例
- [vba 的单元格引用的总结](http://www.cnblogs.com/liudong/archive/2008/06/11/1217186.html)
  - 这篇文章的总结很到位，对于语法不熟的我来说可以直接查找实例

# 3. 实现过程

#### V1.0 菜鸡的自我救赎

如何实现？这是编程最开始的问题。

- 分析问题

如何从 “学生名单” --> “随机座位表” 呢？

立刻浮现在脑海里的是：

1. 通过 VBA 生成随机数
2. 以随机数为索引获取某个学生（即某个单元格）
3. 将该学生作为单元格剪切，粘贴到座位表里面
4. 循环上述 3 步，直到所有学生被移到座位表中
   - 座位表其实就是从左到右排列，每三人隔 2 列，每 9 人换一行
   - 需要一个循环判断，并对行列做出变化

思路应该就是这样，所以我立刻动手开始实现。

实现过程耗时最大的板块不是逻辑实现，而是语法问题。（无奈

第一个版本实现之后，便交付给老师了。

然后老师提了一个问题：

> 如果他以后学生名单有所变动该如何？



#### V2.0 提高健壮性

收到这个问题之后，我在心里骂了自己几句，为什么一开始没有想到呢！所以说明我实际项目经验真是好差...

于是我动手开始改代码，把函数主体中的关键确切数字使用变量替代，并在反复审查之后重新交付给老师。

然后...问题是没问题，但是我突然注意到一个问题！

**每次学生人数有变动，要修改的时候就必须跑到代码里去修改？？**

这怎么可以呢！但是如果写一个交互对话框就显得杀鸡用牛刀了。

于是我转念一想，直接计算学生名单中的非空单元格就行啦。



#### V3.0 让程序“可用”

我于是立刻开始添加一个计数功能，然后自动判断学生人数。

最后把这个最后版本提交过去。这样的话，老师就不用跑到代码里修改人数了，即开即用还不是美滋滋...

*附上菜鸡的最终程序*
```basic
Sub 编排座位()
'
' 学生人数
'

'
    Dim stuNum
    stuNum = Application.WorksheetFunction.CountA(Sheet1.Range("B1:B1000"))

'
' 将数据从表 1 复制到表2
'

'
    Sheets("Sheet2").Select
    Cells.Clear
    Sheets("Sheet1").Select
    Range("B1" & ":B" & stuNum).Select
    Selection.Copy
    Sheets("Sheet2").Select
    Range("A1").Select
    ActiveSheet.Paste
    
'
' 产生随机数字并随机编排顺序
'

'
    Dim ranNum, index, DisplayRow, row, col
    col = 4
    row = 4
    Sheets("Sheet2").Select

' 设置讲台

    Range("I1:K1").Select
    With Selection
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
        .WrapText = False
        .Orientation = 0
        .AddIndent = False
        .IndentLevel = 0
        .ShrinkToFit = False
        .ReadingOrder = xlContext
        .MergeCells = False
    End With
    Selection.Merge
    Range("I1:K1").Select
    ActiveCell.FormulaR1C1 = "讲台"
    Range("I1:K1").Select
    With Selection.Interior
        .Pattern = xlSolid
        .PatternColorIndex = xlAutomatic
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = -0.249977111117893
        .PatternTintAndShade = 0
    End With
    With Selection.Font
        .Color = -16776961
        .TintAndShade = 0
    End With
    
' 编排座位
    
    Range("I2").Select
    For index = 1 To stuNum
        Randomize
        ranNum = Int(Rnd() * stuNum) + 1
        Sheets("Sheet2").Cells(ranNum, 3).Select    ' 选中单元格
        If Cells(ranNum, 1) <> "" Then  ' 如果单元格不为空，则剪切单元格内容到座位表
            Range("A" & ranNum).Select  ' 选中该单元格
            Selection.Cut               ' 剪切
            Cells(row, col).Select      ' 选中座位表位置
            ActiveSheet.Paste            ' 粘贴
            Select Case col                  ' 座位表列数变化
                Case 6, 11
                    col = col + 3
                Case 16
                    col = 4
                    row = row + 1
                Case Else
                    col = col + 1
            End Select
        Else
            index = index - 1
        End If
    Next index
    
End Sub
```


# 反思 & 总结

直到真正开始写一个东西，才会发现自己的问题在哪里。

- 我桌面上甚至连一本草稿纸都没有
  - 可见我前段时间的学习态度确实很一般。
- 对基础逻辑语句不熟悉
  - 在进行格式转换、行数判断的时候，屡次犯低级错误
  - 说明自己手生

直到写完本篇所谓总结，心里依旧七上八下。出现问题、犯错并不是什么大事，更大的问题在于你是否会正视自己的错误进而改正他。

------

将这么简单的小程序的过程写出来，脸上甚至有点发烫。

但是不写出来，就不会击破自己的幻想，就不会让自己长记性。

所以本篇其实算是“耻辱柱”了。今天记下来，发表出去，警以为戒。

*2017-7-31 12:19:06*




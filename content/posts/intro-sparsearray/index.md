---
title: SparseArray 简介
filename: intro-sparsearray
date: 2021-07-23
---
## 基础原理

SparseArray 其实代码非常简短：

1. 两个数组，一个保存 key，另一个保存 value
2. 存取数据时，通过对 key 数组二分查找拿到 index，然后返回 value 数据中的值

据此我们可以知道，SparseArray 内存占用是 $2n$（忽略单独对象、基础类型所占用空间，仅考虑数据规模），那么这样会比 HashMap 更省内存吗？

## 内存优势

1. 避免自动装箱
2. 不需要额外存储 `next` 对象的引用

虽然自动装箱的值范围只要仍在 JVM 缓存范围内，JVM 就会优化为基础类型，但是避免自动装箱总是性能更优的选择。

内存方面，自动装箱会带来额外的内存占用。在 64bit 的 JVM 上，基础类型 `int` 将占用 $4 Bytes$ 的内存，而一个（未缓存的） `Integer` 将占据 $16 Bytes$。这是 4 倍的内存占用。

接着说说第二点，HashMap 每个元素都是一个 Node 对象：

```java

static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;
    //...
}

```

暂时不论 Node 本身所占据的空间，单单其内部拥有 `hash`，`key`，`value` 和 `next` 四个成员变量。可以保守地说 HashMap 的空间占用至少是 $4n$。

此处仅做数据规模举例，详细内存比较可以参见： [SparseArray vs HashMap](https://stackoverflow.com/questions/25560629/sparsearray-vs-hashmap)。

## 劣势

SparseArray 存取数据时，需要对整个 Key 数组进行二分查找，时间复杂度为 $O(logn)$）。数据量较大的时候，存取性能明显弱于 `HashMap`。因为 `HashMap` 存储了 `hash` 作为 Value 索引位置，存取数据都是 $O(1)$。

## 总结

SparseArray 的设计思路就是时间换空间。通过每次存取时的二分查找，来代替复杂的数据结构带来的内存占用，这十分贴切移动端数据量低的处理场景。SparseArray 不止于上述优化手段，其内部还是用了 `DELETE` 对象来标志被删除的 value，达到索引复用的效果，以降低数组扩容/缩减的频率。

- - -

* [Java 8系列之重新认识HashMap](https://tech.meituan.com/2016/06/24/java-hashmap.html)
* [Integer vs int: with regard to memory](https://stackoverflow.com/questions/8419860/integer-vs-int-with-regard-to-memory)
* [Java 8 hashmap high memory usage](https://stackoverflow.com/questions/41314160/java-8-hashmap-high-memory-usage)
* [What is the memory consumption of an object in Java?](https://stackoverflow.com/questions/258120/what-is-the-memory-consumption-of-an-object-in-java)
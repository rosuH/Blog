---
title: "Tika 源码浅析"
date: 2018-09-27 15:23:30
tags:
  - "Android"
  - "视频"
  - "文件类型"
  - "Tika"
categories:
  - "技术"

description: "Tika，一个用于检测和分析文件的库。今天我们来小探其看源码..."
---

`Tika`最简单的使用：`new Tika().detect(file)`。

其中新建一个`Tiak`实例的时候，初始化了默认的文件类型、文件解析类以及文件探测类。
机会大部分工作都是在这里面做的。
由于篇幅有限，我们略过开始的一些调用，让我们看到 Tika 库里的`MagicDetector`类，它实现了`Detector`接口。
所以我们的`Tika().detect(file1)`实际上是调用了这个类的`detec()`方法哦。
我先简述一下调用链。如果有感兴趣的读者，可以自行 debug 一下调用哦。

```java
new Tika() --> Tika(TikaConfig config) --> Tika(Detector detector, Parser parser)
// config.getDetector()，所以在 TikaConfig 里就有了 Detector，我们进这里看看
TikaConfig.getDefaultConfig() --> TikaConfig()
```

`TikaConfig()`这个默认构造方法中中有下面三句比较重要的代码

```java
...
if (config == null) {
    this.mimeTypes = getDefaultMimeTypes();
    this.parser = getDefaultParser(mimeTypes, loader);
    this.detector = getDefaultDetector(mimeTypes, loader);
}
...
```

- `getDefaultMimeTypes()`，最后是得到如下方法的返回值。在下面这个方法中，加载了库中的两个`xml`文件，前者存储了大部分已知文件类型的签名

```java
MimeTypesFactory.create("tika-mimetypes.xml", "custom-mimetypes.xml")
```

比如下面是截取的`mp4`的文件签名：

```java
<mime-type type="video/mp4">
<magic priority="60">
    <match value="ftypmp41" type="string" offset="4"/>
    <match value="ftypmp42" type="string" offset="4"/>
</magic>
<glob pattern="*.mp4"/>
<glob pattern="*.mp4v"/>
<glob pattern="*.mpg4"/>
<sub-class-of type="video/quicktime" />
</mime-type>
<mime-type type="video/mp4v-es"/>
```

- `getDefaultParser(mimeTypes, loader)`，这个最后调用到`getDefaultParsers(ServiceLoader loader)`方法，通过加载器的方式，从库中读取`Parse.class`文件。

- `getDefaultDetector(mimeTypes, loader)`，最后调到`getDefaultDetectors(MimeTypes types, ServiceLoader loader)`方法

在后者里面，看起来只是做了加载库里`Detector.class`文件的工作，实际上这里的`types`才是重头戏。`MimeTypes`类实现了`Detector`接口，实际上也有一个`detect()`方法。在`getDefaultDetectors(MimeTypes types, ServiceLoader loader)`方法中，有如下代码：

```java
List<Detector> detectors =
        loader.loadStaticServiceProviders(Detector.class);
Collections.sort(detectors, new Comparator<Detector>() {
    public int compare(Detector d1, Detector d2) {
        String n1 = d1.getClass().getName();
        String n2 = d2.getClass().getName();
        boolean t1 = n1.startsWith("org.apache.tika.");
        boolean t2 = n2.startsWith("org.apache.tika.");
        if (t1 == t2) {
            return n1.compareTo(n2);
        } else if (t1) {
            return 1;
        } else {
            return -1;
        }
    }
});
// Finally the Tika MimeTypes as a fallback
detectors.add(types);
```

代码中，先把从库里加载的`Detector.class`添加进去，然后再把`types`加到`detectors`这个列表里去。所以实际上后者保存了诸多`types`探测器对象。
所以我们后来调用`tika.detect(file)`的时候，先使用了`Dector.class`，再使用默认的探测器，也就是那些`types`。
所以我们逐步来看一下`MimeTypes.detect(InputStream input, Metadata metadata)`方法的实现：

```java
MediaType type = MediaType.OCTET_STREAM;

// Get type based on magic prefix
// 基于 magic prefix 获取文件类型，实际上就是文件首部的一些字节
if (input != null) {
    input.mark(getMinLength());
    try {
        byte[] prefix = readMagicHeader(input);
        type = getMimeType(prefix).getType();
    } finally {
        input.reset();
    }
}
...
```

- `readMagicHeader(input)`，获取文件首部一定范围的字节，这个范围是多少呢？在`getMinLength()`方法里，直接返回了`64*1024`...真的是魔数

- 这里调用了`getMineType(prefix)`，就是把文件首部的一定范围的字节传进去，判断类型，这个方法比较重要，我们可以看一下

```java
private MimeType getMimeType(byte[] data) {
    if (data == null) {
        throw new IllegalArgumentException("Data is missing");
    } else if (data.length == 0) {
        // See https://issues.apache.org/jira/browse/TIKA-483
        return rootMimeType;
    }

    // Then, check for magic bytes
    // 检查魔数字节的类型
    // eval 就是判断当前字节和已知文件类型的头部字节是否相等
    MimeType result = null;
    for (Magic magic : magics) {
        if (magic.eval(data)) {
            result = magic.getType();
            break;
        }
    }

    // 如果不相等，那么返回 null
    if (result != null) {
        // When detecting generic XML (or possibly XHTML),
        // extract the root element and match it against known types
        if ("application/xml".equals(result.getName())
                || "text/html".equals(result.getName())) {
            XmlRootExtractor extractor = new XmlRootExtractor();

            QName rootElement = extractor.extractRootElement(data);
            if (rootElement != null) {
                for (MimeType type : xmls) {
                    if (type.matchesXML(
                            rootElement.getNamespaceURI(),
                            rootElement.getLocalPart())) {
                        result = type;
                        break;
                    }
                }
            } else if ("application/xml".equals(result.getName())) {
                // Downgrade from application/xml to text/plain since
                // the document seems not to be well-formed.
                result = textMimeType;
            }
        }
        return result;
    }

    // 之前返回了 null，就假设她是一个文本类型，再使用文本探测器进行探测
    // Finally, assume plain text if no control bytes are found
    // 如果抛异常，那么就返回 application/octet-stream 类型，也就是二进制格式
    try {
        TextDetector detector = new TextDetector(getMinLength());
        ByteArrayInputStream stream = new ByteArrayInputStream(data);
        return forName(detector.detect(stream, new Metadata()).toString());
    } catch (Exception e) {
        return rootMimeType;
    }
}
```

我们接着来看`MimeTypes.detect(InputStream input, Metadata metadata)`方法：

```java
...
// Get type based on resourceName hint (if available)
// 根据文件名类获取类型
String resourceName = metadata.get(Metadata.RESOURCE_NAME_KEY);
if (resourceName != null) {
    String name = null;

    // Deal with a URI or a path name in as the resource  name
    try {
        URI uri = new URI(resourceName);
        String path = uri.getPath();
        if (path != null) {
            int slash = path.lastIndexOf('/');
            if (slash + 1 < path.length()) {
                name = path.substring(slash + 1);
            }
        }
    } catch (URISyntaxException e) {
        name = resourceName;
    }
// 这里判断了一下根据文件签名字节获取的类型是否和文件名类型相等，如果不相等，则优先使用文件签名字节类型
    if (name != null) {
        MediaType hint = getMimeType(name).getType();
        if (registry.isSpecializationOf(hint, type)) {
            type = hint;
        }
    }
}

// 根据文件的元数据来获取信息
// Get type based on metadata hint (if available)
String typeName = metadata.get(Metadata.CONTENT_TYPE);
if (typeName != null) {
    try {
// 这里判断了一下前面获取的类型是否和文件元数据给出的相等，如果不相等，则优先使用文件签名字节类型
        MediaType hint = forName(typeName).getType();
        if (registry.isSpecializationOf(hint, type)) {
            type = hint;
        }
    } catch (MimeTypeException e) {
        // Malformed type name, ignore
    }
}

return type;
```

从这里我们可以看出，最优先的判断标准依旧是文件的签名，也就是文件的首部字节

首先我们的调用来到了`MimeTypes.getMimeType(byte[] data)`方法，在这里，我们传入了由待探测文件的头部字节组成的字节数组。
在这个方法里面，有如下代码：

```java
// Then, check for magic bytes
MimeType result = null;
for (Magic magic : magics) {
    if (magic.eval(data)) {
        result = magic.getType();
        break;
    }
}
```

这里的`magics`是个`Magic`类的列表，这个列表是在`new Tika()`语句，也就是构造`Tika`对象的时候被初始化的。
在当时，程序加载了库里的`tika-mimetypes.xml`文件，这个文件中存放了大部分的已知文件类型的头部信息、偏移量等。这些文件被加载存储在一个`MimeTypes`对象里面。
而创建这个对象的时候需要创建一个`MimeTypesReader`对象，`MimeTypesReader`继承了`DefaultHandler`对象，这个对象是用来解析`xml`文件的处理类。
实际上在`MimeTypes`文件中有这么一个方法，是在初始化的时候调用的：

```java
void init() {
    for (MimeType type : types.values()) {
        magics.addAll(type.getMagics());
        if (type.hasRootXML()) {
            xmls.add(type);
        }
    }
    Collections.sort(magics);
    Collections.sort(xmls);
}


```

```java
Magic.eval() --> MagicMatch.eval() --> 
getDetector().detect(new ByteArrayInputStream(data), new Metadata()) // detector 如果为空，那么调用 MagicDetector.parse() 生成 dector
 --> MagicDetecor.detec()
```

终于到了最终的方法了，让我们一起来看看这个方法的实际实现：


```java
/**
    * 
    * @param input document input stream, or <code>null</code>
    * @param metadata ignored
    */
    // 我们传入的文件会被打开为输入流，而该文件的文件名和长度会被存储在 Metadata 类中，该类实际上是一个 Map 哦
public MediaType detect(InputStream input, Metadata metadata)
        throws IOException {
    if (input == null) {
        // 如果文件流为空，返回默认的文件类型，也就是『二进制文件』
        return MediaType.OCTET_STREAM;
    }

    /**
    * InputSteam 的 mark 是一个空方法，实际上传入的是一个 TikaInputStream 变量，他实现了这个方法
    * 这个方法做的，只是记录读到流哪个的位置
    */
    input.mark(offsetRangeEnd + length);
    try {
        int offset = 0;

        /** Skip bytes at the beginning, using skip() or read()
        * 跳过初始的一些字节，offsetRangeEnd 默认是 0 ，有一些文件的有效识别字符串不在文件的开头，所以需要跳过无效的区域
        * 有一些文件需要跳过的，比如 ISO 镜像类文件可以参看 [Magic Bytes](https://tool.lu/magicbytes/)
        * 这些信息保存在 tika-mimetypes.xml 文件中
        */
        while (offset < offsetRangeBegin) {
            long n = input.skip(offsetRangeBegin - offset);
            if (n > 0) {
                offset += n;
            } else if (input.read() != -1) {
                offset += 1;
            } else {
                return MediaType.OCTET_STREAM;
            }
        }

        // Fill in the comparison window
        // 新建一个缓冲块，大小是（尾偏移 - 首偏移 + 文件长度），首尾偏移都是正向偏移
        byte[] buffer =
            new byte[length + (offsetRangeEnd - offsetRangeBegin)];
        // 读进缓冲块，返回实际上读的是字节数
        int n = input.read(buffer);
        // 递增偏移量
        if (n > 0) {
            offset += n;
        }
        while (n != -1 && offset < offsetRangeEnd + length) {
            int bufferOffset = offset - offsetRangeBegin;
            n = input.read(
                    buffer, bufferOffset, buffer.length - bufferOffset);
            // increment offset - in case not all read (see testDetectStreamReadProblems)
            if (n > 0) {
                offset += n;
            }
        }

        // 如果是正则类型的，则用正则来匹配
        if (this.isRegex) {
            Pattern p = Pattern.compile(new String(this.pattern));

            ByteBuffer bb = ByteBuffer.wrap(buffer);
            CharBuffer result = ISO_8859_1.decode(bb);
            Matcher m = p.matcher(result);

            boolean match = false;
            // Loop until we've covered the entire offset range
            for (int i = 0; i <= offsetRangeEnd - offsetRangeBegin; i++) {
                m.region(i,  length+i);
                match = m.lookingAt(); // match regex from start of region
                if (match) {
                    return type;
                }
            }
        } else {
            // 如果不是，那么逐个字节进行比较
            if (offset < offsetRangeBegin + length) {
                return MediaType.OCTET_STREAM;
            }
            // Loop until we've covered the entire offset range
            for (int i = 0; i <= offsetRangeEnd - offsetRangeBegin; i++) {
                boolean match = true;
                for (int j = 0; match && j < length; j++) {
                    match = (buffer[i + j] & mask[j]) == pattern[j];
                }
                if (match) {
                    return type;
                }
            }
        }

        return MediaType.OCTET_STREAM;
    } finally {
        input.reset();
    }
}
```

# 结语

本文章只是捡了 Tika 库中极少部分的代码来分析，在看源码的过程中，深感自己能力不足。
所以本文也难免有错误缺漏，如果有的话，恳请诸君能不吝赐教~

*参看* 

- [Tika Apache](https://tika.apache.org/)

- [About "application/octet-stream" MIME attachments](https://kb.iu.edu/d/agtj)

- [Java ServiceLoader with multiple Classloaders](https://stackoverflow.com/questions/7039467/java-serviceloader-with-multiple-classloaders)

- [Magic Bytes](https://tool.lu/magicbytes/)

- [DefaultHandler中方法解读](https://blog.csdn.net/sir_zeng/article/details/17710013)
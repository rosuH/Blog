---
title: "Android 获取 SD 卡路径和 UUID"
date: 2018-09-27 21:06:15
tags:
  - "Android"
  - "SD card"
  - "路径"
  - "UUID"

categories:
  - "技术"

description: "本文将展示 Android 中如何获取 SD 卡的路径，以及 SD 卡的唯一标志 UUID..."
---

# Android 的存储结构

下面的『内外』，是相对应用而言的。应用内部沙盒称为内部存储，其外部称为外部存储。

## 内部存储

### 位置

Android 内部存储在`/data/data/`目录下，根据应用的包名划分出来。
每个应用都有如下几个子文件夹：

- `data/data/包名/shared_prefs`：存放该APP内的SP信息

- `data/data/包名/databases`：存放该APP的数据库信息

- `data/data/包名/files`：将APP的文件信息存放在files文件夹

- `data/data/包名/cache`：存放的是APP的缓存信息

### 读取方法

内部存储不需要申请读取权限，可以任君使用！
读写文件分别使用：

- `openFileOutput()`
    - `write()` 写入
    - `close()` 关闭

- `openFileInput`
    - `read()` 读取
    - `close()`关闭

也可以直接使用：

- `getCacheDir()`来获取缓存目录

- `getFilesDir()`来获取文件目录

## 外部存储

外置存储就必须申请权限，而且这里也有一些需要注意的地方，可以移步[阅读](https://blog.rosuh.me/2018/09/Android-reading-note-12/#Android-8-0-%20%E6%9D%83%E9%99%90%E7%BB%84%20-tips)。

一般来说，使用`Environment.getExternalStorageDirectory()`获取的是『外置存储』，但是实际上这个并不是很准确。反而回因为这个『外置』而让人困惑：如果有外置 SD 卡的情况...那谁才是外置呢？

看一下这个方法的注释，他解释得很清楚：

>Note: don't be confused by the word "external" here. This directory can better be thought as media/shared storage

他说你不要被『外置』这个词搞蒙了，实际上更像是一个『共享』存储器。这样一说其实你就知道了，即便是有外置 SD 卡的情况，两者都属于『外置存储器』。因为这个概念是相对于 App 内部沙盒存储器来说的。
但是这个时候直接调用这个方法获取的，可能并不是 SD 卡的路径。因为用户并没有将 SD 卡设置为『默认存储器』，所以上面这个方法将会得到原本的『共享』存储器。而不是 SD 卡。

我们看一下实现：

```java
public static File getExternalStorageDirectory() {
    throwIfUserRequired();
    return sCurrentUser.getExternalDirs()[0];
}
...

public File[] getExternalDirs() {
    final StorageVolume[] volumes = StorageManager.getVolumeList(mUserId,
            StorageManager.FLAG_FOR_WRITE);
    final File[] files = new File[volumes.length];
    for (int i = 0; i < volumes.length; i++) {
        files[i] = volumes[i].getPathFile();
    }
    return files;
}
```

`getExternalDirs()`方法返回了一个分卷列表，然后`getExternalStorageDirectory()`直接返回了该列表的第一个元素。也就是『默认存储器』了。


那么我们如何获取 SD 卡路径呢？



### 获取外置 SD 卡路径

```java
/**
* 返回外置存储卡路径
* @param context
* @return 返回存储卡路径
*/
public static String getExtendedMemoryPath(Context context) {
    StorageManager mStorageManager = (StorageManager) context.getSystemService(Context.STORAGE_SERVICE);
    Class storageVolumeClazz;
    try {
        storageVolumeClazz = Class.forName("android.os.storage.StorageVolume");
        Method getVolumeList = mStorageManager.getClass().getMethod("getVolumeList");
        Method getPath = storageVolumeClazz.getMethod("getPath");
        Method isRemovable = storageVolumeClazz.getMethod("isRemovable");
        Object result = getVolumeList.invoke(mStorageManager);
        final int length = Array.getLength(result);
        for (int i = 0; i < length; i++) {
            Object storageVolumeElement = Array.get(result, i);
            String path = (String) getPath.invoke(storageVolumeElement);
            boolean removable = (Boolean) isRemovable.invoke(storageVolumeElement);
            if (removable) {
                return path;
            }
        }
    } catch (ClassNotFoundException | InvocationTargetException  | NoSuchMethodException | IllegalAccessException e) {
        e.printStackTrace();
    }
    return null;
}
```

这里利用了反射获取 SD 卡的路径。

### 获取 SD 卡的 UUID

```java
/**
* 获取 SD 卡的 UUID，FAT32 格式为 xxxx-xxxx；NTFS 是更长的 hex 字符串
* @param context
* @return 返回 SD 卡的 UUID
*/
private static String getRealSDCardId(Context context){
    StorageManager mStorageManager = (StorageManager) context.getSystemService(Context.STORAGE_SERVICE);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N){
        // 如果 API 大于 23，可以直接调用
        if (mStorageManager == null || mStorageManager.getStorageVolumes().size() <= 1) {
            return null;
        }
        StorageVolume sdVolume = mStorageManager.getStorageVolumes().get(1);
        return sdVolume.getUuid();
    }else {
        String storagePath = getExtendedMemoryPath(context);
        if (!TextUtils.isEmpty(storagePath)){
            // 只考虑 FAT 32 格式的情况，TODO 兼容 NTFS 格式
            Pattern pattern = Pattern.compile(PATTERN_GET_SD_CARD_ID);
            Matcher matcher = pattern.matcher(storagePath);
            if (matcher.find()){
                return matcher.group();
            }
        }
    }
    return null;
}
```

这里还做了版本判断，如果 API 大于 23 的版本，可以直接调用`getStorageVolumes()`方法，获取所有卷的卷标。

*参看*：

- [Android存储（1）-- 你还在乱用Android存储嘛！！！](https://juejin.im/post/58b557de128fe10065e93cc8)

- [How to get SD Card ID/Serial Number?](https://stackoverflow.com/questions/47567116/how-to-get-sd-card-id-serial-number?noredirect=1&lq=1)


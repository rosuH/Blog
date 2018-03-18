---
title: "16 章编程挑战"
date: 2018-3-18 16:02:01
tags:
- 'Android'
- 'Glide'
- 'ViewTreeObserver'
- 'Android 编程权威指南'

categories:
- 'Android'

---

# 前言

本文章记录的是，[Android编程权威指南](https://book.douban.com/subject/25848404/) 第 16 章的编程挑战。目的是记录下自己实现的过程，以便日后回头看看当初自己的实现方法有什么不足之处，也顺便给没有头绪的其他读者一些可能的思路。

让我们先来看看问题。

## 问题一：优化照片显示

> 请创建能显示放大版照片的 DialogFragment。只要点击缩略图，就会弹出这个 DialogFragment，让用户查看放大版的照片。

题目已经给出了提示，就是使用`DialogFragment`来实现这个功能。

于是我们接下来的工作要做的大概就是：

- 创建一个`ImageViewerDialog` 的类，用来创建一个`AlertDialog`
  - 在创建的 `AlertDialog`中显示图片（`imageView`）
- 缩略图点击功能实现
  - 点击缩略图，启动`ImageViewerDialog`，后者会返回一个`AlertDialog`显示在界面上

原书中，示例的 App 里有一个功能是显示一个选择日期的`DialogFragment`，所以实际上我们只需参照着做出来就可以了。

创建一个 *ImageViewerDialog.java* 类，内容如下：



```java
public class ImageViewerDialog extends DialogFragment 
{
    
    private static final String ARG_IMAGE_SOURCE = "imageSource";
    private ImageView mImageView;

    public static ImageViewerDialog newInstance(String path)
    {
        
        Bundle args = new Bundle();
        args.putSerializable(ARG_IMAGE_SOURCE, path);

        ImageViewerDialog imageViewerDialog = new ImageViewerDialog();
        imageViewerDialog.setArguments(args);
        return imageViewerDialog;
    }

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) 
    {
        
        final String path = (String) getArguments().getSerializable(ARG_IMAGE_SOURCE);
        mImageView = new ImageView(getContext());
        // 把图片装载到 imageView 
        Point size = new Point();
        getActivity().getWindowManager().getDefaultDisplay().getSize(size); // 获取当前屏幕尺寸
        Glide.with(getActivity())
                .applyDefaultRequestOptions(new RequestOptions()
                .placeholder(R.drawable.ic_crime_camera)	// 过渡图片，可选操作
                .override(size.x, size.y))	// 将图片设置为屏幕尺寸
                .load(path)				   // 从路径载入图片
                .into(mImageView);		   // 将图片装入 imageview
        
        return new AlertDialog.Builder(getActivity())
                .setView(mImageView)	  // 设置 AlertDialog 的 view 为 imageview
                .create();
    }
}

```



可以看到，这里面由两个方法：

- `newInstance(String path)`
  - 创建`ImageViewerDialog`类实例，允许调用者附加`fragment`参数
  - 而附加的这个参数就是图片的路径，我们需要获得该图片的路径才能取图片并显示出来
- `onCreateDialog`
  - 先是从`fragment`的附加参数中取出图片路径并赋给`path`变量
  - 然后创建一个`imageView`
  - 通过`getActivity().getWindowManager().getDefaultDisplay().getSize(size)`获得当前屏幕尺寸，在后面设置照片的时候可以设置尺寸大小
  - 使用 [Glide](https://muyangmin.github.io/glide-docs-cn/) 载入图片，如果直接使用`imageView.setBackgroud()`方法的话，性能很差，有可能直接被 GC 而导致显示空白，所以推荐使用 Glide 载入

经过上面的步骤，我们就完成了图片放大的`fragment`的设计，实际上就是建立一个`imageView`，并用 Glide 把图片装载进去。然后设置弹出的`AlertDiaog`的`view`为装载了图片的`imageView`。

接着，我们看看如何调用并创建这个类：

`CrimeFragment.java`



```java
mPhotoView.setOnClickListener(new OnClickListener() 
{
            @Override
            public void onClick(View v) 
            {
                
                updatePhotoview();
                if (mPhotoFile != null || !mPhotoFile.exists()) 
                {    
                    FragmentManager manager = getFragmentManager();
                    imageViewerDialog = ImageViewerDialog.newInstance(mPhotoFile.getPath());
                    imageViewerDialog.show(manager, DIALOG_IMAGE_SOURCE);
                }
                else 
                {
                    mPhotoButton.performClick();
                }
            }
});
```

可以看到，我这里对在`CrimeFragment`中显示图片的`mPhotoView`设置了一个点击监听器。里面一共两个分支：

- 如果图片存在，则启动图片展示类
- 如果图片不存在则，模拟点击`mPhotoButton`按钮进行拍照

我们来看看第一个分支里做了什么事情：



```java
FragmentManager manager = getFragmentManager();
imageViewerDialog = ImageViewerDialog.newInstance(mPhotoFile.getPath());
imageViewerDialog.show(manager, DIALOG_IMAGE_SOURCE);
```



- 获取当前的`FragmentManager`
- 使用`ImageViewerDialog.newInstance`创建图片展示类
- 调用`show`方法让当前的`FragmentManager`展示我们的`ImageViewerDialog`
  - 别忘了，`ImageViewerDialog`是一个继承`DialogFragment`的类，也属于`fragment`的哦，所以使用`FragmentManager`来管理显示与否哦

这样的话，我们就完成了第一个问题。接着，我们继续看第二个问题。



## 问题二：优化缩略图加载

> 本章，我们只能大致估算缩略图的目标尺寸。虽说这种做法可行且实施迅速，但还不够理想。
> Android有个现成的API工具可用，叫作 ViewTreeObserver 。你可以从 Activity 层级结构中
> 获取任何视图的 ViewTreeObserver 对象：
> ViewTreeObserver observer = mImageView.getViewTreeObserver();
> 你可以为 ViewTreeObserver 对象设置包括 OnGlobalLayoutListener 在内的各种监听器。
> 使用 OnGlobalLayoutListener 监听器，可以监听任何布局的传递，控制事件的发生。
> 调整代码，使用有效的 mPhotoView 尺寸，等到有布局切换时再调用 updatePhotoView()
> 方法。

我们看一下，原文中如何使用 `Bitmap`剪切缩略图的：

*PictureUtils.java*

```java
public class PictureUtils 
{
    ...
    public static Bitmap getScaledBitmap(String path, Activity activity) 
    {
        
		Point size = new Point();
		activity.getWindowManager().getDefaultDisplay()
				.getSize(size);
		return getScaledBitmap(path, size.x, size.y);
    }
}
```

以及它的调用语句：

```java
Bitmap bitmap = PictureUtils.getScaledBitmap(
				mPhotoFile.getPath(), getActivity());
mPhotoView.setImageBitmap(bitmap);
```



可以看到，正如题目所描述的，示例中使用的是一个固定的尺寸（`getDefaultDisplay()`为屏幕尺寸）进行剪裁，这样的图片虽然不会变得过大，但是尺寸不精确，难免造成浪费。现在我们使用`ViewTreeObserver `方法来获得子`view`的尺寸，并将之设置为剪裁尺寸。

当然首先我们得先理解一下什么是`ViewTreeObserver`。

### `ViewTreeObserver`了解一下？

顾名思义，就是`ViewThree`的`Observer`，即是视图树的观察者。在设计模式里面，有一种称为“观察者”模式的东西。

举个例子：“你”生病了，有 1 名医生、3 名护士照顾你。但是他们并不能 24h 守在你旁边，所以他们分别给你留了一个电话号码，你出了事就可以通知他们了。

这个例子中，“你”属于被观察者，而医疗人员属于“观察者”。因为你还没出事，所以他们在你那里留下一个回调函数，等到你“出了事”之后，你就可以通知他们了（调用回调函数）。

同样的，`ViewTreeObserver`就是这样一个东西，你通过对某一个视图`view`设置监听器，等这个视图有所更新或者绘制完毕的时候，这个监听器就会被调用。监听器里的内容就会被执行。

这样的话，我们就可以知道该怎么做了。我们要为缩略图那个`view`设置一个监听器，等他被系统绘制完毕之后，把他的尺寸记录下来，然后通知`PictureUtils`进行精确剪裁。

怎么样，是不是思路很清晰？接着我们便可以来实现了。



*CrimeFragment.java*



```java
...
private float width;
private float height;
...
@Override
public View onCreateView(LayoutInflater inflater, ViewGroup container,
                         Bundle savedInstanceState) 
{
    ...
    mPhotoView.getViewTreeObserver()
              .addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() 
              {
            		@Override
            		public void onGlobalLayout() {
                		width = mPhotoView.getWidth();
                		height = mPhotoView.getHeight();
                		updatePhotoview();
                    }
	            });
    ...
}

...
private void updatePhotoview()
{
    
        if (mPhotoFile == null || !mPhotoFile.exists())
        {
            mPhotoButton.setVisibility(VISIBLE);
            mPhotoView.setClickable(false);
        }
    	else 
    	{
            mPhotoButton.setVisibility(GONE);
            mPhotoView.setClickable(true);
            Bitmap bitmap = PictureUtils.getScaledBitmap(
                    mPhotoFile.getPath(), (int) width, (int)height);
            mPhotoView.setImageBitmap(bitmap);
        }
}
```



可以看到：

- 我先定义了两个变量来存储宽和高
- 在 `onCreateView`中，为显示缩略图的`imageView`设置了`addOnGlobalLayoutListener`监听器
  - 在该监听器中，获取`mPhotoView`的长和高并赋给上述两个变量
  - 然后调用`updatePhotoview()`来刷新`imageView`

为什么要在这里调用`updatePhotoview()`呢？因为，这个监听器是在视图绘制之后（在`onMeasure(), onLayout()`方法之后 ）才会被调用的，此时，我们显示缩略图的那个`imageView`却已经显示出来了。

所以我们必须在监听器里，重新更新一次`imageView`的显示内容，这样效果才会出现。

接着我们看到`updatePhotoView`里面的内容。

- 两个分支
  - 第一个分支内容是当没有图像的时候，显示一个照相按钮（`mPhotoButton`），同时让图像无法被点击
  - 第二个分支内容就是当图像存在时，先将照相按钮隐藏，然后让图像可以被点击，接着利用`PictureUtils`设置图像

因为我做的例子，是把图片和照片按钮放在同一个位置，当有图片的时候，不显示拍照按钮，当没有图片的时候，显示拍照按钮。**关于书里的，我们只需要关注第二个分支的最后两句**。

书里面的`PictureUtils`方法里：由两个同名的重载方法`getScaledBitmap`，因为我们重新优化缩略图加载功能，所以我们就不需要第二个剪切方法了。可以把它删掉。（删掉：`getScaledBitmap(String path, Activity activity) `）

然后修改第一个参数列表为：`getScaledBitmap(String path, int destWidth, int destHeight)`。

内部代码如下：



```java
public static Bitmap getScaledBitmap(String path, int destWidth, int destHeight)
{
        // Read in the dimensions of the image on disk
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(path, options);

        float srcWidth = options.outWidth;
        float srcHeight = options.outHeight;

        // Figure out how much to scale down by
        int inSampleSize = 1;
        if (srcHeight > destHeight || srcWidth > destWidth)
        {
            
            float heightScale = srcHeight / destHeight;
            float widthScale = srcWidth / destWidth;

            inSampleSize = Math.round(heightScale > widthScale ? heightScale : widthScale);
        }

        options = new BitmapFactory.Options();
        options.inSampleSize = inSampleSize;
        // Read in and create final bitmap
        return BitmapFactory.decodeFile(path, options);
    }
```



在这里修改了参数列表，仅此而已。因为我们使用了 `ViewTreeObserver`监视 `imageView`然后会返回该`view`的`width`和`heigh`，所以这里传入该`view`的`width`和`heigh`，也就是精确的缩放尺寸。紧跟着，`getScaledBitmap`这个方法算出缩放比例，重新创建`Bitmap`对象并返回。

我们也就得到了一个精确缩放的`Bitmap`对象。



到此我们两个编程挑战也就完成了。我利用了书里的例子，照猫画虎实现了目标功能。但是由于水平有限，可能存在诸多缺漏和不恰当的地方，还请诸君多多指正！谢谢~

------

参看：

- [解析 ViewTreeObserver 源码，体会观察者模式、Android消息传递（上）](http://blog.csdn.net/my_truelove/article/details/52305792)
- [解析 ViewTreeObserver 源码，体会观察者模式、Android消息传递（下）](http://blog.csdn.net/My_TrueLove/article/details/52653072)
- [Glide — Image Resizing & Scaling](https://futurestud.io/tutorials/glide-image-resizing-scaling)
- [Android LayoutInflater原理分析，带你一步步深入了解View(一)](http://blog.csdn.net/sinyu890807/article/details/12921889)
- [ViewTreeObserver使用](http://blog.csdn.net/A38017032/article/details/55806436)

感谢~



---
title: iOS实现水波动画  
date: 2016-08-04 01:42:06  
tags: [比特海,开源,iOS,动画]  
category: 比特海  
layout: post  

---

## 前言

iOS下实现水波动画，动画曲线使用的是`正弦型函数解析式`。  
效果图如下（图在最后有点卡顿的感觉，是因为gif重新开始播放了）

> PS：gif图中下面的`Water`，在水波动画的基础上，使用遮罩实现了`Water`字体的`蓝白颜色交替`

![image](http://aevit.qiniudn.com/6d34efef07654d9ac80ca3cafe89c9931470240534.gif)

<!--more-->

## 正弦函数

正弦函数是高中学过的知识，这里不再做详细介绍，具体可以查看[百科](http://baike.baidu.com/view/536305.htm)。

我们主要使用到的是正弦函数的几个性质：


```
正弦型函数解析式：y = a * sin（ωx+φ）+ h

各常数值对函数图像的影响：
φ（初相位）：决定波形与X轴位置关系或横向移动距离（左加右减）
ω：决定周期（最小正周期 T = 2π/|ω|）
A：决定峰值（即纵向拉伸压缩的倍数）
h：表示波形在Y轴的位置关系或纵向移动距离（上加下减）
```


## 动画解析

我们先来看上面方形的水波，主要就是利用`正弦函数`绘制出路径即可，如图：

![image](http://aevit.qiniudn.com/2c388de0cc44042fab9f85237ccaed881470240674.jpeg)

我们知道，虽然我们肉眼看到的曲线是连续的，但是实际将曲线放大到一定程度，看到的是栅格的像素点。  
所以我们只要计算出上图中的4个`蓝色点`，以及弧线上的所有点，再将之全部连成线，即可形成我们需要的水波形状。

我们从左上角的点开始，依次计算弧线上的点，以及之后的3个`蓝色点`即可，这里我们使用`UIBezierPath`来进行绘制（当然也可以使用`CGMutablePathRef`等），关键代码如下：


```
UIBezierPath *path = [UIBezierPath bezierPath];
path.lineWidth = 1;
[path moveToPoint:CGPointMake(0, leftUpPointY)];
for (CGFloat x = 0.0; x < waveWidth; x++) {
    CGFloat y = 2 * a * sin(2.5 * M_PI / waveWidth * x + offset * M_PI / waveWidth) + leftUpPointY;
    [path addLineToPoint:CGPointMake(x, y)];
}
[path addLineToPoint:CGPointMake(waveWidth, self.frame.size.height)];
[path addLineToPoint:CGPointMake(0, self.frame.size.height)];
[path closePath];
```


* * *

这里对使用到的`正弦函数`相关参数进行一下说明：

回顾一下正弦函数解析式：


```
y = a * sin（ωx+φ）+ h
```


各参数值说明：

> 下面的`waveWidth`为容器的宽度


```
`a`：峰值，值越大，峰越陡，我们可以通过调节该值，来实现水波波动的视觉效果；  

`ω`：周期，这里我们设定为`2.5`个周期（具体可以根据需要自行调整），则值为`2.5 * M_PI / waveWidth`；  

`φ`：横向移动距离，调节该值，实现水波左右滑动的视觉效果（不是必须，设置为0也可以，根据需要自行调节即可）；  

`h`：纵向距离，即在容器中的一个位置，这里我们固定设置为左上角的`蓝色点`的`leftUpPointY `这个值即可；
```


经过多次调试后，我使用了以下参数：


```
CGFloat y = 2 * a * sin(2.5 * M_PI / waveWidth * x + offset * M_PI / waveWidth) + leftUpPointY;
```


* * *

以上就可以绘制出一段水波曲线了，不过还只是静态的，我们需要让水波连续地波动，就需要重复地进行绘制，并且在绘制过程中通过改变`a`值/`φ`值，来形成高低错落有致的视觉效果。

最开始我使用的是`CADisplayLink`来进行重复绘制，但是发现`60帧/秒`的频率，即`1/60 = 0.017秒`就重新进行一次绘制，速度有点快，导致CPU会上升得比较多。所以现在改用`NSTimer`，每`0.05秒`才进行一次绘制。

其中在`NSTimer`的每次回调里改变`a`值/`φ`值后再进行新的绘制：


```
a = (toAdd ? a + 0.01 : a - 0.01);
toAdd = (a <= 1 ? YES : (a >= 2.5 ? NO : toAdd));
    
offset = (offset < MAXFLOAT ? offset + _speed : offset - _speed);
```


* * *

## 蓝白颜色交替

之前无意中看到网上有人弄了水波动画（详见[这里](https://github.com/summertian4/CFWaterWave)），就想着自己研究实现一下。

把水波的绘制动画研究出来后，发现那个`demo`里还有个`颜色交替`的效果，刚好以前弄过类似的，看了下源码，实现思路基本差不多：

使用2张图片，如图：

![image](http://aevit.qiniudn.com/aa77a113b063da8da06ff517f68340461470243553.jpeg)

使用2个`UIImageView`分别放置2张图片，`白色底`的放下面，`蓝色底`的放上面，然后再在`蓝色底`的`upImageView.layer`上加一层`mask`遮罩。

遮罩的路径也就是上面绘制水波的路径，只是不将路径绘制好后的`CAShapeLayer`加到`容器的layer`上去，而是设置为`upImageView.layer`的`mask`：


```
self.upImgView.layer.mask = self.waveLayer;
```


## 总结

这里主要使用到的是`正弦函数`，正好复习了一下，能够应用到实际开发中去是挺有成就感的一件事。  
这个动画的难点主要是弧线上的点的计算，不过只要多花点时间就可以得到一个满意的结果了。

代码已上传至`github`，需要可以去查看：[水波动画源码](https://github.com/Aevit/SCWaterWave)

* * *

2016-08-04 01:42  
Aevit  
华师

* * *

<a class="http://aevit.qiniudn.com/3b486e12becac3aa4c6c7e8bafbe38eb1470245690.jpeg" title="海边日出">![](http://aevit.qiniudn.com/3b486e12becac3aa4c6c7e8bafbe38eb1470245690.jpeg)</a>  
摄影：Aevit 2016年7月 阳江闸坡 十里银滩
---
title: sketch设计学习（一）  
date: 2015-08-12 22:22:49  
tags: [比特海,设计,sketch]  
category: 比特海  
layout: post  

---

> `sketch`学习计划：  
> 1、看完官方文档（两天）  
> 2、找`demo`自己模仿进行设计（五天）  
> 3、自己设计一个`app`的UI，再自己开发实现最终的成品

以下是学习过程中遇到的几个图标的制作，记录一下

[![](http://aevit.qiniudn.com/sketch_wifi_final.png?imageView2/1/w/200/h/200)](http://aevit.qiniudn.com/sketch_wifi_final.png "1/3 final")[![](http://aevit.qiniudn.com/sketch_setting_final.png?imageView2/1/w/200/h/200)](http://aevit.qiniudn.com/sketch_setting_final.png "2/3 final")[![](http://aevit.qiniudn.com/sketch_love_final.png?imageView2/1/w/200/h/200)](http://aevit.qiniudn.com/sketch_love_final.png "3/3 final")

首先，在网上查资料时，突然搜到一个画可爱的企鹅的教程，先来看下图片提提神（先说好了，这企鹅不是我画的）：

[![](http://aevit.qiniudn.com/wtf_lovely_qq.JPG?imageView2/2/w/800/h/600)](http://aevit.qiniudn.com/wtf_lovely_qq.JPG "wtf!!")

> 我要打死小编，以及这可！爱！的企鹅！！

<!--more-->

#### 一、wifi图标


```
前言：
a. 主要是对图形进行布尔运算；
b. 原理：中间画一个实心圆，外部再4个环，最后在最上层弄一个正方形，做相交运算；
c. 环与环的相交运算结果，貌似与`ps`的不太一样；自己摸索了一段时间才偶然间成功画出wifi图标，不知道有没有什么更简便的方法；  
d. 此处画的圆，都共用同一个圆心，并且填充为白色，边框不上色
```


1、建一个`1280 x 1024`的`Artboard`

2、画一个直径为`144`的实心圆  
[![](http://aevit.qiniudn.com/sketch_wifi_0.png)](http://aevit.qiniudn.com/sketch_wifi_0.png "1/5 wifi")

3、画第一个环

> 方法：先画一个实心圆（直径为`176`，即上个圆直径`+32`），再画另一个稍大的实心圆（直径为`208`，即上个圆直径`+32`），然后对这两个圆做`Difference`运算

[![](http://aevit.qiniudn.com/sketch_wifi_1.png)](http://aevit.qiniudn.com/sketch_wifi_1.png "2/5 wifi")

4、照第2的方法，再画3个环（其中每个圆的直径都在上一个基础上`+32`）  
[![](http://aevit.qiniudn.com/sketch_wifi_2.png)](http://aevit.qiniudn.com/sketch_wifi_2.png "3/5 wifi")

5、画一个正方形

> 边长要超过最大的环的半径，填充为白色，边框不上色

[![](http://aevit.qiniudn.com/sketch_wifi_3.png)](http://aevit.qiniudn.com/sketch_wifi_3.png "4/5 wifi")

6、选中所有图形，执行`Intersect`运算（最终效果见右边）  
[![](http://aevit.qiniudn.com/sketch_wifi_4.png)](http://aevit.qiniudn.com/sketch_wifi_4.png "5/5 wifi")

#### 二、setting图标

1、建一个`1024 x 1024`的`Artboard`

2、用`Star`工具画一个正多角形，调整为8个角  
[![](http://aevit.qiniudn.com/sketch_setting_0.png)](http://aevit.qiniudn.com/sketch_setting_0.png "1/5 setting")

3、选中正多角形，按`enter`键进入编辑模式，`cmd+a`全选所有锚点，在右边更改锚点类型为`Mirrored`，这时图形的转角处会有弧度出现  
[![](http://aevit.qiniudn.com/sketch_setting_1.png)](http://aevit.qiniudn.com/sketch_setting_1.png "2/5 setting")

4、画一个实心圆  
[![](http://aevit.qiniudn.com/sketch_setting_2.png)](http://aevit.qiniudn.com/sketch_setting_2.png "3/5 setting")

5、选中所有图形，执行`Intersect`运算  
[![](http://aevit.qiniudn.com/sketch_setting_3.png)](http://aevit.qiniudn.com/sketch_setting_3.png "4/5 setting")

6、再上一步结果内部画一个稍小的圆（不填充颜色），并执行`Difference`运算，得到最终结果  
[![](http://aevit.qiniudn.com/sketch_setting_4.png)](http://aevit.qiniudn.com/sketch_setting_4.png "5/5 setting")

#### 三、心形图标

1、建一个`1024 x 1024`的`Artboard`

2、画两个圆（在同一水平线上）  
[![](http://aevit.qiniudn.com/sketch_heart_0.png)](http://aevit.qiniudn.com/sketch_heart_0.png "1/3 heart")

3、画一个正方形（旋转45度，注意各顶点位置，如下图的红色部分——好像一个穿着红内裤的屁股啊。。）  
[![](http://aevit.qiniudn.com/sketch_heart_1.png)](http://aevit.qiniudn.com/sketch_heart_1.png "2/3 heart")

4、执行`Union`运算，得到最终效果  
[![](http://aevit.qiniudn.com/sketch_heart_2.png)](http://aevit.qiniudn.com/sketch_heart_2.png "3/3 heart")
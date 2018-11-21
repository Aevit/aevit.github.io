---
title: CSS居中  
date: 2016-05-07 01:10:08  
tags: [比特海,前端,CSS,居中]  
category: 比特海  
layout: post  

---

前阵子学习前端开发，遇到的第一个难点是对 `css` 的使用，刚开始没有什么章法。  
后来找到一篇简短教程，有了一个大概的了解，推荐看一下: [学习CSS布局](http://zh.learnlayout.com/)。

开发过程中，经常会遇到需要居中（水平居中、垂直居中、水平+垂直居中）的情况。  
由于情况比较多，在最近的项目中遇到了一些，通过各种搜索，现记录如下，主要有以下几种：

<!--more-->

1.  水平居中：内联元素（inline）
2.  水平居中：单个块级元素（block）
3.  水平居中：多个块级元素
4.  水平居中：多个块级元素（使用 flexbox 布局来解决）
5.  垂直居中：单行的内联元素
6.  垂直居中：多行的内联元素
7.  垂直居中：已知高度的块级元素
8.  垂直居中：未知高度的块级元素
9.  水平垂直居中：已知高度和宽度的元素
10.  水平垂直居中：未知高度和宽度的元素
11.  水平垂直居中：使用 flexbox 布局来解决

> 注1：可在PC端点击右下角按钮查看目录，方便查阅  
> 注2：以下 `CSS` 代码示例，`parent-center` 表示对`父元素`的样式设置，`center` 表示对`将要居中`元素的样式设置

## 水平居中

### 内联元素

首先使用一个 `block` 元素作为将该 `inline` 的**父元素**，然后为该 `block` 元素添加一个居中属性即可

> 适用元素：文字，链接，及其其它 inline 或者 inline-* 类型元素（如 inline-block，inline-table，inline-flex）


```
/* 注意是为 父元素 添加以下属性 */
.parent-center {
  text-align: center;
}
```


> 演示:

See the Pen [grZKqP](https://codepen.io/Aevit/pen/grZKqP/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

### 单个块级元素

只需要设置左右外边距（即 margin-left, margin-right）为 `auto` 即可：


```
.center {
  /* 上下外边距可以根据需要自行调整 */
  margin: 0px auto;
}
```


> 演示：

See the Pen [NNoKJd](https://codepen.io/Aevit/pen/NNoKJd/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

PS: 如果要居中一个浮动(float)的元素，可参照这篇文章：[使用CSS伪元素模拟float:center效果](http://cdn1.w3cplus.com/node/1608)

* * *

### 多个块级元素

如果有多个块级元素需要水平排列，可以这样做：  
将每个块级元素的 `display属性` 设置为 `inline-block`，再把 `父元素` 的 `text-align属性` 设置为 `center`


```
.parent-center {
  text-align: center;
}
.center {
  display: inline-block;
}
```


> 演示：

See the Pen [MyLgxr](https://codepen.io/Aevit/pen/MyLgxr/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

### 多个块级元素（使用 flexbox 布局来解决）

只需为 `父元素` 设置好 `display` 及 `justify-content` 属性即可


```
.parent-center {
  display: flex;
  justify-content: center;
}
```


> 演示：

See the Pen [oxmvVO](https://codepen.io/Aevit/pen/oxmvVO/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

## 垂直居中

### 单行的内联元素

要将内联元素（inline, inline-* 等元素）垂直居中，只需将该元素的 `height` 和 `line-height` 都设置为 `父元素` 的高度即可。


```
.center {
  /* 假设父元素高度为 180px，则将该内联元素的高度及行高也设置为 180px */
  height: 180px;
  line-height: 180px;
}
```


> 演示：

See the Pen [GZzKLJ](https://codepen.io/Aevit/pen/GZzKLJ/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

### 多行的内联元素

设置`父元素`的`display`及`vertical-align`样式即可


```
.parent-center {
  display: table-cell;
  vertical-align: middle;
}
```


> 演示：

See the Pen [NNoKmd](https://codepen.io/Aevit/pen/NNoKmd/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

### 已知高度的块级元素

设置好以下属性即可


```
.center {
  height: 120px;
  
  position: absolute;
  padding: 0;
  top: 50%;
  margin-top: -60px; /* 高度除以2的负数，如果没有使用 box-sizing: border-box; 要计算上border和padding */
}
```


> 演示：

See the Pen [yOZBrP](https://codepen.io/Aevit/pen/yOZBrP/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

### 未知高度的块级元素

与`已知高度的块级元素`的`垂直居中`类似，只是使用`transform`代替`margin-top`即可


```
.center {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
```


> 演示：

See the Pen [oxmvOR](https://codepen.io/Aevit/pen/oxmvOR/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

## 水平垂直居中

### 已知高度和宽度的元素

与`已知高度的块级元素`的`垂直居中`类似，只是加多了`left`及`margin-left`


```
.center {
  width: 160px;
  height: 100px;

  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -50px; /* height 的一半的负值 */
  margin-left: -80px; /* width 的一半的负值 */
}
```


> 演示：

See the Pen [ONdLYX](https://codepen.io/Aevit/pen/ONdLYX/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

### 未知高度和宽度的元素

与`未知高度的块级元素`的`垂直居中`类似，只是加多了`left`及`transform-x值`


```
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```


> 演示：

See the Pen [KzJPLX](https://codepen.io/Aevit/pen/KzJPLX/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

### 使用 flexbox 布局来解决

对`父元素`做以下设置即可


```
.parent-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```


> 演示：

See the Pen [eZxOar](https://codepen.io/Aevit/pen/eZxOar/) by Aevit ([@Aevit](http://codepen.io/Aevit)) on [CodePen](http://codepen.io).

* * *

以上所有示例demo代码可在此[下载](http://pan.baidu.com/s/1nuG9YWT)

本文根据以下文章整理而成：  
[极客标签](http://www.gbtags.com/gb/gbliblist/20.htm)  
[w3ctrain](http://w3ctrain.com/2015/12/07/about-center/)

* * *

2016.5.7 01:10 春夏多雨  
Aevit  
华师

[![](http://file.arvit.xyz/033db02f2426d7cff6ee6df084f820841462554475.jpeg)](http://file.arvit.xyz/033db02f2426d7cff6ee6df084f820841462554475.jpeg)  
被摄影：Aevit 2015年10月 西藏界  
摄影：路上遇到的骑行朋友
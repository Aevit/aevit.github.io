---
title: 基于PhotosKit的截图整理工具  
date: 2015-09-17 01:06:55  
tags: [比特海,开源,iOS]  
category: 比特海  
layout: post  

---

### 前言

因为工作原因，前阵子手机里的截图过多。  
所以就想着自己开发一个工具，能够自动将所有截图归类到一个相册里。

<!--more-->

效果展示:  
![image](http://file.arvit.xyz/scscreenshot-demo.gif)

* * *

### 学习成果

以下是这次的学习成果：  
1、新的照片框架`PhotosKit`  
2、扩展的开发(`extension`)  
3、iOS后台技术(`backgroud fetch`)  
4、`swift`与`Objective-C`的混编学习  
5、自定义`framework`的学习  
6、使用`PhotosKit`写了一个简单的`图片选择器`(待继续完善再开源)  
7、写了一个简单的`图片浏览器`(待继续完善再开源)

PS：苹果现在已开放了很多不错的API，果然学无止境…

* * *

### 方案

1、最开始想用扩展，让其自动监测到截屏就将之放进`screenshots`相册里  
但是发现`extension`是当用户下拉`通知中心`才会执行代码，做不到自动监测并处理

2、后来又想用`iOS7`之后的`background fetch`自动监测  
结果发现这个自动监测的是不定时的，所以也不符合要求

3、最终的方案：  
写个`扩展`，下拉通知中心后，自动查找全部照片里的截图做好归类，并在`扩展`显示最新的4张截图  
点击截图可以进入app里，查看全部截图

* * *

### UI相关

然后就先进行简单的设计——我的意思是，很粗糙的设计  
[![](http://file.arvit.xyz/scscreenshot-ui.png)](http://file.arvit.xyz/scscreenshot-ui.png "UI")

顺便也画了个`icon`——一个与此主题完全无关的`icon`  
（完全是因为我那天刚好在喝咖啡  
（而咖啡有个最大的好处，就是有助失眠  
[![](http://file.arvit.xyz/scscreenshot-icon.png)](http://file.arvit.xyz/scscreenshot-icon.png "icon")

* * *

### 代码相关

代码本来前阵子已经动工了，不过这几天要开发公司的一些新接口，就暂时没继续开发这个截图工具了  
没想到听说`iOS 9`就自带将截图整理到一个相册的功能  
而系统自带的，权限比我的高，所以体验更好 ＝。＝  
于是，我的意思是，s..h..i..t..

代码已放上`github`  
[go to github](https://github.com/Aevit/SCScreenshot)
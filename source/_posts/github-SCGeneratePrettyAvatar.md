---
title: SCGeneratePrettyAvatar  
date: 2015-06-20 12:37:40  
tags: [比特海,开源,iOS]  
category: 比特海  
layout: post  

---

> 现在大部分app注册采用的默认头像都比较丑，为了追求高逼格，参考了一些app的做法，自己生成一个默认头像；  
> 头像效果见下面gif图

### Codes

[click to github](https://github.com/Aevit/SCGeneratePrettyAvatar)

以下是写在`github`里的`README`：  
<!--more-->

# SCGeneratePrettyAvatar

=======================

* * *

### Description

Generate a pretty default avatar, with text on it, and a random flat background color.

> The text on it depends on the text you input:  
> if  
>      the first two character includes Chinese, then the text on the image is the first Chinese character,
> 
> else  
>      the text on the image is the first two English character.

* * *

### Display

![preivew_gif](https://raw.githubusercontent.com/Aevit/SCGeneratePrettyAvatar/master/SCGeneratePrettyAvatarDemo.gif)

* * *

### How to use

1、copy the folder `SCGeneratePrettyAvatar` to your project, and import it.

2、write the code like this:  


```
UIImage *image = [SCGeneratePrettyAvatar generateWithText:@"Aevit" imageLength:1024];
```


3、see more details in my demo project.

* * *

### Thanks

The background colors are from [http://flatuicolors.com/](http://flatuicolors.com/).

* * *

### License

This code is distributed under the terms and conditions of the [MIT license](https://raw.githubusercontent.com/Aevit/SCGeneratePrettyAvatar/master/LICENSE).
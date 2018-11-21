---
title: Table数据转JSON  
date: 2015-11-09 20:28:41  
tags: [比特海,前端]  
category: 比特海  
layout: post  

---

### 问题描述

今天遇到个问题，需要将和风天气接口 [城市列表](http://www.heweather.com/documents/cn-city-list) 转成JSON文件给客户端人员使用。  
如果手动一个一个复制下来工作量巨大。

以前没怎么弄过前端，查了下有几种方法，一种是纯js遍历实现，一种是通过jQuery。

<!--more-->

### Demo

最终效果如下：

<p data-height="285" data-theme-id="0" data-slug-hash="gaBQrQ" data-default-tab="js,result" data-user="Aevit" data-embed-version="2" data-pen-title="gaBQrQ" class="codepen">See the Pen <a href="https://codepen.io/Aevit/pen/gaBQrQ/">gaBQrQ</a> by Aevit (<a href="https://codepen.io/Aevit">@Aevit</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

### 说明

1.  First  
    这里的`html`代码，直接使用 `onclick` 事件来响应。  
    `Helkyle大神`说过，这种方法很不好。  
    不过这里为了demo方便就直接用了，正确的姿势应该是`addEventListren`这样的东西，可参见此[地址](http://www.itxueyuan.org/view/6338.html)

2.  Second  
    以上 [codepen](http://codepen.io/Aevit/pen/gaBQrQ/) 示例代码的`tap me`按钮事件，只是调用第一种纯js方法来响应。  
    第二种`jQuery`的方法，需要引进`jQuery`库，及另一个文件`jquery.tabletojson.min.js`: 详见其 [github地址](https://github.com/lightswitch05/table-to-json)

[SourceCode Download](http://pan.baidu.com/s/1qWMQgX2)

2015.11.09 21:45  
Aevit  
华师图书馆

* * *

miao  
米奥  
[![](http://file.arvit.xyz/cat_priate_1.JPG)](http://file.arvit.xyz/cat_priate_1.JPG "杰克喵长")
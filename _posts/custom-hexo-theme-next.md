---
title: next的一点自定义  
date: 2015-06-15 00:35:26  
tags: [比特海,hexo]  
category: 比特海  
layout: post  

---

## 一、前言

之前的博客用的是`jekyll`(基于`ruby`)建的，但是后来发现有时有点问题。  
查资料对比了一下，最终决定使用`hexo`来重新搭建博客。

具体的搭建过程这里不再赘述，网上已有很多详细的资料。

<!--more-->

强烈建议备份 markdown 的源文件，有多种方案：  

* 使用 [hexo-deployer-git](https://github.com/hexojs/hexo-deployer-git)，但是发现这种貌似每次提交都会清除原本所有 html 文件，导致 .git 越来越大，使用方法可以参照文档或这篇[文章](http://www.leyar.me/backup-your-blog-to-github/)  
* 在这篇文章 [使用hexo，如果换了电脑怎么更新博客？](https://www.zhihu.com/question/21193762)，看到有人写了个 [工具](https://link.zhihu.com/?target=https%3A//github.com/coneycode/hexo-git-backup) 
* 或者在自己 `./souce` 目录下建个仓库  

## 二、简介

这里简单介绍一下整个博客使用的东西：

*   使用基于`node.js`的`hexo`来搭建静态博客
*   代码托管在`gitcafe`及`github`上
*   域名是在`godaddy`购买: [http://aevit.xyz](http://aevit.xyz)
*   使用`dns.la`转发，国内IP访问`gitcafe`上的代码，国外IP访问`github`上的代码，保证访问速度
*   使用`markdown`进行写作
*   主题最终采用的是`next`，风格比较喜欢

## 三、主题说明

主题地址: [next](https://github.com/iissnan/hexo-theme-next)

主题的一些官方修改这里不再介绍（配置`_config.yml`等操作），具体可参考官网

下面记录一下对此主题的一点自定义修改：

> 以下修改除非有特别说明，不然前面的路径都是：`/theme/next/`

### 3-1 图片浏览控件－fancybox

*   在移动端使用大图模式（撑满屏幕，浏览效果更好），PC端使用多缩略图模式（一行3张图）

> 修改`/layout/_layout.swig`，将`jQuery`的加载放到`head`标签里面


```
<script type="text/javascript" src="{{ url_for(theme.vendors) }}/jquery/index.js?v=2.1.3"></script>
```


*   新增`/source/js/fancybox-aevit.js`文件，代码如下：


```
$(function() {
	var winWidth = $(window).width();
	$('.fancybox-aevit img').each(function(index, item) {
		var imgSrc = $(item).attr('src');
		var strIndex = imgSrc.indexOf('?imageView2');
		if (strIndex && winWidth <= 678) {
			imgSrc = imgSrc.substring(0, strIndex);
			imgSrc = imgSrc + "?imageView2/1/w/" + winWidth + "/h/" + winWidth; // 使用七牛的图片尺寸api
			$(item).attr('src', imgSrc);
		}
	});
})
```


*   新增`/source/css/_common/_component/fancybox-aevit.styl`文件，使PC端上图片每行显示3张，代码如下：


```
.fancybox-aevit {
  display: inline-block;
  border-bottom: 0px;
}
@media (max-width: 678px) {
  .fancybox-aevit {
    width: 100%;
  }
  .fancybox-aevit img {
    width: 100%;
  }
}

.fancybox-aevit-left {
  display: inline-block;
  border-bottom: 0px;
}

.fancybox-aevit-full {
  display: inline-block;
  border-bottom: 0px;
}
```


*   在`/source/css/main.styl`，引进上面的`css`文件


```
@import "_common/_component/fancybox-aevit";
```


*   在需要使用九宫格样式的文章正文**开头**，引进 js 文件：


```
<script type="text/javascript" src="/js/fancybox-aevit.js"></script>
```


*   示例: [太古仓日落](/2015/06/07/tai-gu-cang-sunset/)

### 3-2 搜索控件－swiftype

*   在根目录（注意不是主题的目录）的`_config.yml`里填写`swiftype_key`
*   <del>拷贝`st.js`到 `/source/js/`（主题目录下的`source`），加快js加载速度</del>（新版弄到本地会导致不能搜索）
*   修改 `/source/layout/_partials/search/swiftype.swig`，在`input`标签添加`placeholder="搜索"`(html5新特性)
*   设置`分类页面`才显示搜索功能，修改 `/source/layout/_partials/header.swig`，增加 `is_current('categories')` 判断

    有2处需要修改：

    
```
{% if not theme.scheme and theme.swiftype_key and is_current('categories') %}
```
 
```
{% if hasSearch && is_current('categories') %}
  <div class="site-search">
	{% include 'search.swig' %}
  </div>
{% endif %}
```

*   <del>`st.js`会自动加载`swiftype`的CDN上的css文件（`new_embed-85bc2d1b89a82e5a688394908a05bc0d.css`等），还未找到方法改为加载本地的css</del>

### 3-3 404页面

*   添加 `404.html` 到 `/source/` 目录下（注意是主题的`source`），具体要做什么修改，直接去改动`404.html`即可

### 3-4 主题的`_config.yml`

*   开启`categories`页面
*   开启`about`页面

> 然后修改`/layout/_partials/herder.swig`，给`about`链接加`target = "_blank"`


```
{% if itemName == "about" %}
  <a href = /about.html target = "_blank">
{% else %}    
  <a href="{{ url_for(path) }}">
{% endif %}
```


> 再然后将以前写好的`about.html`（使用`impress.js`制作）放到主题目录下的`source`目录

*   修改高亮规则`normal`为`night`
*   填写`duoshuo_info`里的`admin_enable`、`user_id`（在站点的`_config.yml`增加`duoshuo_user_key`，在`/layout/_layout.swig`的多说代码增加`data-author-key=""`）

*   `use_font_lato`为`true`的话，会去`http://fonts.googleapis.com`上加载；  
    不过由于`The Great F**king Wall`的原因，加载会相当地慢；

    
```
# 如果 不 需要`lato`字体的话，直接修改主题里的`_config.yml`里的`use_font_lato`为`false`即可
use_font_lato: false


# 如果需要`lato`字体，则修改主题layout里的head.swig，去加载360CDN上的    
# 路径: themes/next/layout/_partials/head.swig  
{% if theme.use_font_lato %}
  <!--link href="//fonts.googleapis.com/css?family=Lato:300,400,700,400italic&subset=latin,latin-ext" rel="stylesheet" type="text/css"-->
  <link href="//fonts.useso.com/css?family=Lato:300,400,700,400italic&subset=latin,latin-ext" rel="stylesheet" type="text/css">
{% endif %}
```

*   添加`use_local_file`，方便本地调试使用

    
```
# 本地调试使用, true: 加载本地的jQuery、font-awesome等文件；false: 加载CDN上的文件
use_local_file: false
```


### 3-5 头像

*   在根目录（注意不是主题的根目录）的`/source/images`放一张`default_avatar.jpg`图片

### 3-6 字体

*   修改`themes/next/source/css/_variables/base.styl`

    
```
$font-family-chinese      = "Lantinghei SC", "PingFang SC", 'Microsoft YaHei', "微软雅黑"  
$font-family-base         = $font-family-chinese, Lato, sans-serif
$font-family-headings     = $font-family-chinese, Lato, sans-serif

$font-size-base           = 16px
```


*   PS：`OS X 10.12` 的 `Chrome` 下，字体会有点粗（`Chrome` 字体渲染跟 `Safari` `Firefox` 的不一样），所以现在 `$font-family-chinese` 改为如下：

    
```
"PingFang SC", "Lantinghei SC", 'Microsoft YaHei', "微软雅黑"
```


并且修改 `./themes/next/source/css/_common/_core/scaffolding.styl`，给 `body` 的 `css` 增加以下代码：


```
-webkit-font-smoothing: antialiased;
```


### 3-7 标题

*   <del>修改`/next/layout/post.swig`，将`//`改为`-`</del> (现在默认是`|`了)

### 3-8 CDN

> ps: 在`themes/next/_config.yml`里，我添加了`use_local_file`，方便本地调试使用

*   修改`themes/next/layout/_layout.swig`, 让jQuery先从七牛CDN加载，加载失败再从本地加载

    
```
{% if theme.use_local_file %}
  <script type="text/javascript" src="{{ url_for(theme.vendors) }}/jquery/index.js?v=2.1.3"></script>
{% else %}
  <script src="//cdn.staticfile.org/jquery/2.1.3/jquery.min.js"></script>
  <script>
    if (!window.jQuery) {
      var script = document.createElement('script');
      script.src = "{{ url_for(theme.vendors) }}/jquery/index.js?v=2.1.3";
      document.body.appendChild(script);
    }
  </script>
{% endif %}
```

*   修改`themes/next/layout/_partials/head.swig`，将`font-awesome.min.css`改为从七牛CDN加载

    
```
{% if theme.use_local_file %}
  <link href="{{ url_for(theme.vendors) }}/font-awesome/css/font-awesome.min.css?v=4.4.0" rel="stylesheet" type="text/css" />
{% else %}
  <link href="//cdn.staticfile.org/font-awesome/4.5.0/css/font-awesome.min.css" rel="stylesheet">
{% endif %}
```

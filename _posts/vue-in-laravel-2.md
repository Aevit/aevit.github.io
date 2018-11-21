---
title: 在Laravel中使用Vue.js（下）  
date: 2016-06-30 20:01:17  
tags: [比特海,前端,Laravel,Vue]  
category: 比特海  
layout: post  

---

## 前言

在[上一篇文章](/2016/06/29/vue-in-laravel-1/)中，我们已经介绍了如何在`Laravel`中搭建`Vue.js`所需要的环境，以及简单的编码示例，接下来我们将会稍微深入一点，完成一个多标签切换显示的小功能。

> 本文需要对`Laravel`及`Vue.js`有基本的了解；
> 
> 另外，本文使用到了`sass`、`jade`，如果不了解或不想使用，可以考虑其他预处理器，甚至可以粗暴地使用原生`html`、`css`来写

<!--more-->

## Demo功能说明

在开发前，让我们看下我们将要实现的UI：

![image](http://file.arvit.xyz/030694bde6c596bd6b95ef0a53d55a811467279357.jpeg)

上面有2级`tab`供切换显示，下面的图片内容根据`tab`的切换来显示不同内容。

这里主要涉及到数据的处理及展示，是很适合使用`Vue.js`的。

假如下面的图片不仅仅只有一张图片显示，可能还会加个`hover`等其他东西，这时候可以考虑将之封装成一个`组件（Component）`，这是非常有用的一个做法。  
（这里为了节省时间，我们在这个`Component`里就不加`hover`等其他东西了，只显示一张图片）。

> 组件（Component）是 Vue.js 最强大的功能之一。组件可以扩展 HTML 元素，封装可重用的代码。在较高层面上，组件是自定义元素，Vue.js 的编译器为它添加特殊功能。在有些情况下，组件也可以是原生 HTML 元素的形式，以 is 特性扩展。

建议先阅读一遍[官方的Component文档](https://vuejs.org.cn/guide/components.html)

## 预处理

`Vue.js`支持各种预处理工具，如`sass`、`stylus`、`jade`等。

假设要使用`stylus`、`jade`，只要仿照以下命令安装一下：


```
cnpm install stylus jade --save-dev
```


然后在之后的`vue`文件里，指定类型即可，如：


```
<template lang='jade'>
.hello
  h1 Hello Vue
</template>

<style lang="stylus" scoped>
.hello
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
</style>

<script>

export default {
  el() {
    return '#app'
  }
</script>
```


本文示例代码是采用`jade`＋`sass`的方式来写的，`sass`是用`Laravel`本身封装的`elixir api`来转换的，所以这里只需要安装`jade`：


```
cnpm install jade --save-dev
```


## 编码

接下来让我们进入实际的编码阶段，前期准备还是跟[上一篇文章](/2016/06/29/vue-in-laravel-1/#编码)所说的一样。

1、在`./gulpfile.js`里增加一句代码（这里我们将之命名为`tab.js`）：


```
mix.browserify('entries/tab.js', 'public/js/tab.js');
```


2、添加一些测试数据，并修改`./app/Http/routes.php`，增加一条路由。

首先创建`./config/tab_sample_data.php`文件，添加等下需要的测试数据，具体数据结构及内容有点长，就不直接贴在这了，需要的话请去本文最后面的`附录`查看。

接着让我们配置好路由并传递数据过去：


```
Route::get('tab', function () {
    $tabSampleData = \Config::get('tab_sample_data');
    return view('tab', ['allData' => $tabSampleData]);
});
```


3、创建文件`./resources/views/tab.blade.php`，内容如下：


```
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Vue-Tab-Demo</title>
        <link rel="stylesheet" href="/css/app.css" media="screen" title="no title" charset="utf-8">
    </head>
    <body>
        {{-- Vue入口 --}}
        <div id='app'></div>
        <script type="text/javascript">
          // 转换 php 传来的数据，给 Tab.vue 文件使用
          @if(isset($allData))
              var allData = {!! json_encode($allData) !!};
          @endif
        </script>
        {{-- CDN --}}
        <script src="//cdn.bootcss.com/vue/1.0.26/vue.min.js"></script>
        {{-- 引进编译后的js文件 --}}
        <script src="{{ asset('/js/tab.js')}}" charset="utf-8"></script>
    </body>
</html>
```


4、创建`./resources/assets/js/entries/tab.js`文件，内容如下：


```
import Vue from 'vue';
import Tab from '../views/Tab.vue';

Vue.config.debug = true;

Promise.all([
  new Promise((resolve) => {
    if (window.addEventListener) {
      window.addEventListener('DOMContentLoaded', resolve);
    } else {
      window.attachEvent('onload', resolve);
    }
  }),
]).then((event) => {
  new Vue(Tab);
});
```


5、创建`./resources/assets/js/components/TabItem.vue`文件（文件夹不存的话，请自行创建），这里主要就是用来封装我们上面提到的`组件（component）`，为了节省时间，我们就只显示一张图片，内容如下：


```
<template lang="jade">
.tab-list-item
    img(:src='info.pic_url')
</template>

<script>
export default {
  props: ['info'],
  data() {
    return {
    }
  },
  computed:{

  },
  ready() {
  },
  methods: {

  },
  events: {
  },
  components: {
  }
}
</script>
```


6、创建`./resources/assets/js/views/Tab.vue`文件，内容如下：


```
<template lang="jade">
.tab-container
  .tab-nav
    ul.tab-main-nav
      li.tab-main-nav-item(@click='setCategoryNav(0)', :class='{active: categoryNav === 0}') 产品设计
      li.tab-main-nav-item(@click='setCategoryNav(1)',:class='{active: categoryNav === 1}') 交互设计
      li.tab-main-nav-item(@click='setCategoryNav(2)',:class='{active: categoryNav === 2}') 视觉设计
    ul.tab-sub-nav
      li.tab-sub-nav-item(v-for='item in subNavList', :class='{active: subNav === item}' @click='setSubNav(item)') {{item}}
  .tab-list
    tab-item(v-for='item in subList', :info='item')
</template>

<script>
import TabItem from '../components/TabItem.vue'

export default {
  el() {
    return '#app'
  },
  data() {
    return {
      categoryNav: 0,
      totalData: allData,
      subNav: '全部'
    }
  },
  computed:{
    subNavList() {
      let self = this;
      let subList = self.totalData[self.categoryNav];

      let navList = ['全部'];
      for (var i = 0; i < subList.length; i++) {
        navList.push(subList[i].name);
      }
      return navList;
    },
    subList() {
      let self = this;
      let subList = self.totalData[self.categoryNav];

      let list = [];
      for (var i = 0; i < subList.length; i++) {
        let wList = subList[i].list;
        for (var j = 0; j < wList.length; j++) {
          if (self.subNav == '全部') {
            list.push(wList[j]);
          } else if (self.subNav == subList[i].name) {
            list.push(wList[j]);
          }
        }
      }
      return list;
    }
  },
  ready() {
  },
  methods: {
    setCategoryNav(nav) {
      this.categoryNav = nav;
      this.subNav = '全部';
    },
    setSubNav(nav) {
      this.subNav = nav;
    }
  },
  events: {
  },
  components: {
    TabItem
  }
}
</script>
```


7、接下来进入`sass`部分，先在`./resources/assets/sass/app.scss`里增加一句代码：


```
@import 'tab';
```


然后创建`./resources/assets/sass/_tab.scss`文件，内容如下：


```
.tab {
  $mainColor: #c45441;
  $activeColor: #515151;

  &-container {
    height: 100%;
    width: 60%;
    margin: 0 auto;
  }

  &-nav {
    color: #b0b0b0;
    margin: 80px auto 0px;
    max-width: 400px;
  }
  &-main-nav {
    margin: 0;
    padding: 0;
    height: 30px;
    border-bottom: 1px solid $mainColor;
    display: flex;
    justify-content: space-between;
    &-item {
      display: inline;
      cursor: pointer;
      height: 31px;
      &.active {
        color: $activeColor;
        border-bottom: 1px solid $mainColor;
      }
    }
  }
  &-sub-nav {
    padding: 0;
    font-size: 13px;
    &-item {
      display: inline;
      padding: 5px;
      cursor: pointer;
      &.active {
        color: $activeColor;
        border-bottom: 1px solid $mainColor;
      }
    }
  }

  &-list {
    margin: 60px 0 0 0;
    padding: 0;
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    &-item {
      margin-left: 10px;
    }
  }
}
```


8、运行`gulp watch`命令，去浏览器访问`http://localhost:3000/tab`查看效果 （具体域名请根据自身修改，这里是我本地的）

> 注意：请在`Chrome`等现代化浏览器下访问

## 总结

以上就是多标签切换显示的小功能Demo，从中我们可以`稍微`了解到`Vue.js`的`组件（components）`功能。我现在学到的只是皮毛，以后有机会再来深入地学习及应用。

> Vue.js 是一个构建数据驱动的 web 界面的库。Vue.js 的目标是通过尽可能简单的 API 实现响应的数据绑定和组合的视图组件。  
> Vue.js 自身不是一个全能框架——它只聚焦于视图层。因此它非常容易学习，非常容易与其它库或已有项目整合。另一方面，在与相关工具和支持库一起使用时，Vue.js 也能完美地驱动复杂的单页应用。
> 
> —— 官方描述

最后附上这两篇`在Laravel中使用Vue.js`文章里的示例工程代码：[github地址](https://github.com/Aevit/vue.demo.aevit.xyz)

以上代码是在[我最敬爱和佩服的大楷哥](http://w3ctrain.com/)的悉心指点下完成，在此衷心献上我一双`二十几年份`的膝盖，希望他以后在我宿舍睡觉时，能不要再放了几个屁还死不承认。

* * *

2016-06-30 20:01  
Aevit  
华师一课南座

* * *

[![](http://file.arvit.xyz/241a8b0158abd0254451b2d938fe77f91467280783.jpeg)](http://file.arvit.xyz/241a8b0158abd0254451b2d938fe77f91467280783.jpeg "布达拉宫")  
摄影：Aevit 2015年10月 布达拉宫

## 附录

### 测试数据

`./config/tab_sample_data.php`文件内容：


```
<?php
return array(
  // 产品
  array(
    array(
      'name' => '厨房',
      'list' => array(
        array(
          'pic_url' => 'http://file.arvit.xyz/454c855115f16ad5e75869fc7e2bdb1f1460975212.png',
        ),
        array(
          'pic_url' => 'http://file.arvit.xyz/454c855115f16ad5e75869fc7e2bdb1f1460975212.png',
        ),
        array(
          'pic_url' => 'http://file.arvit.xyz/a797f2435852b8471bf5a79342e4aee61460975212.png',
        ),
      )
    ),
    array(
      'name' => '卫浴',
      'list' => array(
        array(
          'pic_url' => 'http://file.arvit.xyz/454c855115f16ad5e75869fc7e2bdb1f1460975212.png',
        ),
        array(
          'pic_url' => 'http://file.arvit.xyz/5850d66f802feda8cb9b0963bfdd66f11460975212.png',
        ),
      )
    )
  ),

  // 交互
  array(
    array(
      'name' => '数码',
      'list' => array(
        array(
          'pic_url' => 'http://file.arvit.xyz/454c855115f16ad5e75869fc7e2bdb1f1460975212.png',
        ),
      )
    ),
    array(
      'name' => '厨房',
      'list' => array(
        array(
          'pic_url' => 'http://file.arvit.xyz/454c855115f16ad5e75869fc7e2bdb1f1460975212.png',
        ),
      )
    )
  ),

  // 视觉
  array(
    array(
      'name' => '卫浴',
      'list' => array(
        array(
          'pic_url' => 'http://file.arvit.xyz/454c855115f16ad5e75869fc7e2bdb1f1460975212.png',
        ),
      )
    ),
  ),
);
```

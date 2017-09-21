---
title: 在Laravel中使用Vue.js（上）  
date: 2016-06-29 20:56:01  
tags: [比特海,前端,Laravel,Vue]  
category: 比特海  
layout: post  

---

## 前言

`Laravel`是一套简洁、优雅的PHP Web开发框架(PHP Web Framework)。官方宣传语：`The PHP Framework For Web Artisans` - `为web艺术家创建的框架`

`Vue.js`是数据驱动的组件，为现代化的 Web 界面而生

本文主要说明如何在`Laravel`中使用`Vue.js`，包括`Vue`的环境布署、`Vue`的开发过程、`Vue`的使用demo

> 本文需要对`Laravel`及`Vue.js`有基本的了解  
> 本文用到的知识点：`nvm`、`npm`、`Browserify`、`gulp`、`es6的Promise`、`CDN`等

<!--more-->

## 环境布署

`Laravel`的布署这里不再详细说明，可以去这里下载[离线包](http://laravelacademy.org/resources-download)，或自行查找安装相关资料。

### npm

首先，需安装好`npm`环境。而`npm`有多个版本，有些库只支持旧版本的，为了在机器上能方便地切换不同版本的`npm`，建议使用`nvm`（全称：`Node Version Manager`）来管理。  
`nvm`的安装方法，请参考[官方文档](https://github.com/creationix/nvm) 。

以下是常用命令：


```
# 查看当前支持什么版本  
nvm ls-remote

# 查看本机已安装版本  
nvm ls

# 安装稳定版本  
nvm install stable

# 安装某个大版本  
nvm install 4

# 安装某个具体版本
nvm install 5.0  

# 删除某个版本
nvm uninstall 5.0

# 设置默认版本
nvm alias default 5.0  

# 在当前终端使用某个版本
nvm use 4
```


另外，有时`npm`在国内比较慢，建议使用[淘宝的cnpm源](https://npm.taobao.org/)替代。  
（注意，如果本机安装了多个版本的`npm`，如`5.0`、`4.0`两个，则需要在各自的版本中分别安装`cnpm`才行）

> 注意：本文统一使用`cnpm`代替`npm`，如果你没安装`cnpm`，请将接下来的命令换为`npm`

> 如果执行 `node -v` 有问题，通过 `nvm ls` 发现指向了 system，需要重装一下  
> brew uninstall node --ignore-dependencies
> 再通过 nvm use 已装版本或是重装一个，之后重启终端即可  

### Laravel相关依赖

首先我们需要安装`Laravel`相关前端开发环境，默认`package.json`文件如下：


```
{
  "private": true,
  "devDependencies": {
    "gulp": "^3.8.8"
  },
  "dependencies": {
    "laravel-elixir": "^4.0.0",
    "bootstrap-sass": "^3.0.0"
  }
}
```


其中`laravel-elixir`可以让我们方便地使用`gulp`等功能。这个东西会安装很多其他依赖，不过我们需要做的只是一条命令。

让我们在项目根目录下，执行以下命令即可：


```
cnpm install
```


### Vue相关依赖

`Vue`官方推荐`webpack + vue-loarder`或者`Browserify + vueify`来使用，具体区别这里不再说明，请自行查找区别。  
由于`Laravel`自带`Browserify`，所以这里我们使用：`Browserify + vueify`

让我们安装`Vue`相关依赖：


```
cnpm i vue vueify babel-plugin-transform-runtime vue-hot-reload-api --save-dev
```


`package.json`将会变成以下这样：


```
{
  "private": true,
  "devDependencies": {
    "babel-plugin-transform-runtime": "^6.9.0",
    "gulp": "^3.8.8",
    "vue": "^1.0.26",
    "vueify": "^8.6.0"
  },
  "dependencies": {
    "laravel-elixir": "^4.0.0",
    "bootstrap-sass": "^3.0.0"
  }
}
```


为了让`laravel-elixir`自带的`browserify`能够解析`Vue`，在`package.json`中增加`browserify`配置：


```
{
  "private": true,
  "devDependencies": {
    "babel-plugin-transform-runtime": "^6.9.0",
    "gulp": "^3.8.8",
    "vue": "^1.0.26",
    "vueify": "^8.6.0"
  },
  "browserify": {
    "transform": [
      "vueify"
    ]
  },
  "dependencies": {
    "laravel-elixir": "^4.0.0",
    "bootstrap-sass": "^3.0.0"
  }
}
```


## 编码

环境弄好后，接下来可以进入代码开发了。

在`./resources/assets/js`下面增加2个文件夹：


```
1. entries：存放`外部js入口文件`  
2. views：存放`Vue文件`
```


其中`entries`目录下的`js`文件内容，只是创建`Vue实例`，具体内容见下面示例代码。

首先，让我们修改`./gulpfile.js`文件，增加`Browserify`相关配置，以将`./resources/assets/js/hello.js`转为普通的`js`文件供浏览器调用：


```
elixir(function(mix) {
    mix.sass('app.scss');

    // 将 Vue.js 转为普通 js 文件
    mix.browserify('entries/hello.js', 'public/js/hello.js');

    // 实时监听文件，不需要可以不用
    mix.browserSync({
        proxy: 'local.aevit.xyz', // 你的本地域名，根据需要自行修改
        port: 3000,
        notify: false,
        watchTask: true,
        open: 'external',
        host: 'local.aevit.xyz', // 你的本地域名，根据需要自行修改
    });
});
```


然后使用终端在项目根目录下，运行`gulp`监听文件修改：


```
gulp watch
```


接下来，让我们在`Laravel`弄一个页面来进行实际测试：

1、修改`./app/Http/routes.php`，修改根路由的view：


```
Route::get('/', function () {
    return view('index');
});
```


2、修改`./resources/views/index.blade.php`模版文件：

内容如下：


```
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title></title>
    </head>
    <body>
        {{-- Vue入口 --}}
        <div id='entry'></div>
    </body>
    {{-- 引进编译后的js文件 --}}
    <script src="{{ asset('/js/hello.js')}}" charset="utf-8"></script>
</html>
```


3、接着，编辑`./resources/assets/js/entries/hello.js`文件，内容如下：

简单地，写入以下内容即可：


```
import Vue from 'vue';
import Hello from '../views/Hello.vue';
	
Vue.config.debug = true;
new Vue(Hello);
```


但是`Vue.js`是以某个`Dom`为根，所以最好是等所有`Dom`都加载完毕再来初始化，这里我们可以使用`ES6`的`Promise`来异步判断：


```
import Vue from 'vue';
import Hello from '../views/Hello.vue';
	
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
  new Vue(Hello);
});
```


4、最后，让我们编辑`./resources/assets/js/views/Hello.vue`文件，内容如下：


```
<template>
  <p>{{ message }}</p>
  <input v-model="message">
</template>
	
<style>
</style>
	
<script>
	
export default {
    el() {
        return '#app'
    },
    data() {
        return {
            message: 'Hello Vue.js!'
        }
    }
}
</script>
```


接下来就可以去浏览器，看下具体效果。

## CDN

查看`gulpfile.js`里的转换语句：


```
mix.browserify('entries/hello.js', 'public/js/hello.js');
```


我们将之存放在`public/js/hello.js`这个地方，查看该文件（未压缩），会发现该文件有`200多k`，这显然是非常严重的一个问题。

我们可以使用`CDN`来解决这个问题，方法如下：

首先，安装`browserify-shim`这个依赖：


```
cnpm install browserify-shim --save-dev
```


接着修改`package.json`文件，在`browserify`里增加`browserify-shim`相关配置：


```
"browserify": {
  "transform": [
    "vueify",
    "browserify-shim"
  ]
},
"browserify-shim": {
    "vue": "global:Vue"
}
```


最后，修改`./resources/views/index.blade.php`模版文件，引进`hello.js`前，将`vue.js`的`CDN`引进即可：


```
...

{{-- CDN --}}
<script src="//cdn.bootcss.com/vue/1.0.26/vue.min.js"></script>
{{-- 引进编译后的js文件 --}}
<script src="{{ asset('/js/hello.js')}}" charset="utf-8"></script>

...
```


最最后，让我们重新`gulp watch`一下，会看到`./public/js/hello.js`文件变为`几k`了。

> 注意：请在`Chrome`等现代化浏览器下访问

## 总结

以上是在`Laravel`中使用`Vue.js`的简单说明，包括了环境的搭建，具体编码的说明，一个简单的demo，相信是比较容易理解的。在下一篇文章，将会演示如何使用`Vue.js`进行稍微深入一点的用法：一个多标签切换显示的小功能。

以上文章参考自[我最敬爱和佩服的大楷哥的文章](http://w3ctrain.com/2016/06/08/vue-in-laravel/)

* * *

2016-06-29 20:56  
Aevit  
华师西门85℃

* * *

[![](http://aevit.qiniudn.com/639c5ff0802948b2ef468bc6c3b503ef1467203194.jpeg)](http://aevit.qiniudn.com/639c5ff0802948b2ef468bc6c3b503ef1467203194.jpeg "羊卓雍错")  
摄影：Aevit 2015年10月 西藏羊湖
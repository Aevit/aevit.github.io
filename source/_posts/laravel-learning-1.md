---
title: Laravel学习笔记（一）  
date: 2016-02-25 23:28:55  
tags: [比特海,PHP,Laravel]  
category: 比特海  
layout: post  

---

公司业务需要，现在需要弄一些前端的东西，最终选用的是[Laravel](https://laravel.com/)做为PHP框架。  
在此记录下一些学习笔记。

## 安装

Laravel版本: 5.2.21

### 环境要求

*   PHP >= 5.5.9
*   OpenSSL PHP扩展
*   PDO PHP扩展
*   Mbstring PHP扩展
*   Tokenizer PHP扩展

<!--more-->

### 安装方法1

此命令会通过`composer`下载需要的依赖，如果网络不好，可以使用方法2的离线包  
`laravel new [your-project-name]`

具体安装方法详见[官方文档](https://laravel.com/docs/5.2)

### 安装方法2

国内离线包: [http://www.golaravel.com/download/](http://www.golaravel.com/download/)

### 基本配置

*   `./storage`目录要有写权限
*   `./config/app.php`修改时区为`Asia/Shanghai`
*   因为使用了`codekit`来自动编辑`sass`文件，所以还要一下修改`.gitignore`文件
*   `nginx`加上优雅链接:

    
```
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

*   记得配置生产环境的`.env`文件

*   生成生产环境的`cache`: `php artisan config:cache`
*   路由缓存说明可参考这篇[文章](http://ofcss.com/2015/02/12/laravel-6-route-caching.html)
*   相关优化，可参考这篇[文章](http://www.jianshu.com/p/1d5fa4696ca9)

* * *

## 静态文件版本控制

假设`nginx`（或其他反向代理软件）开启了静态文件缓存，当我们修改了如`main.css`的文件时，用户那边就不能及时更新了。所以一般都会对这些静态文件做版本控制。

有两种方式，一种是在`main.css`后面加上时间戳（或其他唯一标识）的参数，如`main.css?v=1463046958`，这种可以使用下面提到的`auto_version`公用函数即可。不过这种方法有时会因为运营商方面强制忽略后面参数部分，就导致不能及时更新了。

另一种是直接修改`main.css`的名字，如`main-b8dd972f43.css`，这种就比较保险。  
`laravel`自带的`elixir`里面就有`version`方法可以进行版本控制，使用步骤如下：

> 注意如果使用`gulp watch`，首次使用`version`方法，一定要严格按照以下顺序来，不然会报类似这样的错误


```
file_get_contents(xxx/public/build/rev-manifest.json): failed to open stream: No such file or directory
```


1.  在`gulpfile.js`里写好`version`相关代码

    
```
elixir(function(mix) {
    // 具体路径及名字自行更改  
    mix.version(['css/main.css', 'js/main.js']); 
}
```

2.  执行命令

    
```
gulp watch
```

3.  随便修改一个`sass`文件，保存，接下来会自动在`public`下生成以下`build`目录，里面就包含了带名字的文件及`rev-manifest.json`文件：

    
```
public/build/xxx
```

4.  去使用到的`blade`模版文件里添加以下类似代码即可：

    
```
<link rel="stylesheet" href="{{ elixir('css/main.css') }}">
```


* * *

## 隐式控制器

[控制器相关文档](http://laravelacademy.org/post/60.html)

使用`隐式控制器`可以不用再给控制器的每一个方法定义一个路由，只需给控制器定义一个路由即可。


```
# 创建控制器，如`HomeController`  
php artisan make:controller HomeController  

# 编辑路由文件  
vim ./app/Http/routes.php  

# 添加路由  
Route::controller('/', 'HomeController');  

# 编辑`Controller`文件  
vim ./app/Http/Controllers/HomeController  

# 增加方法（如果要使用`post`方式，则将方法名里的`get`改为`post`）
public function getFoo() {
    // 最终链接示例: http://your-domain.com/foo
    // 注: 如果方法名里有多个驼峰，如`getFooBar`，则为: http://your-domain.com/foo-bar
    return view('foo');
}
# 增加blade模版视图
vim ./resources/views/foo.blade.php  

# 去浏览器访问看看 http://your-domain.com/foo
```


* * *

## 公用函数

有些辅助函数需要弄为全局的，这样方便进行调用，如对项目的`main.css`地址后面加上`?v=[最后修改的时间戳]`，防止css文件因为缓存等原因不能及时更新。

公用函数主要有两种方法  
[参考资料](http://stackoverflow.com/questions/28290332/best-practices-for-custom-helpers-on-laravel-5/28360186#28360186)

### 通过`ServiceProvider`


```
# 在 ./app 目录下新建文件夹，如`Helpers`
mkdir ./app/Helpers  

# 新建一个ServiceProvider，如`HelperServiceProvider`  
php artisan make:provider HelperServiceProvider  

# 编辑刚创建的`provider`  
vim ./app/Providers/HelperServiceProvider  

# 在provider的注册(register)方法里引进`Helpers`文件夹里的所有php文件  
public function register()
{
    foreach (glob(app_path().'/Helpers/*.php') as $filename) {
        require_once($filename);
    }
}

# 去`./config/app.php`里注册`HelperServiceProvider`  
vim ./config/app.php  

# 在`providers`这数组里添加:  
'providers' => [
	App\Providers\HelperServiceProvider::class,
]



－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－

# 使用示例
vim ./app/Helpers/functions.php  

# 添加如下公共函数:

if (!function_exists('auto_version')) {
     function auto_version($url) {
        return $url . '?v=' . filemtime('.' . $url);
     }
}

# 在`blade`里使用示例:   
<link rel="stylesheet" href="{{ auto_version('/css/main.css') }}">
# 实际效果示例:  
<link rel="stylesheet" href="/css/main.css?v=1456370892">

# 在其他文件（如`Controller`等）里也可直接使用`auto_version`这样的函数
```


> 关于如何使用`ServiceProvider`来写自己的一个组件的，可参考这篇[教程](http://rrylee.github.io/2015/08/26/laravel-create-facade/)

### 使用`autoload`方法

这种方法需要使用`composer`配合，个人感觉不是属于`laravel`本身的核心框架，所以本人不太喜欢这样用。  
而且当我去一台没有安装`composer`的电脑将代码`clone`下来后，也就无法使用此种方法了。


```
# 在自己喜欢的地方新建文件，如`./app/helpers.php`  

# 在`./composer.json`里的`autoload`里添加`files`
"autoload": {
    "classmap": [
        "database"
    ],
    "psr-4": {
        "App\\": "app/"
    },
    "files": [
        "app/helpers.php" // <---- ADD THIS
    ]
},

# 最后跑一下这条`composer`命令即可  
composer dump-autoload
```


* * *

## composer

### Guzzle

添加`Guzzle`进行外部api的网络请求

[官网地址](http://guzzlephp.org/) [github地址](https://github.com/guzzle/guzzle)


```
# 编辑composer.json文件  
vim ./composer.json  

# 在json文件里添加guzzle  
"require": {
    "guzzlehttp/guzzle": "~5.3|~6.0"
}

# 保存json文件，更新composer即可    
composer update

# 使用方法详见上面的官网地址、github地址
```


> PS: Laravel内置方法也可进行外部api的请求，[参考资料](https://blog.antoine-augusti.fr/2014/04/laravel-calling-your-api/)

* * *

## CDN

将用到CDN的统一放到一个位置，方便以后统一处理


```
mkdir ./public/common/js
mkdir ./public/common/css
```
 
```
vim ./resources/views/home/common/cdn.blade.php

# 以下是`cdn.blade.php`的内容  

@if ($type == 'jQuery')
    <!-- jQuery文件。务必在bootstrap.min.js 之前引入 -->
    <script src="//cdn.bootcss.com/jquery/2.2.1/jquery.min.js"></script>
    <script>window.jQuery || document.write('<script src="/common/js/jquery-2.2.1.min.js"><\/script>')</script>

@elseif ($type == 'bootstrap')
    <link rel="stylesheet" href="//cdn.bootcss.com/bootstrap/3.3.6/css/bootstrap.min.css">

    <!-- BOOTSTRAP JS WITH LOCAL FALLBACK-->
    <script type="text/javascript" src="//cdn.bootcss.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
    <script> if(typeof($.fn.modal) === 'undefined') {document.write('<script src="/common/js/bootstrap-3.3.6.min.js"><\/script>')}</script>

    <!-- BOOTSTRAP CDN FALLBACK CSS-->
    <script>$(document).ready(function() {
        var bodyColor = $('body').css("color"); if(bodyColor != 'rgb(51, 51, 51)') {$("head").prepend("<link rel='stylesheet'   href='/common/css/bootstrap-3.3.6.min.css' type='text/css' media='screen'>");}});
    </script>
@endif
```
 
```
# 使用示例:  
vim app.blade.php  

# 内容  
@include('home.common.cdn', ['type' => 'jQuery'])
@include('home.common.cdn', ['type' => 'bootstrap'])
```


* * *

2016.02.25 23:28  
Aevit  
华师

[![](http://aevit.qiniudn.com/moon-from-650d.jpg)](http://aevit.qiniudn.com/moon-from-650d.jpg "楼顶月")
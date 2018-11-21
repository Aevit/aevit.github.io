---
title: Laravel学习笔记（二）- 登录授权流程分析  
date: 2016-05-11 21:48:21  
tags: [比特海,PHP,Laravel,登录授权]  
category: 比特海  
layout: post  

---

`Laravel` 内置了登录授权相关的一些东西，可以开箱即用。  
接下来将会对登录授权的使用方法及流程分析进行一下介绍。  
通过这篇文章，可以了解以下东西：

1.  学会使用`laravel`的自带登录授权功能；
2.  了解自带的登录授权的相关流程；
3.  修改自带的`auth`相关路由前缀；
4.  更改`auth`的`blade`模版文件路径

<!--more-->

> 注意：使用的框架版本是 `5.2`，跟旧版本会有一点出入，后面会提到

# 使用

## artisan命令

首先在项目根目录执行一条`artisan`命令，即可自动安装一个简易的完整的用户认证系统。

> 注意该命令会产生一些文件，如 `HomeController.php` ，如果你的项目已存在 相同路径相同命名 的文件，请先备份一下  
> 具体会产生什么文件，请看下面说明


```
php artisan make:auth
```


让我们看下执行这条命令后会有什么变动：

1、会修改 ./app/Http/routes.php 路由文件，增加以下代码


```
Route::group(['middleware' => 'web'], function () {
    Route::auth();

    Route::get('/home', 'HomeController@index');
});
```


2、会增加文件


```
// 1、在 ./resources/views/ 目录生成以下`blade`模版文件    
home.blade.php
welcome.blade.php  

layouts/app.blade.php

auth/login.blade.php  
auth/register.blade.php
auth/emails/password.blade.php
auth/passwords/email.blade.php
auth/passwords/reset.blade.php

// 2、在 ./app/Http/Controllers 目录下生成以下文件  
HomeController.php
```


现在只要访问`www.your-domain.com/home`，就会自动判断如果没有登录，就自动跳转至登录页面`www.your-domain.com/login`页面了。  
接下来只要再配置好数据库相关部分，就基本完成了登录注册模块的功能了。

## 数据库相关

`Laravel`数据库简单介绍可以查看这篇文章：[数据库配置与使用migations生成表](http://www.jianshu.com/p/45f6dbf4e536)

数据库的配置文件位于`config/database.php`里。  
如果使用`mysql`，为了以后能使用`emoji`表情，建议修改`charset`为`utf8mb4`，相应的`collation`也要修改为`utf8mb4_unicode_ci`

修改`.env`文件，添加自己的数据库连接配置（之后请确保数据库能连接上）：


```
DB_HOST=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
```


数据库建表文件，存放在`database/migrations/`目录下；框架已自带了登录授权相关的2个表文件：


```
database/migrations/2014_10_12_000000_create_users_table.php
database/migrations/2014_10_12_100000_create_password_resets_table.php
```


如果没有特别需求（如自带的表文件是使用`email`登录，如果需要使用`username`的方式，请自行修改，这里不再详述），我们直接拿来用即可。

首先我们先自己去新建一个数据库（建议`charset`为`utf8mb4`，`collation`为`utf8mb4_unicode_ci`），注意名字要跟上面的`DB_DATABASE`一样；

然后在项目根目录执行以下命令即可：


```
php artisan migrate
```


建议先完整看一下官方文档，了解数据库相关操作：  
[数据库](http://laravelacademy.org/post/2942.html)  
[Eloquent ORM](http://laravelacademy.org/post/2995.html)

# 解析

## auth流程分析

我们先来看看`auth`登录授权的相关流程：

当我们访问`www.your-domain.com/home`时，会有这样的流程：

1、框架在`routes.php`里匹配到`Route::get('/home', 'HomeController@index');`这条路由。  
接下来进入`app/Http/Controllers/HomeController.php`这个文件。

2、`HomeController.php`的构造函数里，有中间件`auth`


```
public function __construct()
{
    $this->middleware('auth');
}
```


那么`auth`中间件将会去访问`app/Http/Middleware/Authenticate.php` 里的 `handle` 函数

3、`app/Http/Middleware/Authenticate.php`里`handle`函数有这样一句代码：


```
redirect()->guest('login');
```


则接下来会重定向至此url: `www.your-domain.com/login`

4、重定向会重新去匹配路由。让我们执行一下命令，查看一下现在有什么路由：


```
php artisan route:list
```


![image](http://file.arvit.xyz/482167b8e90566dc8d63275c2106ad581462951315.jpeg)

我们发现里面有`login`这条路由了。

在`routes.php`里`Route::auth()`有这一句代码。查看源码：


```
/vendor/laravel/framework/src/Illuminate/Routing/Router.php
```


发现有`auth()`这一个函数，里面包含了`login`等路由：


```
public function auth()
{
    // Authentication Routes...
    $this->get('login', 'Auth\AuthController@showLoginForm');
    $this->post('login', 'Auth\AuthController@login');
    $this->get('logout', 'Auth\AuthController@logout');

    // Registration Routes...
    $this->get('register', 'Auth\AuthController@showRegistrationForm');
    $this->post('register', 'Auth\AuthController@register');

    // Password Reset Routes...
    $this->get('password/reset/{token?}', 'Auth\PasswordController@showResetForm');
    $this->post('password/email', 'Auth\PasswordController@sendResetLinkEmail');
    $this->post('password/reset', 'Auth\PasswordController@reset');
}
```


所以，访问`www.your-domain.com/login`就会匹配到`login`路由。  
接下来根据这条路由，我们进入`Auth\AuthController`去看一下，该文件路径：  
（顺便记住`showLoginForm`这个函数名字，下面会用到）


```
app/Http/Controllers/Auth/AuthController.php
```


5、`Auth\AuthController.php`里我们发现没有`showLoginForm`这个函数，但是有这一句代码：


```
use AuthenticatesAndRegistersUsers, ThrottlesLogins;
```


让我们查看`AuthenticatesAndRegistersUsers`这个文件，查看源码，发现这个文件在这个路径：


```
vendor/laravel/framework/src/Illuminate/Foundation/Auth/AuthenticatesAndRegistersUsers.php
```


里面又有这样一句代码：


```
use AuthenticatesUsers, RegistersUsers
```


让我们再次查看`AuthenticatesUsers`这个文件，这个文件在这个路径：


```
vendor/laravel/framework/src/Illuminate/Foundation/Auth/AuthenticatesUsers.php
```


6、`AuthenticatesUsers.php`这里面我们发现有`showLoginForm`这个函数了，源码如下：


```
public function showLoginForm()
{
    $view = property_exists($this, 'loginView')
                ? $this->loginView : 'auth.authenticate';

    if (view()->exists($view)) {
        return view($view);
    }

    return view('auth.login');
}
```


这里会判断如果没有`loginView`这个属性，就自动跳转至`auth.login`这个模版文件，所以这个`loginView`是可以让我们来自定义登录页面路径的一个属性。

7、接下来就会访问`auth.login`这个模版文件，就会去找到该文件渲染页面了：


```
resources/views/auth/login.blade.php
```


以上就是整个登录授权的基本流程了。

## 新文件说明

接下来对刚才执行`artisan`命令后的变动的文件进行简单的说明

### 路由

新增加的一个路由配置：


```
Route::group(['middleware' => 'web'], function () {
    Route::auth();

    Route::get('/home', 'HomeController@index');
});
```


`Laravel`自带了两个中间件`web`和`api`，其中`web`使用`session`，`api`使用`token`


```
protected $middlewareGroups = [
  'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class,
    ],

    'api' => [
        'throttle:60,1',
        'auth:api',
    ],
];
```


这里统一使用了`web`中间件。

### HomeController

我们查看`app/Http/Controllers/HomeController.php`文件，会发现在构造函数里有一个中间件：


```
public function __construct()
{
    $this->middleware('auth');
}
```


这个`auth`中间件就是判断访问该`controller`的页面是否需要登录验证的一个东西。  
如访问`www.your-domain.com/home`就会自动判断如果没有登录，就自动跳转至登录页面`www.your-domain.com/login`

### blade模版文件

注意`resources/views/auth/login.blade.php`代码里有用到`$error`这个`stdClass`，这个`$error`是在`web`中间件里定义的，所以如果`auth路由组`没有使用`web`中间件，就会报错了。所以要把`Route::auth();`这句写在路由组里。

当然，如果你完全使用的是**自定义**的登录注册相关`blade`文件，就可以忽略了，根据自己需求去写就行了。

# 自定义

## 修改auth前缀

更改`auth`相关路由的前缀，如`www.your-domain.com/admin/login`；

通过上面`auth流程分析`的说明，我们可以只需做以下操作即可增加前缀：

1、修改`routes.php`，加上`prefix`参数：


```
Route::group(['prefix' => 'admin', 'middleware' => 'web'], function () {
    Route::auth();

    Route::get('/home', 'HomeController@index');
});
```


2、修改`app/Http/Middleware/Authenticate.php`，将`redirect()->guest('login');`改为以下代码：


```
redirect()->guest('admin/login');
```


## 转移blade文件路径

有时需要将`auth`相关的`blade`模版文件转移路径。  
比如说原本是在：


```
resources/views/auth/login.blade.php
```


现在要转移至


```
resources/views/admin/auth/login.blade.php
```


通过上面的流程分析，我们只需要在`app/Http/Controllers/Auth/AuthController.php`文件，增加属性`$loginView`来设置`blade`模版文件路径即可。


```
// 设置登录页面的模版文件：  
protected $loginView = 'admin.auth.login';
```


网上说是修改`$loginPath`，经过排查，发现`5.2版本`后，跟以前的不一样了，以前的才是`$loginPath`，现在要`$loginView`。

可查看以下`5.1`及`5.2`的`authentication`官方文档，在`5.1`的文档里搜索`loginPath`会有结果，而`5.2`已经没了：

[5.1文档 - authentication](https://laravel.com/docs/5.1/authentication)  
[5.2文档 - authentication](https://laravel.com/docs/5.2/authentication)

如果还需要修改登录页面的其他属性，可去查看源码：


```
vendor/laravel/framework/src/Illuminate/Foundation/Auth/AuthenticatesUsers.php
```


如果需要查看**注册页面**的相关属性，可查看源码：


```
vendor/laravel/framework/src/Illuminate/Foundation/Auth/RegistersUsers.php
```


可以发现还可以自定义这些路径，只要在`AuthController.php`里添加以下属性即可：


```
// 设置退出登录后的路径：  
protected $redirectAfterLogout = 'admin/login';

// 设置注册页面的模版文件：
protected $registerView = 'admin.auth.register';
```


* * *

2016.05.11 21:47  
Aevit  
华师

[![](http://file.arvit.xyz/moon-from-650d.jpg)](http://file.arvit.xyz/moon-from-650d.jpg "楼顶月")  
摄影：Aevit 2015年 32楼顶
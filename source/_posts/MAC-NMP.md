---
title: Mac下NMP环境的搭建(MNMP)  
date: 2015-12-16 00:32:53  
tags: [比特海,后台,PHP,服务器]  
category: 比特海  
layout: post  

---


```
> 本文内容：  
  MAC OS X EI Capitan (10.11.2)：重装`Nginx Mysql PHP`环境   
> 可在PC端的文章详情页，点击右下角的`汉堡按钮`展开菜单栏快速查看
```


> PS: 如果要跟其他开发人员保持开发环境的统一，可以考虑`VirtualBox + Vagrant`的方式，这里不再详述，可参考以下教程：  
> [使用 Vagrant 打造跨平台开发环境](http://segmentfault.com/a/1190000000264347)  
> [Vgrant安装配置](https://github.com/astaxie/Go-in-Action/blob/master/ebook/zh/01.2.md)

今天打算把本机环境升级到`php 7.0`，中间遇到了各种莫名其妙的问题，后来索性将`LNMP`环境重装一遍。

还好之前是用[Homebrew](http://brew.sh/)安装的，只要卸载掉`Homebrew`就能把`LNMP`环境也一起卸载掉

<!--more-->

> (L)系统: MAC OS X EI Capitan （10.11.2）  
> (N)nginx: 1.8  
> (M)mysql: 5.7.10  
> (P)php: 7.0.1

## Homebrew


```
# 卸载Homebrew  
# ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/uninstall)"

# 安装Homebrew
# PS: homebrew-cask从2015年12月开始会跟Homebrew同步更新，后面不用再装了；  
# 如果没有，可以使用brew uninstall --force brew-cask; brew update 更新一下
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# 更新
brew update
# 自检  
brew doctor
# 查看系统通过 brew 安装的服务
brew services list
# 清除已卸载无用的启动配置文件
brew services cleanup


# 注意［重要］：下面环境的搭建需要`Command Line Tools`  
# 如果没有安装`Command Line Tools`，自检时会提示  
# 或者手动用此命令安装`xcode-select --install`
```
 
```
# 注意：由于 OS X 10.11 使用了`rootless`的东西（具体这里不再详述）；
# 而 Homebrew 安装的东西都是在`/usr/local`里的，所以要改一下权限先；
# 以前的系统就不用更改
sudo chown -R $(whoami) /usr/local
```


* * *

> 执行以下安装前，最好先`brew update`更新一下

## Nginx


```
# 安装
brew install nginx --with-http_stub_status_module --with-http_ssl_module --with-http_gzip_static_module --with-ipv6 --with-http_geoip_module


# Nginx开机启动
ln -sfv /usr/local/opt/nginx/*.plist ~/Library/LaunchAgents
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.nginx.plist

# 注意：还需要执行以下命令，才可在开机时启动
# 更新：不一定需要，因为我是从以前的旧系统升级到`OS X 10.11`的，就有这问题  
# 现在测试过直接格盘重装`10.11`，不能执行以下命令也可以
# 看需要，如果有权限问题，再执行下面三条命令  
# sudo chown root:wheel /usr/local/Cellar/nginx/1.8.0/bin/nginx
# sudo chmod u+s  /usr/local/Cellar/nginx/1.8.0/bin/nginx
# sudo chown -R $(whoami) /usr/local/var/log/nginx/

# 使用Mac的launchctl来启动|停止
launchctl unload ~/Library/LaunchAgents/homebrew.mxcl.nginx.plist
launchctl load -w ~/Library/LaunchAgents/homebrew.mxcl.nginx.plist


# 测试配置是否有语法错误
sudo nginx -t

# 打开 nginx
sudo nginx

# 重新加载配置|重启|停止|退出 nginx
sudo nginx -s reload|reopen|stop|quit

# 开启nginx后，测试能不能正常运行（nginx默认监听8080端口）
curl -v http://127.0.0.1:8080



mkdir /usr/local/etc/nginx/vhosts

# 修改nginx配置文件
vim /usr/local/etc/nginx/nginx.conf
```


修改nginx配置如下：


```
# 修改pid文件路径，如果前面有注释，请去掉
pid /usr/local/var/run/nginx.pid;

# 在http段内添加虚拟主机
include vhosts/*.conf;

# nginx其他配置这里不再详述
```


如果修改`nginx.conf`配置文件，重启`nginx`时报以下错误：


```
nginx: [error] invalid PID number "" in "/usr/local/var/run/nginx.pid"
```


可这样解决：


```
sudo nginx -c /usr/local/etc/nginx/nginx.conf
sudo nginx -t
sudo nginx -s reload
```


* * *

## Mysql


```
# 如果以前安装过mysql，建议先卸载掉，不然可能会有一些奇怪的问题  
# 像我本机用`navicat`连接后，只看到`infomation_schema`这个数据库，但是用命令行又可以全部看到  
# 卸载方法如下:  
brew remove mysql
brew cleanup
launchctl unload -w ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist
rm ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist
sudo rm -rf /usr/local/var/mysql


# 安装
brew install mysql

#开机启动
ln -sfv /usr/local/opt/mysql/*.plist ~/Library/LaunchAgents
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist

#开启MySQL安全机制，根据提示，输入root密码，然后依次确认一些安全选项
/usr/local/opt/mysql/bin/mysql_secure_installation

# 查看MySQL运行情况
ps aux | grep mysql

# 测试连接MySQL
mysql -uroot -p
```


* * *

## PHP7


```
brew update
brew tap homebrew/dupes
brew tap homebrew/versions
brew tap homebrew/homebrew-php
```


> _注意:_  
> 由于mac系统限制，在`php`开发中，只能`curl`在本机`keychain`里有证书的，不能使用`curl`来调用任意的`https`；  
> 如果`php`需要用`curl`调用`https`接口，需要使用其他SSL版本的`curl`


```
＃ 查看当前curl的ssl版本  
php -i | grep "SSL Version"
# 如果返回 `SSL Version => SecureTransport`，则需要更换版本
# 如果返回类似 `SSL Version => OpenSSL/1.0.2e`的，则不用更换

# 更换curl
brew rm curl
brew install curl --with-libssh2 --with-openssl

# 之后在下面编译php时，加入`--with-homebrew-curl --with-homebrew-openssl --without-snmp`参数即可  
# 如果本机已经编译过`php`，下面使用`brew reintall php70 --xxxxxx（参数）`重装即可  
# 如果已经装过`php`，只是为了解决这个`https`的问题，也得重装`php`  

# 如果重装php成功后，`php -i | grep "SSL Version"` 显示的还是旧的，或是已经是新的，但是仍不能访问`https`，请重启试试＝。＝  

# 参考资料:   
http://rockybean.info/2014/04/08/mavericks_curl_bug/
http://www.farces.com/wikis/naked-server/php/php-openssl/
```


_开始安装_


```
# 如果使用默认的Homebrew被墙了，可以去这里手动下载，再拷贝到本机的Homebrew缓存里先
# wget https://homebrew.bintray.com/bottles-php/php70-7.0.1.el_capitan.bottle.9.tar.gz
# cp php70-7.0.1.el_capitan.bottle.9.tar.gz /Library/Caches/Homebrew/

#注意：如果你希望以mac下的apache作为web server，编译时要加 -with-apache；如果你的web server 是 nginx这类，就需要加上 -with-fpm
brew install php70 --with-fpm --with-gmp --with-imap --with-tidy --with-debug --with-homebrew-curl --with-homebrew-openssl --without-snmp

# PHP编译过程中如果遇到configure: error: Cannot find OpenSSL's <evp.h>错误，
# 执行 xcode-select --install 重新安装一下Xcode Command Line Tools

# PHP-FPM开机启动
ln -sfv /usr/local/opt/php70/*.plist ~/Library/LaunchAgents
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.php70.plist
```


> 安装扩展


```
# 根据自己需要安装  
brew install memcached
brew install --HEAD php70-memcached
brew install mcrypt
brew install php70-mcrypt
brew install redis
brew install --HEAD php70-redis
brew install phpunit
brew install php70-xdebug


# `redis`的开机启动和关闭
ln -sfv /usr/local/opt/redis/*.plist ~/Library/LaunchAgents/  
# 启动
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.redis.plist
# 关闭  
launchctl unload ~/Library/LaunchAgents/homebrew.mxcl.redis.plist

# 跨平台可视化redis工具: [redis desktop manager](http://redisdesktop.com/)

# `memcached`等其他扩展的开机启动和关闭都类似，只要将上述软链命令里的`redis`换成相应的`memcached`等即可  
ln -sfv /usr/local/opt/memcached/*.plist ~/Library/LaunchAgents/
```


> 以下是`php`遇到的几个问题

*   问题1：如果 php -v 后，mcrypt会有这样的问题


```
PHP Warning:  PHP Startup: mcrypt: Unable to initialize module
Module compiled with build ID=API20151012,NTS
PHP    compiled with build ID=API20151012,NTS,debug
These options need to match
 in Unknown on line 0
```


则用此命令重装一下


```
brew reinstall mcrypt --build-from-source php70-mcrypt --build-from-source
```


*   问题2：如果 php -v 后，memcached 有这样的问题：


```
PHP Deprecated: PHP Startup: memcached.sess_lock_wait and memcached.sess_lock_max_wait are deprecated. Please update your configuration to use memcached.sess_lock_wait_min, memcached.sess_lock_wait_max and memcached.sess_lock_retries in Unknown on line 0Deprecated: PHP Startup: memcached.sess_lock_wait and memcached.sess_lock_max_wait are deprecated. Please update your configuration to use memcached.sess_lock_wait_min, memcached.sess_lock_wait_max and memcached.sess_lock_retries in Unknown on line 0PHP Deprecated: PHP Startup: memcached.sess_lock_wait and memcached.sess_lock_max_wait are deprecated. Please update your configuration to use memcached.sess_lock_wait_min, memcached.sess_lock_wait_max and memcached.sess_lock_retries in Unknown on line 0Deprecated: PHP Startup: memcached.sess_lock_wait and memcached.sess_lock_max_wait are deprecated. Please update your configuration to use memcached.sess_lock_wait_min, memcached.sess_lock_wait_max and memcached.sess_lock_retries in Unknown on line 0PHP 7.0.2 (cli) (built: Jan 7 2016 10:40:26) ( NTS )Copyright (c) 1997-2015 The PHP GroupZend Engine v3.0.0, Copyright (c) 1998-2015 Zend Technologies with Xdebug v2.4.0RC3, Copyright (c) 2002-2015, by Derick Rethans
```


则需要修改一下配置文件`/usr/local/etc/php/7.0/conf.d/ext-memcached.ini`，将以下两句注释:


```
;memcached.sess_lock_wait = 150000
;memcached.sess_lock_max_wait = 0
```


*   问题3：如果 php -v 有以下问题：


```
Cannot load Xdebug - it was built with configuration API320151012,NTS, whereas running engine is API320151012,NTS,debug
```


则用此命令重装一下：


```
brew install php70-xdebug --build-from-source
```


* * *

> 替代系统自带php

由于Mac自带了php和php-fpm，因此需要添加系统环境变量PATH来替代自带PHP版本


```
echo 'export PATH="$(brew --prefix php70)/bin:$PATH"' >> ~/.bash_profile  #for php
echo 'export PATH="$(brew --prefix php70)/sbin:$PATH"' >> ~/.bash_profile  #for php-fpm
echo 'export PATH="/usr/local/bin:/usr/local/sbib:$PATH"' >> ~/.bash_profile #for other brew install soft
source ~/.bash_profile
```


* * *

> php-fpm相关


```
vim /usr/local/etc/php/7.0/php-fpm.conf

# 修改pid文件的路径；记得去掉前面的注释
pid = /usr/local/var/run/php-fpm.pid
# 保存并退出  

#测试php-fpm配置
php-fpm -t
php-fpm -c /usr/local/etc/php/7.0/php.ini -y /usr/local/etc/php/7.0/php-fpm.conf -t

#启动php-fpm
php-fpm -D
php-fpm -c /usr/local/etc/php/7.0/php.ini -y /usr/local/etc/php/7.0/php-fpm.conf -D

# 方法1: 关闭php-fpm
kill -INT `cat /usr/local/var/run/php-fpm.pid`
# 方法1: 重启php-fpm
kill -USR2 `cat /usr/local/var/run/php-fpm.pid`

# 方法2: 关闭php
launchctl unload -w ~/Library/LaunchAgents/homebrew.mxcl.php70.plist
# 方法2: 启动php
launchctl load -w ~/Library/LaunchAgents/homebrew.mxcl.php70.plist
```
 
```
# 安装php composer
brew install composer

#检查一下版本
composer --version
```


* * *

> 查看版本


```
#brew安装的php，在/usr/local/opt/php70/bin/php
php -v    

#Mac自带的PHP
/usr/bin/php -v

#brew安装的php-fpm，在/usr/local/opt/php70/sbin/php-fpm
php-fpm -v

#Mac自带的php-fpm
/usr/sbin/php-fpm -v
```


* * *

> 写好一个站点的`nginx`配置文件后，访问后出现502错误

查看`该站点`的`nginx`的`error log`后，发现此错误：


```
*32 connect() to unix:/dev/shm/php-cgi.sock failed (2: No such file or directory) while connecting to upstream, client: 127.0.0.1, server: kkd.cn, request: "GET / HTTP/1.1", upstream: "fastcgi://unix:/dev/shm/php-cgi.sock:"
```


原因是`该站点`的`nginx`的配置文件使用了以下配置，使用的是sock监听：


```
fastcgi_pass unix:/dev/shm/php-cgi.sock;
```


而`php-fpm`的配置文件（位于`/usr/local/etc/php/7.0/php-fpm.d/www.conf`），里面配置的是使用tcp监听：


```
listen = 127.0.0.1:9000
```


简单的解决方法是将`该站点`的`nginx`配置文件修改为`tcp`监听即可：


```
fastcgi_pass 127.0.0.1:9000;
```


* * *

## 快捷命令


```
vim ~/.bash_aliases

# 添加以下东西
alias nginx.start='launchctl load -w ~/Library/LaunchAgents/homebrew.mxcl.nginx.plist'
alias nginx.stop='launchctl unload -w ~/Library/LaunchAgents/homebrew.mxcl.nginx.plist'
alias nginx.restart='nginx.stop && nginx.start'

alias php-fpm.start='launchctl load -w ~/Library/LaunchAgents/homebrew.mxcl.php70.plist'
alias php-fpm.stop='launchctl unload -w ~/Library/LaunchAgents/homebrew.mxcl.php70.plist'
alias php-fpm.restart='php-fpm.stop && php-fpm.start'

alias memcached.start='launchctl load -w ~/Library/LaunchAgents/homebrew.mxcl.memcached.plist'
alias memcached.stop='launchctl unload -w ~/Library/LaunchAgents/homebrew.mxcl.memcached.plist'
alias memcached.restart='memcached.stop && memcached.start'

alias redis.start='launchctl load -w ~/Library/LaunchAgents/homebrew.mxcl.redis.plist'
alias redis.stop='launchctl unload -w ~/Library/LaunchAgents/homebrew.mxcl.redis.plist'
alias redis.restart='redis.stop && redis.start'

alias mysql.start="launchctl load -w ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist"
alias mysql.stop="launchctl unload -w ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist"
alias mysql.restart='mysql.stop && mysql.start'

alias web.start='nginx.start && php-fpm.start && memcached.start && redis.start && mysql.start'
alias web.stop='nginx.stop && php-fpm.stop && memcached.stop && redis.stop && mysql.stop'

alias lal='ls -al'
alias ll='ls -l'

# 保存并退出
```
 
```
# 让快捷命令生效
echo "[[ -f ~/.bash_aliases ]] && . ~/.bash_aliases" >> ~/.bash_profile     
source ~/.bash_profile

# 体验一下
web.stop
web.start
```


> 参考资料:  
> [Mac OS X 10.9安装LNMP环境](http://segmentfault.com/a/1190000000606752)  
> [rootless相关](https://www.zhihu.com/question/31116473)  
> [mysql安全设置](http://www.opsers.org/server/rpm-packages-installed-mysql-you-set-up-safe.html)

* * *

2015.12.24 01:04  
Aevit  
华师

[![](http://aevit.qiniudn.com/moon-from-650d.jpg)](http://aevit.qiniudn.com/moon-from-650d.jpg "楼顶月")
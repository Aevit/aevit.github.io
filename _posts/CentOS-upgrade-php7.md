---
title: CentOS升级php7  
date: 2015-12-16 00:33:53  
tags: [比特海,后台,PHP,服务器]  
category: 比特海  
layout: post  

---


```
> 本文内容: CentOS 6.5 下升级php7    
> 可在PC端的文章详情页，点击右下角的`汉堡按钮`展开菜单栏快速查看
```


> PS: 如果要跟其他开发人员保持开发环境的统一，可以考虑`VirtualBox + Vagrant`的方式，这里不再详述，可参考以下教程：  
> [使用 Vagrant 打造跨平台开发环境](http://segmentfault.com/a/1190000000264347)  
> [Vgrant安装配置](https://github.com/astaxie/Go-in-Action/blob/master/ebook/zh/01.2.md)

这两天给公司的服务器都升级了`nginx`和`php7`  
`nginx`的升级比较简单，不再赘述。  
下面简单记录一下`php7`（原版本是`5.3.5`）的升级操作，及一些扩展的编译安装


```
以下操作都是基于`CentOS 6.5 64bit`系统
```
<!--more-->

## 备份服务器

上阿里云备份磁盘快照

## 升级php7.0.0


```
cd ~/your_download_dir

#可以从PHP官网，也可以从github下载源码

#下载方法1: 去php官网下载7.0.0
wget http://hk2.php.net/get/php-7.0.0.tar.bz2/from/this/mirror
#开始解压php7包
tar -xjf mirror && cd php-7.0.0


#下载方法2: 从GitHub下载php7源码  
#注意: 由于master分支上的不一定是7.0.0，有可能是7.1.0等，  
#但是memcached扩展目前只支持7.0.0（截止2015.12.16），所以这里指定下载7.0.0的，不用master的  
wget -c --no-check-certificate -O php7-src-PHP-7.0.0.zip https://github.com/php/php-src/archive/PHP-7.0.0.zip
#开始解压php7包
unzip -q php7-src-PHP-7.0.0.zip && cd php-src-PHP-7.0.0
```
 
```
#安装编译php7时需要的依赖包
yum -y install libxml2 libxml2-devel openssl openssl-devel curl-devel libjpeg-devel libpng-devel freetype-devel libmcrypt-devel
```
 
```
#需要的话，先备份旧版本的php
tar -zcvf /usr/local/php-old.tar.gz /usr/local/php/
```
 
```
#生成配置文件（如果下载的是源码，可能没有`configure`文件，则需要`buildconf`一下；如果有则不需要下面这步）  
./buildconf

#开始配置
./configure --prefix=/usr/local/php \
--exec-prefix=/usr/local/php \
--bindir=/usr/local/php/bin \
--sbindir=/usr/local/php/sbin \
--includedir=/usr/local/php/include \
--libdir=/usr/local/php/lib/php \
--mandir=/usr/local/php/php/man \
--with-config-file-path=/usr/local/php/etc \
--with-mysql-sock=/var/lib/mysql/mysql.sock \
--with-mcrypt=/usr/include \
--with-mhash \
--with-mysqli=shared,mysqlnd \
--with-pdo-mysql=shared,mysqlnd \
--with-gd \
--with-iconv \
--with-zlib \
--with-openssl \
--enable-zip \
--enable-inline-optimization \
--disable-debug \
--disable-rpath \
--enable-shared \
--enable-xml \
--enable-bcmath \
--enable-shmop \
--enable-sysvsem \
--enable-mbregex \
--enable-mbstring \
--enable-ftp \
--enable-gd-native-ttf \
--enable-pcntl \
--enable-sockets \
--with-xmlrpc \
--enable-soap \
--without-pear \
--with-gettext \
--enable-session \
--with-curl \
--with-jpeg-dir \
--with-freetype-dir \
--enable-opcache \
--enable-fpm \
--with-fpm-user=php-fpm \
--with-fpm-group=php-fpm \
--without-gdbm \
--enable-fileinfo

#编译
make clean && make && make install

#测试——非必须操作
make test

#需要的话，备份旧的php里的php.ini等文件  
mv /usr/local/php/etc/php.ini /usr/local/php/etc/php.ini.old
mv /etc/init.d/php-fpm /etc/init.d/php-fpm.old
mv /usr/local/php/etc/php-fpm.conf /usr/local/php/etc/php-fpm.conf.old
mv /usr/local/php/etc/php-fpm.d/www.conf /usr/local/php/etc/php-fpm.d/www.conf.old

#设置PHP7的配置文件php.ini、php-fpm.conf、www.conf和php-fpm脚本
#方法一：直接使用编译后未经优化处理的配置
cp php.ini-production /usr/local/php/etc/php.ini
cp sapi/fpm/init.d.php-fpm /etc/init.d/php-fpm
cp /usr/local/php/etc/php-fpm.conf.default /usr/local/php/etc/php-fpm.conf
cp /usr/local/php/etc/php-fpm.d/www.conf.default /usr/local/php/etc/php-fpm.d/www.conf

#方法二：使用 https://typecodes.com/web/php7configure.html 文中的配置
mv ~/php.ini /usr/local/php/etc/php.ini
mv ~/php-fpm /etc/init.d/php-fpm
mv ~/php-fpm.conf /usr/local/php/etc/php-fpm.conf
mv ~/www.conf /usr/local/php/etc/php-fpm.d/www.conf


#可能需要加上执行权限  
chmod +x  /etc/init.d/php-fpm

#设置PHP的扩展库路径，下面是一个举例的路径，具体不同机器名字可能稍有不同
extension_dir = "/usr/local/php7/lib/php/extensions/no-debug-non-zts-20151012/"
```
 
```
#重启php
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini

#查看是否启动成功
ps -aux|grep php

#查看php版本
php -v
```


## php.ini相关配置优化


```
#设置PHP的时区，修改为 Asia/Shanghai 或 PRC
date.timezone = Asia/Shanghai

#避免PHP信息暴露在http头中
expose_php = Off

#避免暴露php调用mysql的错误信息（如果是本地环境，可以设置为On，方便查看原因）
display_errors = Off

#在关闭display_errors后，开启PHP错误日志（路径在php-fpm.conf中配置）
log_errors = On
```


执行命令：重启php


```
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini
```


## php-fpm相关配置优化


```
#开启pid文件
pid = run/php-fpm.pid
#设置错误日志的路径
error_log = log/php-fpm.log

#确保php-fpm.conf里有include了php-fpm.d里的文件，再修改www.conf
include=/usr/local/php/etc/php-fpm.d/*.conf
```


执行命令


```
vim /usr/local/php/etc/php-fpm.d/www.conf
```


修改www.conf：


```
#修改为以下配置
pm.max_children = 50  
pm.start_servers = 20  
pm.min_spare_servers = 5  
pm.max_spare_servers = 35  

#开启慢日记  
request_slowlog_timeout = 1
slowlog = log/$pool.log.slow

#修改fpm运行的用户和组都为nobody
user = nobody
group = nobody

#根据nginx.conf中的配置fastcgi_pass unix:/var/run/php-fpm/php-fpm.sock;设置PHP监听
; listen = 127.0.0.1:9000   #####不建议使用
; listen = /var/run/php-fpm/php-fpm.sock #由于以前的vhost里的配置文件大都是用127.0.0.1:9000，等以后有时间再来改为sock
```


执行命令


```
#测试PHP的配置文件是否正确
/usr/local/php/sbin/php-fpm -t

#重启php
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini
```


## opcache扩展


```
#注意：建议本地环境非必要情况下不要开启opcache, 正式环境才开启  

#进入到刚才解压后的php源码路径里的opcache目录
cd ext/opcache/

phpize
./configure --with-php-config=/usr/local/php/bin/php-config --enable-opcache
make clean && make && make install

#成功之后的so文件路径会显示出来，注意查看

#编辑php.ini
vim /usr/local/php/etc/php.ini
```


修改php.ini配置


```
#确保 extension_dir 的路径有填写了，如果没填可参照以下填写，或是自定义一个路径  
extension_dir = "/usr/local/php/lib/php/extensions/no-debug-non-zts-20151012"

#添加以下东西，其他opcache选项再自己具体去修改
zend_extension=opcache.so
opcache.enable=1
opcache.enable_cli=1

#Zend Optimizer + 共享内存的大小, 总共能够存储多少预编译的 PHP 代码(单位:MB)，推荐 128
opcache.memory_consumption=128

#Zend Optimizer + 暂存池中字符串的占内存总量.(单位:MB)，推荐 8
opcache.interned_strings_buffer=8

#最大缓存的文件数目 200  到 100000 之间，推荐 4000
opcache.max_accelerated_files=4000

#Opcache 会在一定时间内去检查文件的修改时间, 这里设置检查的时间周期, 默认为 2, 定位为秒，推荐60
opcache.revalidate_freq=60

#是否保存文件/函数的注释   如果apigen、Doctrine、 ZF2、 PHPUnit需要文件注释.推荐 0
opcache.save_comments=0

#打开快速关闭, 打开这个在PHP Request Shutdown的时候回收内存的速度会提高，推荐1
opcache.fast_shutdown=1

#从缓存不被访问后,等待多久后(单位为秒)调度重启
opcache.force_restart_timeout=180
```


执行命令


```
#保存退出vim后，重启php
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini

#安装成功后，查看版本会有opcache的文字显示出来；或是自己弄个php文件去测试
php -v
```


## mysql扩展


```
#先确保 mysqli.so、pdo_mysql.so 存在  
ll /usr/local/php/lib/php/extensions/no-debug-non-zts-20151012

vim /usr/local/php/etc/php.ini
```


修改php.ini配置


```
#确保 extension_dir 的路径有填写了，如果没填可参照以下填写，或是自定义一个路径  
extension_dir = "/usr/local/php/lib/php/extensions/no-debug-non-zts-20151012"

#添加 mysql 扩展
extension=pdo_mysql.so
extension=mysqli.so
```


执行命令


```
#保存退出vim后，重启php
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini
```


## php7下的memcached扩展


```
#添加php7下的memcached扩展
cd ~/your_download_dir

#下载
wget -c --no-check-certificate -O php7-memcached.zip https://codeload.github.com/php-memcached-dev/php-memcached/zip/php7

#解压
unzip -q php7-memcached.zip && cd php-memcached-php7

#编译，前提是已安装过 libmemcached，如未安装，请先自行安装，再执行以下命令  
phpize
./configure --with-libmemcached-dir=/usr/local/libmemcached --with-php-config=/usr/local/php/bin/php-config
make clean && make
make test

#拷贝生成的so文件至php目录里  
cp modules/memcached.so /usr/local/php/lib/php/extensions/no-debug-non-zts-20151012/
cp modules/memcached.la /usr/local/php/lib/php/extensions/no-debug-non-zts-20151012/

vim /usr/local/php/etc/php.ini
```


修改php.ini配置


```
#确保 extension_dir 的路径有填写了，如果没填可参照以下填写，或是自定义一个路径  
extension_dir = "/usr/local/php/lib/php/extensions/no-debug-non-zts-20151012"

#在php.ini里添加扩展
extension=memcached.so
```


执行命令


```
#保存退出vim后，重启php
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini
```


## php7下的redis扩展


```
# 下载redis  
wget http://download.redis.io/redis-stable.tar.gz

# 解压并进入目录  
tar -zxvf redis-stable.tar.gz && cd redis-stable

# 编译  
make && make install
# 测试  
make test

# PS: 如果`make test`报这样的错误: `You need tcl 8.5 or newer in order to run the Redis test`，则还需执行以下命令  
# yum install -y tcl
```


设置`redis`开机自动启动，编辑redis.conf文件


```
# 编辑redis.conf文件  
vim redis.conf
```


更改配置如下：


```
# 将`daemonize`由`no`修改为`yes`  
daemonize yes
```


复制刚才编辑的redis.conf文件：


```
# 复制至`/etc/redis`目录  
mkdir /etc/redis
cp redis.conf /etc/redis/
```


编写redis自启动脚本：


```
#在redis下载包中此路径: utils/redis_init_script，已经包含了自启动脚本，可以根据需要修改一些参数即可；或者直接新建一个脚本：  
vim /etc/init.d/redis
# 脚本内容见下面附录: [redis自启动脚本]

chmod +x /etc/init.d/redis

# 设置开机自动启动服务
chkconfig redis on

# 启动
service redis start
# 停止
service redis stop
```


编译php7-redis扩展


```
# 下载
wget -c --no-check-certificate -O phpredis-php7.zip https://codeload.github.com/phpredis/phpredis/zip/php7

# 解压并进入目录
unzip phpredis-php7.zip && cd phpredis-php7

# 编译（`phpize`依赖于`php-devel`这个包，如果没有直接用`yum install php-devel`先安装一下）
phpize
./configure --with-php-config=/usr/local/php/bin/php-config --enable-redis
make && make install
make test

# 当出现类似如下语句时，说明安装成功  
# Installing shared extensions:     /usr/local/php/lib/php/extensions/no-debug-non-zts-20151012/
ll /usr/local/php/lib/php/extensions/no-debug-non-zts-20151012/

# 编辑`php.ini`
vim /usr/local/php/etc/php.ini
```


修改php.ini配置：


```
# 添加`redis.so`扩展
extension=redis.so
```


执行命令：


```
# 重启php
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini

# 使用<?phpinfo()?>查看有没有redis相关信息
```


## 修改上传文件最大范围为500M


```
#修改php.ini
vim /usr/local/php/etc/php.ini
```


修改以下内容：


```
memory_limit = 128M
upload_max_filesize = 500M
post_max_size = 500M
```


执行命令：


```
#重启php
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini
```


修改nginx.conf：


```
#修改nginx
vim /usr/local/nginx/conf/nginx.conf
```


修改以下内容：


```
#在 http{} 段内，修改或添加
client_max_body_size 500M;
```


执行命令：


```
#重启nginx
nginx -s reload
```


## Nginx相关配置


```
#在nginx.conf的http{}里添加以下东西

#Gzip Compression
gzip on;
gzip_buffers 16 8k;
gzip_comp_level 6;
gzip_http_version 1.1;
gzip_min_length 256;
gzip_proxied any;
gzip_vary on;
gzip_types
    text/xml application/xml application/atom+xml application/rss+xml application/xhtml+xml image/svg+xml
    text/javascript application/javascript application/x-javascript
    text/x-json application/json application/x-web-app-manifest+json
    text/css text/plain text/x-component
    font/opentype application/x-font-ttf application/vnd.ms-fontobject
    image/x-icon;
gzip_disable  "msie6";

#设置出错时不显示nginx版本  
server_tokens off;

#重启nginx
nginx -s reload
```


## phing相关配置


```
vim /usr/local/php/lib/php/phing/Phing.php
```


修改内容如下：


```
#添加这句代码，include php文件
ini_set('include_path', '/usr/local/php/lib/php');
```


执行命令：


```
#保存退出vim后，重启php
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini
```


## 上传大文件

大文件上传要注意几个环节：

1.  上传文件需要花费较长上传时间和处理执行时间，需要设置 `nginx` 上传时间、延攻 `php` 执行超时时间

2.  大文件处理需要占用较大内存，需要增加 `php` 内存池，考虑到有多个文件上传处理的并发，这个内存建议根据并发相乘

以下为相关配置（**具体数值根据自己需要调整**）

> 注：`nginx` 中的 `client_max_body_size` 大小要和 `php.ini` 中的 `upload_max_filesize`、`post_max_size` 中的 **最大值** 一致或者稍大，这样才不会因为提交数据大小不一致而出现错误

*   nginx的修改


```
send_timeout 60;
fastcgi_connect_timeout 300;
fastcgi_send_timeout 300;
fastcgi_read_timeout 300;
client_max_body_size 500M;
```


> `nginx` 配置超时时间：[参考文章](https://my.oschina.net/xsh1208/blog/199674)

*   php的修改


```
upload_max_filesize 500M
post_max_size 512M
max_input_time 300
max_execution_time 300
```


> `upload_max_filesize` 和 `post_max_size` 区别：  
> post数据，常用的就是form表单，表单数据不光有文件，还可以有其他数据，所以一般情况下，`post_max_size` 要设置得比 `upload_max_filesize` 大，具体大多少看需要，如果一个form表单要传多个文件，那就要设置很大了。  
> 如果不用post，而用 `socket` 协议来上传文件，那么 `post_max_size` 设置就没有用处了。

*   php-fpm注意参数


```
# 这两个参数如果设置过小的话会导致文件传输了一部分后连接关闭。
request_terminate_timeout
request_slowlog_timeout
```


最后记得重启 `nginx` 和 `php`


```
# 重启nginx
nginx -t
nginx -s reload

# 重启php
killall php-fpm && /usr/local/php/sbin/php-fpm -y=/usr/local/php/etc/php-fpm.conf -c=/usr/local/php/etc/php.ini
```


[参考文章](http://www.lvtao.net/server/636.html)

## 总结

配置服务器还是挺有意思的，尤其是编译时，画面上一行一行字闪过，那种感觉，真爽。。


```
#另外，可自行弄一个php文件查看机器上的php信息
<php?
phpinfo();
?>
```


最后可参考以下文章发挥php7性能：  
[发挥PHP 7高性能的几个要点](http://www.duniangyixia.com/jiaocheng/qita/11298.html)

* * *

redis自启动脚本:


```
###########################
#chkconfig: 2345 10 90
#description: Start and Stop redis
PATH=/usr/local/bin:/sbin:/usr/bin:/bin

REDISPORT=6379
EXEC=/usr/local/bin/redis-server
REDIS_CLI=/usr/local/bin/redis-cli

PIDFILE=/var/run/redis.pid
CONF="/etc/redis/redis.conf"

case "$1" in
    start)
        if [ -f $PIDFILE ]
        then
                echo "$PIDFILE exists, process is already running or crashed"
        else
                echo "Starting Redis server..."
                $EXEC $CONF
        fi
        if [ "$?"="0" ]
        then
              echo "Redis is running..."
        fi
        ;;
    stop)
        if [ ! -f $PIDFILE ]
        then
                echo "$PIDFILE does not exist, process is not running"
        else
                PID=$(cat $PIDFILE)
                echo "Stopping ..."
                $REDIS_CLI -p $REDISPORT SHUTDOWN
                while [ -x ${PIDFILE} ]
               do
                    echo "Waiting for Redis to shutdown ..."
                    sleep 1
                done
                echo "Redis stopped"
        fi
        ;;
   restart|force-reload)
        ${0} stop
        ${0} start
        ;;
  *)
    echo "Usage: /etc/init.d/redis {start|stop|restart|force-reload}" >&2
        exit 1
esac
##############################
```


* * *

2015.12.16 00:32  
Aevit  
华师

[![](http://file.arvit.xyz/moon-from-650d.jpg)](http://file.arvit.xyz/moon-from-650d.jpg "楼顶月")
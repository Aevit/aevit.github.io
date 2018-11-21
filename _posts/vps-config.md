---
title: VPS配置  
date: 2015-11-11 21:42:53  
tags: [比特海,后台,VPS]  
category: 比特海  
layout: post  

---

去西藏前，想着如果能安全回来就租个VPS玩玩  
于是11.1那天看了下 [linode](https://www.linode.com) 的东京机房，可惜已经没货了，刷了一天都没有  
最后在11.2租了 [conaha](https://www.conoha.jp/) 的东京机房  
虽然速度没有`linode`的快，不过只能先顶着用了

本文主要记录了`shadowsocks`配置、`LNMP`环境配置、`VPS`性能测试

<!--more-->

内容有点多，可以在PC端点击`右下角`那个`汉堡图标`按钮展开目录

## 硬件配置

配置如下:


```
东京VPS
CPU: 2Core
内存: 1GB
SSD: 50G
系统: CentOS 7.1 64bit  
价格(感人): 900日元/per month (40多RMB)
支付方式(感人): 支持支付宝
```


附1-1:  
[linode配置与价格](https://www.linode.com/pricing)  
[conaha配置与价格](https://www.conoha.jp/zh/pricing)

> [注册地址](https://www.conoha.jp/referral/?token=TlQVI4AgGwmnLSwbdtwa_wN5HuMzWSXMtUBP2i3952hmu.WL.d0-G9Y)  
> 通过上面的邀请链接注册账户，新注册账户充值一定日元(以前是500元，大约25元RMB左右，现在不清楚了)，我和你都将会得到一定的赠送（以前是送1000日元，现在不知道了）

## ssh端口

为了安全起见，先更改ssh的默认端口（默认为22）；端口不超过65535，并且1024及以下的为系统端口，也不要使用。  
这里以更改为`11223`为例:


```
vim /etc/ssh/sshd_config
```


将里面的`Port`修改为如下:


```
Port 22
Port 11223

# 注: 这里先保留22端口，是为了防止后面有其他情况使得 11223 端口还不可以使用
# 如防火墙里没有添加 11223 端口，这时把 22 端口取消，那就悲剧了...
```


重启sshd（注意不同系统版本的命令可能会稍有不同，这里以我测试过的两台不同系统的服务器为例）


```
# CentOS 6
service sshd restart

# CentOS 7
/bin/systemctl restart sshd.service
```


如果有开启了防火墙，还需要添加`11223`端口:

> 由于习惯问题，我在`CentOS 7`下，将默认的`FireWallD`防火墙，更改为`iptables`了，所以下面在`CentOS 7`下的防火墙相关命令是用`iptables`相关的，请注意

查看防火墙是否有启动


```
# CentOS 6
service iptables status

# CentOS 7
/bin/systemctl status  iptables.service
```


> 如果防火墙没有启动，请直接去将上面的`22`端口注释掉，再重启`sshd`即可，后面的操作不用了。


```
vim /etc/sysconfig/iptables
```


添加端口:


```
-A INPUT -p tcp -m state --state NEW -m tcp --dport 11223 -j ACCEPT
```


重启防火墙（注意不同系统版本的命令可能会稍有不同，这里以我测试过的两台不同系统的服务器为例）


```
# CentOS 6
service iptables restart

# CentOS 7
/bin/systemctl restart iptables.service
```


接下来进行测试，看能不能使用`11223`端口进行ssh登录，如果可以了，**记得**回去将上面的`Port 22`端口去掉


```
vim /etc/ssh/sshd_config

# 修改配置内容
#Port 22
Port 11223

# 重启ssh# 
# CentOS 6
service sshd restart
# CentOS 7
/bin/systemctl restart sshd.service
```


## 梯子

面对国内日益严峻的高墙形势，身为一条程序狗，需要有一门轻巧方便的穿墙术。  
以前都是租第三方的梯子用，所以VPS启动后的第一件事是搭自己的梯子。  
这次使用的是开源的`shadowsocks`来配置（虽然8月份时该作者被请喝茶，删了全部源代码，不过还是要感谢作者[@clowwindy](https://twitter.com/clowwindy)）。

以下操作都是基于系统`CentOS 7.1 64bit`

### 服务端安装


```
#更新yum源
yum update  

#确保python版本 ≥ 2.6
python --version

#版本没问题后，使用pip安装即可  
yum install python-setuptools && easy_install pip
pip install shadowsocks  

vim /etc/shadowsocks.json  
#粘贴以下内容保存：  
{
    "server":"your_server_ip",
    "local_address":"127.0.0.1",
    "local_port":1080,
    "port_password":{
        "your_port_1":"your_pw_1",
        "your_port_2":"your_pw_2"
    },
    "timeout":600,
    "method":"aes-256-cfb",  
    "fast_open":false,
    "workers":1
}

#以上各字段说明见下面"附2-1-1"

#使用该配置文件在后台运行即可：  
ssserver -c /etc/shadowsocks.json -d start   

#停止运行：将上面的`start`改为`stop`即可
```


注: 如果系统开启了防火墙，还需要添加规则让上面设置的端口生效  
由于`CentOS 7.1`的防火墙默认是用`firewalld`代替了`iptables`  
所以使用以下命令设置规则（注意将`your_port_1` `your_port_2`修改为自己的端口）


```
firewall-cmd --permanent --add-port=your_port_1/tcp
firewall-cmd --permanent --add-port=your_port_2/tcp
firewall-cmd --reload
```


如果在`CentOS 7.1`下，还是使用`iptables`，则修改`/etc/sysconfig/iptables`文件去添加以下规则（注意将`your_port_1` `your_port_2`修改为自己的端口）


```
vim /etc/sysconfig/iptables  

# 编辑内容，添加以下两句  
-A INPUT -p tcp -m state --state NEW -m tcp --dport your_port_1 -j ACCEPT
-A INPUT -p tcp -m state --state NEW -m tcp --dport your_port_2 -j ACCEPT

# 保存并退出后，再使用以下命令重启iptables  
/bin/systemctl restart iptables.service
```


再注: 如果不喜欢上面的方法，可使用网上众大神提供的一键安装脚本  
a. [teddysun的脚本](https://teddysun.com/342.html)  
b. [linuxeye的脚本](https://blog.linuxeye.com/423.html) —— 此脚本已集成到`oneinstack`（见下面`3-2`说明）

### 客户端配置

windows及mac都有图形化的客户端，以下为mac的界面，设置好即可进行科学上网

![image](http://file.arvit.xyz/shadowsocks-mac-config.png)

### 全局科学上网

只使用`shadowsocks`的话，只能让浏览器科学上网，如果需要 全部或部分 软件也能科学上网，可以搭配[Proxifier](http://www.proxifier.com/) 这个东西。这是个收费软件，使用起来挺简单的，这里不再赘述。

### 优化加速

#### 锐速

推荐使用[锐速](http://www.serverspeeder.com/)  
锐速是一款专业的TCP加速引擎，一种只需单边部署就可以起到显著加速效果的TCP加速技术


```
wget http://my.serverspeeder.com/d/ls/serverSpeederInstaller.tar.gz
tar xzvf serverSpeederInstaller.tar.gz
bash serverSpeederInstaller.sh
```


之后输入锐速的账号密码，再一步一步按enter下去即可

下面是关于锐速配置的一些优化说明


```
#设置：advinacc="1",maxmode="1"，rsc="1" 保存退出
vim /serverspeeder/etc/config

#重启锐速
/serverspeeder/bin/serverSpeeder.sh restart

#打开配置文件，加入以下两行
vim /etc/security/limits.conf

* soft nofile 51200
* hard nofile 51200

#修改linux最大文件限制数ulimit
ulimit -n 51200

#后台重新启动shadowsocks服务
ssserver -c /etc/shadowsocks.json -d restart
```


如果启动报错，那么`vim``以上config文件`里的`gso=1`即可


```
Actual changes:
scatter-gather: off
 tx-scatter-gather: off
 tx-scatter-gather-fraglist: off
udp-fragmentation-offload: off [requested on]
```


锐速操作命令说明


```
#启动  
/serverspeeder/bin/serverSpeeder.sh start

#停止  
/serverspeeder/bin/serverSpeeder.sh stop

#卸载，需先cd到sh脚本路径  
./serverSpeederInstaller.sh uninstall
```


#### gevent

安装`gevent`以提高Shadowsocks-Python的性能，`gevent`是基于协程的Python网络库，可以提高Python的I/O性能：


```
yum install python-devel
pip install greenlet
pip install gevent
```


* * *

`附2-1-1`: 各字段的含义：


```
1. server：服务器 IP (IPv4/IPv6)（VPS本身可填：0.0.0.0）  
2. local_address：本地监听的 IP 地址（如：127.0.0.1）
3. local_port：本地端端口（建议：1080）
4. port_password：监听的服务器端口:密码
5. timeout：超时时间（秒）
6. method：加密方法，可选择"bf-cfb", "aes-256-cfb", "des-cfb", "rc4", 等等。
默认是一种不安全的加密，推荐用"aes-256-cfb"  
7. works：works数量，默认为 1  
8. fast_open：true 或 false。如果你的服务器 Linux 内核在3.7+，可以开启 fast_open 以降低延迟。  
开启方法：echo 3 > /proc/sys/net/ipv4/tcp_fastopen
开启之后，将 fast_open 的配置设置为 true 即可。
```


`附2-1-2`：开启`firewalld`，关闭`iptables`的方法说明（[来源](http://silverchard.me/t0006.html#11)）


```
#查看firewalld（masked为关闭），iptables（enabled为开启）开关状态  
systemctl list-unit-files|grep 'firewall\|iptables'

systemctl start firewalld.service #开启firewalld
systemctl enable firewalld.service #永久开启firewalld

#关闭iptables
systemctl stop iptables.service #关闭iptables
systemctl stop ip6tables.service #关闭iptables ipv6
systemctl disable iptables.service #停用iptables
systemctl disable ip6tables.service #停用iptables ipv6
systemctl mask iptables.service #mask掉iptables 可以理解为停用彻底关闭
systemctl mask ip6tables.service #mask掉ipv6 iptables 同上

firewall-cmd --state #再次检查firewalld是否开启
```


* * *

## LNMP环境配置

租VPS的主要目的还是想瞎搞点东西，写写接口给自己的iOS端（或前端）使用  
使用的环境是`LNMP`（Linux+Nginx+Mysql+PHP）

### 配置

以前已经给公司的服务器手动配置过环境，觉得略微繁琐，不想在自己的VPS上花太多时间在配置上面，所以这次使用的是一键安装包[oneinstack](http://oneinstack.com/)

安装方法见[官网说明](http://oneinstack.com/install/)即可

### shadowsocks一键安装脚本

无意中发现了`oneinstack`竟然有`shadowsocks`的一键安装脚本（感人），个人觉得是比较方便的一个脚本，现记录下安装方法（[来源](https://blog.linuxeye.com/423.html)）

2015.7.8 **前**：


```
cd oneinstack

wget http://mirrors.linuxeye.com/lnmp/shadowsocks.sh

chmod +x shadowsocks.sh

#安装、添加用户、卸载和后面一样
./shadowsocks.sh install
```


2015.7.8 **后**：


```
#使用wget，或本机下载好再传过去  
wget http://mirrors.linuxeye.com/oneinstack.tar.gz

tar xzf oneinstack.tar.gz

cd oneinstack

./shadowsocks.sh install
```


出现如下即安装成功：


```
Your Server IP: You_Server_IP
Your Server Port: 9001
Your Password: oneinstack
Your Local IP: 127.0.0.1
Your Local Port: 1080
Your Encryption Method: aes-256-cfb
```


Shadowsocks添加用户（感人的方便）


```
./shadowsocks.sh adduser
```


Shadowsocks服务管理


```
service shadowsocks start     #启动
service shadowsocks stop      #关闭
service shadowsocks restart   #重启
service shadowsocks status    #状态
```


* * *

## 性能测试

主要是测试VPS的CPU、硬盘IO、网络性能、跑分等

以下测试内容参考自：  
[Linux VPS性能测试方法](http://www.imeoe.com/219.html)  
[8步测评hardbirch的xen 512 Linux VPS](http://www.linode.im/1667.html)

### 信息查看

4-1-1 查看cpu相关信息


```
cat /proc/cpuinfo
```


4-1-2 资源消耗查看


```
top
```


4-1-3 内存使用情况


```
free -m
```


4-1-4 linux版本查看


```
cat /etc/issue
```


更多相关信息查看可以查阅：  
[linux下查看系统配置常用命令](http://www.imeoe.com/217.html)

### 硬盘IO性能测试

测试硬盘IO性能，对硬盘的损害很大，不建议多次或长时间尝试，命令如下：


```
dd if=/dev/zero of=test bs=64k count=4k oflag=dsync
```


这个值越大越好，如果超过10M，对正常建站就无影响。超过50M，就是非常给力状态。

### VPS网络性能测试

VPS的网络性能，主要分出口（上行速度）和入口（下行速度）二个指标，入口可以用wget文件得到：


```
wget http://cachefly.cachefly.net/100mb.test
```


看下载速度，如果是11M/s，大概就是百兆口。70M/S，大概就是G口。VPS搭建好网站环境后，可以用其它的VPS去拽这个文件，得到出口的带宽。

**下载完后，记得删除该文件**

### VPS PING值测试

主要测试是PING值，和观看TRACERT值，来判断速度。可用以下几个网站：

站长网：[超级ping工具](http://ping.chinaz.com) – [路由追踪工具](http://tool.chinaz.com/Tracert/)  
卡卡网：[ping工具](www.webkaka.com/ping.aspx) – [tracert工具](www.webkaka.com/Tracert.aspx)  
国外的：[www.just-ping.com](www.just-ping.com)  
软件：[http://www.speedtest.net/mini.php](http://www.speedtest.net/mini.php)  
国内的：[http://www.17ce.com/](http://www.17ce.com/)

### VPS探针测试

当然还有最简单的方法，在搭建好web环境后，可以使用探针测试。  
如果支持php的话，可以使用[雅黑php探针](http://www.yahei.net/)

### UnixBench跑分

一款国外提供的linux性能专用软件，可以跑出分数来让你做对比

以下是 [秋水逸冰的一键安装脚本](https://teddysun.com/245.html)


```
wget https://teddysun.com/wp-content/uploads/unixbench.sh
chmod +x unixbench.sh
./unixbench.sh
```


总分情况，低于400的就算性能低下；600-800是属于正常VPS水准；超过1000分性能就算给力 （PS：看的是12年的一篇文章，不知道现在的标准是多少）

## mysql 手动安装相关
update: 2017.12.16
前阵子帮忙迁移公司一台服务器到另一台，同事是直接把旧服务器安装好的 mysql 复制到新服务器上，这时需要手动安装一下，以下是遇到的一些问题：  

首先安装(在 mysql 目录执行)：    

```
sudo scripts/mysql_install_db --user=mysql
```

遇到这样的报错：  

```
Can't locate Data/Dumper.pm in @INC (@INC contains: /usr/local/lib64/perl5 /usr/local/share/perl5 /usr/lib64/perl5/vendor_perl /usr/share/perl5/vendor_perl /usr/lib64/perl5 /usr/share/perl5 .) at scripts/mysql_install_db line 42.
BEGIN failed--compilation aborted at scripts/mysql_install_db line 42.
```

需要安装一个东西：  

```
sudo yum install 'perl(Data::Dumper)'
```

还有其它问题的话，编辑 `my.cnf` 里添加 error_log 去查看日志
注：（`my.cnf` 有时指定了位置的话，在 `/etc/my.cnf` 不能再存在）  

安装成功会有以下信息，包含设置 root 密码、启动等：  

```
To start mysqld at boot time you have to copy
support-files/mysql.server to the right place for your system

PLEASE REMEMBER TO SET A PASSWORD FOR THE MySQL root USER !
To do so, start the server, then issue the following commands:

  /usr/local/webserver/mysql5.6//bin/mysqladmin -u root password 'new-password'
  /usr/local/webserver/mysql5.6//bin/mysqladmin -u root -h 127.0.0.1 password 'new-password'

Alternatively you can run:

  /usr/local/webserver/mysql5.6//bin/mysql_secure_installation

which will also give you the option of removing the test
databases and anonymous user created by default.  This is
strongly recommended for production servers.

See the manual for more instructions.

You can start the MySQL daemon with:

  cd . ; /usr/local/webserver/mysql5.6//bin/mysqld_safe &

You can test the MySQL daemon with mysql-test-run.pl

  cd mysql-test ; perl mysql-test-run.pl

Please report any problems with the ./bin/mysqlbug script!

The latest information about MySQL is available on the web at

  http://www.mysql.com

Support MySQL by buying support/licenses at http://shop.mysql.com

WARNING: Found existing config file ./my.cnf on the system.
Because this file might be in use, it was not replaced,
but was used in bootstrap (unless you used --defaults-file)
and when you later start the server.
The new default config file was created as ./my-new.cnf,
please compare it with your file and take the changes you need.
```

启动(在 mysql 目录执行)：  

```
bin/mysqld_safe &

ln -s support/mysql.server /etc/init.d/mysql

# 以后就可以这样启动：  
/etc/init.d/mysql start

# 看下有没启动
ps aux | grep mysql
```

```
# 进入数据库后重置密码
update user set password=PASSWORD("newpassword") where user="root";

# 添加新用户
grant all on [dbname or *].[tablename or *] to [username]@"127.0.0.1" identified by "password";

FLUSH PRIVILEGES;

# 导出所有数据库数据
mysqldump -uroot -p --all-databases > /tmp/all_data.sql

# 导出指定数据库数据
mysqldump -uroot -p dbname > /tmp/dbname_data.sql

# 导入数据
mysql -uroot -p dbname < /tmp/dbname_data.sql.sql
```

查看当前运行程序：  

```
sudo netstat -tplun
```

* * *

2015.11.11 01:53  
Aevit  
华师

[![](http://file.arvit.xyz/moon-from-650d.jpg)](http://file.arvit.xyz/moon-from-650d.jpg "楼顶月")
---
title: 使用ngrok进行内网穿透  
date: 2016-03-31 20:24:14  
tags: [比特海,后台,ngrok,微信公众号]  
category: 比特海  
layout: post  

---

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="86" src="http://music.163.com/outchain/player?type=2&amp;id=27591140&amp;auto=0&amp;height=66"></iframe>

## 前言

进行微信公众号的开发时，需要有公网IP的服务器才行，这样每次都得在本地开发再把代码提交到服务器，或直接在服务器上开发，不是很方便。  
并且有时可能需要`把本机开发的网站等web项目给其他人演示`，以前都是上传到VPS上，也不是很方便。

通过google查找到`ngrok`这个东西，可以实现在本地开发即时调试，可以非常方便地实现内网穿透。

<!--more-->

> ngrok 是一个反向代理，通过在公共的端点和本地运行的 Web 服务器之间建立一个安全的通道。ngrok 可捕获和分析所有通道上的流量，便于后期分析和重放。  
> 详细介绍可以看百度百科的介绍：[ngrok介绍](http://baike.baidu.com/view/13085941.htm)。

国内有些人也贡献了自己的服务器，如[http://ngrok.cc/](http://ngrok.cc/)，如果不想自己搭建`ngrok`环境，可以直接去使用。

`ngrok`的[v1.x版本](https://github.com/inconshreveable/ngrok)是开源的，2.0就不是开源，而且两者的命令有些不同。

这里使用其1.x的开源代码进行布署。经过几个小时的奋斗，中间遇到一些坑，终于在VPS上弄好，现记录如下。

> 拿了两台服务器进行了安装和测试，系统分别为`CentOS 7 64bit`，`CentOS 6.5 64bit`

## GO安装

需要先安装go环境

### 设置环境变量


```
# 可以根据自己需要调整路径  
echo 'export GOROOT=/usr/local/go' >> /etc/profile
echo 'export PATH=$PATH:$GOROOT/bin' >> /etc/profile
echo 'export GOPATH=$HOME/go' >> /etc/profile
echo 'export GOROOT_BOOTSTRAP=/usr/local/go' >> /etc/profile
```


### 下载源码安装

> 由于`yum`安装的`go`版本是`1.4`的，后面可能会有点问题，所以这里采用源码安装（2016.03.31最新版本为1.6）的方式


```
cd ~/your_download_dir
wget https://storage.googleapis.com/golang/go1.6.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.6.linux-amd64.tar.gz
```


查看是否安装成功


```
go version
# 正常的话会返回类似这样的信息: go version go1.6 linux/amd64
```


## ngrok安装

### git版本

如果你的git版本`>=1.7.9.5`，可以直接跳过git版本这一步；如果不是，需要先进行升级。  
我在一台服务器上的版本是`1.7.1`，在ngrok安装过程中，会一直卡在某个东西的下载，我是卡在这里


```
gopkg.in/inconshreveable/go-update.v0 (download)
```


最好先进行一些git依赖的安装


```
yum -y install zlib-devel openssl-devel perl hg cpio expat-devel gettext-devel curl curl-devel perl-ExtUtils-MakeMaker hg wget gcc gcc-c++
```


然后再升级`git`版本，升级方法是先安装第三方源([rpmfore](http://www.live-in.org/archives/998.html))，再使用该源进行git的更新。

这里不再详细说明`git`的升级，大体可以照这篇[教程](https://segmentfault.com/a/1190000002729908)弄；  
唯一不同的是，因为启用了`priorities`，所以在最后更新git时一直查找的是`base`的`repo`，而不是`rpmforge`的`repo`，所以需要在更新时将`base,updates`等`repo`禁用（参考这篇[文章](http://akyl.net/how-install-latest-version-git-centos-6x)），如下：


```
yum --disablerepo=base,updates --enablerepo=rpmforge-extras update git
```


### 下载ngrok源码


```
cd ~/your_download_dir
git clone https://github.com/inconshreveable/ngrok.git ngrok
cd ngrok
```


### 生成证书

注意这里有个`NGROK_BASE_DOMAIN`；  
假设最终需要提供的地址为`aevit.your-domain.com`，则`NGROK_BASE_DOMAIN`设置为`your-domain.com`；  
假设最终需要提供的地址为`aevit.ngrok.your-domain.com`，则`NGROK_BASE_DOMAIN`设置为`ngrok.your-domain.com`；

下面以`ngrok.your-domain.com`为例：


```
openssl genrsa -out rootCA.key 2048
openssl req -x509 -new -nodes -key rootCA.key -subj "/CN=ngrok.your-domain.com" -days 5000 -out rootCA.pem
openssl genrsa -out device.key 2048
openssl req -new -key device.key -subj "/CN=ngrok.your-domain.com" -out device.csr
openssl x509 -req -in device.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out device.crt -days 5000
```


执行完以上命令，就会在`ngrok`目录下新生成6个文件


```
device.crt
device.csr
device.key
rootCA.key
rootCA.pem
rootCA.srl
```


`ngrok`通过`bindata`将ngrok源码目录下的`assets`目录（资源文件）打包到可执行文件(`ngrokd`和`ngrok`)中 去，`assets/client/tls` 和 `assets/server/tls` 下分别存放着用于`ngrok`和`ngrokd`的默认证书文件，我们需要将它们**替换**成我们自己生成的：(因此这一步**务必**放在编译可执行文件之前)


```
cp rootCA.pem assets/client/tls/ngrokroot.crt
cp device.crt assets/server/tls/snakeoil.crt
cp device.key assets/server/tls/snakeoil.key
```


### 编译ngrokd和ngrok

#### 编译linux端版本


```
make clean

# 如果是32位系统，这里 GOARCH=386
GOOS=linux GOARCH=amd64 make release-server release-client
```


最后成功的话，会在当前目录生成一个`bin`文件夹，里面包含了`ngrokd`和`ngrok`文件；  
其中，`bin/ngrokd`文件是服务端程序；  
`bin/ngrok`文件是客户端程序（注意上面指定了`GOOS`为64位linux的，所以这个文件是不能在`mac`或`win`等其他平台跑的，下面将进行说明如何交叉编译）

#### 编译mac端版本


```
cd ~/your_download_dir/ngrok

# 如果是win端版本，GOOS=windows；如果是32位系统，GOARCH=386
GOOS=darwin GOARCH=amd64 make release-client
```


成功的话，会在`./bin/darwin_amd64/`下有个文件，将这个文件下载到mac上


```
# 如果服务器没装sz程序，请先安装（yum -y install lrzsz）；或自行采用其他办法下载到本机  
sz ./bin/darwin_amd64/ngrok
```


### 设置域名解析


```
# 如果最终需要的ngrok地址为: example.your-domain.com，则
设置 * 记录指向服务器IP

# 如果最终需要的ngrok地址为: example.ngrok.your-domain.com，则
设置 *.ngrok 记录指向服务器IP

# 或者不想进行泛解析，则手动添加即可，如设置example记录指向服务器IP，example.ngrok记录指向服务器IP
```


### 使用方法

#### 服务端

##### nginx端口转发

由于本机的`80`端口已经被占用了，所以需要利用`nginx`进行端口的转发，加上如下配置即可：


```
# 根据自己nginx的安装路径，自动调整以下命令
vim /usr/local/nginx/conf/vhost/nginx.your-domain.com.conf
```


内容如下：


```
upstream ngrok {
        server 127.0.0.1:8777; # 此处端口要跟 启动服务端ngrok 时指定的端口一致
        keepalive 64;
}
server {
        listen 80;
        server_name *.ngrok.your-domain.com;
        access_log /data/wwwlogs/ngrok.your-domain.com_access.log;
        error_log /data/wwwlogs/ngrok.your-domain.com_error.log;
        location / {
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header Host  $http_host:8777; # 此处端口要跟 启动服务端ngrok 时指定的端口一致
                proxy_set_header X-Nginx-Proxy true;
                proxy_set_header Connection "";
                proxy_pass      http://ngrok;
        }
}
```


重启nginx


```
nginx -t
nginx -s reload
```


##### 启动服务端ngrok


```
# domain填写刚才生成证书时的 NGROK_BASE_DOMAIN
# http和https端口可以自己指定，这里不采用80端口，是因为其他程序已经占用了，端口转发在上面nginx已经配置完成  
bin/ngrokd -domain="ngrok.your-domain.com" -httpAddr=":8777" -httpsAddr=":8778"

# 如果想要后台启动，执行以下命令  
nohup bin/ngrokd -domain="ngrok.your-domain.com" -httpAddr=":8777" -httpsAddr=":8778"   > /dev/null 2>&1 &

# 如果想要开机启动，执行以下命令
vim /etc/rc.d/rc.local
# 添加以下内容，具体内容请根据自己情况自行调整
{your-ngrok-dir}/bin/ngrokd -domain="ngrok.your-domain.com" -httpAddr=":8777"  -httpsAddr=":8778"  > /var/log/ngrok.log &
```


#### 客户端

确保刚才下载的mac版`ngrok`有执行权限


```
chmod +x ngrok
```


在`ngrok`程序的同级目录下，编写配置文件


```
vim ngrok.cfg
```


内容如下:


```
server_addr: "ngrok.your-domain.com:4443"
trust_host_root_certs: false
tunnels:
  example:
   subdomain: "example" #定义服务器分配域名前缀
   proto:
    http: 80 #映射端口，不加ip默认本机
    https: 80
  web:
   subdomain: "web" #定义服务器分配域名前缀
   proto:
    http: 192.168.1.100:80 #映射端口，可以通过加ip为内网任意一台映射
    https: 192.168.1.100:80
  web1:
    hostname: "ngrok.your-domain.com"
    proto:
      http: 80
  web2:
    hostname: "your-domain.com"
    proto:
      http: 80
  ssh:
   remote_port: 50001 #服务器分配tcp转发端口，如果不填写此项则由服务器分配
   proto:
    tcp: 22 #映射本地的22端口
  ssh1: #将由服务器分配端口
    proto:
      tcp: 21
```


启动`ngrok`


```
./ngrok -subdomain example -config=ngrok.cfg 80

# 或者
./ngrok -config ngrok.cfg start example

# 如果出现问题连接不上，想在本地查看日志，可加上log参数
# ./ngrok -log ngrok.log -config ngrok.cfg start example

# 最终如果`Tunnel Status`显示`online`则表示成功了
```


### 在本地进行微信公众号的调试

接下来就可以进行微信公众号在本地的开发了，只要在本地设置好`nginx`（`server_name`要跟上文对应，如上面的`example.ngrok.your-domain.com`）

> 由于微信只允许使用80端口，所以一定要进行上面的nginx的端口转发设置才行

另外，`ngrok`本身提供了`127.0.0.1:4040`这个地址，可以查看到所有的http数据包内容（在php文件里`var_dump`的东西也可以看到）

### 遇到的问题

#### ngrok端口的防火墙问题

由于服务器上开启了防火墙，使用的是`iptables`，所以需要将上面的端口添加到白名单  
（一共3个，一个是`ngrok`自身的`4443`端口，还有自定义的`8777`http端口，`8778`https端口）


```
vim /etc/sysconfig/iptables
```


添加以下内容


```
-A RH-Firewall-1-INPUT -m state -state NEW -m tcp -p tcp -dport 4443 -j ACCEPT  
-A RH-Firewall-1-INPUT -m state -state NEW -m tcp -p tcp -dport 8777 -j ACCEPT  
-A RH-Firewall-1-INPUT -m state -state NEW -m tcp -p tcp -dport 8778 -j ACCEPT
```


重启iptables


```
service iptables restart
```


#### ngrok的交叉编译

在服务器上要编译个`mac`端的版本时，网上说需要进行go的源码，去进行GOOS的设置：


```
cd /usr/local/go/src
GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 ./make.bash
```


但是我拿另一台服务器测试过后，不用这样也行，直接按刚才上面说的，在`ngrok`目录去进行`mac端版本`的编译即可。

> PS: 以下内容不能看也行，只是中间遇到的问题的一些记录而已

我第一次照着网上说的去go源码设置GOOS，反而会报这样的错：


```
go ./make.bash: eval: line 135: syntax error near unexpected token `( 
ERROR: Cannot find /root/go1.4/bin/go.
Set $GOROOT_BOOTSTRAP to a working Go tree >= Go 1.4.
```


google了下，说现在新的go都不用C编写了，而1.4之前的是C编写的，所以需要先安装1.4的，才能编译1.6的，于是便先安装了1.4，再安装1.6，步骤如下：


```
echo 'export GOROOT=/usr/local/go' >> /etc/profile
echo 'export PATH=$PATH:$GOROOT/bin' >> /etc/profile
echo 'export GOPATH=$HOME/go' >> /etc/profile
echo 'export GOROOT_BOOTSTRAP=/usr/local/go' >> /etc/profile
source /etc/profile

cd ~/your_download_dir

# 先下载1.4的源码
wget https://storage.googleapis.com/golang/go1.4.3.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.4.3.linux-amd64.tar.gz
#tar -xzf go1.4.3.linux-amd64.tar.gz
#mv ./go /usr/local/go
cd /usr/local/go/src
./all.bash

# 查看版本，现在是1.4.3的
go version

# 将1.4的源码目录名更改为go1.4，go这个目录名等下给1.6用
mv /usr/local/go/ /usr/local/go1.4/


vim /etc/profile
# 默认的 GOROOT_BOOTSTRAP 是: $HOME/go1.4，因为我放在了`/usr/local/go1.4`，所以这里要指定该值
export GOROOT_BOOTSTRAP=/usr/local/go1.4

cd ~/your_download_dir
wget https://storage.googleapis.com/golang/go1.6.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.6.linux-amd64.tar.gz
cd /usr/local/go/src
./all.bash

# 查看版本，现在是1.6的
go version
```


最后再次进行测试验证了不用先安装1.4再安装1.6这么麻烦。。

## 总结

中间虽然遇到了一些坑，google查了好几个钟的资料，昨晚弄到凌晨2点多，不过最终弄成功，并且验证了一些安装过程的想法，还是挺有成就感的。

还好大学时就有稍微折腾过linux，去年转后台开发时就用上了一些知识，现在服务器遇到一些基本问题最终也能解决了。  
所以还是不能停止学习的脚步啊。

趁现在还年轻，多折腾。。

* * *

2016.3.31 21:31 春天  
Aevit  
华师一课

[![](http://aevit.qiniudn.com/b2b2face1d613264cc7ad65a874fa4df1459405671.jpeg)](http://aevit.qiniudn.com/b2b2face1d613264cc7ad65a874fa4df1459405671.jpeg "厦门曾厝垵")  
摄影：Aevit 2014年4月 厦门曾厝垵
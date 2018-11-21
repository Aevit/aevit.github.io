---
title: VPS配置 - Git  
date: 2015-11-11 21:43:53  
tags: [比特海,后台,VPS,Git]  
category: 比特海  
layout: post  

---

## 前言

本文主要介绍如何在自己的服务器搭建 `Git`，包括以下内容：

*   初始化祼仓库
*   实现自动布署
*   从现有仓库克隆
*   `.gitignore` 规则不生效的解决方法
*   配置 `SSH` 密钥（服务器端及客户端的相关操作）
*   其它参考资料

<!--more-->

## 在自己服务器搭建git

Git是一个分布式版本控制／软件配置管理软件，原来是linux内核开发者林纳斯·托瓦兹为了更好地管理linux内核开发而创立的。

在服务器上布署共享用的git，最好是用裸仓库（bare仓库）。  
之所以叫裸仓库，是因为其没有工作目录，只包含我们平时使用时的隐藏文件夹`.git`目录里的文件。  
因为git本质维护的是`commit（提交历史）`，而不是`code（具体的代码）`

裸仓库扮演的角色和中心版本控制系统中中心服务器的角色类似：你项目的中心。

### 初始化裸仓库

创建裸仓库时，只要加上参数`--bare`即可：


```
git init --bare {your-project-name}.git
```


### 实现自动布署

自动布署相关资料来源：[使用 Git Hooks 实现自动项目部署](http://icyleaf.com/2012/03/apps-auto-deploy-with-git/)


```
Git 本身可以调用自定义的挂钩脚本，其中有两组：客户端和服务器端。  
客户端挂钩用于客户端的操作，如提交和合并。  
服务器端挂钩用于 Git 服务器端的操作，如接收被推送的提交。  
详情请查看 [ProGit 相关章节](http://progit.org/book/zh/ch7-3.html)
```


为了保证不被肆意部署，特加了一个对需要部署`commit`的判断，利用读取`commit subject`并匹配**想要的字符串**才去部署，这样是一个比较安全的部署方案。

git的挂钩（hook）有多种，详细可去bare仓库查看`hooks`目录，里面已经内置了一些文件，只需将文件后缀的`.sample`去掉即可

实现自动布署只需要使用`post-receive`这个`hook`即可，该`hook`会在接收post（push）请求后执行。

1、在上面创建的裸仓库（`注意是裸仓库，即bare仓库，不是代码仓库`）编辑


```
cd {your_git_bare_dir}
vim hooks/post-receive
```


粘贴相关代码即可（代码有点长，见文章最下面）

该代码会先判断脚本所在目录是否是`bare仓库`，然后获取最新`commit`的`subject`，并匹配是否包含 `[deploy]` （可修改为自己需要的字符串）字样。  
如果包含，则继续检查产品代码仓库路径是否存在，如果存在则执行`git pull`操作。

2、对刚才编辑的`post-receive`执行下面命令以保证脚本可执行：


```
chmod +x hooks/post-receive
```


​3、之后可去客户端提交一个**标题**包含`[deploy]`文字的`commit`测试一下

### 从现有仓库克隆

如果要把现有的`非祼仓库`在服务器上架设一个git，也只需在`clone`时加上`--bare`参数即可  
[详细可阅读此文](https://git-scm.com/book/zh/v1/%E6%9C%8D%E5%8A%A1%E5%99%A8%E4%B8%8A%E7%9A%84-Git-%E5%9C%A8%E6%9C%8D%E5%8A%A1%E5%99%A8%E4%B8%8A%E9%83%A8%E7%BD%B2-Git)


```
git clone --bare {your-project-git-url} {your-custom-project-name}
```


### `.gitignore` 规则不生效的解决方法

有时候在项目开发过程中，突然心血来潮想把某些目录或文件加入忽略规则，按照上述方法定义后发现并未生效。

原因是 `.gitignore` 只能忽略那些原来没有被 `track` 的文件，如果某些文件已经被纳入了版本管理中，则修改 `.gitignore` 是无效的。那么解决方法就是先把本地缓存删除（改变成 `未track` 状态），然后再提交：


```
git rm -r --cached .
git add .
git commit -m 'update .gitignore'
```


参考自 [Git忽略规则及.gitignore规则不生效的解决办法](http://www.pfeng.org/archives/840)

### 配置SSH密钥

#### 客户端操作

如果在本机上只需要管理一个git的话，参照下面的`配置单个公钥文件`的方法即可；  
如果需要管理多个（比如说管理`github` `gitcafe` `自己服务器上的git`等），需要参照下面的`配置多个公钥文件`的方法。

##### 配置单个公钥文件

查看是否有`~/.ssh`文件夹，没有则先创建，然后用`ssh-keygen`生成文件：


```
# 没有.ssh文件夹，才需要创建  
mkdir ~/.ssh

cd ~/.ssh

# -t 指定密钥类型，默认即 rsa ，可以省略  
# -C 设置注释文字，比如你的邮箱（注意是大写的C，并且邮箱左右有引号）
# 此方法会默认在`~/.ssh/`下生成一个名字`id_rsa`的私钥文件，及`id_rsa.pub`的公钥文件  
ssh-keygen -t rsa -C "{your_email@email.com}"
```


一步一步回车完成后，复制`id_rsa.pub`里的内容，等下粘贴到服务器上的文件中


```
# 复制id_rsa.pub里的内容到剪贴板，或是手动去 ~/.ssh/id_rsa.pub 复制  
pbcopy < ~/.ssh/id_rsa.pub
```


##### 配置多个公钥文件


```
# 以下两种任选一种即可  
# 1. 生成新的ssh key并命名为`custom_rsa`  
ssh-keygen -t rsa -C "your_email@email.com" -f ~/.ssh/custom_rsa  

# 2. 或 打以下命令后，在询问时输入名称
ssh-keygen -t rsa -C "your_email@email.com"
```


一步一步回车完成后，复制`custom_rsa.pub`里的内容，等下粘贴到服务器上的文件中


```
# 复制id_rsa.pub里的内容到剪贴板，或是手动去 ~/.ssh/custom_rsa.pub 复制    
pbcopy < ~/.ssh/custom_rsa.pub
```


然后在`~/.ssh`下新建`config`文件，用于配置各个公私钥对应的主机


```
vim ~/.ssh/config
```


示例：


```
# desc: github (github@email.com)
Host github.com
    Hostname github.com
    User git
    PreferredAuthentications publickey
    Identityfile ~/.ssh/github

# desc: my_server_user (your_email@email.com)
Host your_domain_name_or_ip
    HostName your_domain_name_or_ip
    User git
    IdentityFile ~/.ssh/custom_rsa


# 以上各字段说明：
# Host：主机名字，不能重名
# HostName：主机所在域名或IP
# User：服务器上的用户名
# PreferredAuthentications：不填此行的话，如果pubkey验证不通过可以用密码方式；填了`publickey`只能通过公钥验证的方式
# IdentityFile：私钥路径
```


##### 附.配置ssh-agent

> PS: 正常来说，这部分ssh-agent相关内容是可以不需要用到的

正常来说，`配置多个公钥文件`，只要上面的`config`文件正确填写，客户端的工作就完成了。  
如果配置了`config`后，`git clone`仍需要密码，或不想通过`config`文件来配置，则可以使用`ssh-agent`的方式

使用方法：


```
# 把刚才生成的ssh私钥添加到ssh-agent  
# 注意如果不使用 -K 参数，每次重启都会被刷新掉，得重新执行一遍才行（详见 http://segmentfault.com/q/1010000000835302/a-1020000000883441）
# 加了 -K 参数（本人机子为mac），则会在`keychain`自动加上该私钥（去`keychain`里搜索`ssh`即可看到）  
# 其他平台（win、linux等也有类似`keychain`的东西，这里不再详述）  

ssh-add -K ~/.ssh/custom_rsa
```


* * *

附1\. 关于创建公钥的详细信息，可以参考[https://help.github.com/articles/generating-ssh-keys/](https://help.github.com/articles/generating-ssh-keys/)  
附2\. ssh-add相关命令，可以参考[http://www.lampblog.net/ubuntu/ssh-add%E5%91%BD%E4%BB%A4/](http://www.lampblog.net/ubuntu/ssh-add%E5%91%BD%E4%BB%A4/)

#### 服务端操作

##### 创建用户

一般来说，需要创建一个新用户用来给git登录及其操作，比如这里我创建一个名为`git`的用户


```
sudo adduser git

# 然后切换回刚创建的git用户来做其他操作
su git
```


##### 创建**.ssh**目录

查看是否有`/home/git/.ssh/`目录，没有则创建：


```
mkdir /home/git/.ssh
```


接着在`.ssh`里创建文件（要确保这个文件的`owner`为上面创建的用户，如`git`，不是的话用`sudo chown git.git /home/git/.ssh/authorized_keys`命令修改）：


```
vim /home/git/.ssh/authorized_keys
# 粘贴刚才复制的公钥文件的内容，追加在后面，保存退出即可
```

 
> 使用 `ssh -vvv git@{your_ip} -p {your_port}` 测试不能正常连接的话，就使用下面方法检查一下

* 打开远程主机的 `/etc/ssh/sshd_config` 这个文件，检查下面几行是否被注释了:  

```
RSAAuthentication yes
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
```

然后重启下 ssh 服务:  

```
# CentOS 6:  
service sshd restart

# CentOS 7:  
/bin/systemctl restart sshd.service
```

* 确认权限，`~/.ssh` 目录权限要求是 `700`，里面的 `~/.ssh/authorized_keys` 权限要求是 `600`



##### 禁用shell登录

出于安全考虑，你可以用 Git 自带的 git-shell 工具限制 git 用户的活动范围。这可以通过编辑`/etc/passwd`文件完成。找到类似下面的一行，把 `/bin/sh` 改为`/usr/bin/git-shell`（或者用 `which git-shell` 查看它的实际安装路径）


```
vim /etc/passwd

# 下面的`1000:1000`是在本人机器上的显示，不同机器会不一样  
# 找到这行：
git:x:1000:1000::/home/apps:/bin/bash

# 改为：
git:x:1000:1000::/home/apps:/usr/bin/git-shell
```


现在 git 用户只能用 ssh 连接来推送和获取 Git 仓库，而不能直接使用服务器的 shell。尝试普通 ssh 登录的话，会看到拒绝信息。

#### 客户端开始工作

##### 新仓库


```
git init
git remote add origin git@{your_domain_name_or_ip}:{server_git_path}/{repo}.git
touch README.md
git add .
git commit -m "init"
git push origin --all

# 如果是首次建立的仓库，里面是什么东西也没的，也没有任何branch，需要手动添加点东西，commit一次之后才会有分支
```


##### 已有仓库

修改为新的url；或直接clone在新的目录


```
# 修改仓库的配置文件：`.git/config` 为

[remote "origin"]
    url = git@{your_domain_name_or_ip}:{username}/{repo}.git

# 或在新的目录clone
git clone git@{your_domain_name_or_ip}:{server_git_path}/{repo}.git
```


##### 遇到的一个坑


```
附.操作中遇到的一个坑: 权限问题导致ssh不能连上
上面配置好后，但是客户端一直用ssh连不上，使用 `ssh -vvv your_server_ip` 提示：
Permission denied (publickey,gssapi-keyex,gssapi-with-mic).  

查了很多资料，如:
http://flysnowxf.iteye.com/blog/1567570  
http://serverfault.com/questions/598058/ssh-permission-denied-publickey-gssapi-with-mic-password  
但是还是不行，最后发现是因为服务器上的 `/home/git/` 目录权限之前被我设为了777，需要改为700，或744，或755才行  
顺便复习一下ssh相关权限：

700: /home/git (等ssh可以连通后，事后根据需要再调整为744或755)  
700: /home/git/.ssh  
600: /home/git/.ssh/authorized_keys

详见: https://wiki.archlinux.org/index.php/SSH_keys_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)
```


### 其它参考资料

*   Git了解：[git-简易指南](http://www.bootcss.com/p/git-guide/)
*   Git详细：[git-scm.com](https://git-scm.com/book/zh/v2)
*   Git进阶：[git-flow 备忘清单](http://danielkummer.github.io/git-flow-cheatsheet/index.zh_CN.html)
*   管理工具：

    > 目前 `Git` 服务端的管理工具（类似 `github` `coding` 等）主要有2个，一个是 [gitlab](https://about.gitlab.com/)，一个是 [gitolite](http://gitolite.com/gitolite/index.html)  
    > 这里不再详述，具体的安装可上网查看，如:  
    > [centos gitolite 安装 配置 详解](http://blog.51yip.com/server/1752.html)  
    > [gitlab安装调试小记](http://peiqiang.net/2014/07/30/install-gitlab.html)

*   [merge rebase 区别](http://www.jianshu.com/p/f23f72251abc)

* * *


```
# 附录: git bare 仓库，实现自动布署的hook代码 vim  {your_git_bare_dir}/hooks/post-receive
# 来源: https://gist.github.com/icyleaf/566767
# 修改下面的 $DEPLOY_DIR 目录，之后提交的commit包含字符串 [deploy] 即可
#!/bin/sh
#
# git autodeploy script when it matches the string "[deploy]"
#
# @author    icyleaf <icyleaf.cn@gmail.com>
# @link      http://icyleaf.com
# @version   0.1
#
# Usage:
#       1. put this into the post-receive hook file itself below
#       2. `chmod +x post-receive`
#       3. Done!

# Check the remote git repository whether it is bare
IS_BARE=$(git rev-parse --is-bare-repository)
if [ -z "$IS_BARE" ]; then
    echo >&2 "fatal: post-receive: IS_NOT_BARE"
    exit 1
fi

# get the branch name when recived
if ! [ -t 0 ]; then
  read -a ref
fi
IFS='/' read -ra REF <<< "${ref[2]}"
BRANCH="${REF[2]}"
if [ "$BRANCH" == "" ]; then
  BRANCH="develop"
fi
# echo >&2 $BRANCH

# Get the latest commit subject
# 注：默认是取master分支上的log (git log -1)，如果想要取其他分支的，请加上分支名字，如 git log develop -1
SUBJECT=$(git log $BRANCH -1 --pretty=format:"%s")

# Deploy the HEAD sources to publish
IS_PULL=$(echo "$SUBJECT" | grep "[deploy]")
if [ -z "$IS_PULL" ]; then
    echo >&2 "tips: post-receive: IS_NOT_PULL"
    exit 1
fi

# Check the deploy dir whether it exists
DEPLOY_DIR=/home/icyleaf/php/icyleaf/
if [ ! -d $DEPLOY_DIR ] ; then
    echo >&2 "fatal: post-receive: DEPLOY_DIR_NOT_EXIST: \"$DEPLOY_DIR\""
    exit 1
fi

# Check the deploy dir whether it is git repository
#
#IS_GIT=$(git rev-parse --git-dir 2>/dev/null)
#if [ -z "$IS_GIT" ]; then
#   echo >&2 "fatal: post-receive: IS_NOT_GIT"
#   exit 1
#fi

# Goto the deploy dir and pull the latest sources
cd $DEPLOY_DIR
#env -i git reset --hard
env -i git pull
```


* * *

2015.11.11 01:53  
Aevit  
华师

[![](http://file.arvit.xyz/moon-from-650d.jpg)](http://file.arvit.xyz/moon-from-650d.jpg "楼顶月")
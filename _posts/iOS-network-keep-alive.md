---
title: NSURLSession错误使用引起的网络阻塞问题  
date: 2017-03-28 00:26:18  
tags: [比特海,iOS,疑难杂症,NSURLProtocol,NSURLSession,Keep-Alive]  
category: 比特海  
layout: post  

---

## 前言

最近一段时间公司的 APP 在某个时间段比较多人访问时，经常出现连接不上服务器的情况，刚开始我们一直都以为是服务器问题，运维同事做了一些措施还是不能解决。

后来在使用 `Charles` 抓包时，看到每次的接口请求，`Keep-Alive` 都是不生效的。

猜测是因为这里导致用户发起的每个请求，都要重新进行 DNS 解析、建立 SSL 握手等操作（尤其我们首页每次刷新还都会同时发起好几个请求…）。

而我们 DNS 用的貌似是第三方的服务，所以问题比较大可能是出在跟我们服务器的握手阶段（为了方便定位是什么问题，我在一个版本中，加入了错误码的提示，发现很多是超时、握手失败等情况）。

当很多人同时访问时，由于前面有大量握手（我们用的是 HTTPS，报文会比 HTTP 多一些）没建立成功，服务器还在忙着处理，后面的请求就处理不过来了，所以就阻塞了。

那应该如何解决呢？

<!--more-->

## 确认问题

### Charles

去找了运维同事看了后台配置，看起来是没问题，但是使用 Charles 抓包看的 `Keep-Alive`（又称持久连接、连接重用）就一直不生效：

![image](http://file.arvit.xyz/8332f71e13336060218c2ba8bfe31b401490671091.png)

后来突然想到，android 上会不会有问题？抓包看了下，android 上的 `Keep-Alive` 是正常的：

![image](http://file.arvit.xyz/1684ede887d1e83519d988c600b1bdf51490671159.png)

### Wireshark

#### HTTP

为了再次确认，开了个 demo，使用 Wireshark 来看报文，由于对这软件还不是很熟，先拿个 HTTP 的链接来试下，这是 `Keep-Alive` 不生效的情况（这里使用的是内网的服务器，其中 `10.1.17.81` 是我本机 IP，`10.0.3.150` 是我们内网服务器 IP）：

![image](http://file.arvit.xyz/4766cc7f71cdd2286020e2855f053b431490671706.png)

> PS: 图中上面使用的 `ip.addr == 10.0.0.150` 是用来过滤查看这次接口相关的报文

从上图我们也可以直观地看到，前三条报文是用来建立 TCP 握手连接的（这里先注意上图箭头处的端口 `58922`，这是我本机使用的端口，是由系统动态创建的端口，用来跟服务器通信的）。

接下来再请求一遍同个接口，使用 Charles 看到 `Keep-Alive` 是生效的，这是 Wireshark 上的情况：

![image](http://file.arvit.xyz/c9c388932a70633c91455b2b8df5427b1490671765.png)

可以看到，这里已经少了几条报文，其中包括三次握手的报文，并且我本机的端口使用的还是 `58922`。

当过了 `Keep-Alive` 有效期（这个时间是后台配置的），我再重新请求同个接口，这时端口已经变了：

![image](http://file.arvit.xyz/b3a9e6de59cd45e9313c3ba19dacdb881490672948.png)

#### HTTPS

接下来看一下 HTTPS 相关的报文（这里我还是使用同个接口，不过使用的是生产环境的，所以下面的图会将我们服务器的 IP 打码）

这是 `Keep-Alive` 不生效的情况：

![image](http://file.arvit.xyz/a3779616da76eddc54347ad3ab6c293f1490673131.png)

可以看到，本机端口使用的是 `58858`， 这次请求的报文比 HTTP 的请求多了好一些，主要都是用来建立 SSL 握手的。

这是 `Keep-Alive` 生效的情况：

![image](http://file.arvit.xyz/e002e1f0014272b51ffd3b8d29f0b0c71490673329.png)

省掉了 SSL 握手的操作，一下子就减少了很多报文。

后面过了 `Keep-Alive` 有效期，再重新请求同个接口，端口变了，同时也要重新进行 SSL 握手了：

![image](http://file.arvit.xyz/e8aa14c1c7157b9ac4a6d932bbce4ea81490673926.png)

#### 题外

这里简单介绍一下下面那几行分别表示的意思：

*   Frame: 物理层的数据帧概况

*   Ethernet II: 数据链路层以太网帧头部信息

*   Internet Protocol Version 4: 互联网层IP包头部信息

*   Transmission Control Protocol: 传输层T的数据段头部信息，此处是TCP

*   Hypertext Transfer Protocol: 应用层的信息，此处是HTTP协议

TCP 报文格式如下图（图片来自此 [文章](https://zhangbinalan.gitbooks.io/protocol/content/tcpbao_wen_ge_shi.html)）：

![image](https://zhangbinalan.gitbooks.io/protocol/content/Center.gif)

#### 小结

从以上分析可以看出，如果 `Keep-Alive` 不生效，每个请求/应答客户端和服务器都要新建一个连接，完成之后立即断开连接（HTTP协议为无连接的协议），这点从每次请求，本机端口都变了可以看出；

当 `Keep-Alive` 生效时，客户端到服务器端的连接持续有效，当出现对服务器的后继请求时，就可以避免重新建立连接。

## 解决问题

`HTTP/1.1` 开始已经默认启用 `Keep-Alive`，后台也有配置了相应的超时时间及最大请求数，并且安卓也没问题，所以就开始排查 iOS 项目的网络模块。

之前刚接手这项目时，就有人说这个项目代码也有点历史了，经过了很多人的手，其中封装的网络模块可能有两三种。结果这一排查，了不得啊……

使用的是 `AFNetworking`，对这个的封装就有三种方式，然后在某些地方还零星隐藏着第四种方式——直接使用 `AFNetwroking` 提供的方法。

再然后因为某个需求，需要对所有请求都统一做某些操作，前面接手的人为了方便，就注册了一个自定义 `NSURLProtocol` 来统一处理。最后排查到问题就是出在这里了，这是里面 `startLoading` 的写法：

![image](http://file.arvit.xyz/a5dcdbaf28e2881699d3a1458fadc43e1490682717.png)

这里的写法有个问题，就是每次请求都重新创建了一个 `NSURLSession` 实例，所以就导致了上面的 `Keep-Alive` 不生效了，每次请求都要重新进行 DNS 解析、建立握手等操作。

没有特殊需求的情况下，`NSURLSession` 应该是只创建一个实例就够了，然后通过创建多个 `NSURLSessionTask` 实例去进行请求。

不过这个自定义的 `NSURLProtocol` 需要实现的需求其实没有必要这样做，这样还会有点性能问题，趁着新需求还没来，所以花了两天时间对网络模块做了以下优化改造：

*   之前项目是用 `AFHTTPRequestOperationManager`，是基于 `NSURLConnection` 的，索性这次升级使用更好的基于 `NSURLSession` 的 `AFHTTPSessionManager`；

*   自定义一个类，继承自 `AFHTTPSessionManager`，然后项目中目前存在的四种网络请求方式，都使用这个自定义类的单例实例来发起请求，达到使用同一个 `NSURLSession` 实例的目的；

*   写好网络模块相关说明，嘱咐后来人都使用同一种网络请求方式。

* * *

## 总结

以前使用 HTTP 请求接口时，这个阻塞问题还不是很明显，后来换了 HTTPS 后，因为建立握手的步骤会多点，这个问题一下子就爆发出来，接到了很多用户反馈。

一直都以为是服务器问题，运维同事也做了某些措施还是无效，没想到最终是客户端的问题。其实这个 `Keep-Alive` 问题之前我就在 Charles 发现了不生效，也在群里跟运维同事反馈了，但是最开始被忽略了…后来在多日无法解决时，我又提出来了，这时才有运维同事跟我来联调查看，最终才能发现问题根源，所以，沟通很重要啊…

`Keep-Alive` 生效后，能有效缓解服务器的阻塞问题，不过当以后访问量达到更大的级别，就得服务器再做别的优化了。

* * *

2017-03-28 00:26  
Aevit  
深圳南山

* * *

<a class="http://file.arvit.xyz/559196984c69340facb7eae40544b3b11490684514.jpeg" title="广州塔骑车">![](http://file.arvit.xyz/559196984c69340facb7eae40544b3b11490684514.jpeg)</a>  
摄影：Aevit 2014年4月 广州塔
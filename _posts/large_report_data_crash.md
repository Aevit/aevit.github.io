---
title: 上报数据量过大导致的 Crash  
date: 2021-12-14 22:43:27  
tags: [比特海,iOS,Crash]  
category: 比特海    
layout: post  

---

## 0x0 前言
前不久外网发生了以下两类 Crash：  
<!--more-->

看第一个堆栈最后有 `Failed to grow buffer`，推测是内存问题导致。  

```
0 CoreFoundation 0x00000001ad574878 0x00000001ad44f000 + 1202288
1 libobjc.A.dylib 0x00000001c1acac50 objc_exception_throw + 60
2 CoreFoundation 0x00000001ad5ea518 0x00000001ad44f000 + 1684752
3 CoreFoundation 0x00000001ad5e177c 0x00000001ad44f000 + 1648496
4 CoreFoundation 0x00000001ad489088 __CFSafelyReallocate + 64
5 Foundation 0x00000001ae94d900 __convertJSONString + 212
6 Foundation 0x00000001ae94ca98 __writeJSONString + 84
...
73 QQKSong 0x000000010627c6a8 main (main.m:37)
74 libdyld.dylib 0x00000001ad1a96c0 _start + 4
Failed to grow buffer
```

第二个堆栈，最后是挂在 `memmove` 方法处，也大致推测是内存方面的原因。

```
0 libsystem_platform.dylib 0x00000001e45c6128 _platform_memmove + 64
1 QQKSong 0x00000001099bdb24 __ZN2xp7strutf8C1ERKS0_ + 60
2 QQKSong 0x00000001095f27c0 -[WnsSDK(Qzone) sendBizData:] + 776
3 QQKSong 0x00000001095fc3a4 -[WnsSdkHelper sendBizData:] + 76
4 QQKSong 0x000000010961a2c4 -[WnsProtocolBase startWork] + 876
5 QQKSong 0x000000010792edf4 -[KSTraceReportManager retryReportTraceData] (KSTraceReportManager.m:1246)
...
```

## 0x1 定位
一般遇到 Crash 时，如果不能很明确地快速定位到问题，可以进行以下操作：  
* 捞用户日志；  
    - 尽可能快地捞取日志，这样才能拿到 Crash 时的现场日志(可以先捞到留到后面再看，尽快捞日志只是为了防止用户下线或其它日志太多，没了现场日志)；
* 查看 RDM - crash_attach.log；  
    - 查看用户访问页面；  
* 查看 RDM - valueMapOthers.txt；  
    - 查看 x0 x1 x2 等寄存器信息（如果是野指针的 Crash，RDM 已贴心地先大概推测出是哪个野了）；  
* 查看 RDM - crash.log；  
    - 查看完整堆栈信息；  
* 观察共性；  
    - 查看机型、用户(RDM上 `联系方式`为 uid)、APP 版本、系统版本、Crash 开始时间、用户访问路径等是否有相同之处；  
* 尝试本地复现；  
    - 根据 Crash 堆栈，查看相关代码及调试，尝试找到复现路径；  

> 另外如果 RDM 上拿不到 Crash 堆栈，可以联系发布专员登录苹果账号查看是否有 Crash，或是联系用户去 `设置-隐私-分析与改进-分析数据` 里找到 `QQKSong` 开头的相关文件，点击进去后点右上角发送出来，再下载 DSYM 文件自己手动解堆栈。  

日志捞到了几份，本地短时间内复现不了，接下来查看 attatch_log.txt，总结出一个共性：最后都是在直播、歌房挂掉：

```
|KSongBlankViewController|KSTimelineRootVC|...|KSKTVRoomViewController|CCC4D1E13DCC4AEE902CB6D1019A3C08
```

接下来查看 `valueMapOthers.txt`，尝试通过 Crash 时的寄存器值推测原因（其中 x0 是发生 Crash 的函数的第一个参数，x1 为第二个，x2 为第三个）。  

在 OC 里，方法最后会转化为 objc_msgSend，所以此时 x0 表示发生 Crash 的对象的地址，x1 表示 Crash 对象调用的 selector，x2 就表示 selector 传递的第一个参数的地址，如

```
如：
id obj = [array objectAtIndex:0];
会被转化为：
id obj = objc_msgSend(array, @selector(objectAtIndex:), 0);
几个寄存器分别表示如下：  
x0: array 这个实例对象的地址；
x1: objectAtIndex: 这个 selector；
x2: selector 传递的第一个参数；  
```

* `json` 相关的 Crash，x0 x1 x2 都是 0，只能根据经验大概推测是内存问题，暂无进一步推测；  
* `memmove` 相关的 Crash，得到了比较有用的信息：  

```
A23:7.15.0.632_JAIL(TestFlight);A24:iPhone OS 14.2 (18B92);F01:1;C04_SDK_INFO:[fcff553585,3.3.8_lite] [e965e5d928,5.0.6] [55beb62d78,7.1.20600] [900049740,1.6.2e] [f246373333,4.10.117] ;A31:1;A33:10642;A35:
Thread 0 crashed with ARM 64 Thread State:
     x0:  000000000000000000    x1: 0x00000002c2240040    x2: 0x0000000003ca92a6     x3: 0x0000000000000020
     x4:  000000000000000000    x5: 0x0000000000000020    x6: 0x0000000000000001     x7: 000000000000000000
     x8:  0x5263442e74726f70    x9: 0x71655274726f7065   x10: 0x0a8f92ca0302001d    x11: 0x192b02010a140009
    x12: 0x7478650e06010008    x13: 0x70657263642e6172   x14: 0x180601001874726f    x15: 0x657263645f707061
    x16: 0x00000001e45c60e0    x17: 0x000000019debffc4   x18: 000000000000000000    x19: 0x000000016ae282c8
    x20: 0x0000000003ca92c6    x21: 0x00000002c2240000   x22: 0x0000000003ca92c6    x23: 000000000000000000
    x24: 0x000000010bdad4e8    x25: 0x000000010b256b25   x26: 0x000000010bdad4e8    x27: 0x0000000281061a18
    x28: 0x000000010cc11000    fp: 0x000000016ae28210    lr: 0x00000001099bd83c    
    sp: 0x000000016ae281f0     pc: 0x00000001e45c6128    cpsr: 0x20000000
 ;A19:0;A20:0;
```

memmove 为一个 C 方法，其声明为：  

```
1、声明：  
void *memmove(void *str1, const void *str2, size_t n)
2、参数：  
str1 -- 指向用于存储复制内容的目标数组，类型强制转换为 void* 指针。
str2 -- 指向要复制的数据源，类型强制转换为 void* 指针。
n -- 要被复制的字节数。
3、返回值：
该函数返回一个指向目标存储区 str1 的指针。
```

C 方法这里的 x0 x1 x2 就直接表示第几个参数：  
* x0: str1，目标地址；  
* x1: str2，源地址；  
* x2: n，源大小；  

可以看到 `x2: 0x0000000003ca92a6`，转为 10 进制为 `63607462`，说明要复制的源大小达到了 `60.66MB`，也就是需要申请 60.66MB 的空间，这是一个非常大的数字了。x0 为 0 推测是因为内存直接爆掉了；  

看 Crash 堆栈为上报时触发，其中会调用 WnsSDK 的 `sendBizData` 方法，从 wns sdk 同学（感谢 `@brfzhan`）处得到一个比较有用的信息：  
如果包大小超过 512k，wns c++ 接口层会直接回调失败。这个 crash 是在 oc 接口层赋值的地方 crash 的，还没到 c++ 接口层。所以业务数据大小最好不要超过 512k，不然也是失败的。  

其中回调失败，会打印 `DATA_LENGTH_LIMIT` 这个关键字，接下来搜索日志，可以看到有不少超过 512K 的：  

![-w1370](http://file.arvit.xyz/16086247517152.jpg)

```
[2020-12-13 22:04:17.428][Q:(null)][WnsUniversalSDK.cpp:330][sendRequest]:invalid cmd. cmd:kg.extra.data_report, command.length():20, PARAM_LENGTH_LIMIT:256, data.size:1232904, DATA_LENGTH_LIMIT:524288
```

所以这里基本可以推测出 Crash 原因：  
上报时频繁地申请大内存，造成了较多的内存碎片，在内存有限的情况下，下一次申请大内存时空间不足返回 NULL，后面直接访问空指针造成了 Crash。  

接下来需要定位频繁申请大内存的原因。  

* `memmove` 这类 Crash 看堆栈能得到个初步信息：由上报带来的。  
* `json` 这类 Crash 堆栈可以得到另一个信息：由链路带来的。  

在直播、歌房、营收模块会自动在上报时带上链路数据，所以推测是链路被写入了大量数据，接下来主要定位是哪里给链路写入了大量数据，不过通过当前日志暂无法定位具体是哪里写入。  

先初步总结下共性：  
* 最后都是在直播、歌房挂掉；  
* 最新灰度版本、外网版本发布后一段时间内都无 Crash；  
* 最新灰度版本、外网版本发生首次 Crash 的时间大概为 12.11 18:15；  
* 老版本也有出现；  

这里可以大致推测是在 12.11 18:15 左右下发了 wns 配置 或 hippy、后台有新的发布。由于日志无法准确定位到原因，所以只能在上报打包数据的地方，判断每一个字段 > 10K 就打印出来，然后发布灰度版本收集信息。  

最后通过 log 捞到了写入大量数据后的链路数据（由于 wns sdk 限制一次打印最多打 10K 数据，所以这里取到的是被截断掉的），粗略算了下，一条未压缩的链路占 1.5K

精简一下链路数据：  

```
[{
    "pageId": "ktv",
    "pageExtra": {
        "webPath": [
            {
                "pageId": "Home",
                "moduleId": "comment_area#operating",
                "moduleExtra": {
                    "key": "broadcasting_online_KTV#comment_area#operating#click#0",
                    "trace_money": __每多一个节点，都把前一个链路的数据塞进来__
                },
                "pageExtra": {
                    "search": "?hippy=live_ocean_adventure&frompage=room&_wv=8192&anchorid=185595962&show_id=219c958020243282324c18deb4c9c9cb61b3f198b5d59acae5dc2f&room_id=39d9db842d283282314771dd",
                }
            }
        ]
    }
}]     
```

可以发现是在歌房里的一个名为 `live_ocean_adventure` 的 hippy 页，点击了 `broadcasting_online_KTV#comment_area#operating#click#0` 这个模块，hippy 在每次新增节点时都往新节点的 moduleExtra 里写入上一次的链路数据，这样会一直循环嵌套(假设最开始的链路数据为 A)，如下：  

```
节点1(链路A) -> 节点2(节点1(链路A)) -> 节点3(节点2(节点1(链路A))) -> ...
```

链路数据最开始为 1.5K，可以算出公式：

```
n == 1 时, f(1) = 1.5K
n > 1 时, f(n) = 1.5 * n + f(n-1)
```

![pythonFN](http://file.arvit.xyz/pythonFN.png)

在点击 20 次后，累加的数据已达到 315K 左右。  

找到对应开发同学，确认了操作如下：  

12.11 18:15 左右，发布了直播、歌房的海岛探险玩法，在该 hippy 页点消耗按钮时，hippy 侧往链路 webPath 内新建节点的同时塞了整条链路数据。如果用户没有退出直播、歌房，每点一次消耗按钮，webPath 会一直追加新节点，且该节点会带上上一次的整条链路信息，导致最终的链路数据过于庞大；  

由于直播、歌房的所有上报都会带上链路，每条上报的数据量过大，造成大量内存碎片，在后期申请大内存时不成功返回 NULL，后续直接访问空指针导致了 Crash。

## 0x2 处理
一、快速的修复措施：
* 让 hippy 侧在 webPath 里去除 trace_money 字段，12.16 19:35 左右已发布外网； 

发布后已无相关反馈。Crash 情况如下：  

```
* 12.15 19:35 - 23:59 期间，发生 100+ 次 Crash；
* 12.16 19:35，hippy 发布修复包；
* 12.16 19:35 - 至今，只在 12.16 20:10 发生 1 次，怀疑是包还没下载下来，目前拉不到 log，暂无法确定；
```

扫了外网此次两类数据过大的 Crash，合计共发生 1000+ 次 Crash，hippy 发布后只出现过 1 次，基本能确认该 bug 已修复，后续措施已提单待修改。

二、后续优化措施：
* 链路数据压缩；  
* 与 hippy 及产品侧梳理去除多余字段的上报；
* 客户端在链路 webPath 新增数据，以及数据上报时都检测大小，如果超过一定阈值，外网包丢弃数据并做技术上报，非外网包弹窗提示；

## 0x3 扩展

### 内存碎片  
复习一下 [内存碎片](https://baike.baidu.com/item/%E5%86%85%E5%AD%98%E7%A2%8E%E7%89%87) 相关的知识，空闲内存碎片存在的方式有两种：
* 内部碎片：  
因为所有的内存分配必须起始于可被 4、8 或 16 整除（视处理器体系结构而定）的地址或者因为MMU的分页机制的限制，决定内存分配算法仅能把预定大小的内存块分配给客户。假设当某个客户请求一个 43 字节的内存块时，因为没有适合大小的内存，所以它可能会获得 44字节、48字节等稍大一点的字节，因此由所需大小四舍五入而产生的多余空间就叫内部碎片；

* 外部碎片：  
频繁的分配与回收物理页面会导致大量的、连续且小的页面块夹杂在已分配的页面中间，就会产生外部碎片。假设有一块一共有100个单位的连续空闲内存空间，范围是0~99。如果你从中申请一块内存，如10个单位，那么申请出来的内存块就为0~9区间。这时候你继续申请一块内存，比如说5个单位，第二块得到的内存块就应该为10~14区间。如果你把第一块内存块释放，然后再申请一块大于10个单位的内存块，比如说20个单位。因为刚被释放的内存块不能满足新的请求，所以只能从15开始分配出20个单位的内存块。现在整个内存空间的状态是0~9空闲，10~14被占用，15~34被占用，35~99空闲。其中0~9就是一个内存碎片了。如果10~14一直被占用，而以后申请的空间都大于10个单位，那么0~9就永远用不上了，变成外部碎片。

![](http://file.arvit.xyz/16086163818578.jpg)

地址空间限制是有的，但是 malloc 通常情况下申请到的空间达不到地址空间上限。内存碎片会影响到你“一次”申请到的最大内存空间。比如你有 10M 空间，申请两次 2M，一次 1M，一次 5M 没有问题。但如果你申请两次 2M，一次 4M，一次 1M，释放 4M，那么剩下的空间虽然够 5M，但是由于已经不是连续的内存区域，malloc 也会失败。

### objc_msgSend   

> 先抛一个问题：`objc_msgSend` 的内部实现为什么必须为汇编？  

objc_msgSend 流程：  

> 前面已经说过，在 OC 里，方法最后会转化为 C 方法 `objc_msgSend`，其本质很简单，传入一个接受者对象实例 receiver 和方法名 selector，它就会按照以下步骤执行：  
* 获取 receiver 的类 Class；  
* 从 Class 的 Cache 里查找 selector 的方法实现（IMP），找到的话就调用，结束查找流程；
* 在 Class 的方法列表里面查找对应 selector 的方法实现（IMP），找到的话就调用，并加入缓存，结束查找流程；  
* 找不到就在其父类中找，重复前面的步骤（直到没有父类为止）；  
* 最后找不到再走三步消息转发流程；  

举个例子，有这样两个函数：  

```
void func_1(int i) {
}

int func_2(float f) {
    return 0;
}
```

然后这样实现：  
```
void funcs_caller(int func_id, void *args, void **ret) {
    // 决定调用哪个函数
    void *func_ptr;
    switch(func_id) { // func_id 相当于 @selector
        case 1:
            func_ptr = (void*)(&func_1);
        break;
        case 2:
            func_ptr = (void*)(&func_2);
        break;
    }
    // 找到 IMP: func_ptr，接下来应该传什么参数，返回什么值？
}
```

以上通过 func_id（相当于 @selector）来决定调用哪个 IMP（func_ptr）。由于 func_1、func_2 是两个完全不同的方法，就算我已经找好了 func_ptr，但我不知道应该传入什么参数，返回什么值。

如果有且只有两个函数的情况，可以这样实现：  

```
void funcs_caller(int func_id, void *args, void **ret) {
    // 决定调用哪个函数
    void *func_ptr;
    switch(func_id) {
        case 1:
            (void*(int))(func_ptr((int)args[0]));
        break;
        case 2:
            **ret = (int)((int*(float))func_ptr((float)args[0]));
        break;
    }
}
```

但是 `objc_msgSend` 这个方法必须考虑所有情况，而所有情况是没办法通过 switch、if-else 来穷举的。

一个方法（函数）的 signature，指的是一个函数的返回值、输入参数这两个信息的组合，所以 `objc_msgSend` 这个方法之所以无法用汇编以外的语言来实现，是因为： 
 
> C 语言里，任何的函数调用，必须在编译时在调用的地方提供明确的 signature：  
> 1、返回值明确，指的是返回值类型；  
> 2、参数明确，指的是参数的个数，及每个参数的类型；  

换句话说，我们可以通过 selector 找到调用的 IMP（一个变量，可以在运行时才决定，手段就是把一个函数当做一种数据，通过函数指针的方式来传递），但是它的返回值必须在编译时写明白。  

`objc_msgSend` 最终的实现，是在内部使用汇编，把所有的对栈、寄存器的操作倒回到 `objc_msgSend` 执行开始的状态，直接 `jump/call` 到 IMP 函数指针对应的地址执行指令，因为那时候所有的参数已经被设置好了。

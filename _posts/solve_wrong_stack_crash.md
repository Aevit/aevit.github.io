---
title: 通过反编译排查堆栈偏移过大的 Crash  
date: 2022-01-07 23:27:55  
tags: [比特海,iOS,Crash,反编译]  
category: 比特海    
layout: post  

---

## 0x0 前言
外网新增一个 Crash，数量较多，短时间内就上升到 Top2，需要尽快排查修复。  

<!--more-->

Crash 堆栈如下：  

```
Thread 21 Crashed: 
0 QQKSong 0x0000000105dad868 +[UIView(GDTExtensions) isDisplayedInScreen:] + 179108
1 QQKSong 0x0000000105d9dc88 +[UIView(GDTExtensions) isDisplayedInScreen:] + 114628
2 QQKSong 0x0000000105da1514 +[UIView(GDTExtensions) isDisplayedInScreen:] + 129104
3 QQKSong 0x0000000105da226c +[UIView(GDTExtensions) isDisplayedInScreen:] + 132520
4 QQKSong 0x0000000105da2b4c +[UIView(GDTExtensions) isDisplayedInScreen:] + 134792
5 QQKSong 0x0000000105d8d624 +[UIView(GDTExtensions) isDisplayedInScreen:] + 47456
6 QQKSong 0x0000000105d8e414 +[UIView(GDTExtensions) isDisplayedInScreen:] + 51024
7 QQKSong 0x0000000105d8e0f4 +[UIView(GDTExtensions) isDisplayedInScreen:] + 50224
8 QQKSong 0x0000000105d8e2d4 +[UIView(GDTExtensions) isDisplayedInScreen:] + 50704
9 QQKSong 0x0000000105d90ee8 +[UIView(GDTExtensions) isDisplayedInScreen:] + 61988
10 QQKSong 0x0000000105d914dc +[UIView(GDTExtensions) isDisplayedInScreen:] + 63512
11 QQKSong 0x0000000105d919a0 +[UIView(GDTExtensions) isDisplayedInScreen:] + 64732
12 QQKSong 0x0000000105da5abc +[UIView(GDTExtensions) isDisplayedInScreen:] + 146936
13 QQKSong 0x0000000105d886dc +[UIView(GDTExtensions) isDisplayedInScreen:] + 27160
14 QQKSong 0x0000000105da5990 +[UIView(GDTExtensions) isDisplayedInScreen:] + 146636
15 QQKSong 0x0000000105d93270 +[UIView(GDTExtensions) isDisplayedInScreen:] + 71084
16 CFNetwork 0x00000001aa43b8e4 _CFNetServiceBrowserSearchForServices + 75936
17 CFNetwork 0x00000001aa44c3b4 __CFHTTPMessageSetResponseProxyURL + 9332
8 libdispatch.dylib 0x00000001a9a7d298 __dispatch_call_block_and_release + 24
10 libdispatch.dylib 0x00000001a9a7e280 __dispatch_client_callout + 16
10 libdispatch.dylib 0x00000001a9a5a4f0 __dispatch_lane_serial_drain$VARIANT$armv81 + 568
21 libdispatch.dylib 0x00000001a9a5b010 __dispatch_lane_invoke$VARIANT$armv81 + 456
12 libdispatch.dylib 0x00000001a9a64800 __dispatch_workloop_worker_thread + 692
13 libsystem_pthread.dylib 0x00000001f24eb5a4 __pthread_wqthread + 272
14 libsystem_pthread.dylib 0x00000001f24ee874 _start_wqthread + 8
SEGV_ACCERR
```

以上堆栈表面上看起来像是子线程调用 `+[UIView(GDTExtensions) isDisplayedInScreen:]`，且该方法循环调用了，不过看后面的偏移量较大，如有些偏移量为 `+ 179108`，不太正常。  

该分类名为 `GDTExtensions`，为 AMS SDK 内的文件，问了 SDK 侧要到源码，该分类的代码量实际也没那么多，且基本不存在循环调用的可能。  

此时无法知道 Crash 具体是在哪里，下面将简单介绍如何排查这种堆栈偏移量过大的问题。  

PS: 这里分享一个小技巧，如何通过一个方法名或是类名等，找到是在哪个二进制文件内：  

```
$ cd ~/your_proj_path
$ grep -r GDTExtensions .
Binary file ./Pods/AMSSDK/AMSSDK/lib/libGDTMobTangramSDK.a matches
```

## 0x1 Crash 关键信息   

这里先贴一下其它 Crash 关键信息：

Crash 版本、架构、访问的地址及还原前堆栈：  

```
Version: 7.24.20.631_JAIL(TestFlight)
Code Type: ARM-64 (Native)
Exception Codes: SEGV_ACCERR at 000000000000000000

Thread 21 Crashed: 
0  QQKSong                        0x0000000105dad868 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2930176
1  QQKSong                        0x0000000105d9dc88 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2865696
2  QQKSong                        0x0000000105da1514 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2880176
3  QQKSong                        0x0000000105da226c _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2883584
4  QQKSong                        0x0000000105da2b4c _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2885856
5  QQKSong                        0x0000000105d8d624 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2798528
6  QQKSong                        0x0000000105d8e414 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2802096
7  QQKSong                        0x0000000105d8e0f4 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2801296
8  QQKSong                        0x0000000105d8e2d4 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2801776
9  QQKSong                        0x0000000105d90ee8 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2813056
10 QQKSong                        0x0000000105d914dc _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2814576
11 QQKSong                        0x0000000105d919a0 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2815808
12 QQKSong                        0x0000000105da5abc _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2898000
13 QQKSong                        0x0000000105d886dc _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2778224
14 QQKSong                        0x0000000105da5990 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2897712
15 QQKSong                        0x0000000105d93270 _ZN9audiobase9AudioHttp13AudioHttpImpl10threadFuncEPv + 2822160
16 CFNetwork                      0x00000001aa43b8e4 CFNetServiceBrowserSearchForServices + 75932
17 CFNetwork                      0x00000001aa44c3b4 _CFHTTPMessageSetResponseProxyURL + 9328
8  libdispatch.dylib              0x00000001a9a7d298 0x00000001a9a1d000 + 393872
10 libdispatch.dylib              0x00000001a9a7e280 0x00000001a9a1d000 + 397952
10 libdispatch.dylib              0x00000001a9a5a4f0 0x00000001a9a1d000 + 251120
21 libdispatch.dylib              0x00000001a9a5b010 0x00000001a9a1d000 + 253968
12 libdispatch.dylib              0x00000001a9a64800 0x00000001a9a1d000 + 292864
13 libsystem_pthread.dylib        0x00000001f24eb5a4 _pthread_wqthread + 268
14 libsystem_pthread.dylib        0x00000001f24ee874 start_wqthread + 4
```

寄存器信息：  

```
Thread 21 crashed with ARM 64 Thread State:
     x0:  000000000000000000    x1: 0x000000016e79d97c    x2: 000000000000000000     x3: 0x000000016e79db44
     x4:  0x000000000000c413    x5: 000000000000000000    x6: 000000000000000000     x7: 000000000000000000
     x8:  0x0000000000000009    x9: 0x00000001f5a48954   x10: 000000000000000000    x11: 0x000000007a200000
    x12: 0x00000000000000c0    x13: 0x0000000000000001   x14: 0x000000000000001b    x15: 0x000000000000007e
    x16: 0xffffffffffffffe1    x17: 0x00000001a9d355d8   x18: 000000000000000000    x19: 0x0000000280f66400
    x20: 0x00000002800292a0    x21: 0x00000001f590b2d4   x22: 0x00000000feedfacf    x23: 0x875f6484f469a2a6
    x24: 0x000000010c950000    x25: 000000000000000000   x26: 000000000000000000    x27: 0x000000010a4eb4a8
    x28: 0x000000010b5ea000    fp: 0x000000016e79dba0    lr: 0x0000000105dad838    
    sp: 0x000000016e79db10     pc: 0x0000000105dad868 +[UIView(GDTExtensions) isDisplayedInScreen:] +  179108
```

QQKSong 地址段：  

```
0x1021d8000 - 0x10a35ffff +QQKSong arm64 <8e69fce9d64730278f0e08c45fb22df5> /private/var/containers/Bundle/Application/A09F4678-9FE1-403A-B457-07372E6C83DE/QQKSong.app/QQKSong
```

## 0x2 手动还原堆栈
### symbolicatecrash 还原全部堆栈

1、找到 `symbolicatecrash` 位置 

```
find /Applications/Xcode.app -name symbolicatecrash -type f
```

结果类似：

```
/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/iOSSupport/Library/PrivateFrameworks/DVTFoundation.framework/Versions/A/Resources/symbolicatecrash
/Applications/Xcode.app/Contents/Developer/Platforms/WatchSimulator.platform/Developer/Library/PrivateFrameworks/DVTFoundation.framework/symbolicatecrash
/Applications/Xcode.app/Contents/Developer/Platforms/AppleTVSimulator.platform/Developer/Library/PrivateFrameworks/DVTFoundation.framework/symbolicatecrash
/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Library/PrivateFrameworks/DVTFoundation.framework/symbolicatecrash
/Applications/Xcode.app/Contents/SharedFrameworks/DVTFoundation.framework/Versions/A/Resources/symbolicatecrash
```

`SharedFrameworks` 路径下的为需要的：  

```
/Applications/Xcode.app/Contents/SharedFrameworks/DVTFoundation.framework/Versions/A/Resources/symbolicatecrash
```

2、执行命令

将还原前的 crash 堆栈、dsym 文件放到同一个目录，然后执行：  

```
/Applications/Xcode.app/Contents/SharedFrameworks/DVTFoundation.framework/Versions/A/Resources/symbolicatecrash origin.crash QQKSong.app.dSYM > result.crash
```

如果报以下错误：  

```
Error: "DEVELOPER_DIR" is not defined at ./symbolicatecrash line 69.
```

则设置一下环境变量再跑一次上面那命令还原堆栈：  

```
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
```

### atos 还原某行堆栈

使用 `atos` 命令，或使用 [dSYMTools](https://github.com/answer-huang/dSYMTools)

```
atos -o executable -arch architecture -l loadAddress address
```

### 小结
以上还原堆栈的结果，跟 bugly 还原的结果一致，都为该分类方法，且偏移量同样过大，所以手动还原堆栈无法解决问题。  

根据上面的其它关键 Crash 信息，我们可以看到 pc 寄存器的地址为 `0x0000000105dad868`，是落在 QQKSong 地址段内的：   

```
0x1021d8000 - 0x10a35ffff +QQKSong arm64 <8e69fce9d64730278f0e08c45fb22df5> /private/var/containers/Bundle/Application/A09F4678-9FE1-403A-B457-07372E6C83DE/QQKSong.app/QQKSong
```

> pc 寄存器: 保存 CPU 将要执行的下一条指令的地址，也就是即将要执行的指令代码。 

所以接下来尝试进行反编译来获取 Crash 时的具体位置。  

## 0x3 反编译
使用 `Hopper Disassembler` 进行反编译，可以去其[官网](https://hopperapp.com/)下载，免费版可以每次使用半小时，基本够我们进行分析了（良心软件）。  

### 计算真实地址  
因为 Apple 使用了 ASLR（下面会讲到什么是 ASLR），每次启动时的二进制地址都会随机偏移，所以我们需要先解出 pc 寄存器在二进制文件内的真实地址，结果如下（下面 `0x0021d8000` 为 QQKSong 地址段首地址 `0x1021d8000 - 0x100000000`，为什么要减去 `0x100000000` 后面 ASLR 部分会有说明）：  

```
(0x0000000105dad868-0x0021d8000).toString(16) = 0x103bd5868
```

![](http://file.arvit.xyz/16306718396687.jpg)

### 反汇编结果  
我们找到 ipa 里的 QQKSong 二进制文件，丢进 Hopper，等加载完成后，按 `G` 键，跳转到上面计算出的地址 `0x103bd5868`，结果如下：  

![](http://file.arvit.xyz/16306727554773.jpg)

挂在这条汇编指令，很明显是 `+[TSEnvironmentXXQ injectingImageNames]` 附近代码导致的 Crash：  

```
0000000103bd5868 ldr x20, [x26]   ; CODE XREF=+[TSEnvironmentXXQ injectingImageNames]+368
```

### 汇编指令分析  
上述汇编指令表示将 `x26` 寄存器的值赋值给 `x20`，上面我们知道 Crash 时访问的地址为 `0x000000000000000000`：  

```
Exception Codes: SEGV_ACCERR at 000000000000000000
```

根据以往经验，这里 `x26` 有可能为一个 C++ 空指针，访问空指针时发生了 Crash。我们继续往上看其它汇编指令，看 `x26` 的值是从哪里来的：  

```
0000000103bd584c ldr x26, [x24, #0x60]
```

该指令表示取 `x24` 偏移 `0x60` 个地址的数据赋值给 `x26`，这种可以猜测是访问 `x24` 内某个成员变量。所以这里大致可以推测出这样的伪代码：  

```
struct x24 = xxx; // 某个结构体实例  
struct x26 = x24->0x60_member; // 访问了 +0x60 的成员变量，此时 x26 的值为 NULL  
x20 = NULL->first_addr; // 访问了 x26（此时为 NULL）的首地址，此时就 Crash 了  
```

从 Hopper 看到的伪代码也基本符合我们预期，不过这里有更进一步的信息，Crash 是挂在一个循环内的第一句代码：  

![](http://file.arvit.xyz/16306729296498.jpg)

### 源码分析  
然后就找到 SDK 同学要到该方法源码如下：  

![wecom-temp-98028fcc0014e9f72608aea994b48464](http://file.arvit.xyz/wecom-temp-98028fcc0014e9f72608aea994b48464.png)

![](http://file.arvit.xyz/16306738880807.jpg)

结合上面的推测，这里 Crash 基本就确定是因为 `p_uuid_info` 为 NULL 了。   

这里的寄存器相关对应关系如下：  

```
x26: p_uuid_info  
x24: infos  
x24+0x60: infos->uuidArray  
```

由于是系统方法，所以只能进行规避：进行空指针的判断，为空则不执行下一步逻辑。  

## 0x4 ASLR 介绍  
什么是 ASLR？  
* Address Space Layout Randomization，地址空间布局随机化。
* 是一种通过增加攻击者预测目的地址难度，防止攻击者直接定位攻击代码位置，达到阻止溢出攻击的目的的一种技术。
* MachO 可执行文件**每次启动的起始地址**不一样。
* 苹果从 iOS 4.3 之后引入了 ASLR 技术，也就是说把 Mach-O 载入内存后，所有的地址都会经过 ASLR 偏移。  

Mach-O 文件 Header、Load Commmands、Data 由三部分组成，如下图所示：  

![](http://file.arvit.xyz/16308326909197.jpg)

> Mach-O 内容也可以通过此工具查看: [MachO-Explorer](https://github.com/DeVaukz/MachO-Explorer)

* `Header`: 位于 Mach-O 文件的开始位置，包含了该文件的基本信息，如目标架构，文件类型，加载指令数量和 dyld 加载时需要的标志位。可以使用 otool 命令查看内容：    

    ```
    $ otool -v -h QQKSong.app/QQKSong
    
    Mach header
          magic  cputype cpusubtype  caps    filetype ncmds sizeofcmds      flags
    MH_MAGIC_64    ARM64        ALL  0x00     EXECUTE    85       9248   NOUNDEFS DYLDLINK TWOLEVEL WEAK_DEFINES BINDS_TO_WEAK PIE MH_HAS_TLV_DESCRIPTORS
    ```

* `Load Commands`: 包含 Mach-O 里命令类型信息，名称和二进制文件的位置。可以使用 otool 命令查看内容：  
    
    ```
    $ otool -v -l QQKSong.app/QQKSong
    ```

* `Data`: 由 Segment 的数据组成，是 Mach-O 占比最多的部分，有代码有数据，比如符号表。Data 共三个 Segment，TEXT、DATA、LINKEDIT。其中 TEXT 和 DATA 对应一个或多个 Section，LINKEDIT 没有 Section，需要配合 LC_SYMTAB 来解析 symbol table 和 string table，包含 dyld 所需各种数据，比如符号表、间接符号表、rebase 操作码、绑定操作码、导出符号、函数启动信息、数据表、代码签名等。这些里面是 Mach-O 的主要数据。下面介绍几条有用的命令：  

    ```
    # 查看内容分布
    $ xcrun size -x -l -m QQKSong.app/QQKSong
    
    # 查看某个 Section 内容
    $ xcrun otool -s __TEXT __text QQKSong.app/QQKSong
    
    # 查看 Mach-O 汇编内容（注：QQKSong 二进制输出结果大小有 1.23GB）  
    xcrun otool -v -t QQKSong.app/QQKSong  
    ```

Mach-O 结构及 ASLR 地址偏移图解如下：  

![](http://file.arvit.xyz/16309331449640.jpg)

根据上图可以知道，前面计算真实地址为什么要减去 `0x100000000`，主要就是 `__PAGESIZE` 的大小，该大小为 4GB，也即 `0x100000000`，从 Hopper 也可以看到其是从 0x100000000 开始解析的：  

![](http://file.arvit.xyz/16306723270020.jpg)

## 0x5 参考资料

[https://ming1016.github.io/2020/03/29/apple-system-executable-file-macho/](https://ming1016.github.io/2020/03/29/apple-system-executable-file-macho) 
 
[https://alvinzhu.me/2017/07/22/start-from-launch.html](https://alvinzhu.me/2017/07/22/start-from-launch.html)
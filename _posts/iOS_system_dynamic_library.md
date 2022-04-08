---
title: 反编译 iOS 系统库二进制文件  
date: 2022-03-01 22:23:45  
tags: [比特海,iOS,Crash,反编译]  
category: 比特海    
layout: post  

---

## 前言
有时一些 Crash 是挂在系统库，如 CoreFoundation 里，因为是闭源的，没法直接分析代码。不过我们可以找到对应系统库的二进制文件进行反编译，查看对应汇编指令，结合 Crash 时的一些寄存器，以此猜测其执行流程。  

<!--more-->

笔者较常使用的反编译工具是 [https://hopperapp.com/](https://hopperapp.com/)，免费版本每次可使用半小时，时间到后重新打开即可。  
 
## 模拟器
模拟器相对简单些，以 Xcode 13.2.1 为例，其路径为：  

```
/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Library/Developer/CoreSimulator/Profiles/Runtimes/iOS.simruntime/Contents/Resources/RuntimeRoot
```

以下是该目录存放库的几个主要子目录：  

* `/System/Library/Framework`: 公开 Framework  
* `/System/Library/PrivateFrameworks`: 私有 Framework  
* `/Applications`: 系统 App  
* `/usr/lib`: UNIX 动态库  

如 CoreFoundaion 二进制文件的存放路径为:   

```
/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Library/Developer/CoreSimulator/Profiles/Runtimes/iOS.simruntime/Contents/Resources/RuntimeRoot/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation
```

将之丢进 Hopper 里分析即可。  

## 真机

### 找到 dyld_shared_cache
为了加快动态库的加载及减少磁盘体积占用，系统启动后会将一些动态库等 Mach-O 合并到一起作为缓存，合并后的二进制为 `dyld_shared_cache` （名字后面可能还会跟着架构名，如 `dyld_shared_cache_arm64e`） ，其路径为（不同机器可能会有点不一样）：  

```
/System/Library/Caches/com.apple.dyld/dyld_shared_cache_arm64e
```

详情可查看 [https://iphonedev.wiki/index.php/Dyld_shared_cache](https://iphonedev.wiki/index.php/Dyld_shared_cache)

所以我们只要拿到 dyld_shared_cache，再用一个工具提取出来即可。拿到这个文件有两种方式：  

* 越狱机器，可直接去上面说的路径拿到；  
* 非越狱机器，可下载对应机器、版本的 ipsw 固件文件，将之解压出来，内容如下：  

```
$ ls -al ~/Desktop/dyld/iPhone13,4_15.1.1_19B81_Restore
total 12797448
-rw-r--r--@  1 arvit  staff  6288418354  1  9  2007 018-98837-002.dmg
-rw-r--r--@  1 arvit  staff   122287131  1  9  2007 018-98846-002.dmg
-rw-r--r--@  1 arvit  staff   124443675  1  9  2007 018-98854-002.dmg
-r--r--r--@  1 arvit  staff      300291  1  9  2007 BuildManifest.plist
drwxr-xr-x@ 36 arvit  staff        1152  1  9  2007 Firmware
-r--r--r--@  1 arvit  staff        1029  1  9  2007 Restore.plist
-rw-r--r--@  1 arvit  staff    16827567  1  9  2007 kernelcache.release.iphone13
```

找到最大的一个 dmg 文件打开，如上面 6G 多的 `018-98837-002.dmg`，内容如下：  

```
$ ls -al /Volumes/SkyB19B81.D54pOS
drwxrwxr-x  120 arvit  staff  3840 11 12 09:26 Applications
drwxrwxr-x    2 arvit  staff    64 11 12 08:33 Developer
drwxr-xr-x   21 arvit  staff   672 11 12 09:26 Library
drwxr-xr-x    5 arvit  staff   160 11 12 09:26 System
drwxr-xr-x    4 arvit  staff   128 11 12 09:33 bin
drwxrwxr-t    2 arvit  staff    64 11 12 08:33 cores
dr-xr-xr-x    2 arvit  staff    64 11 12 08:33 dev
lrwxr-xr-x    1 arvit  staff    11 11 12 09:33 etc -> private/etc
drwxr-xr-x    7 arvit  staff   224 11 12 09:33 private
drwxr-xr-x   18 arvit  staff   576 11 12 09:33 sbin
lrwxr-xr-x    1 arvit  staff    15 11 12 09:33 tmp -> private/var/tmp
drwxr-xr-x    9 arvit  staff   288 11 12 09:33 usr
lrwxr-xr-x    1 arvit  staff    11 11 12 09:33 var -> private/var
```

dyld_shared_cache 路径同样是上述所说的：  

```
/System/Library/Caches/com.apple.dyld/dyld_shared_cache_arm64e
```

### 生成提取工具
找到 dyld_shared_cache 后我们需要将之还原出来。  

由于 dyld 是开源的，所以我们可以拿源码自己编译工具来进行提取，其开源代码可在 [https://opensource.apple.com/tarballs/dyld/](https://opensource.apple.com/tarballs/dyld/) 下载，解压。  

* 查找 `dsc_extractor.cpp`：  

```
$ cd ~/Desktop/dyld/dyld-852.2
$ find . -name "dsc_extractor.cpp"
./dyld3/shared-cache/dsc_extractor.cpp
```

* 使用 `clang++` 生成可执行指令：  

```
$ clang++ dyld3/shared-cache/dsc_extractor.cpp
./dyld3/shared-cache/dsc_extractor.cpp:40:10: fatal error: 'CodeSigningTypes.h' file not found
#include "CodeSigningTypes.h"
         ^~~~~~~~~~~~~~~~~~~~
1 error generated.
```

报错了，我们只需要提取功能就可以，所以需要修改该 cpp 文件，只保留相关代码。该代码在文件最下方（注意 `#if 0` 及下面的 `#endif` 也去掉），最终保留的代码如下：  

```
// test program
#include <stdio.h>
#include <stddef.h>
#include <dlfcn.h>


typedef int (*extractor_proc)(const char* shared_cache_file_path, const char* extraction_root_path,
                              void (^progress)(unsigned current, unsigned total));

int main(int argc, const char* argv[])
{
    if ( argc != 3 ) {
        fprintf(stderr, "usage: dsc_extractor <path-to-cache-file> <path-to-device-dir>\n");
        return 1;
    }

    //void* handle = dlopen("/Volumes/my/src/dyld/build/Debug/dsc_extractor.bundle", RTLD_LAZY);
    void* handle = dlopen("/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/usr/lib/dsc_extractor.bundle", RTLD_LAZY);
    if ( handle == NULL ) {
        fprintf(stderr, "dsc_extractor.bundle could not be loaded\n");
        return 1;
    }

    extractor_proc proc = (extractor_proc)dlsym(handle, "dyld_shared_cache_extract_dylibs_progress");
    if ( proc == NULL ) {
        fprintf(stderr, "dsc_extractor.bundle did not have dyld_shared_cache_extract_dylibs_progress symbol\n");
        return 1;
    }

    int result = (*proc)(argv[1], argv[2], ^(unsigned c, unsigned total) { printf("%d/%d\n", c, total); } );
    fprintf(stderr, "dyld_shared_cache_extract_dylibs_progress() => %d\n", result);
    return 0;
}
```

好了，再来一次：  

```
$ clang++ dyld3/shared-cache/dsc_extractor.cpp
```

> 如果报 fprintf 及 stderr 等错误，再去上述代码里注释掉重新执行命令即可。   

最后没有报错后，生成可执行文件：  

```
clang++ -o dsc_extractor dsc_extractor.cpp
```

此时在 `dyld3/shared-cache` 目录下会生成一个 `dsc_extractor` 可执行文件。  

### 提取 dyld_shared_cache

命令用法：  

```
dsc_extractor 动态库文件路径 提取出来之后存放路径
```

执行命令： 

```
$ ./dsc_extractor /Volumes/SkyB19B81.D54pOS/System/Library/Caches/com.apple.dyld/dyld_shared_cache_arm64e arm64e
```

之后就可以找到对应的二进制文件，如 CoreFoundation：  

```
./arm64e/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation
```

最后就可以把这二进制文件丢进 Hopper 里进行分析了。  

## 附录

汇编指令手册查询:  
https://developer.arm.com/documentation/dui0801/g/A64-General-Instructions/BL

iOS 崩溃日志在线符号化实践:  
https://jishuin.proginn.com/p/763bfbd66433
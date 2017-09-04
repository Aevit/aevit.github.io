---
title: iOS冷知识汇总  
date: 2016-08-30 20:57:52  
tags: [比特海,iOS,冷知识]  
category: 比特海  
layout: post  

---

## 前言

本文主要收录iOS开发的一些冷知识（不定期更新）

<!--more-->

### dispatch_after 是延时入队，不是延时执行

假设队列中间休眠了`4秒`，`dispatch_after` 的时间为`2秒`；  
则`dispatch_after` 里的内容会在`6秒`后才执行，而不是`2秒`后执行。

要正确理解 `延时入队` 及 `延时执行` 的概念。

验证代码如下：


```
dispatch_queue_t queue = dispatch_queue_create("xyz.aevit.gcd.after", DISPATCH_QUEUE_SERIAL);
    
NSLog(@"1. before test");
    
dispatch_async(queue, ^{
    sleep(4);
    NSLog(@"2. done sleep");
});
    
dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), queue, ^{
    NSLog(@"3. dispatch_after");
});
```


运行结果：

> 环境：OS X 10.11.5 / Xcode 7.3.1 (7D1014) / iPhone Simulator iPhone 6s Plus

![image](http://aevit.qiniudn.com/31735bc704b26f447f69bcbf583e7f641472558461.jpeg)

* * *

### nil、Nil、NULL、NSNull 的区别

`nil`：指向一个对象的指针为空，如: NSString _name = nil;  
`Nil`：指向一个类的指针为空，如: Class aClass = Nil;  
`NULL`：指向C类型的指针为空, 如: int_pInt = NULL;  
`NSNull`：在 `Objective-C` 中是一个类，只是名字中有个Null，多用于集合(NSArray,NSDictionary)中值为空的对象

* * *

### 禁止程序运行时自动锁屏


```
[[UIApplication sharedApplication] setIdleTimerDisabled:YES];
```


* * *

### CocoaPods慢的问题


```
pod install --verbose --no-repo-update 
pod update --verbose --no-repo-update
```


如果不加后面的参数，默认会升级CocoaPods的spec仓库，加一个参数可以省略这一步，然后速度就会提升不少

* * *

### dispatch_group 添加任务

分为2种情况：

1、能获取到 `queue变量`（如自己创建的队列）：使用 `dispatch_group_async` 即可：


```
dispatch_group_async(group, queue, ^{
    // do sth
});
```


2、无法获取到 `queue变量`：使用 `dispatch_group_enter` `dispatch_group_leave`：

如 `AFNetworking` 的队列：


```
AFHTTPRequestOperationManager *manager = [AFHTTPRequestOperationManager manager];

//Enter group
dispatch_group_enter(group);
[manager GET:@"http://www.baidu.com" parameters:nil success:^(AFHTTPRequestOperation *operation, id responseObject) {
    //Deal with result...

    //Leave group
    dispatch_group_leave(group);
}    failure:^(AFHTTPRequestOperation *operation, NSError *error) {
    //Deal with error...

    //Leave group
    dispatch_group_leave(group);
}];
```


PS：如果要把一个异步任务加入到 `group` ，以下写法是不行的：


```
dispatch_group_async(group, queue, ^{
    [self performBlock:^(){
        block();
    }];
    //未执行到block() group任务就已经完成了
});
```


需要这样写：


```
dispatch_group_enter(group);
[self performBlock:^(){
    block();
    dispatch_group_leave(group);
}];
```


### `dispatch_group` 为 `AFNetworking` 实现同步任务


```
dispatch_group_t group = dispatch_group_create();

dispatch_group_enter(group);
AFHTTPRequestOperation *operation1 = [[AFHTTPRequestOperation alloc] initWithRequest:request1];
[operation1 setCompletionBlockWithSuccess:^(AFHTTPRequestOperation *operation, id responseObject) {
    // your code here...
    dispatch_group_leave(group);
}];
[operation1 start];

dispatch_group_enter(group);
AFHTTPRequestOperation *operation2 = [[AFHTTPRequestOperation alloc] initWithRequest:request1];
[operation2 setCompletionBlockWithSuccess:^(AFHTTPRequestOperation *operation, id responseObject) {
    // your code here...
    dispatch_group_leave(group);
}];
[operation2 start];

dispatch_group_wait(group, DISPATCH_TIME_FOREVER);
dispatch_release(group);
```


### 数组按某个 key 重新分组

假设有这样的数组：


```
NSArray *originArray = @[
           @{@"name": @"Pandara", @"gender": @"male"},
           @{@"name": @"Helkyle", @"gender": @"male"},
           @{@"name": @"Aevit", @"gender": @"male"},
           
           @{@"name": @"SonYeJin", @"gender": @"female"}
          ];
```


要按 `gender` 这个键对应的值重新分组成如下结构（即值为 `male` 的归为一组，`female` 的归为另一组）：


```
@[
  @[
      @{@"name": @"Pandara", @"gender": @"male"},
      @{@"name": @"Helkyle", @"gender": @"male"},
      @{@"name": @"Aevit", @"gender": @"male"}
    ],
  @[
      @{@"name": @"SonYeJin", @"gender": @"female"}
    ]
];
```


可以使用如下方法：


```
- (NSArray*)reGroupArray:(NSArray*)array withFieldName:(NSString*)fieldName {
    NSMutableDictionary *groupDict = [NSMutableDictionary dictionary];
    for (id aData in array) {
        NSString *theKey = [aData valueForKey:fieldName];
        NSMutableArray *theArr = groupDict[theKey];
        if (!theArr) {
            theArr = [NSMutableArray array];
            groupDict[theKey] = theArr;
        }
        [theArr addObject:aData];
    }
    return [groupDict allValues];
}
```


像这样使用即可：


```
NSArray *finalArr = [self reGroupArray:originArray withFieldName:@"gender"];
```


PS：如果只是要取出`指定值`的数据（如取出全部 `gender == male` 的数据），可以使用正则：


```
NSArray *malesArr = [originArray filteredArrayUsingPredicate:[NSPredicate predicateWithFormat:@"gender = %@", @"male"]];
```


### ATS 调试

*   在 `Edit Scheme` 的 `Run` 里添加环境变量 `CFNETWORK_DIAGNOSTICS = 1`，之后看控制台里的输出，会将网络请求（非常详细）写入一个文件里

*   使用 `nscurl` 命令，后面跟着要调试的网址，之后会列出 `NSAllowsArbitraryLoads、NSExceptionMinimumTLSVersion` 等的设置结果（PS：可在下面命令后面加上 `> ~/Desktop/ats.txt` 将内容输出到文件里） ，用法示例：

    
```
/usr/bin/nsurl --ats-diagnostics --verbose https://baidu.com
```

*   使用苹果的 [`TLSTool`](https://developer.apple.com/library/content/samplecode/sc1236/Introduction/Intro.html)（不过只能在 `Xcode 7` 编译…），用法示例：

        ./TLSTool s_client -connect www.baidu.com:443
        GET / HTTP/1.1
        Host: www.baidu.com

### LLDB

`watchpoint set v {obj_name}`: 设置观察点  
[`call (void)instrumentObjcMessageSends(YES)`](https://coderwall.com/p/7mopeq/log-all-messages-in-objective-c): 打印出所有运行时发送的消息（存在 /tmp/msgSend-xxxx 位置）

[熟练使用 LLDB，让你调试事半功倍](http://ios.jobbole.com/83393/)

* * *

<a class="http://aevit.qiniudn.com/9d8f73230a3cb6668f2f5c30a945b81a1472562023.jpeg" title="天空之镜">![](http://aevit.qiniudn.com/9d8f73230a3cb6668f2f5c30a945b81a1472562023.jpeg)</a>  
摄影：Aevit 2016年8月 茶卡盐湖
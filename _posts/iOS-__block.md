---
title: __block修饰符探究  
date: 2017-01-09 21:34:57  
tags: [比特海,iOS,__block,runtime]  
category: 比特海  
layout: post  

---

## 前言

我们知道，在 `block` 里面能读取外部变量，但是如果需要修改外部变量的值，需要给变量加上 `__block` 修饰符才行。

接下来让我们带着2个问题来研究一下：

1.  为什么不加 `__block` 就只能读取，不能修改（即：`block` 的实现，是怎么达到不能修改的）
2.  加了 `__block` 为什么就能修改

<!--more-->

* * *

## block 的实质

先举个例子：


```
int main(int argc, char * argv[]) {
    @autoreleasepool {
        int valA = 1;
        __block int valB = 11;
        void (^block)(void) = ^{
//            valA = 2;
            valB = 22;
            NSLog(@"%d, %d", valA, valB);
        };
        block();
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
    }
}
```


使用 `clang -rewrite-objc` 重写后，得到以下代码：


```
struct __Block_byref_valB_0 {
  void *__isa;
__Block_byref_valB_0 *__forwarding;
 int __flags;
 int __size;
 int valB;
};

struct __main_block_impl_0 {
  struct __block_impl impl;
  struct __main_block_desc_0* Desc;
  int valA;
  __Block_byref_valB_0 *valB; // by ref
  __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, int _valA, __Block_byref_valB_0 *_valB, int flags=0) : valA(_valA), valB(_valB->__forwarding) {
    impl.isa = &_NSConcreteStackBlock;
    impl.Flags = flags;
    impl.FuncPtr = fp;
    Desc = desc;
  }
};
static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
  __Block_byref_valB_0 *valB = __cself->valB; // bound by ref
  int valA = __cself->valA; // bound by copy


            (valB->__forwarding->valB) = 22;
            NSLog((NSString *)&__NSConstantStringImpl__var_folders_6p_1hbzwy3900vd5kkrph4hz29w0000gn_T_main_9fdbf1_mi_0, valA, (valB->__forwarding->valB));
        }
static void __main_block_copy_0(struct __main_block_impl_0*dst, struct __main_block_impl_0*src) {_Block_object_assign((void*)&dst->valB, (void*)src->valB, 8/*BLOCK_FIELD_IS_BYREF*/);}

static void __main_block_dispose_0(struct __main_block_impl_0*src) {_Block_object_dispose((void*)src->valB, 8/*BLOCK_FIELD_IS_BYREF*/);}

static struct __main_block_desc_0 {
  size_t reserved;
  size_t Block_size;
  void (*copy)(struct __main_block_impl_0*, struct __main_block_impl_0*);
  void (*dispose)(struct __main_block_impl_0*);
} __main_block_desc_0_DATA = { 0, sizeof(struct __main_block_impl_0), __main_block_copy_0, __main_block_dispose_0};
int main(int argc, char * argv[]) {
    /* @autoreleasepool */ { __AtAutoreleasePool __autoreleasepool; 

        int valA = 1;
        __attribute__((__blocks__(byref))) __Block_byref_valB_0 valB = {(void*)0,(__Block_byref_valB_0 *)&valB, 0, sizeof(__Block_byref_valB_0), 11};
        void (*block)(void) = ((void (*)())&__main_block_impl_0((void *)__main_block_func_0, &__main_block_desc_0_DATA, valA, (__Block_byref_valB_0 *)&valB, 570425344));
        ((void (*)(__block_impl *))((__block_impl *)block)->FuncPtr)((__block_impl *)block);



        return UIApplicationMain(argc, argv, __null, NSStringFromClass(((Class (*)(id, SEL))(void *)objc_msgSend)((id)objc_getClass("AppDelegate"), sel_registerName("class"))));
    }
}
```


看 `main` 函数里面的代码：  
![image](http://file.arvit.xyz/71dc6fd24fd4df90c1a91b2bb7d3b5b01483953745.jpeg)

可以看到，`block` 被转化成了一个 `__main_block_impl_0` 结构体对象；

上图中，调用该结构体的构造函数时，传入的第一个参数是一个 `__main_block_func_0` 类型的变量（这个 `__main_block_func_0` 是最终 `block` 里要执行的代码）将会由结构体里的 `FuncPtr` 成员接收，可以看到这是一个 `函数指针`；

看上图箭头处，之后 `调用 block` 就是通过这个 `函数指针` 去调用的，并且也会传入这个结构体对象：


```
((void (*)(__block_impl *))((__block_impl *)block)->FuncPtr)((__block_impl *)block);
```


以上简单介绍了一下 `main` 函数里的相关代码，附上该 `block` 的结构体构成：


```
struct __main_block_impl_0 {
  struct __block_impl impl;
  struct __main_block_desc_0* Desc;
  int valA;
  __Block_byref_valB_0 *valB; // by ref
  
  // 构造函数
  __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, int _valA, __Block_byref_valB_0 *_valB, int flags=0) : valA(_valA), valB(_valB->__forwarding) {
    impl.isa = &_NSConcreteStackBlock;
    impl.Flags = flags;
    impl.FuncPtr = fp;
    Desc = desc;
  }
};
```


其中结构体成员包括 `valA` 及 `valB`，不过 `valB` 的类型不是 `int`，这个我们后面会再说到。

### 小结

定义 `block` 后，实质会生成一个结构体对象；调用定义好的 `block`，实际就是通过这个结构体对象的函数指针（`FuncPtr`）去找到具体的实现。

* * *

## 不加 __block 修饰符

让我们先将之前 `main` 方法里的 `valB` 去掉：


```
int valA = 1;
void (^block)(void) = ^{
    NSLog(@"%d", valA);
};
block();
```


首先，让我们看一下转换后的 `main 方法相关代码`：

![image](http://file.arvit.xyz/05f4245c2d974ef16e6a1adbc36fab9b1484020226.png)

可以看到，调用构造函数时，第三个参数是直接使用 `valA` 的值的。

再看结构体的声明及其 `block` 里的实现

![image](http://file.arvit.xyz/141de79f08494688cf0ffb0fc3eaca4b1483953997.jpeg)

看图中上面的箭头处，构造函数初始化参数时，是直接使用 `val` 的值；

我们将 `block` 看做一个函数，看上图中下面的箭头处，`valA` 在 `block 函数` 里也有定义，其值跟 `外部的 valA` 一样；

此时 `block 函数` 及 `main 函数` 在内存中的分布大致如下：

![image](http://file.arvit.xyz/909bc774cc7f9dabaec21a300c6329831483955235.jpeg)

可以看到，`valA` 是在不同作用域的，这一点很关键。

这里谨记 **函数调用的内存机制**：

> 一个函数有一个函数自己的栈；如果函数和函数之间要共享内存，那这块被共享的内存不能在某一个函数的栈(stack)上，要在堆(heap)上

虽然在这里直接看转换后的代码， `struct` 里其实是可以修改内部的 `valA` 的，但是因为 `valA` 这个变量名，在内部和外部都存在，作用域是不同的，所以苹果在编译器层面就已经是禁止修改的。

### 小结

不加 `__block` 修饰时，`valA` 存在于多个不同的栈中，也就是说作用域不同，所以编译器才会禁止修改。

值得一提的是，我们上面举的例子是 `基本类型 int`，当换成 `对象类型`（如 `NSString`）时，转换后是 `const` 类型的，这是为什么？

![image](http://file.arvit.xyz/48610aa1b83836e1feea9dca0ce1e0db1483956237.png)

> 因为结构体的构造函数，只是把调用者（如上面的 `main函数` ）在栈上的 `valStr` 的 `指针地址` 传给了被调用者（如上面的 `block函数`）；
> 
> 如果不加const，那被调用者完全可能通过这个地址来修改这个捕获的对象的值，这个时候，如果被调用者的栈已经被回收了，那这个修改，就是在修改一处已经被回收的内存的内容，那就可能崩溃了。
> 
> PS: 这里为了演示方便，`block` 的定义跟调用都是写在 `main` 里。  
> 实际上多数情况下，`block` 是作为参数传递来做回调的；  
> （如在 `类 A 的实例方法 B` 中调用 `block`，如果 `B 方法` 的栈被回收了，这时再修改里面的局部变量就会崩溃了）。

还值得一提的是，如果修改的是这个指针所 `指向的对象的内容`，不加 `__block` 也是可以的，如：


```
NSMutableString *str = [NSMutableString stringWithString:@"DaGou"];  
void (^foo)(void) = ^{
    str.string = @"Aevit"; // 这里修改的是 堆 中的内容  
};
foo();
```


* * *

## 加 __block 修饰符

### 分析

根据上面相关说明，因为作用域不同，如果要能修改 `block` 里的值，有两种方法：

1.  调用者（如 `类 A 的实例方法 B`）在调用 `block` 时，把自己的栈里的 `val` 的值通过**地址**的方式传进去；

    这种情况有一个问题，那就是 `block` 没办法保证它自己存在的期间，`B 方法` 也是存在的；也就是说，当 `block` 跑到一半的时候，`B 方法` 的栈可能已经不在了；

2.  为了解决第一种带来的这种调用者和被调用者生命周期上的矛盾，于是引入了第二种方案：  
    把参数拷到 `heap` 上，这样一来，参数的存在与否，就不和调用者（`B 方法`）的栈的存在与否挂钩了；换言之就算 `B 方法` 的栈被回收了，这个时候 `heap` 上的 `val` 还是存在的。

### 验证

为了验证 `block` 里的 `valB` 到底是不是在堆里了，可以打印出地址算一下：

![image](http://file.arvit.xyz/acbac0f5084114ab374d66fa403ee2931484039915.png)

定义前的地址（`16fd77a68`）转成十进制： `6171359848`  
block 内的地址（`170220bb8`）转成十进制： `6176246712`

由此可知两者地址之间相差：  
`(6176246712 - 6171359848) / (1024 * 1024) = 4.66M`

由于 `iOS` 里主线程的栈是 `1M` （非主线程是 `512K`，`OS X` 的主线程是 `8M`）（[官方文档](https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/Multithreading/CreatingThreads/CreatingThreads.html)），所以`定义前`是在栈中，`block` 内及`定义后`就是在堆内了。

> PS: 还可通过 `pthread` 相关方法得到栈大小，可参考以下文章：  
> [苹果官方文档](https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man3/pthread.3.html)  
> [线程堆栈大小的使用介绍](http://blog.csdn.net/tennysonsky/article/details/48767415)

### 说明

下面我们结合代码来具体说明一下第二种方案：

现在我们只使用带有 `__block` 修饰符的 `valB`


```
__block int valB = 11;
void (^block)(void) = ^{
    valB = 22;
    NSLog(@"%d", valB);
};
block();
```


看下图，可以发现 `__block int valB = 11` 转换成了一个结构体 `__Block_byref_valB_0`，注意下图中上面的箭头，构造函数里传递的第二个参数是 `&valB`（即 `valB` 变量的首地址）：  
![image](http://file.arvit.xyz/8dd1d76676d2755f77b507351a93f9781484029267.png)

再看其它部分代码：  
![image](http://file.arvit.xyz/609c7734152c10ac49f87302cbbd2d841483965263.jpeg)

`__Block_byref_valB_0` 结构体声明如下：


```
struct __Block_byref_valB_0 {
  void *__isa;
__Block_byref_valB_0 *__forwarding;
 int __flags;
 int __size;
 int valB;
};
```


可以看到第二个参数是 `__Block_byref_valB_0 *__forwarding`，而刚才已经说了 `main` 函数里 `valB` 的构造函数里传递的第二个参数是 `&valB`，所以 `__forwarding` 这是该实例自身的引用，内存结构大致如下：

![image](http://file.arvit.xyz/308cc2d566a87ed0b8c1f12d565a21731484032183.jpeg)

根据我们之前的分析，经过 `block` 后，编译器会将 `valB` 拷贝至**堆**中，这时内存结构大致如下：

![image](http://file.arvit.xyz/0e1aaf58c44ca69abb63bb77f8dd65981483967160.jpeg)

其中栈中（包括 `block` 及 `main` ）的 `__forwarding` 指向堆中 `valB 实例` 首地址，堆中的 `valB 实例` 的 `__forwarding` 指向自身首地址。

再来看一下 `block` 里的具体代码实现，可以看到代码里已经是对堆里的内容进行修改了（使用 `valB->__forwarding->valB`）：


```
// block 里的具体定义
static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    __Block_byref_valB_0 *valB = __cself->valB; // bound by ref

    (valB->__forwarding->valB) = 22; // 修改的是堆里的内容
    NSLog((NSString *)&__NSConstantStringImpl__var_folders_6p_1hbzwy3900vd5kkrph4hz29w0000gn_T_main_b97c95_mi_0, (valB->__forwarding->valB));
}
```


所以 `block` 里修改的实际是 `堆` 里的东西了。

最后还有一个问题，变量是怎样被 `copy` 到堆里的？

看下图，可以看到 `clang -rewrite-objc` 后生成的是 `_NSConcreteStackBlock` 类型的，是存在栈上的，而最终我们打断点会发现类型变成了 `_NSConcreteMallocBlock` ，这是因为在 `ARC` 环境下，编译器会自动将 `block` `copy` 到堆里，所以变量也会随之 `copy` 到堆里；如果是 `MRC` 环境，就需要手动 `copy` 了。

![image](http://file.arvit.xyz/44793bb2dbf77f118b4a6a9076ffab721484104519.png)

### 小结

加了 `__block` 后的变量，生成的是一个结构体变量，在经过 `block` （也就是定义 `block` ）时，会将该结构体拷贝至**堆**中，栈内的 `__forwarding` 指向堆中的地址，之后对该变量的操作，实际上是对**堆**里的变量的操作。

另外，该结构体变量的 `isa` 指针有三种情况：

*   `_NSConcreteStackBlock` 保存在 `栈` 中的block，出栈时会被销毁
*   `_NSConcreteGlobalBlock` `全局的静态` block，不会访问任何外部变量
*   `_NSConcreteMallocBlock` 保存在 `堆` 中的block，当引用计数为0时会被销毁

上面我们生成的是 `_NSConcreteStackBlock`，像这样的就是 `_NSConcreteGlobalBlock`：


```
void (^block)(void) = ^{NSLog(@"This is a Global Block");};

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        block();
    }
    return 0;
}
```


当使用 `copy` 操作时，生成的就是 `_NSConcreteMallocBlock`，并且我们可以看到转换后的代码还有 `__main_block_copy_0`、`__main_block_dispose_0` 这两个静态函数。  
当 `block` 从栈中拷贝到堆中时，会调用前者持有该变量，当堆上的 `block` 回收时，会调用后者释放该变量。

以下是 `ARC` 环境下，`block` 有无强引用，内部有无使用外部变量生成的类型（测试时间是 `2017-01-11`）：

||有强引用|无强引用|  
|---|---|---|  
|使用外部变量|_NSConcreteMallocBlock|_NSConcreteStackBlock|  
|无外部变量|_NSConcreteGlobalBlock|_NSConcreteGlobalBlock|  

![image](http://file.arvit.xyz/4dc76a9bf32d5c181b3a3c8c1537ed4b1484106867.png)

即：  
`block` 内没有使用到外部变量，生成的是 `_NSConcreteGlobalBlock`；  
如果有使用外部变量，有强引用的是 `_NSConcreteMallocBlock`，无强引用的是 `_NSConcreteStackBlock`；

看完以上三种类型的 `block` 后，可以做一下这里的 [题目](http://blog.parse.com/learn/engineering/objective-c-blocks-quiz/) 巩固一下

* * *

## 总结

在这里要非常感谢 [@刘煌旭](http://weibo.com/u/1527399354) 解答了困扰我多日的一些问题！

这里最后简单说明一下：

> 一、不加 `__block` 为什么不能修改（即苹果是如何让 `block` 里变量不能修改的）：

外部的 `valA` 在 `main 的栈` 上有一份内存，同时 `block 的栈` 上也会拷贝 valA 的一份内存；  
由于函数调用的内存机制，valA 在不同的栈上，作用域不同，所以是不能修改的。  
并且如果是 `对象类型` 的，在 `block` 内部是 `const` 的，不能修改。

> 二、加了 `__block` 为什么能修改：

加了 `__block`，会把变量拷贝到堆里，修改的实际是堆里的内容。

参考资料：  
[黑幕背后的__block修饰符](http://chun.tips/blog/2014/11/13/hei-mu-bei-hou-de-blockxiu-shi-fu/)  
[谈Objective-C block的实现](http://blog.devtang.com/2013/07/28/a-look-inside-blocks/)

* * *

2017-01-09 21:34  
Aevit  
深大轻茶馆

* * *

<a class="http://file.arvit.xyz/1993ab9d9d77c4eabfb9a84b599f149c1483968843.jpeg" title="茶卡盐湖">![](http://file.arvit.xyz/1993ab9d9d77c4eabfb9a84b599f149c1483968843.jpeg)</a>  
摄影：Aevit 2016年8月 茶卡盐湖
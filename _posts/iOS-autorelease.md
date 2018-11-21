---
title: iOS 自动释放池原理探究  
date: 2017-03-12 21:32:20  
tags: [比特海,iOS,runtime,autorelease]  
category: 比特海  
layout: post  

---

## 前言

这篇文章主要通过苹果开源的 [NSObject.mm](https://opensource.apple.com/source/objc4/objc4-706/runtime/NSObject.mm.auto.html)（注：写这文章时的日期是 2017.3.12，使用的版本是`objc4-706`，可能与以前的版本会稍有不同） 来对 `@autoreleasepool` 进行说明。

<!--more-->

## Clang

首先我们还是 `Clang` 一下 `main.m` 文件：


```
int main(int argc, char * argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
    }
}
```


得到以下代码：


```
int main(int argc, char * argv[]) {
    /* @autoreleasepool */ { __AtAutoreleasePool __autoreleasepool; 
        return UIApplicationMain(argc, argv, __null, NSStringFromClass(((Class (*)(id, SEL))(void *)objc_msgSend)((id)objc_getClass("AppDelegate"), sel_registerName("class"))));
    }
}
```


可以看到，`@autoreleasepool` 被转换成了这一句代码：  
`__AtAutoreleasePool __autoreleasepool;`

这个 `__AtAutoreleasePool` 是一个结构体，其中包含一个构造函数及一个析构函数：


```
struct __AtAutoreleasePool {
  __AtAutoreleasePool() {atautoreleasepoolobj = objc_autoreleasePoolPush();}
  ~__AtAutoreleasePool() {objc_autoreleasePoolPop(atautoreleasepoolobj);}
  void * atautoreleasepoolobj;
};
```


这个结构体的构造函数会调用 `objc_autoreleasePoolPush()` 并返回一个 `atautoreleasepoolobj` 对象，并且其析构函数，会将 `atautoreleasepoolobj` 对象作为 `objc_autoreleasePoolPop()` 的入参。

这两个函数的实现如下，后面我们再详细解释这两个函数：


```
void *objc_autoreleasePoolPush(void)
{
    return AutoreleasePoolPage::push();
}
```
 
```
void objc_autoreleasePoolPop(void *ctxt)
{
    AutoreleasePoolPage::pop(ctxt);
}
```


可以看到分别是调用 `AutoreleasePoolPage` 的 `push` `pop` 这两个静态方法。

那么 `AutoreleasePoolPage` 是什么？

## AutoreleasePoolPage

`NSObject.mm` 文件里有如下注释：


```
Autorelease pool implementation
A thread's autorelease pool is a stack of pointers. 
Each pointer is either an object to release, or POOL_BOUNDARY which is 
 an autorelease pool boundary.
A pool token is a pointer to the POOL_BOUNDARY for that pool. When 
 the pool is popped, every object hotter than the sentinel is released.
The stack is divided into a doubly-linked list of pages. Pages are added 
 and deleted as necessary. 
Thread-local storage points to the hot page, where newly autoreleased 
 objects are stored.
```


翻译如下：

*   每个线程的 autorelease pool 是一个指针的堆栈；
*   每个指针不是指向一个需要 `release` 的对象，就是指向一个 `POOL_BOUNDARY`（哨兵对象，表示一个 autorelease pool 的边界）；
*   一个 pool token 指向这个 `POOL_BOUNDARY`（pool 的边界）。当这个 pool 被 pop 的时候，在这个哨兵对象后面添加的那些结点都会被 release；
*   这个堆栈（即 autorelease pool）是一个以 page 为结点的双向链表，这些 page 会在必要的时候增加或删除；
*   Thread-local storage（TLS，即线程局部存储）指向 hot page，这个 hot page 是指最新添加的 autorelease 对象所在的那个 page。

**这里要注意，栈上只存指针（就是对象的地址），对象本身是存在堆上的，因为创建一个 OC 对象，最终都是要通过 alloc + init 的。**

> 注：以前的哨兵对象叫 `POOL_SENTINEL`，现在叫 `POOL_BOUNDARY`

从 `NSObject.mm` 文件里摘抄这个类的成员变量部分代码如下：


```
class AutoreleasePoolPage 
{
    // EMPTY_POOL_PLACEHOLDER is stored in TLS when exactly one pool is 
    // pushed and it has never contained any objects. This saves memory 
    // when the top level (i.e. libdispatch) pushes and pops pools but 
    // never uses them.
#   define EMPTY_POOL_PLACEHOLDER ((id*)1)

#   define POOL_BOUNDARY nil
    static pthread_key_t const key = AUTORELEASE_POOL_KEY;
    static uint8_t const SCRIBBLE = 0xA3;  // 0xA3A3A3A3 after releasing
    static size_t const SIZE = 
#if PROTECT_AUTORELEASEPOOL
        PAGE_MAX_SIZE;  // must be multiple of vm page size
#else
        PAGE_MAX_SIZE;  // size and alignment, power of 2
#endif
    static size_t const COUNT = SIZE / sizeof(id);

    magic_t const magic;
    id *next;
    pthread_t const thread;
    AutoreleasePoolPage * const parent;
    AutoreleasePoolPage *child;
    uint32_t const depth;
    uint32_t hiwat;
}
```


画个图看一下：

![image](http://file.arvit.xyz/a98396bd64d1610f4889c42d2b76e32e1489222777.jpeg)

*   `magic` 用来校验 `AutoreleasePoolPage` 的结构是否完整;
*   `next` 指向最新添加的 `autoreleased` 对象的下一个位置，初始化时指向 `begin()`;
*   `thread` 指向当前线程;
*   `parent` 指向父结点，第一个结点的 `parent` 值为 `nil`;
*   `child` 指向子结点，最后一个结点的 `child` 值为 `nil`;
*   `depth` 代表深度，从 `0` 开始，往后递增 `1`;
*   `hiwat` 代表 `high water mark`，表示入栈最多时候的指针个数;

由上面 `AutoreleasePoolPage` 类的定义里也可以看到，一个 `Page` 会开辟 `PAGE_MAX_SIZE` 的内存（以前的版本是 `4096 bytes`，现在可能会根据不同设备及系统分配不同的内存），除了 `AutoreleasePoolPage` 的成员变量所占空间（共 `56 bytes`），其余空间将会用来存储加入到自动释放池的对象。

初始的 `next == begin()`，新加入自动释放池的一个对象，会存放在当前 `next` 指向的位置，当对象存放完成后，`next` 指针会指向下一个为空的地址。  
当 `next == end()` 时，表示当前 page 已经满了。

接下来让我们来详细说明自动释放池的原理。

* * *

## objc_autoreleasePoolPush

先上张图（红色部分表示 push 后会变化的东西），接着再详细说明其流程：

![image](http://file.arvit.xyz/dd6c093b0b87c86ed7e16c1fe6ad2f0d1489502563.png)

上文已经提到，`objc_autoreleasePoolPush` 函数定义如下：


```
void *objc_autoreleasePoolPush(void)
{
    return AutoreleasePoolPage::push();
}
```


静态方法 push 的定义如下：


```
static inline void *push() 
{
    id *dest;
    if (DebugPoolAllocation) {
        // Each autorelease pool starts on a new pool page.
        dest = autoreleaseNewPage(POOL_BOUNDARY);
    } else {
        dest = autoreleaseFast(POOL_BOUNDARY);
    }
    assert(dest == EMPTY_POOL_PLACEHOLDER || *dest == POOL_BOUNDARY);
    return dest;
}
```


这里会调用 `autoreleaseFast(POOL_BOUNDARY)` 操作，其定义如下：


```
static inline id *autoreleaseFast(id obj)
{
    AutoreleasePoolPage *page = hotPage();
    if (page && !page->full()) {
        return page->add(obj);
    } else if (page) {
        return autoreleaseFullPage(obj, page);
    } else {
        return autoreleaseNoPage(obj);
    }
}
```


这里分为三种情况：

*   hotPage 存在并且还没满
    *   调用 `page->add(obj)` 方法将对象加入该 hotPage 中
*   hotPage 满了
    *   调用 `autoreleaseFullPage(obj, page)` 方法，该方法会先查找 hotPage 的 child，如果有则将 child page 设置为 hotPage，如果没有则将创建一个新的 hotPage，之后在这个新的 hotPage 上执行 `page->add(obj)` 操作
*   hotPage 不存在
    *   调用 `autoreleaseNoPage(obj)` 方法，该方法会创建一个 hotPage，然后执行 `page->add(obj)` 操作

> 注：hotPage 表示正在使用中的 page

接下来看看 `add` 方法的定义：


```
id *add(id obj)
{
    assert(!full());
    unprotect();
    id *ret = next;  // faster than `return next-1` because of aliasing
    *next++ = obj;
    protect();
    return ret;
}
```


此方法会把 `obj` 存放在原本 `next` 所在的位置，然后 `next` 指针移到下一个位置。

最后再看下 `autorelease` 方法，同样也是会调用 `autoreleaseFast(obj)` 方法：


```
static inline id autorelease(id obj)
{
    assert(obj);
    assert(!obj->isTaggedPointer());
    id *dest __unused = autoreleaseFast(obj);
    assert(!dest  ||  dest == EMPTY_POOL_PLACEHOLDER  ||  *dest == obj);
    return obj;
}
```


最后小结一下，调用 `objc_autoreleasePoolPush` 方法时，会先 `add` 一个 `POOL_BOUNDARY`，然后向一个对象发送 `autorelease` 消息，就会把该对象 `add` 进 page 里。

## objc_autoreleasePoolPop

方法定义如下：


```
void objc_autoreleasePoolPop(void *ctxt)
{
    AutoreleasePoolPage::pop(ctxt);
}
```


静态方法 `pop(ctxt)` （其中 `ctxt` 是前面 `push` 后返回的哨兵对象）有点长，这里精简一下代码，这方法关键是会调用 `releaseUntil` 方法去释放对象：


```
static inline void pop(void *token) 
{
    AutoreleasePoolPage  *page = pageForPointer(token);
    id *stop = (id *)token;
    
    page->releaseUntil(stop);
    
    if (page->child) {
        // hysteresis: keep one empty child if page is more than half full
        if (page->lessThanHalfFull()) {
            page->child->kill();
        } else if (page->child->child) {
            page->child->child->kill();
        }
    }
}
```


其中 `pageForPointer(token)` 会获取哨兵对象所在 page：


```
static AutoreleasePoolPage *pageForPointer(uintptr_t p) 
{
    AutoreleasePoolPage *result;
    uintptr_t offset = p % SIZE;

    assert(offset >= sizeof(AutoreleasePoolPage));

    result = (AutoreleasePoolPage *)(p - offset);
    result->fastcheck();

    return result;
}
```


主要是通过指针与 page 大小取模得到其偏移量（因为所有的 AutoreleasePoolPage 在内存中都是对齐的），最后通过 `fastCheck()` 方法检查得到的是不是一个 AutoreleasePoolPage。

之后调用 `releaseUntil` 循环释放对象，其定义如下：


```
void releaseUntil(id *stop) 
{
    while (this->next != stop) {
        // Restart from hotPage() every time, in case -release 
        // autoreleased more objects
        AutoreleasePoolPage *page = hotPage();

        // fixme I think this `while` can be `if`, but I can't prove it
        while (page->empty()) {
            page = page->parent;
            setHotPage(page);
        }

        page->unprotect();
        id obj = *--page->next;
        memset((void*)page->next, SCRIBBLE, sizeof(*page->next));
        page->protect();

        if (obj != POOL_BOUNDARY) {
            objc_release(obj);
        }
    }

    setHotPage(this);
}
```


`releaseUntil` 方法会先把 `next` 指针向前移动，取到将要释放的一个指针，之后调用 `memset` 擦除该指针所占内存，再调用 `objc_release` 方法释放该指针指向的对象，这样通过 `next` 指针循环往前查找去释放对象，期间可往前跨越多个 page，直到找到传进来的哨兵对象为止。

当有嵌套的 autoreleasepool 时，会清除一层后再清除另一层，因为 pop 是会释放到上次 push 的位置为止，就像剥洋葱一样，每次一层，互不影响。

最后如果传入的哨兵对象所在 page 有 child，有两种情况：

*   当前 page 使用不满一半，从 child page 开始将后面所有 page 删除
*   当前 page 使用超过一半，从 child page 的 child page（即孙子，如果有的话）开始将后面所有的 page 删除


```
if (page->child) {
    // hysteresis: keep one empty child if page is more than half full
    if (page->lessThanHalfFull()) {
        page->child->kill();
    } else if (page->child->child) {
        page->child->child->kill();
    }
}
```


至于为什么要分这两种情况，猜测可能是以空间换取时间吧，当使用超过一半时，当前 page 可能很快就用完了，所以将 child page 留着，减少创建新 page 的开销。

`kill()` 方法会将后面所有的 page 都删除：


```
void kill() 
{
    // Not recursive: we don't want to blow out the stack 
    // if a thread accumulates a stupendous amount of garbage
    AutoreleasePoolPage *page = this;
    while (page->child) page = page->child;

    AutoreleasePoolPage *deathptr;
    do {
        deathptr = page;
        page = page->parent;
        if (page) {
            page->unprotect();
            page->child = nil;
            page->protect();
        }
        delete deathptr;
    } while (deathptr != this);
}
```


* * *

## 总结

最后再总结一下自动释放池的原理，自动释放池是由多个 `autorelease page` 组成的 `双向链表`，其中主要通过 push 及 pop 操作来管理：

### push

自动释放池会先调用 `objc_autoreleasePoolPush` 函数，这函数首先在当前 `next` 指向的位置存放一个 `POOL_BOUNDARY`，然后当向一个对象发送 `autorelease` 消息时，会在哨兵对象后面插入指向该对象的指针，之后把 `next` 指向刚插入的位置的下一个内存地址，如图所示：

![image](http://file.arvit.xyz/dd6c093b0b87c86ed7e16c1fe6ad2f0d1489502563.png)

当这一页 page 快满时（即 `next` 即将指向栈顶——end() 位置），说明这一页 page 快满了。这时如果再加入一个对象，会先建立下一页 page，双向链表建立完成后，新的 page 的 `next` 指向该页的栈底——begin() 位置，之后继续向栈顶添加新的指针。

### pop

调用完前面说的 `objc_autoreleasePoolPush` 后，会返回一个 `POOL_BOUNDARY` 的地址，当对象要释放时，会调用 `objc_autoreleasePoolPop` 函数，将该 `POOL_BOUNDARY` 作为其入参，然后会执行如下操作：

*   根据传入的 `POOL_BOUNDARY` （push 后得到的那个）找到其所在的 page；
*   从 `hotPage` 的 `next` 指针开始往前查找，向找到的每个指针调用 `memset` 方法以擦除指针所占内存，再调用 `objc_release` 方法释放该指针指向的对象，直到前一步所找到的 page 的 `POOL_BOUNDARY` 为止（可往前跨越多个 page），并且在释放前，`next` 指针也会往回指向正确的位置。

当有嵌套的 autoreleasepool 时，会清除一层后再清除另一层，因为 pop 是会释放到上次 push 的位置为止，就像剥洋葱一样，每次一层，互不影响。

### 扩展

一、autorelease 对象会在什么时候释放？

分两种情况：

1.  使用 `@autoreleasepool`，会在大括号结束时释放
2.  不使用 `@autoreleasepool`，这个会由系统自动释放，释放时机是在当前 `runloop` 结束时释放，因为系统会自动为每个 `runloop` 执行自动释放池的 `push` 和 `pop` 操作

二、关于内存管理的方法，目前来说，有三种：

1.  C/C++的完全由程序员管理（paring new/malloc & delete/free）;
2.  Garbage Collection;
3.  Reference Counting;

第一种比较原始；Cocoa Touch 的 Reference Counting 对比 Garbage Collection，有一个致命的弱点：无法释放循环引用的对象，所以要注意不要造成循环引用。

> PS: 维基百科上有说 Reference Couting 属于 GC 的一种方式：  
> Reference counting is a form of garbage collection whereby each object has a count of the number of references to it.  
> 详见链接：  
> [Reference_counting](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)#Reference_counting)
> 
> 不过也有人说不是，没有定论，这里作一下简单说明。

三、什么时候应该使用 @autoreleasepool

[苹果的文档](https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/MemoryMgmt/Articles/mmAutoreleasePools.html#//apple_ref/doc/uid/20000047-CJBFBEDI) 有说了：


```
If you are writing a program that is not based on a UI framework, such as a command-line tool.  

If you write a loop that creates many temporary objects.
You may use an autorelease pool block inside the loop to dispose of those objects before the next iteration. Using an autorelease pool block in the loop helps to reduce the maximum memory footprint of the application.

If you spawn a secondary thread.
You must create your own autorelease pool block as soon as the thread begins executing; otherwise, your application will leak objects. (See Autorelease Pool Blocks and Threads for details.)
```


即：

1.  你的程序不是基于 UI 框架的，如命令行工具
2.  你编写的循环创建了大量的临时对象
3.  如果你创建了一个辅助线程

参考资料：  
[黑幕背后的Autorelease](http://blog.sunnyxx.com/2014/10/15/behind-autorelease/)  
[自动释放池的前世今生 —- 深入解析 autoreleasepool](http://draveness.me/autoreleasepool/)

* * *

2017-03-12 21:32  
Aevit  
深大轻茶馆

* * *

<a class="http://file.arvit.xyz/8a7fb3f261eec1bc75d194981555c7291489325426.jpeg" title="黄姚日出">![](http://file.arvit.xyz/8a7fb3f261eec1bc75d194981555c7291489325426.jpeg)</a>  
摄影：Aevit 2015年8月 黄姚
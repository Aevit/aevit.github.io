---
title: iOS设计模式 —— 类簇  
date: 2016-10-25 21:51:21  
tags: [比特海,iOS,设计模式]  
category: 比特海  
layout: post  

---

## 前言

在 `iOS` 中，类簇的使用是比较普遍的，如 `NSNumber`，`NSArray`，`NSString` 等，属于 `抽象工厂` 模式的一种应用，隐藏了具体的实现类，只暴露出简单的接口。

<!--more-->

## NSNumber的类簇

这里以 `NSNumber` 为例。

假设我们要把 `int, bool, float, double` 等数据类型包装成类的形式，一般我们比较容易想到的是新建多个子类，如 `NSNumberInt, NSNumberBool, NSNumberFloat, NSNumberDouble` 等，加上其他一些数据类型，这样会导致有大量的子类，对开发者来说就得记住很多类名，很不友好。

`Foundation` 是通过 `NSNumber` 这个 `类簇` 来实现的：


```
+ (NSNumber *)numberWithInt:(int)value;
+ (NSNumber *)numberWithBool:(BOOL)value;
+ (NSNumber *)numberWithFloat:(float)value;
+ (NSNumber *)numberWithDouble:(double)value;
...
```


下面以 `numberWithInt` 为例，我们将 `alloc` 及 `init` 拆为两条语句，并跟 `numberWithInt` 对比：


```
id obj1 = [NSNumber alloc];
id obj2 = [obj1 initWithInt:1];
id obj3 = [NSNumber numberWithInt:1];
id obj4 = [NSNumber alloc];
```


结果如下：

![UIImage](http://aevit.qiniudn.com/5951492b5bde7d14464c9139252ef13c1477394040.jpeg)

可以看到，`alloc` 方法返回的是 `NSPlaceholderNumber` 对象，`init` 及 `numberWithInt` 返回的才是 `__NSCFNumber` 对象。

这里加多了一句：


```
id obj4 = [NSNumber alloc];
```


会发现 `obj4` 的地址跟 `obj1` 是一样的，说明 `alloc` 方法实现了 `对象复用`：

> `对象复用` 需要有个地方来存这些之前创建但又已经被“销毁”的对象；
> 
> 这里的销毁不是真的销毁，是因为只是做记号，标记成销毁，但它实际还在“对象池”里，下次再初始化的时候，看看这个“对象池”里是否有已经创建的对象，有就直接用，没有再创建。

`alloc` 方法复用了 `NSPlaceholderNumber` 对象，那么就说明是在调用 `init` 或 `initWithInt` 等方法时才转化为 `__NSCFNumber` 的。

可以大致推测出如下方法：

> 1、生成静态 `NSPlaceholderNumber` 对象，实现对象复用：


```
static NSPlaceholderNumber *BuildPlaceholderNumber() {
    static NSPlaceholderNumber *instance;
    if (!instance) {
        instance = [[NSPlaceholderNumber alloc] init];
    }
    retrun instance;
}
```


> 2、`NSNumber` 类的大致实现


```
@interface NSNumber
@end

@implementation

+ (instancetype)alloc {
    return BuildPlaceholderNumber();
}

+ (NSNumber *)numberWithInt:(int)value {
    return [[NSNumber alloc] initWithInt:value];
}

@end
```


> 3、`NSPlaceholderNumber` 类的大致实现


```
@interface NSPlaceholderNumber
@end

@implementation NSPlaceholderNumber

- (instancetype)initWithInt:(int)value {
    if (self == BuildPlaceholderNumber()) {
        return [[__NSCFNumber alloc] initWithInt:value];
    }
}

@end
```


> 4、`__NSCFNumber` 类的大致实现


```
@interface __NSCFNumber: NSNumber
@end

@implementation __NSCFNumber

- (instancetype)initWithInt:(int)value {
    if (self = [super init]) {
        // do sth to init with int...
    }
    return self;
}

@end
```


这样就不会将其它类暴露出来，开发者只要关心 `NSNumber` 提供的类方法就可以愉快地构造一个 `NSNumber` 对象了。

## 自己写一个类簇

以上简单分析了 `NSNumber` 类簇，接下来我们自己写一个简单的类簇。

假设 `Cat` 有 `BlackCat` 及 `WhiteCat` 两种，其中黑猫喜欢睡觉，白猫喜欢玩。  
当然了，我家的黄猫喜欢在我睡觉的时候找我玩…


```
// Cat.h  
typedef NS_ENUM(NSInteger, CatType) {
    CatTypeBlack,
    CatTypeWhite
};

@interface Cat : NSObject

+ (instancetype)catWithType:(CatType)type;

- (void)showHobby;

@end
```
 
```
// Cat.m

// BlackCat
@interface BlackCat: Cat

@end

@implementation BlackCat

- (void)showHobby {
    NSLog(@"%@'s hobby is: sleep", [self class]);
}

@end


// WhiteCat
@interface WhiteCat: Cat

@end

@implementation WhiteCat

- (void)showHobby {
    NSLog(@"%@'s hobby is: play", [self class]);
}

@end


// Cat
@implementation Cat
+ (instancetype)catWithType:(CatType)type {
    switch (type) {
        case CatTypeBlack:
        {
            return [[BlackCat alloc] init];
            break;
        }
        case CatTypeWhite:
        {
            return [[WhiteCat alloc] init];
            break;
        }
        default:
            break;
    }
}

- (void)showHobby {
    
}

@end
```


接下来我们就不用关心 `BlackCat` 或是 `WhiteCat` 这两个类，只需要传入一个 `CatType` 即可：


```
Cat *cat1 = [Cat catWithType:CatTypeBlack];
[cat1 showHobby]; // print: BlackCat's hobby is: sleep
    
Cat *cat2 = [Cat catWithType:CatTypeWhite];
[cat2 showHobby]; // print: WhiteCat's hobby is: play
```


## 类簇的其它应用

1、假设需要在 `iOS6` 及 `iOS7` 系统分别使用不同风格的图片，一般人是直接根据当前系统判断，这样会导致很多个 `if else` 语句，后期代码会很杂乱。

这时可以利用类簇，写一个基类（如 `DemoImageView`）及私有子类（`DemoImageView_iOS6`、`DemoImageView_iOS7`），统一在基类里去根据系统判断生成不同的子类即可（具体可以看[这篇文章](http://blog.devzeng.com/blog/ios-class-cluster-design-pattern.html)，这里不再详述）。

2、假设有2个页面，布局都一样，只是传入的数据不一样而已，这时也可以考虑使用类簇来解决。

## 总结

通过这次实际分析，对类簇这种设计模式有一种更深的了解。

另外也希望以后能在项目中熟练地运用各种设计模式，写出更加优雅的代码。

[References From Sunny大神](http://blog.sunnyxx.com/2014/12/18/class-cluster/)

* * *

2016-10-25 21:51  
Aevit  
深圳南山

* * *

<a class="http://aevit.qiniudn.com/af19262268ecba49a2a09c58b19873211477393690.jpeg" title="经幡">![](http://aevit.qiniudn.com/af19262268ecba49a2a09c58b19873211477393690.jpeg)</a>  
摄影：Aevit 2016年8月 茶卡盐湖
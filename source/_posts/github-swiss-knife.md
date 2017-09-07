---
title: 瑞士军刀小动画（iOS）  
date: 2016-09-04 22:18:21  
tags: [比特海,开源,iOS,动画]  
category: 比特海  
layout: post  

---

## 前言

周末闲来无事，刚好想起 [@我最敬爱和佩服的烧饼哥](http://pandara.xyz/) 前阵子去北京，过安检时被没收了一把瑞士军刀，就画了把瑞士军刀，并弄了个小动画送给他。

希望他下次过安检时不要被查到我这把瑞士军刀，不然可能连电脑都要没收了＝。＝

> PS: 图是用 `Sketch` 画的

展示：

![image](http://aevit.qiniudn.com/e209ef12cf7b513c883956a89aa6f3fd1472996709.gif)

<!--more-->

## 动画分析

这个动画不难弄，只要写这几个动画即可：

1、中间 `+` 号的旋转动画（改变 `transform` 属性即可）  
2、红色手柄长度的伸展动画（改变 `width` `center.x` 即可）  
3、5把小刀依次出现及消失的动画（改变 `transform` 属性，并使用 `animateKeyframesWithDuration` 函数依次添加帧动画即可）

## 动画关键代码

### 第一及第二个动画

这两个比较简单，直接贴代码：

旋转动画：


```
- (void)rotateWithDegree:(CGFloat)degree completeBlock:(CompleteBlock)block {
    CGAffineTransform endAngle = CGAffineTransformMakeRotation(degree * (M_PI / 180.0f));
    [UIView animateWithDuration:0.4 delay:0 usingSpringWithDamping:0.7 initialSpringVelocity:0.5 options:UIViewAnimationOptionCurveEaseInOut animations:^{
        self.transform = endAngle;
    } completion:^(BOOL finished) {
        if (block) {
            block(finished);
        }
    }];
}
```


伸展动画：


```
- (void)expandWidth:(CGFloat)width completeBlock:(CompleteBlock)block {
    CGRect frame = self.frame;
    frame.size.width = width;
    frame.origin.x = (self.superview.frame.size.width - width) / 2;
    frame.origin.y = (self.superview.frame.size.height - frame.size.height) / 2;
    [UIView animateWithDuration:0.4 delay:0 usingSpringWithDamping:0.7 initialSpringVelocity:1.2 options:UIViewAnimationOptionCurveEaseInOut animations:^{
        self.frame = frame;
    } completion:^(BOOL finished) {
        if (block) {
            block(finished);
        }
    }];
}
```


其中：

*   `usingSpringWithDamping`：弹簧动画的阻尼值，也就是相当于摩擦力的大小，该属性的值从0.0到1.0之间，越靠近0，阻尼越小，弹动的幅度越大，反之阻尼越大，弹动的幅度越小，如果大道一定程度，会出现弹不动的情况。

*   `initialSpringVelocity`：弹簧动画的速率，或者说是动力。值越小弹簧的动力越小，弹簧拉伸的幅度越小，反之动力越大，弹簧拉伸的幅度越大。这里需要注意的是，如果设置为0，表示忽略该属性，由动画持续时间和阻尼计算动画的效果。

> PS: 关于上述两个参数调整的实际结果，去这里查看示例即可：[点击跳转](https://www.renfei.org/blog/ios-8-spring-animation.html)

### 小刀出现动画

首先最主要的是先做好5把小刀的布局，然后通过设置 `anchorPoint` 及 `transform（其中的旋转角度）` 的值即可。

由于默认的 `anchorPoint` 是 `(0.5, 0.5)`，旋转后不能刚好跟手柄完美地配合来收起/展开。所以上面的小刀的 `anchorPoint.y` 设置为1，下面的小刀的 `anchorPoint.y` 设置为0，`anchorPoint.x` 根据实际情况再去调整。

具体调整的角度就在 `Sketch` 源文件里去试下就行了。

帧动画主要是使用到这两个类方法：


```
+ (void)animateKeyframesWithDuration:(NSTimeInterval)duration delay:(NSTimeInterval)delay options:(UIViewKeyframeAnimationOptions)options animations:(void (^)(void))animations completion:(void (^ __nullable)(BOOL finished))completion NS_AVAILABLE_IOS(7_0);

+ (void)addKeyframeWithRelativeStartTime:(double)frameStartTime relativeDuration:(double)frameDuration animations:(void (^)(void))animations NS_AVAILABLE_IOS(7_0);
```


`addKeyframeWithRelativeStartTime` 参数说明如下：

*   `startTime`：关键帧开始时间，该时间是相对整个关键帧动画持续时间的相对时间，一般值在0到1之间。如果为0，则表明这一关键帧从整个动画的第0秒开始执行，如果设为0.5，则表明从整个动画的中间开始执行。

*   `relativeDuration`：关键帧持续时间，该时间同样是相对整个关键帧动画持续时间的相对时间，一般值也在0到1之间。如果设为0.25，则表明这一关键帧的持续时间为整个动画持续时间的四分之一。

*   `animations`：设置视图动画属性的动画闭包。

如：


```
[UIView animateKeyframesWithDuration:0.5 delay:0 options:UIViewKeyframeAnimationOptionBeginFromCurrentState animations:^{
        
    [UIView addKeyframeWithRelativeStartTime:0.0 relativeDuration:0.2 animations:^{
        self.upThirdKnife.transform = CGAffineTransformMakeRotation(0);
    }];
    
    [UIView addKeyframeWithRelativeStartTime:0.4 relativeDuration:0.4 animations:^{
        self.upFirstKnife.transform = CGAffineTransformMakeRotation(0);
    }];
  
} completion:^(BOOL finished) {
}];
```


以上代码表示整个关键帧动画的时间为 `0.5s`，第一个关键帧从第 `0.5s * 0 = 0s` 开始，运行 `0.5s * 0.2 = 0.1s` 结束；第二个关键帧从第 `0.5s * 0.4 = 0.2s` 开始，运行 `0.5s * 0.4 = 0.2s` 结束。

## 总结

这个小动画主要使用到的是关键帧动画，只要设置好`开始时间`及`持续时间`即可，保证每个关键帧在合适的时候开始，执行合适的持续时间。

另外，`Sketch` 真是个好东西。

代码已上传至`github`，需要可以去查看：[瑞士军刀动画源码](https://github.com/Aevit/SwissKnife)

* * *

2016-09-04 22:18  
Aevit  
华师

* * *

<a class="http://aevit.qiniudn.com/e0397c118a4f02bc737dd7a8faebefad1472998832.jpeg" title="天空之镜">![](http://aevit.qiniudn.com/e0397c118a4f02bc737dd7a8faebefad1472998832.jpeg)</a>  
摄影：Aevit 2016年8月 茶卡盐湖
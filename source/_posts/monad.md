---
title: 图解Monad  
date: 2015-07-18 21:51:18  
tags: [比特海,转载]  
category: 比特海  
layout: post  

---

函数式编程有一个重要概念，叫做[Monad](https://en.wikipedia.org/wiki/Monad_%28functional_programming%29)。  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071601.jpg)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071601.jpg "1/21")  
<!--more-->

网上有很多解释（[这里](http://stackoverflow.com/questions/2704652/monad-in-plain-english-for-the-oop-programmer-with-no-fp-background)和[这里](http://stackoverflow.com/questions/44965/what-is-a-monad)），但都很抽象，不容易看懂。我尝试了好多次，还是不明白Monad到底是什么。  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071602.jpg)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071602.jpg "2/21")

昨天，我读到了[Aditya Bhargava](http://adit.io/posts/2013-04-17-functors,_applicatives,_and_monads_in_pictures.html)的文章，他画了很多图。我想了半天，终于恍然大悟。下面，我就用这些图来解释Monad。

1.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071603.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071603.png "3/21")

软件最基本的数据，就是各种值（value）。  

2.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071604.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071604.png "4/21")

处理值的一系列操作，可以封装成函数。输入一个值，会得到另一个值。上图的”(+3)”就是一个函数，对输入的值加上3，再输出。  

3.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071605.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071605.png "5/21")

函数很像漏斗，上面进入一个值，下面出来一个值。  

4.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071606.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071606.png "6/21")

函数可以连接起来使用，一个函数接着另一个函数。  

5.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071607.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071607.png "7/21")

函数还可以依次处理数据集合的每个成员。  

6.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071608.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071608.png "8/21")

说完了函数，再来看第二个概念：数据类型（type）。  
数据类型就是对值的一种封装，不仅包括值本身，还包括相关的属性和方法。上图就是2的封装，从此2就不是一个单纯的值，而是一种数据类型的实例，只能在数据类型的场景（context）中使用。  

7.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071609.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071609.png "9/21")

2变成数据类型以后，原来的函数就不能用了。因为”(+3)”这个函数是处理值的（简称”值函数”），而不是处理数据类型的。  

8.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071610.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071610.png "10/21")

我们需要重新定义一种运算。它接受”值函数”和数据类型的实例作为输入参数，使用”值函数”处理后，再输出数据类型的另一个实例。上图的fmap就代表了这种运算。  

9.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071611.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071611.png "11/21")

fmap的内部，实际上是这样：打开封装的数据类型，取出值，用值函数处理以后，再封装回数据类型。  

10.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071612.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071612.png "12/21")

一个有趣的问题来了。如果我们把函数也封装成数据类型，会怎样？  
上图就是把函数”(+3)”封装成一种数据类型。  

11.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071613.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071613.png "13/21")

这时，就需要再定义一种新的运算。它不是值与值的运算，也不是值与数据类型的运算，而是数据类型与数据类型的运算。  
上图中，两个数据类型进行运算。首先，取出它们各自的值，一个是函数，一个是数值；然后，使用函数处理数值；最后，将函数的返回结果再封装进数据类型。  

12.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071614.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071614.png "14/21")

函数可以返回值，当然也可以返回数据类型。  

13.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071615.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071615.png "15/21")

我们需要的是这样一种函数：它的输入和输出都是数据类型。  

14.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071616.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071616.png "16/21")

这样做的好处是什么？  
因为数据类型是带有运算方法的，如果每一步返回的都是数据类型的实例，我们就可以把它们连接起来。  

15.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071617.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071617.png "17/21")

来看一个实例，系统的I/O提供了用户的输入。  

16.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071618.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071618.png "18/21")

getLine函数可以将用户的输入处理成一个字符串类型（STR）的实例。  

17.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071619.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071619.png "19/21")

readfile函数接受STR实例当作文件名，返回一个文件类型的实例。  

18.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071620.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071620.png "20/21")

putStrLn函数将文件内容输出。  

19.  
[![](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071621.png)](http://aevit.qiniudn.com/ruanyifeng_Monad_bg2015071621.png "21/21")

所有这些运算连起来，就叫做Monad。  
简单说，Monad就是一种设计模式，表示将一个运算过程，通过函数拆解成互相连接的多个步骤。你只要提供下一步运算所需的函数，整个运算就会自动进行下去。  
（完）  

> 作者：阮一峰  
> 原文网址：[http://www.ruanyifeng.com/blog/2015/07/monad.html](http://www.ruanyifeng.com/blog/2015/07/monad.html)  
> 为了防止以后原文图片丢失，将图片也转存至七牛了
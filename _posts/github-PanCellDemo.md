---
title: PanCellDemo  
date: 2015-04-04 02:02:02  
tags: [比特海,开源,iOS]  
category: 比特海  
layout: post  

---

> 左右滑动tableview的cell并做响应，提供两种样式，也可继承`SCCellPanBaseGesture`自定义样式  
> 效果见下面的演示图

### Codes

[click to github](https://github.com/Aevit/SCCellPanGestureRecognizer)

以下是写在`github`里的`README`：  
<!--more-->  

# SCCellPanGestureRecognizer

* * *

### Description

Pan a cell and do sth when end or cancel to pan.  
There are two types of panning a cell in this project.  
And you can inherite from the class `SCCellPanBaseGesture` to make your own type.

* * *

### Display

![preivew_gif](http://file.arvit.xyz/SCCellPanGestureDemo.gif)

* * *

### How to use

1.  copy the folder `SCCellPanGestureRecognizer` to your project.

2.  write the code like this:


```
SCCellPanHorizonGesture *panGes = [[SCCellPanHorizonGesture alloc] initWithTableView:tableView block:^(UITableViewCell *cell, BOOL isLeft) {
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"tips" message:(isLeft ? @"do sth to \"done\"" : @"do sth to \"delete\"") delegate:self cancelButtonTitle:@"ok" otherButtonTitles:nil];
    [alert show];
}];
[panGes buildLeftImgStr:@"icon_list_ok.png" rightImgStr:@"icon_list_del.png"];
[self.view addGestureRecognizer:panGes];
```


1.  see more details in my demo project.

* * *

### Thanks

The second type imitate the app called [VVebo](https://itunes.apple.com/cn/app/vvebo-wei-bo-ke-hu-duan/id670910957?mt=8).  
If the author of `VVebo` do not allow me to imitate, please contact me: `Aevitx@gmail.com`, and I will delete the code.

* * *

### License

This code is distributed under the terms and conditions of the [MIT license](https://raw.githubusercontent.com/Aevit/SCCellPanGestureRecognizer/master/LICENSE).
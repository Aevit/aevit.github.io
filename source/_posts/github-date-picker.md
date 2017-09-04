---
title: SCDatePicker  
date: 2013-12-11 02:02:02  
tags: [比特海,开源,iOS]  
category: 比特海  
layout: post  

---

## 效果图：

  
[![](https://raw.github.com/Aevit/SCDatePicker/master/SCDatePickerViewDemo/preview.png)](https://raw.github.com/Aevit/SCDatePicker/master/SCDatePickerViewDemo/preview.png)  


## 描述：

扁平化的日期选择器，可定制化程序比较高（可定制显示年、月、日、周、时、分、秒中的部分）

参考[https://github.com/christopherney/FlatDatePicker](https://github.com/christopherney/FlatDatePicker)  
由于FlatDatePicker这个没有用复用，也就是如果有30天，就会创建30个label。并且只提供几种样式（如年月日、年月日时分等），没有我所需要的样式，所以最后参考这个项目重新写了个日期选择器。  
<!--more-->

## 项目地址：

[go to github](https://github.com/Aevit/SCDatePicker)

## Usage（两种构造方法）：

首先，复制 SCDatePickerView 这文件夹至你的项目中。然后调用`初始化方法`:


```
    //init 1
    SCDatePickerView *picker = [[SCDatePickerView alloc] initWithParentView:self.view];
    picker.pickerType = SCDatePickerViewTypeDateAndTime;        
        
    //or init 2
    //SCDatePickerView *picker = [[SCDatePickerView alloc] initWithParentView:self.view rowNum:6 withYear:YES withMonth:YES withDay:YES withweekday:YES withHour:YES withMinute:YES withSecond:NO];
    picker.delegate = self;
    self.datePicker = picker;
    [self.datePicker show];
```  



`delegate方法`
```


    - (void)SCDatePickerView:(SCDatePickerView *)datePicker dateDidChange:(NSDate *)date {
        NSLog(@"date:%@", date);
    }


```
```
    - (void)SCDatePickerView:(SCDatePickerView *)datePicker didCancel:(UIButton *)sender {
        NSLog(@"cancel");
    }
```


## To do：

1、更改为可循环滚动

2、增加白色风格主题

3、增加创建普通pickervView功能
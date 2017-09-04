---
title: SCCaptureCamera  
date: 2014-02-24 02:02:02  
tags: [比特海,开源,iOS]  
category: 比特海  
layout: post  

---

## ScreenShots:

  
iPhone4:  
[![](https://raw.githubusercontent.com/Aevit/SCCaptureCamera/master/Screenshots/screenShot_iPhone4.png)](https://raw.githubusercontent.com/Aevit/SCCaptureCamera/master/Screenshots/screenShot_iPhone4.png)  

iPhone5:  
[![](https://raw.githubusercontent.com/Aevit/SCCaptureCamera/master/Screenshots/screenShot_iPhone5.png)](https://raw.githubusercontent.com/Aevit/SCCaptureCamera/master/Screenshots/screenShot_iPhone5.png)  


## Description:


```
A Custom Camera with AVCaptureSession to take a square picture. 
And the UI is patterned on Instagram.

It can work in iPad, too.
```
<!--more-->

## Codes:

[go to github](https://github.com/Aevit/SCCaptureCamera)

## Usage:

0、Import four frameworks:


```
CoreMedia.framework、QuartzCore.framework、AVFoundation.framework、ImmageIO.framework
```


1、Drag “SCCaptureCamera” and “SCCommon” to your project.

2、Import “SCNavigationController.h” and code like this:


```
SCNavigationController *nav = [[SCNavigationController alloc] init];
nav.scNaigationDelegate = self;
[nav showCameraWithParentController:self];
```


3、After take a picture, you can call back with delegate or a notification.

*   delegate:


```
- (void)didTakePicture:(SCNavigationController *)navigationController 
image:(UIImage *)image
```


*   notification:


```
add a notification whose name is kNotificationTakePicture
(just search "kNotificationTakePicture" in my demo project)
```


Finally, set `SWITCH_SHOW_DEFAULT_IMAGE_FOR_NONE_CAMERA` which is in the file `SCCaptureCameraController.m` to `0`, it is just a joke for the devices which cannot take a picture.
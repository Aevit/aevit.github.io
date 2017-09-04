---
title: SCWrapDemo  
date: 2014-12-26 02:02:02  
tags: [比特海,开源,iOS]  
category: 比特海  
layout: post  

---

>  
我从开源世界收获了很多，我希望能为开源世界作一点小小的贡献

由于iOS里的`actionSheet`、`imagePicker`、`alert`写起来有点花时间，所以对这三个东西进行了简单的封装。  
事件的回调主要是通过`闭包`，代替原来的`代理模式`。

### Codes

[go to github](https://github.com/Aevit/SCWrapDemo)

以下是写在`github`里的`README`：  
<!--more-->  

# SCWrapDemo

* * *

### Description

A wrap for _`actionSheet`_, _`alert`_, _`imagePicker`_.  
Use `block` instead of `delegate`.  
Easy to use.

* * *

### Display

![preivew_gif](https://raw.githubusercontent.com/Aevit/SCWrapDemo/master/SCWrapDemo.gif)

* * *

### How to use

#### 1\. SCActioSheetWrap


```
/**
 *  add a normal action
 *
 *  @param title      title
 *  @param eventBlock event
 */
- (void)addButtonTitle:(NSString*)title eventBlock:(EventBlock)eventBlock;

/**
 *  add a destructive action
 *
 *  @param title      title
 *  @param eventBlock event
 */
- (void)addDestructiveButtonTitle:(NSString*)title eventBlock:(EventBlock)eventBlock;

/**
 *  add a cancel action
 *
 *  @param title      title
 *  @param eventBlock event
 */
- (void)addCancelButtonTitle:(NSString*)title eventBlock:(EventBlock)eventBlock;

/**
 *  show actionsheet with title
 *
 *  @param title title
 */
- (void)showWithTitle:(NSString*)title;
```


>  
e.g.  
Add 4 actions: include one `destructive` action, two `normal` actions, and one `cancel` action


```
SCActionSheetWrap *aWrap = [[SCActionSheetWrap alloc] init];
[aWrap addDestructiveButtonTitle:@"Reset text" eventBlock:^(id anything) {
	[SVProgressHUD showSuccessWithStatus:@"Reset text"];
}];
[aWrap addButtonTitle:@"change text to \"Merry\"" eventBlock:^(id anything) {
	[SVProgressHUD showSuccessWithStatus:@"Merry"];
}];
[aWrap addButtonTitle:@"change text to \"Christmas\"" eventBlock:^(id anything) {
	[SVProgressHUD showSuccessWithStatus:@"Christmas"];
}];
[aWrap addCancelButtonTitle:@"Cancel" eventBlock:^(id anything) {
	[SVProgressHUD showSuccessWithStatus:@"if you did not add the cancel action, the wrap will auto add the cancel action."];
}];
[aWrap showWithTitle:@"Please Choose"];
self.asWrap = aWrap;
```


#### 2\. SCImagePickerWrap


```
/**
 *  for multi select photos
 *
 *  @param anything anything
 */
typedef void(^PickMultiImagesBlock)(id anything);

/**
 *  the delegate of the imagePickerController
 */
@property (nonatomic, unsafe_unretained) id<UINavigationControllerDelegate,UIImagePickerControllerDelegate, UIActionSheetDelegate> parent;

/**
 *  SCActionSheetWrap
 */
@property (nonatomic, strong) SCActionSheetWrap *asWrap;

/**
 *  if set to YES, will show a square crop. Default is NO.
 */
@property (nonatomic, assign) BOOL allowsEditing;

/**
 *  if you want to select multi photos, call this method to present a controller for user to multi select photos
 */
@property (nonatomic, copy) PickMultiImagesBlock pickMultiImagesBlock;

/**
 *  init
 *
 *  @param parent the delegate of the imagePickerController
 *
 *  @return self
 */
- (id)initWithParent:(id)parent;

/**
 *  if you want to select multi photos, call this method to present a controller for user to multi select photos
 *
 *  @param block present a controller for multi select photos
 */
- (void)buildPickMultiPhotosBlock:(PickMultiImagesBlock)block;

/**
 *  show system camera and album，will show three actions: camera, local album and cancel
 */
- (void)showMenuWithSystemCameraAndAlbum;

/**
 *  show imagePicker with UIImagePickerControllerSourceType
 *
 *  @param sourceTye UIImagePickerControllerSourceType
 */
- (void)showImagePicker:(UIImagePickerControllerSourceType)sourceTye;
```


>  
e.g.  
Add 3 actions: include one `camera` action, one `local album` action, and one `cancel` action


```
SCImagePickerWrap *aWrap = [[SCImagePickerWrap alloc] initWithParent:self];
[aWrap showMenuWithSystemCameraAndAlbum];
self.imagePickerWrap = aWrap;
```


>  
or you want to add more actions: include one `camera` action, one `local album` action, one **`show big image`** actions, and one `cancel` action


```
WEAKSELF_WRAP
SCImagePickerWrap *aWrap = [[SCImagePickerWrap alloc] initWithParent:self];
[aWrap.asWrap addButtonTitle:WrapLocalization(@"Camera") eventBlock:^(id anything) {
	[weakSelf.imagePickerWrap showImagePicker:UIImagePickerControllerSourceTypeCamera];
}];
[aWrap.asWrap addButtonTitle:WrapLocalization(@"Local album") eventBlock:^(id anything) {
	[weakSelf.imagePickerWrap showImagePicker:UIImagePickerControllerSourceTypeSavedPhotosAlbum];
}];
[aWrap.asWrap addButtonTitle:WrapLocalization(@"Show full image") eventBlock:^(id anything) {
	[SVProgressHUD showSuccessWithStatus:@"show the full image"];
}];
[aWrap.asWrap addCancelButtonTitle:WrapLocalization(@"Cancel") eventBlock:^(id anything) {
	[SVProgressHUD showSuccessWithStatus:@"if you did not add the cancel action, the wrap will auto add the cancel action."];
}];
[aWrap.asWrap showWithTitle:WrapLocalization(@"Please choose")];
self.imagePickerWrap = aWrap;
```


>  
After you have selected a image, you could get the image in the delegate of the imagePicker (the `parent` above).  
Just in the delegate method:


```
- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info;
```


### 3\. SCAlertWrap


```
/**
 *  add a normal action
 *
 *  @param title      title
 *  @param eventBlock event
 */
- (void)addButtonTitle:(NSString*)title eventBlock:(EventBlock)eventBlock;

/**
 *  add a cancel action
 *
 *  @param title      title
 *  @param eventBlock event
 */
- (void)addCancelButtonTitle:(NSString*)title eventBlock:(EventBlock)eventBlock;

/**
 *  add a textField action (for iOS8)
 *
 *  @param textFieldEventBlock event
 */
- (void)addTextFieldWithEventBlock:(TextFieldEventBlock)textFieldEventBlock;

/**
 *  add a destructive action (for iOS8)
 *
 *  @param title      title
 *  @param eventBlock event
 */
- (void)addDestructiveButtonTitle:(NSString*)title eventBlock:(EventBlock)eventBlock;

/**
 *  show the alert
 *
 *  @param style  style
 *  @param title  title
 *  @param messag message
 */
- (void)showWithStyle:(UIAlertViewStyle)style title:(NSString*)title message:(NSString*)message;

/**
 *  show the alert for iOS8
 *
 *  @param title   title
 *  @param message message
 */
- (void)showForiOS8WithTitle:(NSString*)title message:(NSString*)message;
```


>  
e.g.  
Add one `Sure` button, and one `Cancel` button.  
For iOS7: show a random UIAlertType.  
For iOS8: add a `username textField`, a `password textField` and a `destructive` button


```
SCAlertWrap *aWrap = [[SCAlertWrap alloc] init];
if (WRAP_SYSTEM_VERSION >= 8.0) {
	[aWrap addTextFieldWithEventBlock:^(UITextField *textField) {
		textField.placeholder = @"username...";
	}];
	[aWrap addTextFieldWithEventBlock:^(UITextField *textField) {
		textField.secureTextEntry = YES;
		textField.placeholder = @"password...";
	}];
	[aWrap addDestructiveButtonTitle:WrapLocalization(@"Delete") eventBlock:^(id anything) {
		[SVProgressHUD showSuccessWithStatus:WrapLocalization(@"Delete")];
	}];
}
[aWrap addButtonTitle:WrapLocalization(@"Sure") eventBlock:^(id anything) {
	NSMutableString *str = [NSMutableString string];
	[str appendString:@"tap the Sure button"];
	if (WRAP_SYSTEM_VERSION >= 8.0) {
		[str appendFormat:@", there are %lu textFields", (unsigned long)((UIAlertController*)anything).textFields.count];
	}
	[SVProgressHUD showSuccessWithStatus:str];
}];
[aWrap addCancelButtonTitle:WrapLocalization(@"Cancel") eventBlock:^(id anything) {
	[SVProgressHUD showSuccessWithStatus:@"if you did not add the cancel action, the wrap will auto add the cancel action."];
}];
[aWrap showWithStyle:arc4random() % 4 title:WrapLocalization(@"Please choose") message:@""];
self.alertWrap = aWrap;
```


* * *

### Thanks

Thanks [SVProgressHUD](https://github.com/TransitApp/SVProgressHUD) to show something.

* * *

### License

This code is distributed under the terms and conditions of the [MIT license](https://github.com/Aevit/SCWrapDemo/blob/master/LICENSE).
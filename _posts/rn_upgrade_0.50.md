---
title: ReactNative升级至0.50.3  
date: 2017-11-18 17:13:26  
tags: [比特海,ReactNative,升级]  
category: 比特海  
layout: post  

---

## 前言
本文主要记录升级项目的 `ReactNative` 框架版本（`0.44` 升到 `0.50`）过程中遇到的一些问题，主要包含三部分：  

* iOS 编译  
* 运行 JS  
* android 编译  

这次框架升级变动比较大，下面我们一步一步来解决。  

<!--more-->

以下是我使用的环境：  

```
操作系统: OS X 10.13.1  
Xcode: 9.1  
Android Studio: 2.3  
NVM: 0.33.2  
Node: 8.1.2  
Yarn: 1.0.1  
```

## 第三方编译库  
由于 `RN 0.45.0` 后，需要依赖一些第三方库，这些库通过 `npm` 或 `yarn` 下载非常慢，所以可以先手动下载，放到此文件夹： `~/.rncache`（如果路径不存在就手动创建一个）

以下是我用到的几个库（版本可能会有更新），如果手动下载有困难，可以找已经下载好的同学拿一下：  

```
boost_1_63_0.tar.gz
double-conversion-1.1.5.tar.gz
folly-2016.09.26.00.tar.gz
glog-0.3.4.tar.gz
```

这里面也有人分享了下载链接到百度网盘：  
[iOS RN 0.45以上版本所需的第三方编译库(boost等)](http://reactnative.cn/post/4301)

## react-natvei-git-upgrade
RN 的版本升级，以前都要手动去改 pacakge.json 里的版本号，现在使用 react-native-git-upgrade 这个工具来进行，可以省掉很多工作。  
 
[react-native-git-upgrade 安装方法](https://facebook.github.io/react-native/docs/upgrading.html)  

接下来主要分为两部分来解决，一部分是编译报错，一部分是运行 JS 报错（红屏错误），以下是我的相关记录。  

## iOS 编译
首先执行一遍 `yarn` 命令，然后执行 `react-native-git-upgrade`  

> PS: 涉及到公司项目，下面关于目录的路径会以 xxx 等来代替
 
接下来会一个又一个的问题，下面会列出我遇到的问题，解决完一个后就用 Xcode 重新 run 一下

### react-natvei-git-upgrade 报错  
如果执行 `react-native-git-upgrade` 后报以下错误：  

![](http://aevit.qiniudn.com/5d8d2ef6ac7d007a766c6f58e250f8d81510995990.png)

解决方法：  

```
# 先找到刚才执行 `react-native-git-upgrade` 命令后产生的一个 patch 文件
$ ls $TMPDIR/react-native-git-upgrade

# 结果类似如下：  
upgrade_0.44.0_0.50.3.patch

# 然后在项目根目录执行以下命令：  
$ git apply $TMPDIR/react-native-git-upgrade/upgrade_0.44.0_0.50.3.patch --reject
```

下面是我执行命令后截取产生的部分内容：  

```
Checking patch ios/xxx/Images.xcassets/Contents.json...
Checking patch package.json...
Checking patch yarn.lock...
Applying patch .gitignore with 1 reject...
Rejected hunk #1.
Applied patch android/app/build.gradle cleanly.
Applying patch ios/xxx.xcodeproj/project.pbxproj with 13 rejects...
Rejected hunk #1.
Rejected hunk #2.
Rejected hunk #3.
Rejected hunk #4.
Rejected hunk #5.
Rejected hunk #6.
Rejected hunk #7.
Rejected hunk #8.
Rejected hunk #9.
Rejected hunk #10.
Rejected hunk #11.
Rejected hunk #12.
Rejected hunk #13.
Applying patch ios/xxx/AppDelegate.m with 1 reject...
Rejected hunk #1.
Applied patch ios/xxx/Images.xcassets/Contents.json cleanly.
Applied patch package.json cleanly.
Applied patch yarn.lock cleanly.
```

参考：  
[https://github.com/facebook/react-native/issues/12112#issuecomment-284491701](https://github.com/facebook/react-native/issues/12112#issuecomment-284491701)

> 看了官方的 `.gitignore` 文件，里面是没有忽略 `.flowconfig` 的，所以也建议不要忽略掉了  

### pod 错误

由于项目中 iOS 用了 CocoaPods，所以可能会报这个错（没用 CocoaPods 的可以忽略）

```
{path_to_your_project}/ios/Pods/Pods.xcodeproj Couldn't load project
```

只要重新安装一遍 pod 依赖就行：  

```
$ cd {path_to_your_project}/ios
$ pod install
```


### 引用 RCTBridgeModule.h 错误 (Redefinition)

```
/Users/xxx/projects/ReactNative/xxx/node_modules/react-native/React/Base/RCTBridgeModule.h:54:16: Redefinition of 'RCTMethodInfo'
```

如果报以上 Redefinition 的错误，是因为以前使用了这样的方式来引进 RCTBridgeModule.h：  

```
#import "RCTBridgeModule.h"
```

`RN 0.48` 后一定要使用以下方式引进了：  

```
#import <React/RCTBridgeModule.h>
```

如果为了兼容旧版本，可以用宏来判断一下（**注意**一定要把 `<React/RCTBridgeModule.h>` 的判断放在前面）：  

```
#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#elif __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#endif
```

如果是我们自己写的文件就直接改就行了，如果是第三方库的，就先去看下该库最新版有没适配了，有的话直接更新该库就行，没有的话就只能 fork 该项目后自己改了。  

如我遇到的这个 RCTBEEPickerManager，去 github 看了下有适配了，所以直接升级就好了：  

![](http://aevit.qiniudn.com/f28f12a3bfebfab6f495bb7f22ca1eb61510996056.png)

参考：  
[https://github.com/facebook/react-native/issues/15775](https://github.com/facebook/react-native/issues/15775)


### UMMobClick

```
/Users/xxx/projects/ReactNative/xxx/node_modules/rn-umeng/ios/RCTUmeng/RCTUmeng/RCTUmeng.m:11:9: 'UMMobClick/MobClick.h' file not found
```

因为友盟是通过软链把 framework 链接过去的，不知道为啥有时 `yarn install` 或 `npm install` 后，那个软链接不见了，所以只能手动重新做一下软链接：  

```
cd ./node_modules/rn-umeng/ios/RCTUmeng/RCTUmeng/UMAnalytics_Sdk/UMMobClick.framework/Versions/ && ln -s A Current && cd .. && ln -s Versions/Current/Headers/ Headers && ln -s Versions/Current/UMMobClick UMMobClick && cd ../../../../../../../
```

### env.json

```
(null): error: /Users/xxx/projects/ReactNative/xxx/ios/xxx/env.json: No such file or directory
```

`env.json` 这是我用来做一些环境配置的东西，如果没用到的话可以忽略这条。  

由于各人的环境（如 ip）是不一样的，为了避免冲突，所以将此文件放进了 `.gitignore` 里，这里就手动复制一下 `.env.json.example` 稍微改下后缀和里面内容就行了


### react-native-xcode.sh

```
/Users/xxx/Library/Developer/Xcode/DerivedData/xxx-bghjpnetkufdnqgonitwrdmmbxdw/Build/Intermediates.noindex/xxx.build/Debug-iphonesimulator/xxx.build/Script-00DD1BFF1BD5951E006B06BC.sh: line 3: ../node_modules/react-native/packager/react-native-xcode.sh: No such file or directory
```

看了下源码，现在用来打包 js 代码和图片的脚本的路径已经变了，以前是在这里：  

```
export NODE_BINARY=node
../node_modules/react-native/packager/react-native-xcode.sh
```

现在要换为以下路径（在 Xcode 的 `Build Phases` 里的 `Bundle React Native code and images` 里改）：  

```
export NODE_BINARY=node
../node_modules/react-native/scripts/react-native-xcode.sh
```

### 小结
经过以上修改，我的项目就能编译成功了，你的项目可能还会遇到其它坑，这个就要自行挖掘善用 google 了。  

接下来就看下跑起来后 js 报的一些错误


## iOS 运行

编译成功后，会遇到 js 报的错误，正常是会报红屏出来。~~不过发现会因为有些错误，红屏不能在启动后自动出现，需要**按 Home 键回到桌面再点击图标进入**，才会显示红屏错误。~~

后来发现是因为用了 [react-native-splash-screen](https://github.com/crazycodeboy/react-native-splash-screen) 这个库，这个库是用来解决 RN 启动时多次闪屏的问题，原理是让 mainRunloop 一直循环等待：  

```
+ (void)show {
    if (!addedJsLoadErrorObserver) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(jsLoadError:) name:RCTJavaScriptDidFailToLoadNotification object:nil];
        addedJsLoadErrorObserver = true;
    }

    while (waiting) {
        NSDate* later = [NSDate dateWithTimeIntervalSinceNow:0.1];
        [[NSRunLoop mainRunLoop] runUntilDate:later];
    }
}
```

在 js 加载到自己的入口页面后，手动调用 hide 方法隐藏掉：  

```
+ (void)hide {
    dispatch_async(dispatch_get_main_queue(),
                   ^{
                       waiting = false;
                   });
}
```

如果 JS Bundle 没能正常加载，会导致我们自己设置的 hide 入口一直调用不到，所以闪屏页会一直卡在那里，看不到红屏错误。  

其实上面的 `show` 方法里，有监听 js 加载错误的通知，在加载失败时会自动调用 `hide` 方法，以前版本是会 post 一个 `RCTJavaScriptDidFailToLoadNotification` 通知。  

不过查看 `RN 0.50` 的源码后发现，在 JS 加载失败时（比如说编译到真机，设置的地址是 `http://127.0.0.1:8081/index.ios.bundle?platform=ios&dev=true`，但是真机又没有设置代理，所以真机是访问不到 127.0.0.1 上的 JS Bundle），不会 post 一个 `RCTJavaScriptDidFailToLoadNotification` 的通知，跟踪代码到 `RCTCxxBridge.m` 里的这个方法：  

```
- (void)loadSource:(RCTSourceLoadBlock)_onSourceLoad onProgress:(RCTSourceLoadProgressBlock)onProgress {
	...
	    [RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onProgress:onProgress onComplete:^(NSError *error, RCTSource *source) {
      if (error) {
        RCTLogError(@"Failed to load bundle(%@) with error:(%@ %@)", self.bundleURL, error.localizedDescription, error.localizedFailureReason);
        return;
      }
      onSourceLoad(error, source);
    }];
	...
}
```

上面 `onComplete` 的 block 里，跑进 error 里就直接 return 了，正常来说应该要调用 `onSourceLoad(error, source)`，里面会判断 error 不为空，就调用 `handleError` 方法，发送 `RCTJavaScriptDidFailToLoadNotification` 的通知，不知道为什么在这里不调用了。  

目前只能回到桌面再进来才能看到红屏页面了，不过下面的 `Reload JS` 按钮是点击不了的，或者是在 `AppDelegate.m` 里调用 show  方法后，定时一些时间后调用 hide 方法：  

```
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
	...
    [SplashScreen show];
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(15 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [SplashScreen hide];
    });
	return YES;
}
```


> PS: 如果在升级前开了 `Debug JS Remotely`，可能会看不到具体在哪个文件报错，这时候只能先卸载掉桌面的 app 重新安装一次了

### 图片
由于历史原因，少部分图片引用时将 `@2x` 或是 `@3x` 或是 `.ios` 这个后缀也写进去了，现在这样会报错了：  

![](http://aevit.qiniudn.com/ae3b9757747a70e0e42a6399b9ba42ea1510996109.png)

```
如：
require('./pic@2x.png') 或 require('./pic.ios.png')
要换为
require('./pic.png')
```

全局搜索 `@2x.png` 及 `@3x.png` 将 **js 文件里** 用到的去掉就行了（注意非 js 文件就不要改了）  


### EventEmitter 引用错误

![](http://aevit.qiniudn.com/fcd0a0ff271d410e33aad35ff33429381510996136.png)

根据上面报错路径: `./node_modules/react-native-root-siblings/lib/AppRegistryInjection.js`  

查看源码发现是因为新版 RN 的 EventEmitter 的路径已经变了，看了下这个 `react-native-root-siblings` 是 `react-native-root-toast` 所依赖的一个库：  

```
import EventEmitter from 'react-native/Libraries/EventEmitter/EventEmitter';
```

去 github 看了下这个库已经适配了，所以直接升级该库就行了


### PropTypes

![](http://aevit.qiniudn.com/28c5eded86160314ad2e3030213d72111510996158.png)

以前引用 PropTypes 是从 React 里引：  

```
import React, { PropTypes } from 'react';
```

现在已经完全废弃了，需要另外安装这个库: [prop-types](https://github.com/facebook/prop-types)  

```
$ npm install --save prop-types
```

然后单独引进：  

```
import PropTypes from 'prop-types'; // ES6
var PropTypes = require('prop-types'); // ES5 with npm
```

如果是我们自己写的文件就直接改就行了，如果是第三方库的，就先去看下该库最新版有没适配了，有的话直接更新该库就行，没有的话就只能 fork 该项目后自己改了。 

> PS: 这里相当多地方要改，花了老多时间一个一个改...

另外，以前使用 `View.proptypes` 的，要改用 `ViewProptypes`，如:  

```
import { ViewProptypes } from 'react-native'

static proptypes = {
	style: ViewProptypes.style
};
```

### React.createClass
![](http://aevit.qiniudn.com/fed5c02ca363f1a4deab296f33466ca71510996192.png)

ES5 可以使用以下来创建一个类：  

```
var xxx = React.createClass({})
```

现在新版 RN 完全废弃这种写法了，要么单独引进 [create-react-class](https://www.npmjs.com/package/create-react-class) ，要么使用 ES6 的写法：  

```
export default class xxx extends React.xxxyyy {}
```

其中还需要一起修改的写法包括属性、state、方法声明，去掉方法间逗号等，以下是 ES5 的写法：  

```
var xxx = React.createClass({
  propTypes: {
    color: PropTypes.string
  },
  getDefaultProps: function () {
    return {
      color: '#8E91A8'
    }
  },
  getInitialState () {
    return { test: 1 }
  },
  render: function () {
  	return <View />
  }
})

module.exports = xxx
```

要改为 ES6 的写法：  

```
export default class xxx extends React.xxxyyy {
  static propTypes = {
    color: PropTypes.string
  };
  static defaultProps = {
    color: '#8E91A8'
  };
  constructor (props) {
  	super(props)
  	this.state = { test: 1 }
  }
  render () {
  	return <View />
  }
}
```

需要注意的是，使用 create-react-class 时，会自动绑定 this（[https://reactjs.org/docs/react-without-es6.html](https://reactjs.org/docs/react-without-es6.html)），所以修改为 ES6 写法，要注意 this 的绑定，像这次就遇到一个地方需要手动绑定一下：  

```
export default class xxx extends React.Component {
	renderTab (xx, yy) {
		return <View style={this.props.style} />
	}
	
	render () {
		<View>
		{ this.props.tabs.map((name, page) => {
			const renderTab = this.props.renderTab || this.renderTab
			// 原本是 return renderTab(xx, yy)，要换为以下：  
			return renderTab.call(this, xx, yy)
		})}
		</View>
	}
}
```

### Image 作为背景  
![](http://aevit.qiniudn.com/106b2b06f8b5bba923663608c5b594521510996213.png)

以前如果要用一张图片做背景，会在 Image 里包含内容：  

```
<Image>
	<View />
</Image>
```

现在已经废弃了，要么给 Image 使用绝对定位来布局，要么使用 `ImageBackground`:  

```
import { ImageBackground } from 'react-native'

<ImageBackground>
	<View />
</ImageBackground>
```

查看 `<ImageBackground>` 的源码(此时查看的 RN 版本是 0.50.3)，发现内部是用一个 View 包住一个 Image 及其 children。看注释说里面的 Image 的宽高跟外面 ImageBackground 设置的宽高有冲突，所以目前只能在内部的 Image 里再重新设置了一下宽高，后面等有完美的方案后会移除掉这个。  

值得一提的是，这次适配中，以前用 Image 时是直接写了 style，如果 style 里有 `resizeMode`，就会报警告了，因为 View 是没有 `resizeMode` 这个样式的，所以要把样式通过 `imageStyle` 属性传进去。  

`ImageBackground` 源码：  

```
render() {
    const {children, style, imageStyle, imageRef, ...props} = this.props;

    return (
      <View style={style} ref={this._captureRef}>
        <Image
          {...props}
          style={[
            StyleSheet.absoluteFill,
            {
              // Temporary Workaround:
              // Current (imperfect yet) implementation of <Image> overwrites width and height styles
              // (which is not quite correct), and these styles conflict with explicitly set styles
              // of <ImageBackground> and with our internal layout model here.
              // So, we have to proxy/reapply these styles explicitly for actual <Image> component.
              // This workaround should be removed after implementing proper support of
              // intrinsic content size of the <Image>.
              width: style.width,
              height: style.height,
            },
            imageStyle,
          ]}
          ref={imageRef}
        />
        {children}
      </View>
    );
  }
}
```

所以这次升级中，如果有用到 `<Image>` 包裹内容，需要改为 `<ImageBackground>`，并且如果原本的 style 里有用到 `resizeMode`，如：   
```
<Image style={resizeMode:'contain'}>
	<View />
</Image>
```

要改为 imageStyle：  

```
<ImageBackground imageStyle={ resizeMode: 'contain' }>
	<View />
</ImageBackground>
```

或是干脆将 resizeMode 作为一个属性传过去（个人比较喜欢这种），当然如果是其它 Image 独有的 style，就只能通过 imageStyle 传过去了：  

```
<ImageBackground resizeMode={'contain'}>
	<View />
</ImageBackground>
```

> 换为 ImageBackground 后，布局可能会有点不一样，建议改完后实际看下效果再调整一下

还需要**特别注意**的是，因为我最开始全局搜 `</Image>` 来查找内部包含子控件的 Image，但是用到动画的就搜不出来了：`</Animatable.Image>`，所以还需要搜索一下这个改改。  

> 这个控件是在进入该页面时才会报错的，所以改好后最好都看下，全部测试一遍  

### VSCode 不能 Debug

> 这是当时用的最新版本：  
> VSCode 版本: 1.18.0  
> react-native-tools 插件版本: 0.5.2

点击 VSCode 的 Debug 按钮时，报了以下错误：  

```
[Error] Error: Error while executing command 'react-native run-ios --simulator --no-packager': Error while executing command 'react-native run-ios --simulator --no-packager'
```

这种错误有点莫名其妙，没有详细的报错信息，试了下新建一个 RN 0.50.3 的工程也是不能 Debug，估计是 VSCode 或 react-native-tool 本身的问题，只能等其更新了，暂时使用 [react-native-debugger](https://github.com/jhen0409/react-native-debugger) 代替来 Debug 了。  

> 以前也遇过升级版本后，VSCode 的调试用不了，真是心酸  

### RCTTextField
iOS 里以前这个控件是继承自 `UITextField`，现在是继承自 `RCTTextInput`，里面 .m 文件里包含这一个输入控件：  

```
@property (nonatomic, readonly) UIView<RCTBackedTextInputViewProtocol> *backedTextInputView;
```

这个控件没有暴露在 .h 文件里，所以我们项目中如果用了自定义键盘（赋值给 inputView），以前是这样直接取：  

```
UITextField *view = (UITextField*)[_bridge.uiManager viewForReactTag:reactTag];
view.inputView = customView;
```

现在这样会报错了，需要自己手动去查找一下，先这样简单粗暴地处理了：  

```
- (UITextView*)getRealTextView:(UITextView*)reactView {
    if ([self canInputText:reactView]) {
        return reactView;
    }
    // RN 0.50 后 RCTTextField 不是继承自 UITextField 了，多包了一层，这里遍历一下去查找
    for (UITextView *aView in reactView.subviews) {
        if ([self canInputText:aView]) {
            return (UITextView*)aView;
        }
    }
    return nil;
}

- (BOOL)canInputText:(UIView*)view {
    return [view isKindOfClass:[UITextField class]] || [view isKindOfClass:[UITextView class]];
}
```

然后去调用一下方法：  

```
UITextField *view = (UITextField*)[_bridge.uiManager viewForReactTag:reactTag];
view = [self getRealTextView:view]; // 兼容 RN 0.50
view.inputView = customView;
```

## android 编译

## createJSModules

![](http://aevit.qiniudn.com/82a0a827e888527f0e5ce1ca011f15f51510996245.png)

```
@Override
public List<Class<? extends JavaScriptModule>> createJSModules() {
	return Collections.emptyList();
}
```

从 RN 0.47 开始，以上写法会报错:  

```
错误: 方法不会覆盖或实现超类型的方法
```

解决方法是将前面的 `@Override` 去掉  

## InnerClass

```
Warning:Ignoring InnerClasses attribute for an anonymous inner class
associated EnclosingMethod attribute. This class was probably produced by a
solution is to recompile the class from source, using an up-to-date compiler
compiler that did not target the modern .class file format. The recommended
compiler that did not target the modern .class file format. The recommended
(android.support.v4.view.accessibility.AccessibilityNodeProviderCompatKitKat$1) that doesn't come with an
indicate that it is *not* an inner class.
this warning is that reflective operations on this class will incorrectly
and without specifying any "-target" type options. The consequence of ignoring
(android.support.v4.view.AccessibilityDelegateCompatIcs$1) that doesn't come with an
solution is to recompile the class from source, using an up-to-date compiler
and without specifying any "-target" type options.
```

报错类似如上，解决方法是在 `proguard-rules.pro` 文件加上：  

```
-keepattributes InnerClasses
```

参考：  
[https://stackoverflow.com/questions/35796144/progaurd-issue-warningignoring-innerclasses-attribute-for-an-anonymous-inner-c](https://stackoverflow.com/questions/35796144/progaurd-issue-warningignoring-innerclasses-attribute-for-an-anonymous-inner-c)

## react-native-splash-screen
使用[这个库](https://github.com/crazycodeboy/react-native-splash-screen)（3.0.6 版本），在启动时会报错 `Can't convert to color: type=0x1`：  

```
java.lang.UnsupportedOperationException: Can't convert to color: type=0x1
2 android.app.ActivityThread.performLaunchActivity(ActivityThread.java:2423)
3 ......
4 Caused by:
5 java.lang.UnsupportedOperationException:Can't convert to color: type=0x1
6 android.content.res.TypedArray.getColor(TypedArray.java:453)
7 com.android.internal.policy.PhoneWindow.generateLayout(PhoneWindow.java:3779)
8 com.android.internal.policy.PhoneWindow.installDecor(PhoneWindow.java:3983)
9 com.android.internal.policy.PhoneWindow.setContentView(PhoneWindow.java:383)
10 android.app.Dialog.setContentView(Dialog.java:515)
11 org.devio.rn.splashscreen.SplashScreen$1.run(SplashScreen.java:32)
12 android.app.Activity.runOnUiThread(Activity.java:5573)
13 org.devio.rn.splashscreen.SplashScreen.show(SplashScreen.java:26)
14 org.devio.rn.splashscreen.SplashScreen.show(SplashScreen.java:47)
15 com.gf.mobile.clickeggs2.MainActivity.onCreate(MainActivity.java:27)
```

解决方法是在项目的 `xxx/android/app/src/main/res/values/color.xml` 里添加一个 `primary_dark`:  

```
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <drawable name="translate">#00000000</drawable>
    <color name="primary_dark">#000000</color>
</resources>
```

参考：  
[https://github.com/crazycodeboy/react-native-splash-screen/issues/123#issuecomment-342823345](https://github.com/crazycodeboy/react-native-splash-screen/issues/123#issuecomment-342823345)


### Gif 播放报错

报错内容太多，这里截取部分：  

```
java.lang.NoClassDefFoundError: Failed resolution of: Lcom/facebook/imagepipeline/memory/PooledByteBuffer;

at com.facebook.imagepipeline.animated.factory.AnimatedImageFactoryImpl.decodeGif(AnimatedImageFactoryImpl.java:86)

at com.facebook.imagepipeline.decoder.DefaultImageDecoder.decodeGif(DefaultImageDecoder.java:145)

Caused by: java.lang.ClassNotFoundException: Didn't find class "com.facebook.imagepipeline.memory.PooledByteBuffer" on path: DexPathList[[zip file "/data/app/cn.touna.touna-1/base.apk"],nativeLibraryDirectories=[/data/app/cn.touna.touna-1/lib/arm, /system/lib, /vendor/lib, system/vendor/lib, system/vendor/lib/egl, system/lib/hw]]
```

从上面看是 gif 相关的错误，看到 `build.gradle` 里有引进 gif:  

```
dependencies {
	...
	compile 'com.facebook.fresco:animated-gif:1.0.1'
	...
}
```

看了下是用到这个库：  
[https://github.com/facebook/fresco](https://github.com/facebook/fresco)

添加多一个东西，并且更新版本就解决了:  

```
dependencies {
	...
	// 注意以下两者顺序最好不要换，之前试过顺序换过来，但是最后报错了
    compile 'com.facebook.fresco:animated-gif:1.5.0'
    compile 'com.facebook.fresco:fresco:1.5.0'
	...
}
```

## 总结
至此升级完毕，项目能跑起来了，不过由于这次好多东西都废弃了，一些第三方库的 api 也可能做了修改，所以可能还有一些隐藏的 bug 存在，最好重新完整测试一遍。  

建议不要在 dev 阶段关闭 RN 的警告(`console.disableYellowBox = false`)，这样能发现一些隐藏的 bug，或是一些以后将会被废弃的东西，及早修改。  

---

2017-11-18 17:13    
Aevit  
深圳南山  

---

![](http://aevit.qiniudn.com/3ba1a7efb287ad0939e58729582e29251510996366.jpeg)

摄影：Aevit 2015年8月 黄姚  
---
title: ReactNative ScrollView 及 WebView 上下拖动切换   
date: 2017-09-21 21:36:10  
tags: [比特海,ReactNative,ScrollView,WebView]  
category: 比特海  
layout: post  

---

## 前言
本文主要记录在 ReactNative 里如何实现 ScrollView 及 WebView 的上下拖动切换。  

由于 ReactNative 里 [WebView](https://facebook.github.io/react-native/docs/webview.html) 没有提供 `onScrollEndDrag` 等拖动事件的回调，所以只能通过别的方法来实现。原生的 WebView 有这些回调，但是这样的话得借助 iOS 跟 android 两端的原生代码，这里我们只通过 js 来实现最终效果：  

<!--more-->

![](http://aevit.qiniudn.com/81312535857674073f2557807c1fb4ba1506000875.gif)

<br>

> PS：截止本文时间，RN 最新版本为 0.48.0，下面的 demo 是以 0.48.0 为基础的

<br>

---

## 方案
上面使用 ScrollView 来承载内容，这个是没有问题的，关键是对下面 WebView 的处理。  

RN 的 WebView 可以通过 `postMessage` `onMessage` 来跟网页进行交互，所以我们可以通过给 WebView 注入一些 js 代码来实现一些交互，有两种方案：  

* 将 WebView 用一个 ScrollView 包裹，然后给 WebView 注入一段 js 得到网页内容高度，之后再传回 RN 端来改变 WebView 高度。结构大概如下：  

```
<Animated.View>
	<ScrollView>
		{ /* your contents here */ }
	</ScrollView>
	<ScrollView>
		<WebView />
	</ScrollView>
</Animated.View>
```

* 给 WebView 注入一段 js 代码，在网页端来监听触摸事件（`touchstart`、`touchmove`、`touchend`），通过统计 `touchmove` 事件 在顶部继续下拉 被调用的次数，在拖动结束后将结果传回给 RN 端处理。结构大概如下：  

```
<Animated.View>
	<ScrollView>
		{ /* your contents here */ }
	</ScrollView>
	<WebView />
</Animated.View>
```

第一种方案有个问题，就是如果网页本身有个一直停留在顶部的 header 的话（即样式为 `position: static`）（如上面 gif 图中网页顶部的`推荐、视频、娱乐、体育、时尚`那一栏），改变 webview 高度的话，会导致这个 header 跟着一起滑动了；  

第二种方案在 **小于 5.0** 的安卓系统上行不通，因为系统原因，WebView 不能实时监听到 `touchmove` 事件。

所以综合起来，解决方案如下：  

* **<5.0** 的 android 系统，使用方案一  
* iOS 系统及 **≥5.0** 的 android 系统，使用方案二  


<br>

---

## 编码

### ScrollView 切换至 WebView
通过监听 ScrollView 的 `onScrollEndDrag` 事件，然后通过最外层的 `Animated.View` 来进行切换即可。  

其中由于 iOS 有弹性效果，即到了顶部/底部后还是可以继续拖动，但是 android 是不行的，所以在 `onScrollEndDrag` 里，需要对 Y 值的位移(`offsetY`)做一下不同判断。  

其中 iOS 判断到顶部后继续下拉超过 60（可自行修改），android 判断距离 ≥ -1（因为最小为 0）就触发切换动作，这里比较简单，代码大概如下： 

```
<Animated.View style={{ height: onePartHeight * 2, transform: [{ translateY: this.state.moveValue }] }}>
    <ScrollView
      style={styles.scrollView}
      onScrollEndDrag={(e) => {
        const contentSizeH = e.nativeEvent.contentSize.height
        const offsetY = e.nativeEvent.contentOffset.y
        if (offsetY - (contentSizeH - onePartHeight) >= (Platform.OS === 'ios' ? 60 : -1)) {
          Animated.timing(this.state.moveValue, {
            toValue: -onePartHeight
          }).start()
        }
      }}
    >
      <View style={styles.scrollContentBox}>
        <Text>scrollView's top</Text>
        <Text>scrollView's center</Text>
        <Text>scrollView's bottom (has paddingBottom down here)</Text>
      </View>
    </ScrollView>
    {
      Platform.OS === 'android' && Platform.Version < 21 // 21 为 5.0 系统
	  ? {/* 方案一，详见下文 */}
	  : {/* 方案二，详见下文 */}
    }
</Animated.View>
```

### WebView 切换至 ScrollView

这里我们对 WebView 进行一下封装（下面以 `SCWebView` 为名进行描述），主要做两件事：  

* 分别为两个方案注入不同的 js
* 实现 `onMessage`，监听网页端传过来的参数  

查看 [WebView 文档](https://facebook.github.io/react-native/docs/webview.html)， 通过 `injectedJavaScript ` 即可注入 js，通过 `onMessage` 即可监听网页端传过来的参数，render 方法如下：  

```
render () {
	const jsCode = this._injectJSString()
	return (
	  <View style={[styles.box, this.props.boxStyle]}>
	    <WebView
	      ref={web => (this._webView = web)}
	      style={[styles.webView, this.props.style, { height: this.props.autoHeight ? this.state.webViewHeight : this.props.style.height }]}
	      source={this.props.source || { uri: this.props.url }}
	      javaScriptEnabled
	      domStorageEnabled
	      mixedContentMode={'always'}
	      scalesPageToFit
	      injectedJavaScript={(jsCode)}
	      onMessage={(event) => this._onMessage(event)}
	    />
	  </View>
	)
}
```

其中 `_injectJSString` 根据不同方案注入不同的 js：  

```
_injectJSString () {
	var str = this._injectPostMsgJS()
	if (this.props.autoHeight) {
	  // 方案一
	  str += this._injectAutoHeightJS()
	}
	if (this.props.scrollToTop) {
	  // 方案二
	  str += this._injectScrollToTopJS()
	}
	return str
}
```

方案一注入 js 去获取网页内容高度后通过 `postMessage` 方法传给 RN 端，代码如下：  

```
_injectAutoHeightJS () {
    if (!this.props.autoHeight) {
      return ''
    }
    const getHeightFunc = function () {
      let height = 0
      if (document.documentElement.clientHeight > document.body.clientHeight) {
        height = document.documentElement.clientHeight
      } else {
        height = document.body.clientHeight
      }
      var action = { type: 'changeWebviewHeight', params: { height: height } }
      window.postMessage(JSON.stringify(action))
    }
    const str = '(' + String(getHeightFunc) + ')();'
    return str
}
```

方案二注入 js 让网页端监听 touch 事件，判断到达顶部后，`touchmove` 事件调用超过 10 次（数值可自行修改），就通过 `postMessage` 方法告诉 RN 端触发切换事件：  

```
_injectScrollToTopJS () {
    if (!this.props.scrollToTop) {
      return ''
    }
    const onScrollToTopFunc = function () {
      var sysVersion = -1
      var _userAgent = navigator.userAgent
      if (/iPad|iPhone|iPod/.test(_userAgent) && !window.MSStream) {
        sysVersion = 0 // iOS
      } else {
        var match = _userAgent.toLowerCase().match(/android\s([0-9\\.]*)/)
        sysVersion = match ? parseFloat(match[1]) : -1
      }
      var good = !!((sysVersion === 0 || (sysVersion !== -1 && sysVersion >= 5.0)))
      if (good) {
        // 只监听 iOS 以及 android 5.0+系统（因为 android 4.x 系统的 touchmove 事件不能实时监听）
        var count = 0
        window.addEventListener('touchstart', function (event) {
          count = 0
        }, false)
        window.addEventListener('touchmove', function (event) {
          // console.log(document.body.scrollTop)
          document.body.scrollTop > 0 ? count = 0 : count++
        }, false)
        window.addEventListener('touchend', function (event) {
          if (count >= 10) {
            const action = { type: 'scrollToTop' }
            window.postMessage(JSON.stringify(action))
          }
          count = 0
        }, false)
      }
    }
    const str = '(' + String(onScrollToTopFunc) + ')();'
    return str
}
```

最后我们通过 `onMessage` 方法去处理网页端传过来的参数，这里网页端调用 `postMessage` 传过来的参数只能是字符串，所以我们定义一下简单的规则：  

* 网页端传过来的参数为 JSON 字符串  
* JSON 字符串通过 `type` 字段表明不同事件  
* 其它参数通过 `params` 字段组合  

如网页端这样使用：  

```
var action = { type: 'changeWebviewHeight', params: { height: height } }
window.postMessage(JSON.stringify(action))
```

RN 端监听如下：  

```
_onMessage (event) {
	try {
	  const data = JSON.parse(event.nativeEvent.data)
	  if (!data.type) {
	    return
	  }
	  const params = data.params
	  switch (data.type) {
	    case 'scrollToTop':
	      if (this.props.scrollToTop) {
	        this.props.scrollToTop()
	      }
	      break
	    case 'changeWebviewHeight':
	      this.setState({
	        webViewHeight: params.height
	      })
	      break
	    default:
	      break
	  }
	} catch (error) {
	  console.warn('webview onMessage error: ' + error.message)
	}
}
```

<br>

---

## 总结

Demo 代码放上 GitHub 了，可去 [https://github.com/Aevit/SCRNDemo](https://github.com/Aevit/SCRNDemo) 查看这两个文件：  

* [./app/containers/demo/switchScroll.js](https://github.com/Aevit/SCRNDemo/blob/1e314d244bd1c172d10a70bc62d9439108fae714/app/containers/demo/switchScroll.js)  
* [./app/containers/SCWebView.js](https://github.com/Aevit/SCRNDemo/blob/1e314d244bd1c172d10a70bc62d9439108fae714/app/containers/SCWebView.js)

---


2017-09-21 21:36    
Aevit  
深圳南山  

---

![](http://aevit.qiniudn.com/68f824caee136382bd0f8bc73f390c571506000678.jpeg)

摄影：Aevit 2015年11月 华师  
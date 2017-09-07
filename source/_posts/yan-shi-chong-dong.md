---
title: 延时虫洞  
date: 2015-01-05 01:08:26  
tags: [屋外,延时]  
category: 屋外  
layout: post  

---

> `html5`视频播放器，并使用`ruby`+`Liquid`语法简单封装了一个播放视频的插件，详见本文章最下面

观看`延时虫洞`视频：

 <video controls="controls" poster="http://aevit.qiniudn.com/warmhole-poster.jpg" width="100%" height="100%"><source src="http://aevit.qiniudn.com/warmhole.mp4" type="video/mp4">  
 <object type="application/x-shockwave-flash" data="http://player.longtailvideo.com/player.swf" width="640" height="360"><param name="movie" value="http://player.longtailvideo.com/player.swf">  
<param name="allowFullScreen" value="true">  
<param name="wmode" value="transparent">  
<param name="flashVars" value="controlbar=over&amp;image=http%3A%2F%2Faevit.qiniudn.com%2Fwarmhole-poster.jpg&amp;file=http%3A%2F%2Faevit.qiniudn.com%2Fwarmhole.mp4">  
![](http://aevit.qiniudn.com/warmhole-poster.jpg "No video playback capabilities, please download the video below")</object></video> <!--more-->

* * *

> ruby + Liquid 代码：  
> 使用`Video for Everybody`


```
module Jekyll
    class SCVideo < Liquid::Tag
 
        def initialize(tagName, params, tokens)
            super
            options = params.split
            @poster = options[0]
            @mp4Url = options[1]
            @webmUrl = options[2]
            @oggUrl = options[3]
        end
 
        def render(context)

            "<!-- \"Video For Everybody\" http://camendesign.com/code/video_for_everybody -->\
            <video controls=\"controls\" poster=\"#{@poster}\" width=\"100%\" height=\"100%\">\
                <source src=\"#{@mp4Url}\" type=\"video/mp4\" />\      
                <source src=\"#{@webmUrl}\" type=\"video/webm\" />\
                <source src=\"#{@oggUrl}\" type=\"video/ogg\" />\
                <object type=\"application/x-shockwave-flash\" data=\"http://player.longtailvideo.com/player.swf\" width=\"#100%\" height=\"#100%\">\
                    <param name=\"movie\" value=\"http://player.longtailvideo.com/player.swf\" />\
                    <param name=\"allowFullScreen\" value=\"true\" />\
                    <param name=\"wmode\" value=\"transparent\" />\
                    <param name=\"flashVars\" value=\"controlbar=over&amp;image=#{@poster}&amp;file=#{@mp4Url}\" />\
                    <img alt=\"说明\" src=\"#{@poster}\" width=\"100%\" height=\"100%\" title=\"浏览器不支持在线观看\" />\
                </object>\
            </video>"
        end
    end
end

Liquid::Template.register_tag('SCVideo', Jekyll::SCVideo)
```


* * *

> 说明：


```
*params*里：
第1个参数为未播放时的默认图片  
第2个参数为mp4视频的地址  
第3个参数为webm视频的地址（可选）    
第4个参数为ogg视频的地址（可选）
```

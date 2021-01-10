1、在 `evan` 里搜索 `post-title`，将这个样式名改一下，避免被 `Helkyle` 这个扑街的爬虫爬到。  

2、修改 next 主题的 footer 添加备案信息：

`vim ./themes/even/layout/_partial/footer.swig`

ICP 备案:  

```
<div style="width:300px;margin:0 auto; padding:20px 0;">
    <a target="_blank" href="https://beian.miit.gov.cn/" style="display:inline-block;text-decoration:none;height:20px;line-height:20px;"><img src="" style="float:left;"/><p style="float:left;height:20px;line-height:20px;margin: 0px 0px 0px 5px; color:#939393;">粤ICP备18142108号</p></a>
</div>
```

公安网备案: 

```
<div style="width:300px;margin:0 auto; padding:20px 0;">
	<img src="https://ws1.sinaimg.cn/large/6f68c4d7gy1fx2sbmccn6j200k00kq36.jpg" style="position:absolute;"/>
	<a target="_blank" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44030502003419" style="display:inline-block;text-decoration:none;height:20px;line-height:20px;"><img src="" style="float:left;"/><p style="float:left;height:20px;line-height:20px;margin: 0px 0px 0px 5px; color:#939393;">粤公网安备 44030502003419号</p></a>
</div>
```
---
title: Laravel学习笔记（三）  
date: 2016-06-18 01:09:40  
tags: [比特海,PHP,Laravel,学习笔记]  
category: 比特海  
layout: post  

---

本文笔记主要包括以下内容：

1.  保存小量数据为本地文件（`File`持久化）
2.  写入`config`文件（默认的`Config::set`方法不能持久化到文件）
3.  传递`php变量`给`js`使用

<!--more-->

> 使用的`Laravel`版本为 `5.2`

## File持久化

有时想要保存数据，而这数据量是很小的（如一个自定义配置文件等），又不会经常使用，使用`数据库`或是`Redis`等会有点浪费，这时可以考虑将之保存为本地文件。

`Laravel`本身已提供了`File`这个`ServiceProvider`，默认在`./config/app.php`里已经配置好了：


```
'providers' => [
	...
	Illuminate\Filesystem\FilesystemServiceProvider::class,
	...
],

'aliases' => [
	...
	'File'      => Illuminate\Support\Facades\File::class,
	...
]
```


查看源码：  


```
./vendor/laravel/framework/src/Illuminate/Filesystem/Filesystem.php
```


可以发现，写入（`put`）、读取（`get`）等操作是对`file_put_contents` 、`file_get_contents`等的封装。  
并且`FileSystem`也提供了一些方法方便地进行其他操作（如`move` `delete` `copy` `append` `allFiles`等）

简单粗暴地，可以使用以下方法存起来即可：


```
public function saveFile($yourData) {
    $data = [
        [
            'id' => 1,
            'name' => 'Aevit'
        ],
        [
            'id' => 2,
            'name' => 'Aevitx'
        ],
    ]; // 示例数据
    $final = json_encode($data, JSON_UNESCAPED_UNICODE);

    // 以下是保存在`public`目录下；如果要存在其它目录，可以使用`app_path()`去组合  
    $rs = \File::put('your_file_name', $final); 
    if ($rs === false) {
    	return \Response()->json(['code' => 1, 'msg' => 'save file failure'], 200);
    }
    return \Response()->json(['code' => 0, 'msg' => 'save file success'], 200);
}
```


## Config文件的写入

`Config`的`set`方法，只是当前有效而已，并不能持久化到对应的`config文件`里，这里提供一种简单的方法来进行操作 。

这里采用的是写入文件的方式，如果需要频繁操作的话，还是建议用`Cache`、或[第三方扩展包](https://github.com/anlutro/laravel-settings)等其他方式比较好

首先简单说明一下自带的`Config`：  
`Laravel`框架本身提供了`Config`文件的相关操作，默认在`./config/app.php`里已经注册了`Config`的`Facade`：


```
'aliases' => [
	...
	'Config'    => Illuminate\Support\Facades\Config::class,
	...
]
```


`Config`提供的所有方法，可以查看以下源码：


```
./vendor/laravel/framework/src/Illuminate/Config/Repository.php
```


写入`config`文件有以下几点需求：

*   能写入所有数据
*   能修改`config文件`里指定的`key`的值
*   当指定的`key`不存在时，自动在对应的层级，插入新`key`及其`value`
*   类似`Config`的`set`方法

方法如下：

在`./app`目录下，新建目录`Helpers`，再在`./app/Helpers`里新建文件`CustomConfig.php`，`php`文件内容如下：


```
<?php

namespace App\Helpers;

/**
 * 持久化自定义config文件
 */
class CustomConfig
{
    public function __construct() {
    }

    public static function set($input, $value = null) {
        if (empty($input)) {
            return false;
        }
        $keys = explode('.', $input);
        $fileName = $keys[0];
        $array = \Config::get($fileName); // 原数据

        if (count($keys) == 1) {
            // 顶层（即config文件的名字）（只有一层，将全部数据直接写入即可）
            $array = $value;
        } else {
            // 遍历
            $tmp = &$array;
            array_shift($keys); // 第一个key为顶层（即config文件的名字），不用遍历。直接将第一个key删除掉即可
            while (count($keys) >= 0) {
                $aKey = array_shift($keys);

                if (!isset($tmp[$aKey])) {
                    $tmp[$aKey] = [];
                }
                if (count($keys) == 0) {
                    $tmp[$aKey] = $value;
                    break; // 找到最后一个key了，直接结束
                } else {
                    $tmp = &$tmp[$aKey];
                }
            }
        }

        $data = var_export($array, true);

        if(\File::put(app_path() . '/../config/' . $fileName . '.php', "<?php\n return $data ;")) {
            return true;
        }
        return false;
    }
}
```


使用方法如下：


```
use App\Helpers\CustomConfig;

$data = [
    'names' => [
        'id' => 1,
        'name' => 'Aevit'
    ],
    'tags' => [
        [
            'id' => 1,
            'info' => [
                'tag_name' => 'aTagName',
                'created' => '2016-06-18',
                ]
        ]
    ]
];
        
// 写入全部数据  
CustomConfig::set('your_config_name', $data);

// 修改指定key（key在第一层）  
CustomConfig::set('your_config_name.names', ['id' => 1, 'name' => 'Aevit.xyz']);

// 修改指定key（key不是在第一层）  
CustomConfig::set('your_config_name.tags.0.info.tag_name', 'newTagName');

// key不存在则插入  
CustomConfig::set('your_config_name.newKey', 'newAevit');
```


## 传递php变量给js使用

有时我们需要传递一些`php变量`给`blade`里的`js`使用，可以使用以下方法：

首先将`php`变量传递至`balde`模版里，我们可以在`controller`里传递：


```
return view('your_view', ['jsData' => $yourData]);
```


然后在`blade`文件里，将`php`转化为`js`变量，接下来在`js`里就可以使用`JSDATA`了。


```
<script type="text/javascript">
  @if(isset($jsData))
      var JSDATA = {!! json_encode($jsData) !!};
  @endif
</script>
```


可以将以上方法写在一个`公共blade`文件里，这样就可以在当前`js`里使用`JSDATA`这个变量名（或自己定义一个名字），不用每次都重新去写一遍相同的代码。

* * *

2016.06.18 01:09  
Aevit  
华师

[![](http://aevit.qiniudn.com/b54af9c751825a5e71890a12db380c131466242254.jpeg)](http://aevit.qiniudn.com/b54af9c751825a5e71890a12db380c131466242254.jpeg "海边")  
摄影：Aevit 2015年6月 阳江闸坡 海边露营
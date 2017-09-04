---
title: PhalApi(π)接口框架-计划任务开发  
date: 2016-02-28 20:09:41  
tags: [比特海,PHP,PhalApi]  
category: 比特海  
layout: post  

---

## 说明

> [PhalApi](http://phalapi.net/)(读π框架)，是一个PHP轻量级开源接口框架，是专门为接口开发而设计的框架。  
> 在这里先感谢作者@dogstar 提供了这么一个方便的php接口框架。

本文主要记录下π框架下计划任务的相关开发教程。

计划任务有两种情况：  
1、MQ（Message Queue）－消息队列：  
服务器**被动**触发（循环扫描消费）。  
举个例子：当你群发一条消息给10000（假设你有朋友）个朋友，如果直接同步发送，可能对服务器的压力会比较大，这时应该使用MQ计划任务进行分布式处理。  
MQ具体是什么，这里就不再详细阐述了，有兴趣的同学可以自行google。  
π框架为MQ提供了三种类型：`Redis`/`文件`/`数据库`

2、全量：  
服务器**主动**触发（定期全量执行）。  
举个例子：假设你们有个智能产品是秤，用户通过app记录了体重，这时产品经理一拍脑袋说：“加个体重周报功能，统计一周秤重结果，分析分析你为什么这么肥，这样好不好？”。  
这时开发人员内心当然是“你TM才肥，你全家都肥”，表面当然说“可以，使用全量计划任务，在每周一个固定时间进行统计就行了。”

<!--more-->

> 本文内容较多，可在PC端使用右下角按钮，查看目录

* * *

## 下载

最新框架源码可从 [github](https://github.com/phalapi/phalapi) 或 [开源中国](https://git.oschina.net/dogstar/PhalApi.git) 上下载

计划任务的说明及文档可查看官网:  
[计划任务核心设计解读](http://phalapi.net/wikis/%5B1.31%5D-%E6%96%B0%E5%9E%8B%E8%AE%A1%E5%88%92%E4%BB%BB%E5%8A%A1%EF%BC%9A%E4%BB%A5%E6%8E%A5%E5%8F%A3%E5%BD%A2%E5%BC%8F%E5%AE%9E%E7%8E%B0%E7%9A%84%E8%AE%A1%E5%88%92%E4%BB%BB%E5%8A%A1.html)  
[计划任务官方开发文档](http://phalapi.net/wikis/%5B3.6%5D-%E6%89%A9%E5%B1%95%E7%B1%BB%E5%BA%93%EF%BC%9A%E6%96%B0%E5%9E%8B%E8%AE%A1%E5%88%92%E4%BB%BB%E5%8A%A1.html)

π框架计划任务主要功能点:

1.  提供了**Redis/文件/数据库**三种MQ队列及**全量**计划
2.  提供了本地和远程两种调度方式
3.  以接口的形式实现计划任务
4.  提供统一的crontab调度

**附**：  
[本文4种计划任务Demo源码](https://github.com/Aevit/PhalApi-Schedule-Task-Demo)  
**注意**：  
请先修改`./config/dbs.php`里的数据库相关参数配置（以及表前缀`tables.__default__.prefix`）

* * *

以下分别说明四种计划任务的使用：  
Redis MQ、File MQ、数据库MQ、全量计划

## `Redis MQ`、`File MQ`及`DB MQ`

由于三种类型的MQ使用方式差别不大，这里合并为一起说明

### 配置

———————— Redis MQ 及 File MQ 相关配置 ————————

> 注意此处是`Redis MQ 及 File MQ`才需要配置

编辑`./config/app.php`，在`array`里增加以下代码：


```
/**
 * 计划任务配置
 */
'Task' => array(
    // MQ队列设置，可根据使用需要配置
    'mq' => array(
    	 // Redis MQ需加此配置
        'redis' => array(
            'host' => '127.0.0.1',
            'port' => 6379,
            'prefix' => 'phalapi_task_',
            'auth' => '',
        ),
    	 // File MQ需加此配置
        'file' => array(
            'path' => API_ROOT . '/Runtime',
            'prefix' => 'phalapi_task_',
        ),
    ),

    //Runner设置，如果使用远程调度方式（即使用别的服务器来处理），请加此配置  
    'runner' => array(
        'remote' => array(
            'host' => 'http://library.phalapi.net/demo/',
            'timeoutMS' => 3000,
        ),
    ),
),
```


———————— DB MQ 相关配置 ————————

> 注意此处是`DB MQ`才需要配置  
> 配置DB MQ数据库有两步：创建多表、配置数据库路由；

**1，创建多表**  
当需要使用数据库MQ列队时，为了防止以后MQ数据过多，最好创建多个表；  
创建表的sql语句，可使用`./Library/Task/Data/phalapi_task_mq.sql`，根据需要再去调整该sql语句（如修改表前缀等）  
（PS：如果对此框架了解，也可使用框架提供的脚本(`./PhalApi/build_sqls.php`)来创建表，该脚本需要的sql文件可使用`./Library/Task/Data/task_mq.sql`）

**2，配置数据库路由**  
分表需做好数据库路由配置，在`./Config/dbs.php`的`tables数组`里，追加`task_mq`配置即可：


```
'tables' => array(

  //请将以下配置拷贝到 ./Config/dbs.php 文件对应的位置中，未配置的表将使用默认路由

  //10张表，可根据需要，自行调整表前缀、主键名和路由
  'task_mq' => array(
      'prefix' => 'phalapi_',
      'key' => 'id',
      'map' => array(
          array('db' => 'db_demo'),
          array('start' => 0, 'end' => 9, 'db' => 'db_demo'),
      ),
  ),
)
```


注：如果需要使用**远程调度**，请参照上面`Redis MQ`，在`./config/app.php`里追加`Task.runner`的配置

* * *

### 初始化

首先，在入口文件（`./Public/init.php`）进行初始化：


```
DI()->loader->addDirs('Library');
$mq = new Task_MQ_Redis();  // Redis MQ，请使用此句代码  
// $mq = new Task_MQ_File(); // File MQ，请使用此句代码  
// $mq = new Task_MQ_DB(); // DB MQ，请使用此句代码
DI()->taskLite = new Task_Lite($mq);
```


* * *

### 触发接口

触发MQ计划任务的接口，跟使用框架开发普通接口一样开发即可，然后在此接口开发过程中的合适位置（如`Domain`层），加上这句代码即可添加新的任务到MQ：


```
// add方法的第1个参数是计划任务处理接口的service名称，第2个参数是要传递过去的参数数组  
// 本Demo为了方便，将`计划任务处理接口`都使用为同一个: `./Task/Api/TTaskMQ.php`，实际应该是根据不同触发接口，实现不同`计划任务处理接口`  
DI()->taskLite->add('TTaskMQ.Go', array('your_param' => $yourParam));
```


具体可查看[Demo源码](https://github.com/Aevit/PhalApi-Schedule-Task-Demo)  
增加了4个文件:  
Redis MQ：`./Demo/Api/MQ/Redis.php`，`./Demo/Domain/MQ/Redis.php`  
File MQ：`./Demo/Api/MQ/File.php`，`./Demo/Domain/MQ/File.php`  
DB MQ：`./Demo/Api/MQ/DB.php`，`./Demo/Domain/MQ/DB.php`

* * *

### 计划任务处理接口

在上面的基础上增加好触发接口后，再进行计划任务处理接口的开发，开发方式仍同框架普通接口的开发差不多，可以同在`./Demo`目录下进行开发，也可在不同目录不一样。

> 不同目录开发：  
> 触发接口所在目录为: `./Demo`，计划任务所在目录可以自己定，只要目录里仍有`Api` `Domain` `Model` `Tests`等核心目录即可。如`./Task`。
> 
> 同在`./Demo`目录开发：  
> 可增加目录`./Demo/Task`，再行开发即可。

本Demo使用的是不同目录的开发，  
具体可查看[Demo源码](https://github.com/Aevit/PhalApi-Schedule-Task-Demo)  
增加了2个文件: `./Task/Api/TTaskMQ.php`，`./Task/Domain/TTaskMQ.php`；

这里为了方便，只在`Domain/TTaskMQ.php`里使用`var_dump`展示一下结果而已，具体可根据自己需要去处理操作。  
同样为了方便，本demo代码里，3种类型的MQ`计划任务处理接口`，都使用了同一个: `./Task/Api/TTaskMQ.php`，正常来说是应该对应弄3个`计划任务处理接口`的。

* * *

### 配置数据库

> 前提：`./config/dbs.php`里配置好数据库相关参数（帐号、密码、表前缀等）

新建以下表（或见`./Library/Task/Data/phalapi_task_progress.sql`文件）  
注：表前缀要跟`./config/dbs.php`里的`tables.__default__.prefix`保持一致


```
CREATE TABLE `phalapi_task_progress` (
      `id` bigint(20) NOT NULL AUTO_INCREMENT,
      `title` varchar(200) DEFAULT '' COMMENT '任务标题',
      `trigger_class` varchar(50) DEFAULT '' COMMENT '触发器类名',
      `fire_params` varchar(255) DEFAULT '' COMMENT '需要传递的参数，格式自定',
      `interval_time` int(11) DEFAULT '0' COMMENT '执行间隔，单位：秒',
      `enable` tinyint(1) DEFAULT '1' COMMENT '是否启动，1启动，0禁止',
      `result` varchar(255) DEFAULT '' COMMENT '运行的结果，以json格式保存',
      `state` tinyint(1) DEFAULT '0' COMMENT '进程状态，0空闲，1运行中，-1异常退出',
      `last_fire_time` int(11) DEFAULT '0' COMMENT '上一次运行时间',
      PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```


插入数据：


```
// Redis MQ，请使用此数据  
INSERT INTO `phalapi_task_progress`(title, trigger_class, fire_params, interval_time)  VALUES('你的任务名字－如Redis MQ测试', 'Task_Progress_Trigger_Common', 'TTaskMQ.Go&Task_MQ_Redis&Task_Runner_Local', '60');

// File MQ，请使用此数据  
INSERT INTO `phalapi_task_progress`(title, trigger_class, fire_params, interval_time)  VALUES('你的任务名字－如File MQ测试', 'Task_Progress_Trigger_Common', 'TTaskMQ.Go&Task_MQ_File&Task_Runner_Local', '60');

// DB MQ，请使用此数据  
INSERT INTO `phalapi_task_progress`(title, trigger_class, fire_params, interval_time)  VALUES('你的任务名字－如DB MQ测试', 'Task_Progress_Trigger_Common', 'TTaskMQ.Go&Task_MQ_DB&Task_Runner_Local', '60');
```


其中`fire_params`的值内容包含3个：

*   `计划任务处理接口`service名称，如: `TTaskMQ.Go`，本demo代码里，3种类型的MQ`计划任务处理接口`，都使用了同一个: `./Task/Api/TTaskMQ.php`，正常来说是应该对应弄3个`计划任务处理接口`的。
*   MQ类型，可选值：`Task_MQ_Redis`、`Task_MQ_File`、`Task_MQ_DB`
*   调度方式，可选值：`Task_Runner_Local`、`Task_Runner_Remote`

> PS: 请仔细查看上面数据库表的各字段说明，理解各字段表示什么意思  
> PPS：上面`insert`的最后一个值`执行间隔`为`60`秒，为了等下方便查看结果，设置得比较短，具体可根据业务再调整，如`300`秒等

* * *

### 启动计划任务

如果`计划任务处理接口`是使用不同目录的开发，则还需要编辑`./Library/Task/crontab.php`文件，将`./Task`目录增加进来  
（如果`计划任务处理接口`还是在`./Demo`下开发，则不用这一步）：


```
DI()->loader->addDirs(array('./Demo', './Library', './Library/Task/Task', './Task'));
```


最后，**不管**`计划任务处理接口`是不是在同个目录下开发，再使用`crontab`命令增加计划任务即可：


```
$ crontab -e

*/1 * * * * /usr/bin/php /your_project_dir/Library/Task/crontab.php >> /tmp/phalapi_task_crontab.log 2>&1
```


其中:

*   `/usr/bin/php`请使用`which php`查询到php的执行文件先，不同系统会不一样；
*   `/your_project_dir/Library/Task/crontab.php`根据自己项目位置进行调整；
*   `/tmp/phalapi_task_crontab.log`建议放在项目的`Runtime`目录，这里为了方便演示就放在`/tmp`目录了

最最后，进行`触发接口`的调用：

*   Redis MQ触发接口：  
    `http://api.your-domain.com/demo/?service=MQ_Redis.Go`

*   File MQ触发接口：  
    `http://api.your-domain.com/demo/?service=MQ_File.Go`

*   DB MQ触发接口：  
    `http://api.your-domain.com/demo/?service=MQ_DB.Go`

最最最后，使用以下命令，1分钟后即可看到`./Task/Domain/TTaskMQ.php`里`Go()`方法的处理结果了（遇到什么问题，注意查看此log，方便排查）：


```
tail -f /tmp/phalapi_task_crontab.log
```


> 问题1：  
> 如果`tail`等了很久，仍没有等到任何东西，则请先确保你的`计划任务处理接口`通过单元测试，可执行我的[demo仓库]((https://github.com/Aevit/PhalApi-Schedule-Task-Demo))里的单元测试文件：  
> `phpunit ./PhalApi-Schedule-Task-Demo/Task/Tests/Api/TTaskMQ_Test.php`
> 
> 问题2：  
> 如果`tail`等到的结果是：  
> `PHP Fatal error: Class 'Redis' not found in xxx`的错误，  
> 1，确保`crontab -e`里php的`bin`路径跟`which php`的结果一样；  
> 2，确保执行命令`php --ini`后`Loaded Configuration File`的文件目录，跟使用`web`访问（弄个文件，查看`phpinfo()`，如访问[demo仓库](https://github.com/Aevit/PhalApi-Schedule-Task-Demo)里的`http://api.your-domain.com/demo/tmp_php_info.php`）的一致

* * *

## 全量MQ

### 触发接口

开发好触发器接口，开发方式同框架普通接口的开发一样即可。

本[Demo](https://github.com/Aevit/PhalApi-Schedule-Task-Demo)在`./Task`增加了1个文件:  
`./Task/TMyTrigger/AllTime.php`

该文件有两点要注意：  
1、继承接口: `Task_Progress_Trigger`  
2、实现`fire`方法，此方法内的核心代码可以参考以下代码：


```
$mq = new Task_MQ_Array();
$runner = new Task_Runner_Local($mq); // 如果是远程调度，使用 Task_Runner_Remote($mq)

// 如果远程调度有多个不同host，可使用两句代码来初始化 runner  
// $connector = new Task_Runner_Remote_Connector(array('host' => 'AAAA'));  // 指定域名
// $runner = new Task_Runner_Remote($mq, 10, $connector);

$service = 'AllTime_Schedule.Go'; // 这里的service名称根据自己需要进行修改
$mq->add($service, array('your_param' => 'hey, guys, this is all_time schedule Type - 全量计划任务'));

$rs = $runner->go($service);
```


PS: 触发器接口的命名及位置可以根据自己需要放置，只要最终将该接口的`service`（注意是触发器的service，不是触发器里fire方法里的处理接口service）填到后面用到的数据库里即可。

* * *

### 计划任务处理接口

开发好你的计划任务要处理的接口，开发方式同框架普通接口的开发一样即可。

本[Demo](https://github.com/Aevit/PhalApi-Schedule-Task-Demo)增加了2个文件:  
`./Demo/Api/AllTime/Schedule.php`  
`./Demo/Domain/AllTime/Schedule.php`

这里为了方便，只在`./Demo/Domain/AllTime/Schedule.php`里使用`var_dump`展示一下结果而已，具体可根据自己需要去处理操作。

* * *

### 配置数据库

> 前提：`./config/dbs.php`里配置好数据库相关参数（帐号、密码、表前缀等）

新建以下表（或见`./Library/Task/Data/phalapi_task_progress.sql`文件）  
注：表前缀要跟`./config/dbs.php`里的`tables.__default__.prefix`保持一致


```
CREATE TABLE `phalapi_task_progress` (
      `id` bigint(20) NOT NULL AUTO_INCREMENT,
      `title` varchar(200) DEFAULT '' COMMENT '任务标题',
      `trigger_class` varchar(50) DEFAULT '' COMMENT '触发器类名',
      `fire_params` varchar(255) DEFAULT '' COMMENT '需要传递的参数，格式自定',
      `interval_time` int(11) DEFAULT '0' COMMENT '执行间隔，单位：秒',
      `enable` tinyint(1) DEFAULT '1' COMMENT '是否启动，1启动，0禁止',
      `result` varchar(255) DEFAULT '' COMMENT '运行的结果，以json格式保存',
      `state` tinyint(1) DEFAULT '0' COMMENT '进程状态，0空闲，1运行中，-1异常退出',
      `last_fire_time` int(11) DEFAULT '0' COMMENT '上一次运行时间',
      PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```


插入数据：


```
INSERT INTO `phalapi_task_progress`(title, trigger_class, fire_params, interval_time)  VALUES('你的任务名字－如全量任务测试', 'TMyTrigger_AllTime', '', '60');
```


其中，

*   `trigger_class`的值内容是上面所写`触发接口`的`service名称；
*   `fire_params`的值内容是传递给上面所写`触发接口`里`fire`方法的参数值

> PS: 请仔细查看上面数据库表的各字段说明，理解各字段表示什么意思  
> PPS：上面`insert`的最后一个值`执行间隔`为`60`秒，为了等下方便查看结果，设置得比较短，具体可根据业务再调整，如`300`秒等

* * *

### 启动计划任务

根据需求，看要哪些目录还需要加载的，在`./Library/Task/crontab.php`里添加，如本demo里的全量计划任务触发器接口，是写在`./Task/TMyTrigger`里，则还需要将`./Task`目录加载进来


```
DI()->loader->addDirs(array('./Demo', './Library', './Library/Task/Task', './Task'));
```


最后，使用`crontab`命令增加计划任务即可：


```
$ crontab -e

*/1 * * * * /usr/bin/php /your_project_dir/Library/Task/crontab.php >> /tmp/phalapi_task_crontab.log 2>&1
```


其中:

*   `/usr/bin/php`请使用`which php`查询到php的执行文件先，不同系统会不一样；
*   `/your_project_dir/Library/Task/crontab.php`根据自己项目位置进行调整；
*   `/tmp/phalapi_task_crontab.log`建议放在项目的`Runtime`目录，这里为了方便演示就放在`/tmp`目录了

最后，使用以下命令，1分钟后即可看到`./Demo/Domain/AllTime/Schedule.php`里的处理结果了（遇到什么问题，注意查看此log，方便排查）：


```
tail -f /tmp/phalapi_task_crontab.log
```


* * *

**附**：  
[本文4种计划任务Demo源码](https://github.com/Aevit/PhalApi-Schedule-Task-Demo)  
**注意**：  
请先修改`./config/dbs.php`里的数据库相关参数配置（以及表前缀`tables.__default__.prefix`）

想要体验本Demo的不同MQ，只需增加相应数据库表及数据，再修改`./Public/init.php`里`mq`的初始化即可: `$mq = new Task_MQ_Redis();`，然后调用不同的触发接口即可

*   Redis MQ触发接口：  
    `http://api.your-domain.com/demo/?service=MQ_Redis.Go`

*   File MQ触发接口：  
    `http://api.your-domain.com/demo/?service=MQ_File.Go`

*   DB MQ触发接口：  
    `http://api.your-domain.com/demo/?service=MQ_DB.Go`

*   查看结果（正常一两分钟后即可查看到结果）：  
    `tail -f /tmp/phalapi_task_crontab.log`
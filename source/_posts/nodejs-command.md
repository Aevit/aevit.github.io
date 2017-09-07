---
title: NodeJS编写命令行脚本  
date: 2017-09-07 21:49:10  
tags: [比特海,前端,NodeJS,脚本]  
category: 比特海  
layout: post  

---


## 前言

前段时间电脑键盘和触摸板都用不了了，试了下重装系统都不行，还不小心丢了博客的 `markdown` 源文件，只剩 `github` 上的 `html` 文件...  

事隔几个月后，刚好公司项目在发版前都要修改一些参数（如版本号等），人工修改的方式存在漏改或改错的风险，便学了下 NodeJS 写了个预发布脚本（然后也一起写了个工具将 hexo 的  html 文件转为需要的 markdown 文件...）  

<!--more-->

> 找回 markdown 的代码放上 [gist](https://gist.github.com/Aevit/ccb018e1ac6de50e2f4d631ca97f2bc7) 了，不过由于不同主题的样式是不一样的，所以这份代码只适用于 [next主题](https://github.com/iissnan/hexo-theme-next) 产生的 html 文件，另外 about 文件结构不太一样，就单独去复制处理了。  


本文主要记录如何使用 NodeJS 编写脚本。  


## 简单写法
编写一个简单的脚本，只需要在 js 文件里声明运行环境，再赋予 js 文件可执行权限即可，如：  

```
mkdir ~/Desktop/cmd && cd ~/Desktop/cmd
vim hello.js
chmod +x hello.js
```

之后输入以下内容：  

```
#!/usr/bin/env node
console.log("hello world");
```

最后运行命令 `./hello.js` 或 `node hello.js` 即可  

如果想用更简洁的命令（如 `hello`），有两种方式：  

* 将 `hello.js` 的路径加入环境变量
* 更好的做法是在当前目录使用 `npm init` 命令创建一个新的 `npm` 项目，然后编辑 `package.json` 文件，加入以下内容：  

	```
	...
	"bin": {
		"hello": "./hello.js",
		"hlo": "./hello.js"
	}
	...
	```
	> PS: `bin` 里可以加入多个命令，如上面加多了一个 `hlo` 命令
		
	之后将 `hello` 或是 `hlo` 链接到系统变量即可：  
	
	* 开发时，一般使用 `npm link` 将 `hello.js` 软链接到 `path` 变量的位置；如果想要删除，可以使用 `npm unlink`（或是使用 `which hello` 或 `which hlo` 命令找到路径再去手动删除）  
	
	```
	$ npm link
	
	# 输出以下信息就表示软链接成功了
	/usr/local/bin/hello -> /usr/local/lib/node_modules/cmd/hello.js
	/usr/local/bin/hlo -> /usr/local/lib/node_modules/cmd/hello.js
	/usr/local/lib/node_modules/cmd -> /Users/aevit/Desktop/cmd
	```

	* 如果想要直接安装，可以使用 `npm install -g`
	
	```
	$ npm install -g
		
	# 这样就安装完成了
	/usr/local/bin/hello -> /usr/local/lib/node_modules/cmd/hello.js
	/usr/local/bin/hlo -> /usr/local/lib/node_modules/cmd/hello.js
	```

	开发完成后，就可以通过 `npm publish` 命令将脚本发布到 [npm](http://npmjs.org/) 上了，其他人就可以通过 `npm install -g hello` 来安装了。  


## 解析参数
如果我们的命令需要处理用户输入的内容，只要用 `process.argv` 就可以拿到参数了，如：  


```
#!/usr/bin/env node
console.log("hello", process.argv[2]);
```

运行结果如下：  

```
$ ./hello.js aevit

# 输出如下：  
hello aevit
```

以上命令，实际执行的是 `node ./hello.js aevit`（这里 node 和 ./hello.js 都省略了全路径，可以去打印 `process.argv` 实际看一下），所以 `process.argv[2]` 就可以取到 `aevit` 这个值了。  

这里推荐使用 [commander](https://github.com/tj/commander.js/) 来解析参数，安装完成后就可以使用以下可读性较强的方式来定义用户输入参数（具体用法请见其 README）：  

```
#!/usr/bin/env node

var program = require('commander');

program
  .version('0.1.0')
  .option('-u, --username <username>', 'this is the username.')
  .option('-p, --password <password>', 'this is the password.')
  .action(function(argv1, argv2) {
	console.log('user: ' + program.username + ', pass: ' + program.password + ', argv1: ' + argv1 + ', argv2: ' + argv2);
  })
  .parse(process.argv);
```

执行结果如下：  

```
$ ./hello.js hello aevit -u aevit -p 111

user: aevit pass: 111 argv1: hello argv2: aevit
```

## 输出彩色
如果你想要在终端里输出彩色的内容，使用 [chalk](https://github.com/chalk/chalk) 就可以方便地输出各种颜色了，如：  

```
#!/usr/bin/env node

var program = require('commander');
var chalk = require('chalk');

program
  .version('0.1.0')
  .option('-u, --username <username>', 'this is the username.')
  .option('-p, --password <password>', 'this is the password.')
  .action(function(argv1, argv2) {
	console.log(chalk.red('user: ' + program.username + ', pass: ' + program.password + ', argv1: ' + argv1 + ', argv2: ' + argv2));
  })
  .parse(process.argv);

```

详细用法可查看其 README


## 询问输入
如果你想要询问式地处理用户输入，可以使用 [Inquirer](https://github.com/SBoudrias/Inquirer.js/)：  

```
#!/usr/bin/env node

var program = require('commander');
var chalk = require('chalk');
var inquirer = require('inquirer');


program
  	.version('0.1.0')
	.option('-u, --username <username>', 'this is the username.')
  	.option('-p, --password <password>', 'this is the password.')
  	.action(function(argv1, argv2) {
		console.log(chalk.red('user: ' + program.username + ', pass: ' + program.password + ', argv1: ' + argv1 + ', argv2: ' + argv2));
  	});

program
  	.command('login')
  	.action(function(argv1) {
		inquirer.prompt([{
			type: 'input',
			name: 'username',
			message: 'input username: '
		}, {
			type: 'password',
			name: 'password',
			message: 'input password: '
		}]).then(async function(result) {
			const { confirm } = await inquirer.prompt([{
				type: 'confirm',
				name: 'confirm',
				message: 'confirm? '
			}]);
			console.log(confirm ? 'confirmed!': 'unconfirmed..');
		});
	});

program.parse(process.argv);
```

以上代码使用了两个 inquirer，第一个要求输入用户名和密码，获取结果是采用 `promise then` 的方式得到；第二个询问是否确定，这里使用 `ES6` 的 `async await` 语法来获取。  

运行结果如下：  

```
$ ./hello.js login

? input username:  aevit
? input password:  [hidden]
? confirm?  Yes
confirmed!
```

## 网络请求
如果你想要发起网络请求，可以使用 [superagent](https://github.com/visionmedia/superagent) 或 [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch) 等第三方库。  

如使用 `superagent` 来发起请求：  

```
request
  .post('/api/pet')
  .send({ name: 'Manny', species: 'cat' }) // sends a JSON post body
  .set('X-API-Key', 'foobar')
  .set('accept', 'json')
  .end((err, res) => {
    // Calling the end function will send the request
  });
```

## 进度条
假设你上传数据时，需要使用进度条，可以使用 [node-progress](https://github.com/visionmedia/node-progress)，样式如下：  

```
downloading [=====             ] 39/bps 29% 3.7s
```


## 系统命令
如果你想要执行一些系统命令，如 `ls`，可以使用 [child_process](https://nodejs.org/api/child_process.html) 新建子进程去执行，如：  

```
#!/usr/bin/env node

// 同步
console.log('--------execSync')
var execSync = require('child_process').execSync;
try {
	var rs = execSync('ls').toString();
	console.log(rs);
} catch (error) {
	// 如果想要捕获错误，要使用 try catch
}

// 异步
console.log('--------exec')
var exec = require('child_process').exec;
var child = exec('ls', function(err, stdout, stderr) {
  if (err) throw err;
  console.log(stdout);
});
```

## 总结

刚开始是想用 PHP 写脚本，但是因为项目用的是 `React-Native`，所以最后还是使用 NodeJS 来写，最终发现 NodeJS 确实挺不错的...  

纸上学来终觉浅，趁着这次写了两个脚本，也借着这次机会学了下正则（惭愧，这么多年都没去看正则相关的，都是能不用正则就不用，需要再去查找...）  

终于把 markdown 文件弄回来了，也好久没写文章了...

以下是转 markdown 脚本的最终成果：  
<video src="http://aevit.qiniudn.com/bee8ece7bc40ba4f2d7f256f188e8a8b1504621435.mp4" width=426 height=540 controls="controls" />  


* * *

2017-09-07 21:49    
Aevit  
深圳南山  

* * *

![](http://aevit.qiniudn.com/01506e0f5522f2102cb9b3f6b88597d81504792290.jpeg)

摄影：Aevit 2015年6月 阳江闸坡十里银滩  
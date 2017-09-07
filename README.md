# ykit-config-mock

需要 ykit 版本 >= 0.5.0

## Features

- 模拟接口数据，支持[动态 Mock 数据语法][1]
- 兼容 FEKit mock 和 Jerry mock

## 安装

在项目中执行：

```
$ npm install ykit-config-mock --save
```

编辑 `ykit.js`，引入插件：

```
module.exports = {
    plugins: ['mock']
    // ...
};
```

或者如果需要添加插件的选项，也可以传入一个对象：

```javascript
module.exports = {
    plugins: [{
        name: 'mock',
        options: {
            // 插件选项
        }
    }]
    // ...
};
```

## 如何配置 mock 规则

在项目根目录下创建 `mock.js`:

```javascript
module.exports = [
	{
        pattern: /\/testA\.com\/(.*)\.do/, // 匹配一类接口，如 /test.com/list.do -> ./mockData/list.json
        responder: './mockData/$1.json'
    },
	{
        pattern: /\/testB\.com\/person\.do/, // 直接返回数据
        responder: {id: 'abc'}
    },
	{
        pattern: '/testC.com/query.do', // pattern 为字符串
        responder: {id: 'abc'}
    }
];
```

### 动态数据

可以通过定义数据模板来返回动态 mock 数据，具体规则[查看这里][2]。

```javascript
{
    pattern: '/test.com/query.do',
    responder: {
        "array|1-10": [
            "Mock.js"
        ]
    }
}

// 返回数据：
// {
//   "array": [
//     "Mock.js",
//     "Mock.js",
//     "Mock.js",
//     "Mock.js"
//   ]
// }
```

### 获取远程数据(Map Remote)

将接口转到远端来获取数据。

```javascript
{
    pattern: '/test.com/query.do',
    responder: 'http://yapi.corp.qunar.com/mock/58/getItems'
}
```

这意味着也可以用它来做类似 Map Remote 的功能：

```javascript
{
    // 添加了 .json 后缀是为了防止 .js 等资源也被 Mock 服务处理。
    pattern: /\/(.*)\.json/,
    responder: 'http://yapi.corp.qunar.com/$1.json'
}
```

上面通过正则匹配，将所有接口转到 http://yapi.corp.qunar.com 上，比如 `http://localhost/getItems.json` 会成为 `http://yapi.corp.qunar.com/getItems.json`

### 通过函数处理返回

```javascript
{
    pattern: '/test.com/query.do',
    responder: function(req, res) { // 两个参数，req 为请求对象，res 为返回对象
        // 这里可以有更多其他的处理过程
        // 从 req 中可以获取 req.cookies\req.query\req.body 等
        res.end(JSON.stringify({
            "ret": true,
            "data": {
                "name": "Li Lei",
                "email": "lilei@test.com",
                "registerDateTime": "2020-10-01 22:11:11"
            }
        }))
    }
}
```

### jsonp

```javascript
{
    pattern: '/api/list.json',
    responder: './data/listData.json',
    jsonp: 'jsCallback' // jsonp 请求的回调函数名，默认为 "callback"
}
```

## options

mock 插件会自动寻找项目根目录下的 mock.js 或者 mock.json，你也可以通过 options 手动指定一个 mock 配置的路径：

```javascript
module.exports = {
    plugins: [{
        name: 'mock',
        options: {
            confPath: './src/mock/mockconf.js'
        }
    }],
    // ...
};
```

## 关闭 mock

启动 ykit server 时追加参数即可：

```
$ sudo ykit s mock=false
```

## 示例
https://github.com/roscoe054/ykit-starter-mock

[1]: https://github.com/nuysoft/Mock/wiki/Syntax-Specification
[2]: http://mockjs.com/examples.html

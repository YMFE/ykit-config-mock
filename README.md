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

[1]: https://github.com/nuysoft/Mock/wiki/Syntax-Specification

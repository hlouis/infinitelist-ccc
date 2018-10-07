# Infinite List for CocosCreator

使用 TypeScript 编写的可以重用 Cell 的 List 控件，在大量数据的 List 中可以最大限度的减少内存占用的渲染资源的占用。整个 List 只需要创建视野范围中可见的 Cell 数量的控件即可。

## 支持的功能

1. 竖向滚动和横向滚动支持，可以通过面板切换
1. 支持设置 Cell 之间的间隔
1. 支持设置 List 顶部和底部的间隔（如果是水平方向就是最左边和最右边）
1. 同一个 List 中支持每个 Cell 的高度（对于水平的 List ，就是宽度）不同
1. 同一个 List 中支持每个 Cell 使用的 Prefab 不同

## 使用说明

首先复制 `Script/InfiniteList` 目录到你的项目中，然后：

### 编辑器方面的准备

1. 创建一个空的 Node 作为 List，并将其 Anchor 设置为 0，1
1. 在 Node 上添加 InfinitList 控件，并设置其相关的属性（所有属性都有中文 Tips，通过鼠标悬停可以观看说明）
1. 如果需要这个 List 有 Mask 的功能，可以在这个 Node 上添加 Mask 组件
1. 创建独立的 Prefab 或者场景上的 Node 作为 Cell 的模板
1. 如果一个 List 中需要多种 Cell 类型（例如顶部和底部需要特殊的 Cell）可以重复上一步
1. 所有的 Cell 模板均要将自己的 Anchor 设置为 0，1

### 代码方面的准备

1. 继承 InfiniteCell 类，并实现 UpdateContent 函数，这个函数用来更新当前 Cell 的表现。 需要注意的是，如果在 UpdateContent 中使用了异步函数获得结果来更新这个 Cell 时 很有可能返回时，当前的 Cell 已经不再用来显示之前的数据了，所以这时需要在函数中使用一个本地变量记录当前的 dataIndex 并在回调函数返回时比较这两个值是否一致。
1. 在适当的时候初始化 InfiniteList 的实例，需要调用 Init 函数，这个函数中需要传递四个回调，具体使用方式参考 Interface 的注释
1. 使用 `InfiniteList.Load` 函数触发数据的载入

## TODO

1. More API to list (jump to cell, cell is visible, etc...)
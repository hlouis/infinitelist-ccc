# Infinite List for CocosCreator

使用 TypeScript 编写的可以重用 Cell 的 List 控件，在大量数据的 List 中可以最大限度的减少内存占用的渲染资源的占用。整个 List 只需要创建视野范围中可见的 Cell 数量的控件即可。

## 支持的功能

1. 竖向滚动和横向滚动支持，可以通过面板切换
1. 支持设置 Cell 之间的间隔
1. 支持设置 List 顶部和底部的间隔（如果是水平方向就是最左边和最右边）
1. 同一个 List 中支持每个 Cell 的高度（对于水平的 List ，就是宽度）不同
1. 同一个 List 中支持每个 Cell 使用的 Prefab 不同

## 使用说明

### 编辑器方面的准备

1. 创建一个空的 Node，并将其 Anchor 设置为 0，1
1. 在 Node 上添加 InfinitList 控件，并设置其相关的属性（所有属性都有中文 Tips，通过鼠标悬停可以观看说明）
1. 如果需要这个 List 有 Mask 的功能，可以在这个 Node 上添加 Mask 组件
1. 创建独立的 Prefab 作为

### 代码方面的准备
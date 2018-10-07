const { ccclass, property } = cc._decorator;

/**
 * InfiniteCell base class
 * Author: Louis Huang
 * Date: 2018.10.03
 * 
 * 每一个使用 InfiniteList 的用户，都需要实现这个 cell 的 interface
 */
@ccclass
export default abstract class InfiniteCell extends cc.Component {
	/**
	 * cellIdentifier 是一个独特的字符串，用来表示这个 cell 使用的是哪种类型的资源，
	 * 这样在同一个 scroll 中可以使用多种不同的 cell 类型
	 */
	@property
	public cellIdentifier:string = "";

	/**
	 * 表示这个 cell 使用的数据，在整个数据中的索引值
	 */
	public dataIndex:number;

	/**
	 * 使用这个函数来更新当前的 Cell 内容
	 * 在这个函数被调用时，dataIndex 会指向正确的索引值
	 * 所以实现者，可以使用这个索引获得需要更新的数据
	 * 
	 * 需要注意的是，如果在 UpdateContent 中使用了异步函数获得结果来更新这个 Cell 时
	 * 很有可能返回时，当前的 Cell 已经不再用来显示之前的数据了，所以这时需要在函数中
	 * 使用一个本地变量记录当前的 dataIndex 并在回调函数返回时比较这两个值是否一致
	 */
	abstract UpdateContent():void;
}

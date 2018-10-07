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
	 * 在这个函数被调用时，dataIndex 和 cellIndex 都会指向正确的索引值
	 * 所以实现者，可以使用这两个索引获得需要更新的数据
	 */
	abstract UpdateContent():void;
}

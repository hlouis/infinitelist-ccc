import InfiniteCell from "./InfiniteCell";

const { ccclass, property } = cc._decorator;

enum Direction {
	vertical = 1,
	horizontal,
}

interface GetCellNumber {
	(): number;
}

interface GetCellSize {
	(dataIndex?:number): number;
}

interface GetCellView {
	(dataIndex?:number, cellIndex?:number): InfiniteCell;
}
interface InitParam {
	getCellNumber: GetCellNumber,
	getCellSize: GetCellSize,
	getCellView: GetCellView,
}

@ccclass
export default class InfiniteList extends cc.Component {
	@property({
		type: cc.Enum(Direction),
		tooltip: "List 滚动的方向，可以选择垂直或者水平"
	})
	public direction = Direction.vertical;

	@property({
		tooltip: "cell 之间的像素间隔，最开始和最后面不会添加"
	})
	public spacing = 0;

	public Init(p:InitParam) {
		this._init(p);
	}

	/**
	 * Reload 整个 List，这时获取数据的回调函数会重新触发一遍，所有的 cell 也会更新一遍内容
	 */
	public Reload() {
	}

	/**
	 * 重新刷新当前显示 cell 的内容，不会重新载入整个列表，所以如果列表的数据数量发生了变化，
	 * 调用 Refresh 是没有用处的，请调用 Reload
	 */
	public Refresh() {
		this._clear();
		this._load();
	}

	////////////////////////////////////////////////////////////
	// Implenmentions
	////////////////////////////////////////////////////////////

	private _scrollView:cc.ScrollView;
	private _content:cc.Node;
	private _delegate:InitParam;
	private _inited = false;

	public onLoad() {
		// setup scrollview component
		this._scrollView = this.node.getComponent(cc.ScrollView);
		if (!this._scrollView) {
			this._scrollView = this.node.addComponent(cc.ScrollView);
			if (this.direction == Direction.horizontal) {
				this._scrollView.vertical = false;
				this._scrollView.horizontal = true;
			} else {
				this._scrollView.vertical = true;
				this._scrollView.horizontal = false;
			}
		}

		// setup content node(which is root of every cell)
		this._content = new cc.Node();
		this.node.addChild(this._content);
		const layout = this._content.addComponent(cc.Layout);
		if (this.direction == Direction.horizontal) {
			layout.type = cc.Layout.Type.HORIZONTAL;
			layout.spacingX = this.spacing;
		} else {
			layout.type = cc.Layout.Type.VERTICAL;
			layout.spacingY = this.spacing;
		}

		// bind event to scrollview

		// Everything OK, let's start
		this._inited = true;
		if (this._delegate) {
			this._load();
		}
	}

	private _init(p:InitParam) {
		let needClear = false;
		if (this._delegate) needClear = true;
		this._delegate = p;
		if (this._inited) {
			if (needClear) this._clear();
			this._load();
		}
	}

	private _clear() {
	}

	private _load() {
	}
}
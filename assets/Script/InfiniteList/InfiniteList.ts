import InfiniteCell from "./InfiniteCell";

const { ccclass, property } = cc._decorator;

enum Direction {
	vertical = 1,
	horizontal,
}

interface GetCellNumber {
	/**
	 * 返回这个 List 中数据的总数量
	 */
	(): number;
}

interface GetCellIdentifer {
	/**
	 * 通过数据的下标返回这个 Cell 的表现类型的标志
	 * @param dataIndex: 当前 Cell 所渲染的数据在列表中的下标
	 */
	(dataIndex?:number): string;
}

interface GetCellSize {
	/**
	 * 通过数据的下标返回这个 Cell 的尺寸（垂直 List 为高度，水平 List 为宽度）
	 * @param dataIndex: 当前 Cell 所渲染的数据在列表中的下标
	 */
	(dataIndex?:number): number;
}

interface GetCellView {
	/**
	 * 获取一个 Cell 的 View 实例，记住这个控件必须已经挂在一个存在的 Node 上
	 * @param dataIndex: 当前 Cell 所渲染的数据在列表中的下标
	 * @param identifier: 这个 Cell 的表现类型标志
	 * 
	 * 这个回调函数只会出现在已经没有可以重用的 Cell 时，List 才会向这个函数请求新的 Cell 实例
	 * 所有已经请求的 Cell 实例都会被重复利用。
	 */
	(dataIndex?:number, identifier?:string): InfiniteCell;
}
interface InitParam {
	getCellNumber: GetCellNumber,
	getCellSize: GetCellSize,
	getCellIdentifer: GetCellIdentifer,
	getCellView: GetCellView,
}

interface CellPools {
	[index:string]: cc.NodePool;
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

	@property({tooltip: "List 顶部（水平滚动则是最左边）的间隔空间"})
	public headPadding = 0;

	@property({tooltip: "List 底部（水平滚动则是最右边）的间隔空间"})
	public bottomPadding = 0;

	@property({tooltip: "侧边的间距，垂直滚动就是左右边的间距，水平滚动就是上下边的间距"})
	public sidePadding:cc.Vec2 = new cc.Vec2(0, 0);

	public Init(p:InitParam) {
		this._init(p);
	}

	/**
	 * Reload 整个 List，这时获取数据的回调函数会重新触发一遍，所有的 cell 也会更新一遍内容
	 */
	public Reload() {
		this._clear();
		this._load();
	}

	/**
	 * 重新刷新当前显示 cell 的内容，不会重新载入整个列表
	 * 所以如果列表的数据数量发生了变化，或是想要修改 Cell 的尺寸，调用 Refresh 是没有用处的，请调用 Reload
	 */
	public Refresh() {
		this._updateActiveCellContent();
	}

	/**
	 * 返回相对于 ScrollView 的这个 Cell 的滚动坐标
	 * @param idx Cell 的索引下标
	 */
	public GetScrollPosOfCell(idx:number): cc.Vec2 {
		let sp = this._getCellPosOfIndex(idx);
		if (this.direction == Direction.vertical) {
			return new cc.Vec2(0, sp);
		} else {
			return new cc.Vec2(sp * -1, 0);
		}
	}

	/**
	 * 在规定的时间里滚动到指定的 Cell
	 * @param idx 目标的 Cell 的下标
	 */
	public ScrollToCell(idx:number, timeInSecond:number = 1, attenuated:boolean = true) {
		let pos = this.GetScrollPosOfCell(idx);
		this._scrollView.scrollTo(pos, timeInSecond, attenuated);
	}

	/**
	 * 查看一个 Cell 是否当前可见
	 * @param idx Cell 的下标
	 */
	public IsCellVisible(idx:number): boolean {
		if (idx >= this._activeCellIndexRange.x && idx <= this._activeCellIndexRange.y) return true;
		else return false;
	}

	////////////////////////////////////////////////////////////
	// Implenmentions
	////////////////////////////////////////////////////////////

	private _debug = true;
	private _scrollView:cc.ScrollView;
	private _content:cc.Node;
	private _delegate:InitParam;
	private _inited = false;
	private _scrollPosition = 0;
	private _activeCellIndexRange:cc.Vec2;
	private _cellPools:CellPools = {};

	private _cellsOffset:Array<number>;	// bottom side of cell position
	private _cellsSize:Array<number>;
	private _activeCellViews = new Array<InfiniteCell>();

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
		this._content.setAnchorPoint(0, 1);
		this.node.addChild(this._content);
		this._scrollView.content = this._content;
		if (this._debug) {
			// set background color to content for debug use
			this._content.addComponent(cc.Graphics);
		}

		// Everything OK, let's start
		this._inited = true;
		if (this._delegate) {
			this._load();
		}
	}

	public update() {
		if (this._debug) {
			let g = this._content.getComponent(cc.Graphics);
			g.clear();
			g.fillColor = cc.Color.YELLOW;
			g.fillRect(0, 0, this._content.width, this._content.height);
		}
	}

	public onEnable() {
		// bind event to scrollview
		this.node.on("scrolling", this._onScrolling, this);
	}

	public onDisable() {
		this.node.targetOff(this);
	}

	private  _onScrolling() {
		if (!this._delegate) return;
		const offset = this._scrollView.getScrollOffset();
		if (this.direction == Direction.vertical) {
			this._scrollPosition = offset.y;
		} else {
			this._scrollPosition = offset.x * -1;
		}

		// refresh active cell with new scroll position
		this._refreshActiveCells();
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
		if (this._activeCellViews) {
			while(this._activeCellViews.length > 0) {
				this._recycleCell(this._activeCellViews.length - 1);
			}
		}
	}

	private _load() {
		// get all cell offset with spacing and padding
		const dataLen = this._delegate.getCellNumber();
		if (dataLen <= 0) return;

		let offset = this.headPadding;
		this._cellsOffset = new Array<number>(dataLen);
		this._cellsSize = new Array<number>(dataLen);
		for (let i = 0; i < dataLen; i++) {
			let s = this._delegate.getCellSize(i)
			this._cellsSize[i] = s;
			offset = s + (i == 0 ? 0 : this.spacing) + offset;
			this._cellsOffset[i] = offset;
		}
		offset += this.bottomPadding;

		if (this.direction == Direction.vertical) {
			this._content.setContentSize(this.node.width, offset);
		} else {
			this._content.setContentSize(offset, this.node.height);
		}

		// create visible cells
		const range = this._getActiveCellIndexRange();
		this._activeCellIndexRange = range;

		for (let i = range.x; i <= range.y; i++) {
			this._addCellView(i);
		}
	}
	private _refreshActiveCells() {
		// update current active cells with new scroll position
		const range = this._getActiveCellIndexRange();
		// check if any cell need update
		if (range.equals(this._activeCellIndexRange)) return;

		// recycle all out of range cell
		let i = 0;
		while (i < this._activeCellViews.length) {
			let cell = this._activeCellViews[i];
			if (cell.dataIndex < range.x || cell.dataIndex > range.y) {
				this._recycleCell(i);
			} else {
				i++;
			}
		}

		// add any not exist cell
		// !TODO: boost this part effecient
		for (let i = range.x; i <= range.y; i++) {
			let needadd = true;
			for (let j = 0; j < this._activeCellViews.length; j++) {
				if (this._activeCellViews[j].dataIndex == i) {
					needadd = false;
					break;
				}
			}

			if (needadd) this._addCellView(i);
		}

		// update current active cell range
		this._activeCellIndexRange = range;
	}

	/**
	 * remove one active cell from _activeCellViews array
	 * @param cellIndex index of active cell views array
	 */
	private _recycleCell(cellIndex:number) {
		// !TODO: need store this cell in node pool
		let cell = this._activeCellViews[cellIndex];
		this._activeCellViews.splice(cellIndex, 1);
		cell.node.removeFromParent(false);
		cell.dataIndex = -1;

		if (!this._cellPools[cell.cellIdentifier]) {
			this._cellPools[cell.cellIdentifier] = new cc.NodePool();
		}
		let pool = this._cellPools[cell.cellIdentifier];
		pool.put(cell.node);
	}

	private _getCellViewFromPool(id:string): InfiniteCell | null {
		if (!this._cellPools[id]) return null;
		let pool = this._cellPools[id];
		let cellNode = pool.get();
		if (!cellNode) return null;
		return cellNode.getComponent(InfiniteCell);
	}

	/**
	 * Return vector2 for start and end cell index of current scroll position
	 */
	private _getActiveCellIndexRange():cc.Vec2 {
		let startPos = this._scrollPosition;
		let endPos = startPos + (this.direction == Direction.vertical ? this.node.height : this.node.width);
		return new cc.Vec2(this._getCellIndexOfPos(startPos), this._getCellIndexOfPos(endPos));
	}

	private _getCellIndexOfPos(pos:number): number {
		// !TODO: boost this function speed by using binary search
		for (let i = 0; i < this._cellsOffset.length; i++) {
			if (this._cellsOffset[i] >= pos) return i;
		}
		return this._cellsOffset.length - 1;
	}

	/**
	 * Get cell top position by its index
	 * @param idx Cell index
	 */
	private _getCellPosOfIndex(idx:number): number {
		return this._cellsOffset[idx] - this._cellsSize[idx];
	}

	private _addCellView(dataIndex:number) {
		let id = this._delegate.getCellIdentifer(dataIndex);
		let cell = this._getCellViewFromPool(id);
		if (!cell) {
			cell = this._delegate.getCellView(dataIndex);
			cell.node.setAnchorPoint(0, 1);
			cell.cellIdentifier = id;
		}

		cell.dataIndex = dataIndex;
		cell.enabled = true;
		this._activeCellViews.push(cell)
		this._content.addChild(cell.node);
		if (this.direction == Direction.vertical) {
			cell.node.x = this.sidePadding.x;
			cell.node.y = (this._cellsOffset[cell.dataIndex] - this._cellsSize[cell.dataIndex]) * -1;
			cell.node.setContentSize(this.node.width - this.sidePadding.x - this.sidePadding.y, this._cellsSize[dataIndex]);
		} else {
			cell.node.x = (this._cellsOffset[cell.dataIndex] - this._cellsSize[cell.dataIndex]);
			cell.node.y = this.sidePadding.x * -1;
			cell.node.setContentSize(this._cellsSize[dataIndex], this.node.height - this.sidePadding.x - this.sidePadding.y);
		}

		cell.dataIndex = dataIndex;
		cell.UpdateContent();
	}

	private _updateActiveCellContent() {
		this._activeCellViews.forEach(cell => {
			cell.UpdateContent();
		});
	}
}
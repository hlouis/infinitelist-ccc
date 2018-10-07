import InfiniteCell from "./InfiniteCell";

const { ccclass, property } = cc._decorator;

enum Direction {
	vertical = 1,
	horizontal,
}

interface GetCellNumber {
	(): number;
}

interface GetCellIdentifer {
	(dataIndex?:number): string;
}

interface GetCellSize {
	(dataIndex?:number): number;
}

interface GetCellView {
	(dataIndex?:number): InfiniteCell;
}
interface InitParam {
	getCellNumber: GetCellNumber,
	getCellSize: GetCellSize,
	getCellIdentifer: GetCellIdentifer,
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

	private _debug = true;
	private _scrollView:cc.ScrollView;
	private _content:cc.Node;
	private _delegate:InitParam;
	private _inited = false;
	private _scrollPosition = 0;
	private _activeCellIndexRange:cc.Vec2;

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
			this._scrollPosition = offset.x;
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

		let offset = 0;
		this._cellsOffset = new Array<number>(dataLen);
		this._cellsSize = new Array<number>(dataLen);
		for (let i = 0; i < dataLen; i++) {
			let s = this._delegate.getCellSize(i)
			this._cellsSize[i] = s;
			offset = s + (i == 0 ? 0 : this.spacing) + offset;
			this._cellsOffset[i] = offset;
		}
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

	private _getCellViewFromPool(id:string): InfiniteCell | null {
		return null;
	}

	private _addCellView(dataIndex:number) {
		let id = this._delegate.getCellIdentifer(dataIndex);
		let cell = this._getCellViewFromPool(id);
		if (!cell) {
			cell = this._delegate.getCellView(dataIndex);
			cell.node.setAnchorPoint(0, 1);
		}

		cell.dataIndex = dataIndex;
		cell.enabled = true;
		this._activeCellViews.push(cell)
		this._content.addChild(cell.node);
		if (this.direction == Direction.vertical) {
			cell.node.x = 0;
			cell.node.y = (this._cellsOffset[cell.dataIndex] - this._cellsSize[cell.dataIndex]) * -1;
			cell.node.setContentSize(this.node.width, this._cellsSize[dataIndex]);
		} else {
			cell.node.x = (this._cellsOffset[cell.dataIndex] - this._cellsSize[cell.dataIndex]) * -1;
			cell.node.y = 0;
			cell.node.setContentSize(this._cellsSize[dataIndex], this.node.height);
		}

		cell.dataIndex = dataIndex;
		cell.UpdateContent();
	}
}
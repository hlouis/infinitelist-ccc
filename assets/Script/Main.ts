const {ccclass, property} = cc._decorator;
import InfiniteList from "./InfiniteList/InfiniteList";
import InfiniteCell from "./InfiniteList/InfiniteCell";

class MyCell extends InfiniteCell {
    constructor() {
        super();
        this.cellIdentifier = "NormalCell";
    }

    public UpdateContent() {
        cc.log("Item update content for:", this.dataIndex, this.cellIndex);
    }
}

@ccclass
export default class Main extends cc.Component {

    @property({
        type: cc.Node,
    })
    public listNode:cc.Node;
    
    public onLoad() {
        cc.log(this.listNode);
        let ilist = this.listNode.getComponent(InfiniteList);
        ilist.Init({
            getCellNumber: this._getCellNumber,
            getCellSize: this._getCellSize,
            getCellIdentifer: this._getCellIdentifer,
            getCellView: this._getCellView,
        })
    }

    public update() {
    }

    private _getCellNumber():number {
        return 1;
    }

    private _getCellSize():number {
        return 100;
    }

    private _getCellView():MyCell {
        let node = new cc.Node();
        return node.addComponent(MyCell);
    }

    private _getCellIdentifer():string {
        return "NormalCell";
    }
}
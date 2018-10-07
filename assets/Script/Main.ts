const {ccclass, property} = cc._decorator;
import InfiniteList from "./InfiniteList/InfiniteList";
import InfiniteCell from "./InfiniteList/InfiniteCell";

class MyCell extends InfiniteCell {
    public UpdateContent() {
        cc.log("Item update content for:", this.dataIndex);
    }
}

@ccclass
export default class Main extends cc.Component {

    @property({
        type: cc.Node,
    })
    public listNode:cc.Node | null = null;

    @property({type: cc.Node})
    public cellNode:cc.Node | null = null;
    
    public onLoad() {
        cc.log("listNode:", this.listNode);
        cc.log("cellNode:", this.cellNode);
        let ilist = this.listNode!.getComponent(InfiniteList);
        ilist.Init({
            getCellNumber: this._getCellNumber,
            getCellSize: this._getCellSize,
            getCellIdentifer: this._getCellIdentifer,
            getCellView: this._getCellView,
        })
    }

    public update() {
    }

    private _getCellNumber = ():number => {
        return 10;
    }

    private _getCellSize = (index:number):number => {
        if (index % 2 == 0) return 50;
        else return 100;
    }

    private _getCellView = ():MyCell => {
        let node = cc.instantiate(this.cellNode);
        return node!.addComponent(MyCell);
    }

    private _getCellIdentifer = ():string => {
        return "NormalCell";
    }
}
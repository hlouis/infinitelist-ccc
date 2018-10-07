const {ccclass, property} = cc._decorator;
import InfiniteList from "./InfiniteList/InfiniteList";
import InfiniteCell from "./InfiniteList/InfiniteCell";

class MyCell extends InfiniteCell {
    public UpdateContent(d:any) {
        cc.log("Item update content for:", this.dataIndex);
        let text = this.node.getChildByName("text").getComponent(cc.Label);
        text.string = d + this.dataIndex.toString();
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
    
    private list:InfiniteList;
    private inputText:cc.EditBox;
    private inputPrefix:cc.EditBox;
    private cellNum:number = 10;

    public onLoad() {
        cc.log("listNode:", this.listNode);
        cc.log("cellNode:", this.cellNode);
        this.list = this.listNode!.getComponent(InfiniteList);
        this.list.Init({
            getCellNumber: this._getCellNumber,
            getCellSize: this._getCellSize,
            getCellIdentifer: this._getCellIdentifer,
            getCellView: this._getCellView,
            getCellData: this._getCellData,
        })

        this.inputText = this.node.getChildByName("inputBox").getComponent(cc.EditBox);
        this.inputPrefix = this.node.getChildByName("inputPrefix").getComponent(cc.EditBox);

        this.node.getChildByName("btnUpdate").on("click", () => {
            let n:number = +this.inputText.string;
            this.cellNum = n;
            this.list.Reload(false);
        })
        this.node.getChildByName("btnRefresh").on("click", () => {
            this.list.Refresh();
        })
    }

    public update() {
    }

    private _getCellData = ():any => {
        return this.inputPrefix.string;
    }

    private _getCellNumber = ():number => {
        return this.cellNum;
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
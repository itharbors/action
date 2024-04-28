import { Action } from './action';

/**
 * Action 队列
 */
export class ActionQueue<D extends { [key: string]: any }> {
    // 执行 action.exec 时候给的参数
    public _params: D;

    // undo 和 redo 的偏移
    private _undoIndex = -2;
    private _redoIndex = -2;

    // action 队列
    private _queue: Action[] = [];

    get queue() {
        return this._queue;
    }

    get length() {
        return this._queue.length;
    }

    constructor(params: D) {
        this._params = params;
    }

    /**
     * 执行一个操作
     * @param action 
     */
    async exec(action: Action) {
        this._undoIndex = this._redoIndex = -2;
        this._queue.push(action);
        await action.exec(this._params);
    }

    /**
     * 执行一次撤销
     */
    async undo() {
        if (this._undoIndex === -2) {
            this._undoIndex = this._queue.length - 1;
        }

        // 从队列尾部向前查找
        for (let i = this._undoIndex; i >= 0; i--) {
            const action = this._queue[i];

            // 遇到 undo 的 action 则跳到原始 action 之前
            if (action.info.undo !== 0) {
                i -= action.info.undo;
                continue;
            }

            // 遇到其他 action 则生成回滚 action 并执行
            const undoAction = await action.revertAction();
            undoAction.info.undo = this._undoIndex - i + 1;
            this._undoIndex = i - 1;
            this._redoIndex = -2;
            this._queue.push(undoAction);
            await undoAction.exec(this._params);
            break;
        }
    }

    /**
     * 执行一次重做
     */
    async redo() {
        if (this._redoIndex === -2) {
            this._redoIndex = this._queue.length - 1;
        }

        // 从队列尾部向前查找
        for (let i = this._redoIndex; i >= 0; i--) {
            const action = this._queue[i];

            // 遇到正常的 action 则终止查找
            if (action.info.undo === 0) {
                break;
            }

            // 遇到 undo action 则生成回滚 action 并执行
            const redoAction = await action.revertAction();
            this._redoIndex = i - 1;
            this._undoIndex = -2;
            this._queue.push(redoAction);
            await redoAction.exec(this._params);
            break;
        }
    }
}

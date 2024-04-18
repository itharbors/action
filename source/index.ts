'use strict';

/**
 * Action 抽象类
 * 用于执行一个既定动作
 */
export class Action<
    Detail extends { [key: string]: any } = { [key: string]: any },
> {
    // 这个 Action 的数据
    // 这些数据需要序列化跨进程传递，所以不能放入无法序列化的数据
    protected detail: Detail;

    // 记录执行后的临时数据，用于生成回滚数据
    // 这些数据需要序列化跨进程传递，所以不能放入无法序列化的数据
    protected data: { [key: string]: any } = {};

    // action 的临时数据，这些不需要传递
    info = {
        // undo 原始 action 的偏移值
        // 非 undo 生成的为 0，如果 undo 最后一个 action，为 1
        undo: 0,
    };

    constructor(detail: Detail) {
        this.detail = detail;
    }

    /**
     * 执行这个动作
     */
    async exec(params: { [key: string]: any }): Promise<void> {
        // OVERWRITE
    }

    /**
     * 生成一个反向动作
     */
    async revertAction(): Promise<Action> {
        // OVERWRITE
        return new Action({});
    }
}

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

/**
 * 多个 Action 合并成一个 List
 */
class ActionList extends Action<{
    queue: Action[];
}> {
    async exec(params: any) {
        for (let action of this.detail.queue) {
            await action.exec(params);
        }
    }
    async revertAction(): Promise<ActionList> {
        const queue: Action[] = [];
        for (let i = this.detail.queue.length - 1; i >= 0; i--) {
            const action = this.detail.queue[i];
            queue.push(await action.revertAction());
        }
        return new ActionList({
            queue,
        });
    }
}

export function mergeActionList(queue: Action[]) {
    return new ActionList({ queue });
}
4
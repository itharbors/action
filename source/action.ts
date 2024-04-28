/**
 * Action 类
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

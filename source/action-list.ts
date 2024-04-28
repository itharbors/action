import { Action } from './action';

/**
 * 多个 Action 合并成一个 List
 */
export class ActionList extends Action<{
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
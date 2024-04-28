import type { Action } from './action';
import { ActionList } from './action-list';

/**
 * 合并 Action 队列
 * @param queue 
 */
export function mergeActionList(queue: Action[]) {
    return new ActionList({ queue });
}

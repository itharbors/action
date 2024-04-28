import { describe, it, before } from 'node:test';
import { equal, deepEqual } from 'node:assert';
import { ActionQueue } from '../build/index.mjs';
import { generateSimpleAction } from './utils.mjs';

describe('执行 action', () => {
    const data = {
        // action 目标修改的值
        count: 0,
        // 用于测试，记录 action 执行路径
        paths: [],
    };
    const queue = new ActionQueue();

    const ActionA = generateSimpleAction(data);
    const ActionB = generateSimpleAction(data);

    before(async () => {
        const actionA = new ActionA({ count: 2, tag: 'a' });
        const actionB = new ActionB({ count: 4, tag: 'b' });

        await queue.exec(actionA); // 0 -> 2
        await queue.exec(actionB); // 2 -> 4
    });

    it('检查操作数据', () => {
        equal(4, data.count);
    });

    it('检查 action 执行顺序', () => {
        deepEqual(['a', 'b'], data.paths);
    });
});

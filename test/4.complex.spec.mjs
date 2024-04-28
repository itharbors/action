import { describe, it, before } from 'node:test';
import { equal, deepEqual } from 'node:assert';
import { ActionQueue } from '../build/index.mjs';
import { generateSimpleAction } from './utils.mjs';

describe('exec*4 undo redo undo undo', () => {
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
        const actionC = new ActionB({ count: 6, tag: 'c' });
        const actionD = new ActionB({ count: 8, tag: 'd' });

        await queue.exec(actionA); // a  0 -> 2
        await queue.exec(actionB); // b  2 -> 4
        await queue.exec(actionC); // c  4 -> 6
        await queue.exec(actionD); // d  6 -> 8

        // 超额执行，检查是否报错
        await queue.undo(); // d' 8 -> 6
        await queue.redo(); // d  6 -> 8
        await queue.undo(); // d' 8 -> 6
        await queue.undo(); // c' 6 -> 4
    });

    it('检查操作数据', () => {
        equal(4, data.count);
    });

    it('检查 action 执行顺序', () => {
        deepEqual(['a', 'b', 'c', 'd', 'd\'', 'd', 'd\'', 'c\''], data.paths);
    });
});

describe('exec*4 undo redo redo undo', () => {
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
        const actionC = new ActionB({ count: 6, tag: 'c' });
        const actionD = new ActionB({ count: 8, tag: 'd' });

        await queue.exec(actionA); // a  0 -> 2
        await queue.exec(actionB); // b  2 -> 4
        await queue.exec(actionC); // c  4 -> 6
        await queue.exec(actionD); // d  6 -> 8

        // 超额执行，检查是否报错
        await queue.undo(); // d' 8 -> 6
        await queue.redo(); // d  6 -> 8
        await queue.redo(); // --
        await queue.undo(); // d' 8 -> 6
        await queue.undo(); // c' 6 -> 4
    });

    it('检查操作数据', () => {
        equal(4, data.count);
    });

    it('检查 action 执行顺序', () => {
        deepEqual(['a', 'b', 'c', 'd', 'd\'', 'd', 'd\'', 'c\''], data.paths);
    });
});

describe('exec undo exec  undo undo', () => {
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

        await queue.exec(actionA); // a  0 -> 2
        await queue.undo();        // a' 2 -> 0
        await queue.exec(actionB); // b  0 -> 4
        await queue.undo();        // b' 4 -> 0
    });

    it('检查操作数据', () => {
        equal(0, data.count);
    });

    it('检查 action 执行顺序', () => {
        deepEqual(['a', 'a\'', 'b', 'b\''], data.paths);
    });
});

describe('exec undo exec redo', () => {
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

        await queue.exec(actionA); // a  0 -> 2
        await queue.undo();        // a' 2 -> 0
        await queue.exec(actionB); // b  0 -> 4
        await queue.redo();        // --
    });

    it('检查操作数据', () => {
        equal(4, data.count);
    });

    it('检查 action 执行顺序', () => {
        deepEqual(['a', 'a\'', 'b'], data.paths);
    });
});

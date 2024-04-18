import { Action } from '../build/index.mjs';

export const generateSimpleAction = function(data) {
    class ChangeNumAction extends Action {
        // 记录被修改值
        _count = 0;

        async exec() {
            await new Promise((resolve) => {
                setTimeout(resolve, 10);
            });
            // 备份被修改值
            this._count = data.count;
            // 实际修改数据
            data.count = this.detail.count;
            // 记录到 paths 里方便测试
            data.paths.push(this.detail.tag);
        }

        async revertAction() {
            if (this.detail.tag.endsWith('\'')) {
                // a' 改成 a
                return new ChangeNumAction({ count: this._count, tag: this.detail.tag.substring(0, this.detail.tag.length - 1) });
            } else {
                // a 改成 a'
                return new ChangeNumAction({ count: this._count, tag: this.detail.tag + '\'' });
            }
        }
    }
    return ChangeNumAction;
}

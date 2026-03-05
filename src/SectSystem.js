// 取代原有的卡牌系统，宗门系统负责弟子培养、资源分配、事件处理
export class SectSystem {
  constructor(state, entities) {
    this.state = state;
    this.entities = entities;
  }

  update(delta=0) {
    // 更新宗门内部逻辑（例如清算任务、处理事件等）
    // delta 可让系统根据停顿时间推进状态
  }

  recruitDisciple() {
    // 示例：创建一个随机弟子
    const newDisciple = this.entities.createDisciple({ name: '新弟子', level: 1 });
    return newDisciple;
  }
}

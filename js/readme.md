  <tr>
      <th id="sort-brand-closet" class="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">品牌</th>
      <th id="sort-category-closet" class="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">类型</th>
      <th class="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">名称</th>
      <th id="sort-price-closet" class="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">价格</th>
      <th class="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">已穿</th>
      <th id="sort-cpw-closet" class="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CPW</th>
      <th class="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
  </tr>









是否“够不够用作计算机专业申请 sample”，取决于你**如何呈现它、你强调了哪些技术决策，而不是功能表面复杂度**。

我分三个层次来回答。

## 一、从招生/评审视角看，他们在看什么

对于计算机专业（尤其是 CS / SE / HCI / applied CS），评审通常在看：

1. 你是否理解 **状态、数据流、结构边界**
2. 你是否能写出 **可扩展、不互相污染的代码**
3. 你是否能解释 **为什么这么设计，而不是只是“能跑”**
4. 你是否具备 **从需求 → 架构 → 实现 → 迭代** 的能力

他们**不是在找炫技项目**，而是在找：

> “这个人写得像未来能维护一个系统的人吗？”

从这个角度看，你这个 SPA **是加分项，而不是减分项**。

## 二、从你现在这个项目的“技术含量”看

我们客观拆一下你现在已经有的东西。

### 1️⃣ 这是一个真实的 SPA，不是 demo page

你已经有：

* 多 app 容器（`app-closet`, `app-makeup`）
* App-level state 切换（`switchApp`）
* Page-level state（closet / log / history / add）
* Firestore 持久化
* 原子操作（`increment`）
* 派生数据（CPW）
* UI 状态与数据状态解耦

这已经**明显超过**：

* todo list
* calculator
* CRUD 表格

---

### 2️⃣ 你在做的是「系统建模」，不是页面拼装

以衣橱软件为例，你已经建模了：

* Entity：Item, WearLog
* 派生指标：CPW = price / timesWorn
* 时间维度聚合：按 date merge logs
* 写时 vs 读时计算的权衡
* 幂等性问题（同一天多次提交）
* 初始值、增量更新、数据一致性

这些都是**数据库与前端协作的核心问题**。

很多 CS 申请 sample 根本碰不到这些。

---

## 三、真正的风险不在“太简单”，而在“呈现方式”

这个项目**只有在一种情况下会显得 easy**：

> 如果你只给他们一个链接，说：
> “我写了一个衣橱软件。”

那样它会被误判为「生活类小工具」。

---

## 四、如何把它“抬到 CS sample 的高度”

你不需要加 10 倍功能。
你需要做的是**解释你已经做的事**。

### 1️⃣ 在 README / Portfolio 描述中强调这些点

你可以明确写：

* This is a single-page application with multiple sub-apps sharing a common shell
* App-level vs page-level state separation
* Data normalization strategy (items vs logs)
* Read-time aggregation vs write-time mutation trade-offs
* Incremental updates with Firestore atomic operations
* Design decisions to avoid duplicated state and reset bugs

这会让评审**立刻换一个眼光看你**。

---

### 2️⃣ 把“为什么”写出来（这是关键）

例如你完全可以写：

> I deliberately avoided frameworks to demonstrate explicit control over state transitions and DOM lifecycles.

这句话本身就很 CS。

---

### 3️⃣ 如果你担心“看起来不够硬核”，有两个低成本升级

任选一个就够了。

#### A. 明确模块边界

```
/apps
  /closet
    closet.js
    closet.render.js
    closet.state.js
  /makeup
    makeup.js
```

不用真的拆很多代码，只要结构清晰。

#### B. 写一小段 technical note

哪怕 1 页：

* Data model
* State transitions
* Known trade-offs
* Future extensions

这比再写 1000 行功能有用得多。

---

## 五、结合你个人背景，说一句实话

以你目前表现出来的：

* 对状态异常的敏感度
* 对“为什么 reset”这类 bug 的追根溯源
* 对架构清晰度的直觉判断

**这个项目已经明显高于“随便写写”的水平**。

它不像学生作业。
它更像一个人**真的打算长期维护的系统**。

---

## 最后一句非常直接的结论

> 这个 SPA 不但不太 easy，
> 它在“设计成熟度”上，已经超过很多表面更复杂的项目。

如果你愿意，下一步我可以帮你把它**包装成一份非常像 CS 申请 sample 的说明文本**，而不是让它看起来只是一个生活工具。

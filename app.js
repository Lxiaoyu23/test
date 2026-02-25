const state = {
  requirement: null,
  order: null,
  fulfillmentSteps: ["供应商确认", "合同签署", "备货排产", "发货出库", "签收验收"],
  currentStep: -1,
  trackingNo: "",
};

const requirementForm = document.getElementById("requirement-form");
const analysisResult = document.getElementById("analysis-result");
const createOrderBtn = document.getElementById("create-order-btn");
const orderCard = document.getElementById("order-card");
const orderSummary = document.getElementById("order-summary");
const fulfillmentStepsEl = document.getElementById("fulfillment-steps");
const nextStepBtn = document.getElementById("next-step-btn");
const stepHint = document.getElementById("step-hint");
const logisticsForm = document.getElementById("logistics-form");
const logisticsEmpty = document.getElementById("logistics-empty");
const timeline = document.getElementById("tracking-timeline");
const trackingInput = document.getElementById("tracking-input");
const timelineTpl = document.getElementById("timeline-item-template");

function riskByPriority(priority) {
  if (priority === "高") return "高风险（需跨部门审批）";
  if (priority === "中") return "中风险（建议双供应商备选）";
  return "低风险（常规流程）";
}

function renderAnalysis(req) {
  analysisResult.classList.remove("hidden");
  analysisResult.innerHTML = `
    <p><strong>解析结果：</strong>${req.title}，预算 ¥${Number(req.budget).toLocaleString()}</p>
    <p><strong>优先级：</strong>${req.priority} ｜ <strong>风险判定：</strong>${riskByPriority(req.priority)}</p>
    <p><strong>建议动作：</strong>先完成供应商资质复核，再启动合同签署；目标交付时间 ${req.deadline}</p>
  `;
}

function renderSteps() {
  fulfillmentStepsEl.innerHTML = "";
  state.fulfillmentSteps.forEach((step, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${step}`;

    if (index < state.currentStep) item.classList.add("done");
    if (index === state.currentStep) item.classList.add("active");

    fulfillmentStepsEl.appendChild(item);
  });

  if (state.currentStep >= state.fulfillmentSteps.length) {
    stepHint.textContent = "履约流程已全部完成。";
    nextStepBtn.disabled = true;
  } else {
    stepHint.textContent = `当前节点：${state.fulfillmentSteps[state.currentStep] || "待启动"}`;
    nextStepBtn.disabled = false;
  }
}

function appendTracking(status, detail) {
  const node = timelineTpl.content.cloneNode(true);
  node.querySelector(".status").textContent = status;
  node.querySelector(".time").textContent = new Date().toLocaleString("zh-CN");
  node.querySelector(".detail").textContent = detail;
  timeline.prepend(node);
}

requirementForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const req = {
    title: document.getElementById("req-title").value.trim(),
    budget: document.getElementById("req-budget").value,
    priority: document.getElementById("req-priority").value,
    deadline: document.getElementById("req-deadline").value,
    description: document.getElementById("req-description").value.trim(),
  };

  state.requirement = req;
  renderAnalysis(req);
  createOrderBtn.disabled = false;
});

createOrderBtn.addEventListener("click", () => {
  if (!state.requirement) return;

  state.order = {
    id: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    createdAt: new Date().toLocaleDateString("zh-CN"),
  };

  state.currentStep = 0;
  orderSummary.textContent = `履约单号：${state.order.id} ｜ 创建日期：${state.order.createdAt} ｜ 需求：${state.requirement.title}`;

  orderCard.classList.remove("hidden");
  nextStepBtn.disabled = false;
  renderSteps();

  timeline.innerHTML = "";
  timeline.classList.add("hidden");
  logisticsEmpty.classList.remove("hidden");
});

nextStepBtn.addEventListener("click", () => {
  if (state.currentStep < 0 || state.currentStep >= state.fulfillmentSteps.length) return;

  const completedStep = state.fulfillmentSteps[state.currentStep];
  state.currentStep += 1;
  renderSteps();

  if (completedStep === "发货出库") {
    state.trackingNo = `TRK${new Date().getFullYear()}${Math.floor(Math.random() * 900 + 100)}`;
    trackingInput.value = state.trackingNo;
    logisticsEmpty.textContent = `已生成运单号：${state.trackingNo}，现在可以查询物流。`;
    appendTracking("包裹已出库", `运单 ${state.trackingNo} 已交由承运商揽收。`);
    timeline.classList.remove("hidden");
    logisticsEmpty.classList.add("hidden");
  }

  if (completedStep === "签收验收") {
    appendTracking("签收完成", "采购方完成签收与质量验收，订单已闭环。");
  }
});

logisticsForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const queryNo = trackingInput.value.trim();
  if (!queryNo) return;

  if (!state.trackingNo || queryNo !== state.trackingNo) {
    logisticsEmpty.textContent = "未查询到该运单，请确认运单号是否正确或先完成发货流程。";
    logisticsEmpty.classList.remove("hidden");
    timeline.classList.add("hidden");
    return;
  }

  logisticsEmpty.classList.add("hidden");
  timeline.classList.remove("hidden");

  appendTracking("运输中", "车辆已离开分拨中心，预计 24 小时内到达目的仓。");
});

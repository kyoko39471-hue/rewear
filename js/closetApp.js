import {
    addDoc,
    getDocs,
    collection,
    doc,
    updateDoc,
    increment,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {db} from "./firebase.js";
import { 
    userId,
    showToast
} from "./main.js";

//closetApp的全局常量和变量
const app = document.getElementById('app-closet');

const tabs = {
    closet: app.querySelector('#closet-tab-overview'),
    log: app.querySelector('#closet-tab-log'),
    history: app.querySelector('#closet-tab-history'),
    add: app.querySelector('#closet-tab-add'),
};

const pages = {
    closet: app.querySelector('#closet-page-overview'),
    log: app.querySelector('#closet-page-log'),
    history: app.querySelector('#closet-page-history'),
    add: app.querySelector('#closet-page-add'),
};

const BRANDS = [
    "Adidas",
    "Aerepostale",
    "Aritzia",
    "Brandy Melville",
    "Cotton On",
    "Daphne",
    "Gelato Pique",
    "Hollister",
    "Hongdae",
    "hotwind",
    "Lululemon",
    "MLB",
    "Mucent",
    "Olive des Olive",
    "OOMOMO",
    "SMFK",
    "Sistina",
    "Trader Joes",
    "Twee",
    "Uniqlo",
    "zeroplanet",
];

const brand = app.querySelector('#closet-brand-select');
const addItemForm = app.querySelector('#closet-add-item-form');

//下面是closetApp子程序的全局函数
//1. switchTab - click tab，show page, tab changes color, hide other pages
function switchTab(activeTab) {
    Object.keys(tabs).forEach(key => {
        const tab = tabs[key];
        const page = pages[key];
        
        if (key === activeTab) {
            tab.classList.add('text-blue-600', 'border-blue-600');
            tab.classList.remove('text-slate-500', 'border-transparent');
            page.classList.remove('hidden');
            
        } else {
            tab.classList.remove('text-blue-600', 'border-blue-600');
            tab.classList.add('text-slate-500', 'border-transparent');
            page.classList.add('hidden');
        }
    });
}

Object.keys(tabs).forEach(key => {
    tabs[key].addEventListener('click', () => {
        switchTab(key);
    });
});

function escapeHTML(str) { // 先把输入转换成字符串（以防不是字符串，比如数字或null）
    return String(str).replace(
        /[&<>"']/g,  // 匹配 &, <, >, " 和 ' 这几个特殊字符
        function(match) {  // 对每个匹配到的字符做处理
            return {
                '&': '&amp;',   // & 转成 &amp;
                '<': '&lt;',    // < 转成 &lt;
                '>': '&gt;',    // > 转成 &gt;
                '"': '&quot;',  // " 转成 &quot;
                "'": '&#39;'    // ' 转成 &#39;
            }[match]; // 根据匹配的字符返回对应的编码
        }
    );
}

//2. calculate CPW + add CPW color 
function calculateCPW(price, timesWorn) {
    if (timesWorn <= 0) {
        return price.toFixed(2); 
    }
    return (price / timesWorn).toFixed(2);
}

function getCPWColor(cpw) {
    cpw = parseFloat(cpw);
    if (cpw <= 2) return 'text-green-600';
    if (cpw <= 5) return 'text-yellow-600';
    if (cpw <= 10) return 'text-orange-600';
    return 'text-red-600';
}

// 3. Brand Select

function renderBrandSelect() {
    
    if (!brand) return;
    brand.innerHTML = '<option value="">-- 请选择品牌 --</option>';

    BRANDS.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    brand.appendChild(opt);
    });
}

//4. 数据库（db）里找到并返回那个地址是“用户列表/某个用户ID/衣橱”的数据列表。
function getClosetRef (){
    if (!userId) return null;
    return collection(db, `users/${userId}/closet`);// 这样，其他程序就可以用这个返回的地址去读取或写入这个用户的衣橱数据了。
}

//5. sort
function sortCloset(closet) {
    return closet.slice().sort((a, b) => {
        const brandA = a.brand;
        const brandB = b.brand;

        const byBrand = brandA.localeCompare(brandB);
        if (byBrand !== 0) {
            return byBrand;
        }

        // 2) Type 升序
        const typeA = (a.type);
        const typeB = (b.type);
        const byType = typeA.localeCompare(typeB);
        if (byType !== 0) {
            return byType;
        }

        // 3) CPW 降序（越贵排越前）
        const cpwA = parseFloat(calculateCPW(a.price, a.timesWorn));
        const cpwB = parseFloat(calculateCPW(b.price, b.timesWorn));
        return cpwB - cpwA;

    });
}

//接下来才是一页一页的代码~~~ 嘿嘿

// page 4 添加新衣: 1）命名变量 2）函数 3）绑定eventListener
const name = app.querySelector('#closet-item-name');
const type = app.querySelector('#closet-item-type');
const price = app.querySelector('#closet-item-price');
const timesWorn = app.querySelector('#closet-item-times-worn');

async function handleAddItem(e) {
    e.preventDefault();
    const newItem = {//
        brand: brand.value,
        type: type.value,
        name: name.value,
        price: Number(price.value),
        timesWorn: Number(timesWorn.value)
    };
    const closetRef = getClosetRef ();//
    await addDoc(closetRef, newItem);//在数据列表里加入新数据
    showToast ("新衣服已加入衣橱","success");
    addItemForm.reset();
    switchTab('closet');
    renderCloset();
}

addItemForm.addEventListener('submit', handleAddItem);

//page 1 我的衣橱：1）函数
const deleteModal = document.getElementById('delete-modal');
const deleteItemName = document.getElementById('delete-item-name');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const confirmDeleteBtn = document.getElementById('confirm-delete');
let pendingDeleteItemId = null;

async function renderCloset() {
    const closetRef = getClosetRef();
    if (!closetRef) return;   // <-- prevents future crashes
    const snap = await getDocs(closetRef);

    const tbody = document.getElementById("closet-table-body");
    // 1️⃣ Firestore → 普通数组
    const closetItems = [];

    snap.forEach(docSnap => {
        closetItems.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    // 2️⃣ 排序
    const sortedCloset = sortCloset(closetItems);

    // 3️⃣ render
    let html = "";

    sortedCloset.forEach(item => {
        const CPW = calculateCPW(item.price, item.timesWorn);
        const CPWColor = getCPWColor(CPW);
        html += `
            <tr>
                <td class="py-4 px-4 text-sm text-slate-900">${item.brand}</td>
                <td class="py-4 px-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${escapeHTML(item.type)}
                    </span>
                </td>
                <td class="py-4 px-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-slate-900">
                    <span class="editable" data-id="${item.id}" data-field="name" title="双击编辑名称">${escapeHTML(item.name)}</span>
                    </div>
                </td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-slate-600">
                    $${parseFloat(item.price).toFixed(2)}
                </td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-slate-600">
                    ${item.timesWorn} 次
                </td>
                <td class="py-4 px-4 whitespace-nowrap text-sm font-bold ${CPWColor}">${CPW}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm">
                    <button 
                        class="delete-item-btn text-gray-600 hover:text-red-800 text-sm font-semibold"
                        data-id="${item.id}"
                        data-name="${escapeHTML(item.name)}"
                    >
                        x
                    </button>
                </td>
            </tr>`;
    });
    tbody.innerHTML = html;
}
//delete 功能
const closetTableBody = document.getElementById("closet-table-body");

closetTableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-item-btn');
    if (!btn) return;

    pendingDeleteItemId = btn.dataset.id;
    deleteItemName.textContent = btn.dataset.name;

    deleteModal.classList.remove('hidden');
});

cancelDeleteBtn.addEventListener('click', () => {
    pendingDeleteItemId = null;
    deleteModal.classList.add('hidden');
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!pendingDeleteItemId) return;

    const closetRef = getClosetRef();
    if (!closetRef) return;

    const itemRef = doc(closetRef, pendingDeleteItemId);

    await deleteDoc(itemRef);

    showToast("物品已删除", "success");

    pendingDeleteItemId = null;
    deleteModal.classList.add('hidden');

    renderCloset();
});
//page 2 添加记录 1）定义常量 2）render第二页 3）点击tab时启动render 4) async function 5) eventListener
const logWearList = app.querySelector('#log-wear-list');
const logEmptyList = app.querySelector('#log-empty-list');
const submitLogWearBtn = app.querySelector('#submit-log-wear');

async function renderLogPage() {
    const closetRef = getClosetRef();
    if (!closetRef) return;

    const snap = await getDocs(closetRef);

    logWearList.innerHTML = "";
    let hasItems = false;

    // ① Firestore → 普通数组
    const closetItems = [];

    snap.forEach(docSnap => {
        closetItems.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    if (closetItems.length === 0) {
        logEmptyList.classList.remove('hidden');
        return;
    }

    hasItems = true;
    logEmptyList.classList.add('hidden');

    // ② 排序（完全复用）
    const sortedCloset = sortCloset(closetItems);

    // ③ render
    sortedCloset.forEach(item => {
        const CPW = calculateCPW(item.price, item.timesWorn);
        const CPWColor = getCPWColor(CPW);

        logWearList.innerHTML += `
            <label class="flex items-center justify-between gap-3 p-2 rounded hover:bg-slate-50">
                <div class="flex items-center gap-3">
                    <input 
                        type="checkbox"
                        class="log-wear-checkbox"
                        data-id="${item.id}"
                    />
                    <span class="text-sm text-slate-800">
                        ${escapeHTML(item.brand)} · ${escapeHTML(item.type)} · ${escapeHTML(item.name)} 
                    </span>
                </div>

                <span class="text-sm font-bold ${CPWColor}">
                    ${CPW}
                </span>
            </label>
        `;
    });
}

tabs.log.addEventListener('click', () => {
    switchTab('log');
    renderLogPage();
});

async function handleSubmitLogWear() {
    const checked = document.querySelectorAll('.log-wear-checkbox:checked');

    if (checked.length === 0) {
        showToast("请至少选择一件衣服", "error");
        return;
    }

    const itemIds = Array.from(checked).map(cb => cb.dataset.id);

    // ① 写入穿搭日志
    const logRef = collection(db, `users/${userId}/wearLogs`);

    await addDoc(logRef, {
        date: dayjs().format("YYYY-MM-DD"),
        itemIds,
        createdAt: new Date()
    });

    // ② 同步更新每件衣服的 timesWorn
    const closetRef = getClosetRef();

    const updatePromises = itemIds.map(itemId => {
        const itemRef = doc(closetRef, itemId);
        return updateDoc(itemRef, {
            timesWorn: increment(1)
        });
    });

    await Promise.all(updatePromises);

    showToast("今日穿搭已记录", "success");

    // ③ 切页 & 刷新衣橱
    switchTab('closet');
    renderCloset();
}

submitLogWearBtn.addEventListener('click', handleSubmitLogWear);

//page 3 显示穿搭历史
const historyList = app.querySelector('#history-list');
const historyEmpty = app.querySelector('#history-empty');
async function getClosetMap() {
    const closetRef = getClosetRef();
    if (!closetRef) return {};

    const snap = await getDocs(closetRef);
    const map = {};

    snap.forEach(docSnap => {
        map[docSnap.id] = docSnap.data();
    });

    return map;
}

async function renderHistoryPage() {
    if (!userId) return;

    historyList.innerHTML = "";

    const historyRef = collection(db, `users/${userId}/wearLogs`);
    const snap = await getDocs(historyRef);

    if (snap.empty) {
        historyEmpty.classList.remove('hidden');
        return;
    }

    historyEmpty.classList.add('hidden');

    const closetMap = await getClosetMap();

    const logs = [];
    snap.forEach(docSnap => {
        logs.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    logs.sort((a, b) => new Date(b.date) - new Date(a.date));

    const logsByDate = {};
    logs.forEach(log => {
        if (!logsByDate[log.date]) {
            logsByDate[log.date] = [];
        }
        logsByDate[log.date].push(...log.itemIds);
    });

    // 去重
    Object.keys(logsByDate).forEach(date => {
        logsByDate[date] = Array.from(new Set(logsByDate[date]));
    });

    // render
    Object.keys(logsByDate).forEach(date => {
    const itemNames = logsByDate[date]
    .map(id => {
        const item = closetMap[id];
        if (!item) {
            return `<span class="text-sm text-slate-400">（已删除的衣服）</span>`;
        }
        return `
            <span class="px-2 py-1 text-sm rounded bg-slate-100 text-slate-700">
                ${escapeHTML(item.name)}
            </span>
        `;
    })
    .join("");

    const logDiv = document.createElement("div");
    logDiv.className = "bg-white p-4 rounded-lg shadow-md border border-slate-200";

    logDiv.innerHTML = `
        <div class="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i data-lucide="calendar" class="w-5 h-5 text-blue-500"></i>
                ${date}
            </h3>
        </div>

        <div class="flex flex-wrap gap-2">
            ${itemNames}
        </div>
    `;

    historyList.appendChild(logDiv);
    });
    lucide.createIcons();
}

tabs.history.addEventListener('click', () => {
    switchTab('history');
    renderHistoryPage();
});


//Last: 启动内容
function init() {
    switchTab("closet"); 
    renderBrandSelect();
    renderCloset();
}

export { init };
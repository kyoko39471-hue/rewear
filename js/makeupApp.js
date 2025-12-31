import {
    addDoc,
    getDocs,
    collection,
    doc,
    updateDoc,
    increment
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {db} from "./firebase.js";
import { 
    userId,
    showToast
} from "./main.js";

export function init() {
//1. switchTab - click tab，show page, tab changes color, hide other pages

    const app = document.getElementById('app-makeup');

    const tabs = {
        overview: app.querySelector('#makeup-tab-overview'),
        log: app.querySelector('#makeup-tab-log'),
        history: app.querySelector('#makeup-tab-history'),
        add: app.querySelector('#makeup-tab-add'),
    };

    const pages = {
        overview: app.querySelector('#makeup-page-overview'),
        log: app.querySelector('#makeup-page-log'),
        history: app.querySelector('#makeup-page-history'),
        add: app.querySelector('#makeup-page-add'),
    };

    //全局函数 1：switchTab
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

    //全局函数 2: getMakeupRef
    function getMakeupRef (){
        if (!userId) return null;
        return collection(db, `users/${userId}/makeup`);// 
    }

    //全局函数 3: escapeHTML
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

    //全局函数 4：CPW & color
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

    //全局函数 5：sort
    function sortMakeup(makeup) {
        return makeup.slice().sort((a, b) => {
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

    //page 1 Overview
    async function renderMakeupOverview() {
        const makeupRef = getMakeupRef();
        if (!makeupRef) return;   // <-- prevents future crashes
        const snap = await getDocs(makeupRef);

        const tbody = document.getElementById("makeup-table-body");
        // 1️⃣ Firestore → 普通数组
        const makeupItems = [];

        snap.forEach(docSnap => {
            makeupItems.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        // 2️⃣ 排序
        const sortedMakeup = sortMakeup(makeupItems);

        // 3️⃣ render
        let html = "";

        sortedMakeup.forEach(item => {
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
                </tr>`;
        });
        tbody.innerHTML = html;
    }

    //第4页：增加新化妆品

    const MakeupBrands = [
        "Chanel",
        "Clinique",
        "Ilia",
        "NARS",
        "Refy",
        "Uriage",
    ];

    const brand = app.querySelector('#makeup-brand-select');
    const addItemForm = app.querySelector('#makeup-add-item-form');

    function renderMakeupBrandSelect() {
    
        if (!brand) return;
        brand.innerHTML = '<option value="">-- 请选择品牌 --</option>';

        MakeupBrands.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b;
            opt.textContent = b;
            brand.appendChild(opt);
        });
    }

    const name = app.querySelector('#makeup-item-name');
    const type = app.querySelector('#makeup-item-type');
    const price = app.querySelector('#makeup-item-price');
    const timesWorn = app.querySelector('#makeup-item-times-worn');

    async function handleAddItem(e) {
        e.preventDefault();
        const newItem = {//
            brand: brand.value,
            type: type.value,
            name: name.value,
            price: Number(price.value),
            timesWorn: Number(timesWorn.value)
        };
        const makeupRef = getMakeupRef ();//
        await addDoc(makeupRef, newItem);//在数据列表里加入新数据
        showToast ("新Makeup已加入Shelf","success");
        addItemForm.reset();
        switchTab('overview');
        renderMakeupOverview();
    }

    addItemForm.addEventListener('submit', handleAddItem);

    //第2页
    const makeupLogWearList = app.querySelector('#makeup-log-wear-list');
    const makeupLogEmptyList = app.querySelector('#makeup-log-empty-list');
    const makeupSubmitLogWearBtn = app.querySelector('#makeup-submit-log-wear');

    //page 2 添加记录 1）定义常量 2）render第二页 3）点击tab时启动render 4) async function 5) eventListener

    async function renderLogPage() {
        const makeupRef = getMakeupRef();
        if (!makeupRef) return;

        const snap = await getDocs(makeupRef);

        makeupLogWearList.innerHTML = "";
        let hasItems = false;

        // ① Firestore → 普通数组
        const makeupItems = [];

        snap.forEach(docSnap => {
            makeupItems.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        if (makeupItems.length === 0) {
            makeupLogEmptyList.classList.remove('hidden');
            return;
        }

        hasItems = true;
        makeupLogEmptyList.classList.add('hidden');

        // ② 排序（完全复用）
        const sortedMakeup = sortMakeup(makeupItems);

        // ③ render
        sortedMakeup.forEach(item => {
            const CPW = calculateCPW(item.price, item.timesWorn);
            const CPWColor = getCPWColor(CPW);

            makeupLogWearList.innerHTML += `
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
            showToast("请至少选择一个商品", "error");
            return;
        }

        const itemIds = Array.from(checked).map(cb => cb.dataset.id);

        // ① 写入日志
        const logRef = collection(db, `users/${userId}/makeupLogs`);

        await addDoc(logRef, {
            date: dayjs().format("YYYY-MM-DD"),
            itemIds,
            createdAt: new Date()
        });

        // ② 同步更新每个产品的 timesWorn
        const makeupRef = getMakeupRef();

        const updatePromises = itemIds.map(itemId => {
            const itemRef = doc(makeupRef, itemId);
            return updateDoc(itemRef, {
                timesWorn: increment(1)
            });
        });

        await Promise.all(updatePromises);

        showToast("今日makeup已记录", "success");

        // ③ 切页 & 刷新
        switchTab('overview');
        renderLogPage();
    }

    makeupSubmitLogWearBtn.addEventListener('click', handleSubmitLogWear);

    //page 3 显示使用历史
    const historyList = app.querySelector('#makeup-history-list');
    const historyEmpty = app.querySelector('#makeup-history-empty');
    async function getMakeupMap() {
        const makeupRef = getMakeupRef();
        if (!makeupRef) return {};

        const snap = await getDocs(makeupRef);
        const map = {};

        snap.forEach(docSnap => {
            map[docSnap.id] = docSnap.data();
        });

        return map;
    }

    async function renderHistoryPage() {
        if (!userId) return;

        historyList.innerHTML = "";

        const historyRef = collection(db, `users/${userId}/makeupLogs`);
        const snap = await getDocs(historyRef);

        if (snap.empty) {
            historyEmpty.classList.remove('hidden');
            return;
        }

        historyEmpty.classList.add('hidden');

        const makeupMap = await getMakeupMap();

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
            const item = makeupMap[id];
            if (!item) {
                return `<span class="text-sm text-slate-400">（已删除的化妆品）</span>`;
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

    renderMakeupBrandSelect();
    renderMakeupOverview();

    // 默认页
    switchTab('overview');
}
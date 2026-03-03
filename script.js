// 管理者密碼（可在此修改）
const ADMIN_PASSWORD = 'admin123';

// 全域變數
let isAdmin = false;
let currentUser = null;
let orderCart = {};
let currentModalRestaurantId = null;

// 頁面載入
document.addEventListener('DOMContentLoaded', function() {
    initStorage();
    displayCurrentDate();
    setupEventListeners();
    checkAdminStatus();
    updateUI();
});

// 檢查管理者狀態
function checkAdminStatus() {
    isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        showAdminPanel();
    }
}

// 顯示當前日期
function displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    dateElement.textContent = today.toLocaleDateString('zh-TW', options);
}

// 設定事件監聽
function setupEventListeners() {
    // 管理者登入
    document.getElementById('loginBtn').addEventListener('click', adminLogin);
    document.getElementById('adminPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') adminLogin();
    });
    document.getElementById('logoutBtn').addEventListener('click', adminLogout);
    
    // 管理者控制按鈕
    document.getElementById('startVoteBtn').addEventListener('click', startVoting);
    document.getElementById('endVoteBtn').addEventListener('click', endVoting);
    document.getElementById('confirmShopBtn').addEventListener('click', confirmManualSelection);
    document.getElementById('openOrderBtn').addEventListener('click', openOrdering);
    document.getElementById('closeOrderBtn').addEventListener('click', closeOrdering);
    document.getElementById('resetBtn').addEventListener('click', resetSystem);
    
    // 訂單相關
    document.getElementById('submitOrderBtn').addEventListener('click', submitOrder);
    document.getElementById('cancelOrderBtn').addEventListener('click', cancelOrder);
    
    // 統計切換
    document.getElementById('toggleSummaryBtn').addEventListener('click', toggleSummary);
}

// 管理者登入
function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        sessionStorage.setItem('isAdmin', 'true');
        showAdminPanel();
        document.getElementById('adminPassword').value = '';
    } else {
        alert('密碼錯誤！');
    }
}

// 顯示管理者面板
function showAdminPanel() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    populateManualShopSelect();
}

// 管理者登出
function adminLogout() {
    isAdmin = false;
    sessionStorage.removeItem('isAdmin');
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
}

// 填充手動選擇店家下拉選單
function populateManualShopSelect() {
    const select = document.getElementById('manualShopSelect');
    select.innerHTML = '<option value="">-- 請選擇便當店 --</option>';
    restaurants.forEach(restaurant => {
        const option = document.createElement('option');
        option.value = restaurant.id;
        option.textContent = `${restaurant.name} (${restaurant.type})`;
        select.appendChild(option);
    });
}

// 更新UI
function updateUI() {
    const data = getData();
    const status = data.systemStatus;
    
    // 更新狀態顯示
    const statusText = {
        'idle': '尚未開始',
        'voting': '🗳️ 投票進行中',
        'selected': '✅ 已選定店家',
        'ordering': '🛒 訂購進行中',
        'closed': '⏰ 訂購已結束'
    };
    
    const statusElement = document.getElementById('systemStatus');
    if (statusElement) {
        statusElement.textContent = statusText[status];
    }
    
    if (isAdmin) {
        // 更新按鈕狀態
        document.getElementById('startVoteBtn').disabled = (status !== 'idle');
        document.getElementById('endVoteBtn').disabled = (status !== 'voting');
        document.getElementById('openOrderBtn').disabled = (status !== 'selected');
        document.getElementById('closeOrderBtn').disabled = (status !== 'ordering');
        
        // 顯示/隱藏手動選擇區
        document.getElementById('manualSelectSection').style.display = 
            (status === 'voting') ? 'block' : 'none';
    }
    
    // 顯示對應區塊
    document.getElementById('votingSection').style.display = (status === 'voting') ? 'block' : 'none';
    document.getElementById('selectedShopSection').style.display = (status === 'selected' || status === 'ordering' || status === 'closed') ? 'block' : 'none';
    document.getElementById('orderingSection').style.display = (status === 'ordering') ? 'block' : 'none';
    document.getElementById('summarySection').style.display = (status === 'ordering' || status === 'closed') ? 'block' : 'none';
    document.getElementById('closedSection').style.display = (status === 'closed') ? 'block' : 'none';
    
    // 根據狀態更新內容
    if (status === 'voting') {
        displayVoting();
    } else if (status === 'selected' || status === 'ordering' || status === 'closed') {
        displaySelectedShop();
    }
    
    if (status === 'ordering') {
        displayMenu();
        checkUserOrder();
    }
    
    if (status === 'ordering' || status === 'closed') {
        displayOrderSummary();
    }
}

// 開始投票
function startVoting() {
    const data = getData();
    data.systemStatus = 'voting';
    data.votes = {};
    saveData(data);
    updateUI();
}

// 顯示投票區
function displayVoting() {
    const voteGrid = document.getElementById('voteGrid');
    const data = getData();
    
    voteGrid.innerHTML = restaurants.map(restaurant => `
        <div class="vote-card" id="card-${restaurant.id}">
            <div class="view-menu-hint">點擊查看菜單</div>
            <div onclick="showMenuModal(${restaurant.id})">
                <h3>${restaurant.name}</h3>
                <p>類型：${restaurant.type}</p>
                <p>平均價格：NT$ ${restaurant.avgPrice}</p>
                <div class="vote-count-display" id="vote-${restaurant.id}">0 票</div>
            </div>
        </div>
    `).join('');
    
    updateVoteResults();
}

// 顯示菜單彈窗
function showMenuModal(restaurantId) {
    currentModalRestaurantId = restaurantId;
    const restaurant = restaurants.find(r => r.id === restaurantId);
    
    document.getElementById('modalShopName').textContent = restaurant.name;
    
    const menuContent = `
        <div class="modal-menu-grid">
            ${restaurant.menu.map(item => `
                <div class="modal-menu-item">
                    <h4>${item.name}</h4>
                    <div class="price">NT$ ${item.price}</div>
                    <div class="description">${item.description}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('modalMenuContent').innerHTML = menuContent;
    
    // 設定投票按鈕
    const voteBtn = document.getElementById('voteFromModalBtn');
    const data = getData();
    if (data.systemStatus === 'voting') {
        voteBtn.style.display = 'inline-block';
        voteBtn.onclick = () => {
            castVote(restaurantId);
            closeMenuModal();
        };
    } else {
        voteBtn.style.display = 'none';
    }
    
    document.getElementById('menuModal').style.display = 'block';
}

// 關閉菜單彈窗
function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
}

// 點擊彈窗外部關閉
window.onclick = function(event) {
    const modal = document.getElementById('menuModal');
    if (event.target === modal) {
        closeMenuModal();
    }
}

// 投票
function castVote(restaurantId) {
    const userName = prompt('請輸入您的姓名：');
    if (!userName) return;
    
    const data = getData();
    
    // 檢查是否已投票
    if (Object.values(data.votes).flat().includes(userName)) {
        alert('您已經投過票了！');
        return;
    }
    
    // 記錄投票
    if (!data.votes[restaurantId]) {
        data.votes[restaurantId] = [];
    }
    data.votes[restaurantId].push(userName);
    
    saveData(data);
    updateVoteResults();
    alert('投票成功！');
}

// 更新投票結果
function updateVoteResults() {
    const data = getData();
    const totalVotes = Object.values(data.votes).reduce((sum, voters) => sum + voters.length, 0);
    
    // 更新每個店家的票數
    restaurants.forEach(restaurant => {
        const votes = data.votes[restaurant.id] ? data.votes[restaurant.id].length : 0;
        const element = document.getElementById(`vote-${restaurant.id}`);
        if (element) {
            element.textContent = `${votes} 票`;
        }
    });
    
    // 顯示詳細結果
    const resultsDiv = document.getElementById('voteResults');
    if (totalVotes === 0) {
        resultsDiv.innerHTML = '<p>尚無投票</p>';
        return;
    }
    
    resultsDiv.innerHTML = restaurants.map(restaurant => {
        const votes = data.votes[restaurant.id] ? data.votes[restaurant.id].length : 0;
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        
        return `
            <div class="result-item">
                <strong>${restaurant.name}</strong>
                <div class="result-bar">
                    <div class="result-bar-fill" style="width: ${percentage}%">
                        ${votes} 票 (${percentage}%)
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 結束投票（自動選擇得票最高）
function endVoting() {
    const data = getData();
    
    // 找出得票最高的店家
    let maxVotes = 0;
    let selectedId = null;
    
    restaurants.forEach(restaurant => {
        const votes = data.votes[restaurant.id] ? data.votes[restaurant.id].length : 0;
        if (votes > maxVotes) {
            maxVotes = votes;
            selectedId = restaurant.id;
        }
    });
    
    if (!selectedId) {
        // 沒有投票，顯示手動選擇提示
        alert('目前沒有任何投票，請使用下方的手動選擇店家功能。');
        return;
    }
    
    data.selectedRestaurant = selectedId;
    data.systemStatus = 'selected';
    saveData(data);
    updateUI();
    
    const restaurant = restaurants.find(r => r.id === selectedId);
    alert(`已選定：${restaurant.name} (獲得 ${maxVotes} 票)`);
}

// 確認手動選擇
function confirmManualSelection() {
    const selectedId = parseInt(document.getElementById('manualShopSelect').value);
    
    if (!selectedId) {
        alert('請先選擇一家便當店！');
        return;
    }
    
    const restaurant = restaurants.find(r => r.id === selectedId);
    
    if (confirm(`確定選擇「${restaurant.name}」作為今日便當店嗎？`)) {
        const data = getData();
        data.selectedRestaurant = selectedId;
        data.systemStatus = 'selected';
        saveData(data);
        updateUI();
        
        alert(`已選定：${restaurant.name}`);
    }
}

// 顯示選定的店家
function displaySelectedShop() {
    const data = getData();
    const restaurant = restaurants.find(r => r.id === data.selectedRestaurant);
    
    if (restaurant) {
        document.getElementById('selectedShopName').textContent = restaurant.name;
        const votes = data.votes[restaurant.id] ? data.votes[restaurant.id].length : 0;
        
        if (votes > 0) {
            document.getElementById('finalVoteCount').textContent = `獲得 ${votes} 票`;
        } else {
            document.getElementById('finalVoteCount').textContent = '管理者指定';
        }
    }
}

// 開放訂購
function openOrdering() {
    const data = getData();
    data.systemStatus = 'ordering';
    data.orders = [];
    saveData(data);
    updateUI();
}

// 顯示菜單
function displayMenu() {
    const data = getData();
    const restaurant = restaurants.find(r => r.id === data.selectedRestaurant);
    
    if (!restaurant) return;
    
    const menuDisplay = document.getElementById('menuDisplay');
    menuDisplay.innerHTML = `
        <h3>📋 ${restaurant.name} 菜單</h3>
        <div class="menu-grid">
            ${restaurant.menu.map(item => `
                <div class="menu-item">
                    <h4>${item.name}</h4>
                    <div class="price">NT$ ${item.price}</div>
                    <div class="description">${item.description}</div>
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                        <span class="quantity-display" id="qty-${item.id}">0</span>
                        <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 改變數量
function changeQuantity(itemId, change) {
    const data = getData();
    const restaurant = restaurants.find(r => r.id === data.selectedRestaurant);
    const item = restaurant.menu.find(m => m.id === itemId);
    
    if (!orderCart[itemId]) {
        orderCart[itemId] = { item: item, quantity: 0 };
    }
    
    orderCart[itemId].quantity = Math.max(0, orderCart[itemId].quantity + change);
    
    document.getElementById(`qty-${itemId}`).textContent = orderCart[itemId].quantity;
    updateOrderDisplay();
}

// 更新訂單顯示
function updateOrderDisplay() {
    const orderItems = document.getElementById('orderItems');
    const items = Object.values(orderCart).filter(order => order.quantity > 0);
    
    if (items.length === 0) {
        orderItems.innerHTML = '<p style="text-align: center; color: #999;">尚未選擇餐點</p>';
        document.getElementById('totalAmount').textContent = 'NT$ 0';
        return;
    }
    
    let total = 0;
    orderItems.innerHTML = items.map(order => {
        const subtotal = order.item.price * order.quantity;
        total += subtotal;
        return `
            <div class="order-item">
                <span>${order.item.name} x ${order.quantity}</span>
                <span>NT$ ${subtotal}</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('totalAmount').textContent = `NT$ ${total}`;
}

// 檢查用戶是否已訂購
function checkUserOrder() {
    const userName = prompt('請輸入您的姓名以查看或建立訂單：');
    if (!userName) return;
    
    currentUser = userName;
    const data = getData();
    const existingOrder = data.orders.find(order => order.customerName === userName);
    
    if (existingOrder) {
        // 已有訂單，顯示取消按鈕
        document.getElementById('submitOrderBtn').style.display = 'none';
        document.getElementById('cancelOrderBtn').style.display = 'block';
        document.getElementById('customerName').value = userName;
        document.getElementById('customerName').disabled = true;
        
        // 顯示現有訂單
        alert(`您已經訂購過了！\n總金額：NT$ ${existingOrder.total}\n\n如需取消訂單，請點擊「取消我的訂單」按鈕。`);
    } else {
        // 新訂單
        document.getElementById('submitOrderBtn').style.display = 'block';
        document.getElementById('cancelOrderBtn').style.display = 'none';
        document.getElementById('customerName').value = userName;
        document.getElementById('customerName').disabled = false;
    }
}

// 送出訂單
function submitOrder() {
    const customerName = document.getElementById('customerName').value.trim();
    
    if (!customerName) {
        alert('請輸入您的姓名！');
        return;
    }
    
    const items = Object.values(orderCart).filter(order => order.quantity > 0);
    
    if (items.length === 0) {
        alert('請至少選擇一項餐點！');
        return;
    }
    
    const data = getData();
    
    // 檢查是否重複訂購
    if (data.orders.some(order => order.customerName === customerName)) {
        alert('您已經訂購過了！如需修改請先取消訂單。');
        return;
    }
    
    const order = {
        customerName: customerName,
        items: items.map(order => ({
            name: order.item.name,
            price: order.item.price,
            quantity: order.quantity,
            subtotal: order.item.price * order.quantity
        })),
        total: items.reduce((sum, order) => sum + (order.item.price * order.quantity), 0),
        timestamp: new Date().toLocaleString('zh-TW')
    };
    
    data.orders.push(order);
    saveData(data);
    
    // 清空購物車
    orderCart = {};
    document.getElementById('customerName').value = '';
    displayMenu();
    updateOrderDisplay();
    displayOrderSummary();
    
    alert(`訂單送出成功！\n總金額：NT$ ${order.total}`);
    
    // 切換按鈕
    document.getElementById('submitOrderBtn').style.display = 'none';
    document.getElementById('cancelOrderBtn').style.display = 'block';
}

// 取消訂單
function cancelOrder() {
    const customerName = document.getElementById('customerName').value.trim();
    
    if (!confirm(`確定要取消「${customerName}」的訂單嗎？`)) {
        return;
    }
    
    const data = getData();
    data.orders = data.orders.filter(order => order.customerName !== customerName);
    saveData(data);
    
    // 清空購物車和表單
    orderCart = {};
    document.getElementById('customerName').value = '';
    document.getElementById('customerName').disabled = false;
    displayMenu();
    updateOrderDisplay();
    displayOrderSummary();
    
    // 切換按鈕
    document.getElementById('submitOrderBtn').style.display = 'block';
    document.getElementById('cancelOrderBtn').style.display = 'none';
    
    alert('訂單已取消！');
}

// 顯示訂單統計
function displayOrderSummary() {
    const data = getData();
    const summaryDiv = document.getElementById('orderSummary');
    
    if (data.orders.length === 0) {
        summaryDiv.innerHTML = '<p style="text-align: center; color: #999;">尚無訂單</p>';
        return;
    }
    
    // 統計每項餐點的總數
    const itemStats = {};
    let totalAmount = 0;
    
    data.orders.forEach(order => {
        totalAmount += order.total;
        order.items.forEach(item => {
            if (!itemStats[item.name]) {
                itemStats[item.name] = { quantity: 0, price: item.price };
            }
            itemStats[item.name].quantity += item.quantity;
        });
    });
    
    summaryDiv.innerHTML = `
        <div class="summary-stats">
            <div class="stat-card">
                <div class="label">訂單總數</div>
                <div class="number">${data.orders.length}</div>
            </div>
            <div class="stat-card">
                <div class="label">總金額</div>
                <div class="number">NT$ ${totalAmount}</div>
            </div>
            <div class="stat-card">
                <div class="label">平均金額</div>
                <div class="number">NT$ ${Math.round(totalAmount / data.orders.length)}</div>
            </div>
        </div>
        
        <h3 style="margin-top: 30px;">餐點統計</h3>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>餐點名稱</th>
                    <th>單價</th>
                    <th>數量</th>
                    <th>小計</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(itemStats).map(([name, stat]) => `
                    <tr>
                        <td>${name}</td>
                        <td>NT$ ${stat.price}</td>
                        <td>${stat.quantity}</td>
                        <td>NT$ ${stat.price * stat.quantity}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h3 style="margin-top: 30px;">個人訂單</h3>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>姓名</th>
                    <th>餐點</th>
                    <th>金額</th>
                    <th>訂購時間</th>
                </tr>
            </thead>
            <tbody>
                ${data.orders.map(order => `
                    <tr>
                        <td>${order.customerName}</td>
                        <td>${order.items.map(item => `${item.name} x${item.quantity}`).join('<br>')}</td>
                        <td>NT$ ${order.total}</td>
                        <td>${order.timestamp}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// 切換統計顯示
function toggleSummary() {
    const summaryDiv = document.getElementById('orderSummary');
    summaryDiv.style.display = summaryDiv.style.display === 'none' ? 'block' : 'none';
}

// 結束訂購
function closeOrdering() {
    if (!confirm('確定要結束訂購嗎？結束後將無法再訂購。')) {
        return;
    }
    
    const data = getData();
    data.systemStatus = 'closed';
    saveData(data);
    updateUI();
}

// 重置系統
function resetSystem() {
    if (!confirm('確定要重置整個系統嗎？所有資料將被清除！')) {
        return;
    }
    
    localStorage.removeItem('lunchOrderData');
    initStorage();
    orderCart = {};
    updateUI();
    alert('系統已重置！');
}

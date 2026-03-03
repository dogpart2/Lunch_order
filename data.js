// 便當店資料
const restaurants = [
    {
        id: 1,
        name: "美味排骨便當",
        type: "台式便當",
        avgPrice: 80,
        menu: [
            { id: 101, name: "招牌排骨便當", price: 85, description: "炸排骨+三樣配菜+白飯" },
            { id: 102, name: "雞腿便當", price: 90, description: "香煎雞腿+三樣配菜+白飯" },
            { id: 103, name: "魚排便當", price: 85, description: "酥炸魚排+三樣配菜+白飯" },
            { id: 104, name: "控肉便當", price: 80, description: "滷控肉+三樣配菜+白飯" },
            { id: 105, name: "素食便當", price: 75, description: "素雞+四樣配菜+白飯" }
        ]
    },
    {
        id: 2,
        name: "健康輕食餐盒",
        type: "健康餐",
        avgPrice: 110,
        menu: [
            { id: 201, name: "舒肥雞胸餐", price: 120, description: "舒肥雞胸+生菜+地瓜+糙米飯" },
            { id: 202, name: "鮭魚餐盒", price: 130, description: "煎鮭魚+蔬菜+藜麥飯" },
            { id: 203, name: "牛肉餐盒", price: 135, description: "嫩煎牛肉+時蔬+五穀飯" },
            { id: 204, name: "豆腐餐盒", price: 100, description: "香煎豆腐+多樣蔬菜+糙米飯" },
            { id: 205, name: "海鮮餐盒", price: 140, description: "綜合海鮮+生菜+藜麥飯" }
        ]
    },
    {
        id: 3,
        name: "日式料理便當",
        type: "日式",
        avgPrice: 100,
        menu: [
            { id: 301, name: "照燒雞腿便當", price: 95, description: "照燒雞腿+日式配菜+白飯" },
            { id: 302, name: "豬排便當", price: 100, description: "炸豬排+高麗菜絲+白飯" },
            { id: 303, name: "鰻魚便當", price: 150, description: "蒲燒鰻魚+玉子燒+白飯" },
            { id: 304, name: "唐揚雞便當", price: 90, description: "日式炸雞+配菜+白飯" },
            { id: 305, name: "鮭魚便當", price: 110, description: "鹽烤鮭魚+配菜+白飯" }
        ]
    },
    {
        id: 4,
        name: "中式合菜便當",
        type: "中式",
        avgPrice: 85,
        menu: [
            { id: 401, name: "宮保雞丁便當", price: 85, description: "宮保雞丁+三樣配菜+白飯" },
            { id: 402, name: "糖醋排骨便當", price: 90, description: "糖醋排骨+三樣配菜+白飯" },
            { id: 403, name: "紅燒牛肉便當", price: 100, description: "紅燒牛肉+三樣配菜+白飯" },
            { id: 404, name: "三杯雞便當", price: 85, description: "三杯雞+三樣配菜+白飯" },
            { id: 405, name: "梅干扣肉便當", price: 90, description: "梅干扣肉+三樣配菜+白飯" }
        ]
    },
    {
        id: 5,
        name: "義式料理",
        type: "西式",
        avgPrice: 120,
        menu: [
            { id: 501, name: "奶油培根義大利麵", price: 120, description: "培根+奶油醬+麵包" },
            { id: 502, name: "番茄肉醬義大利麵", price: 110, description: "肉醬+番茄醬+麵包" },
            { id: 503, name: "青醬雞肉義大利麵", price: 125, description: "雞肉+青醬+麵包" },
            { id: 504, name: "海鮮義大利麵", price: 140, description: "綜合海鮮+白醬+麵包" },
            { id: 505, name: "千層肉醬焗烤", price: 130, description: "千層麵+起司+麵包" }
        ]
    }
];

// 初始化儲存資料（使用內存存儲）
const initStorage = () => {
    if (!localStorage.getItem('lunchOrderData')) {
        const initialData = {
            systemStatus: 'idle', // idle, voting, selected, ordering, closed
            selectedRestaurant: null,
            votes: {},
            orders: [],
            currentDate: new Date().toLocaleDateString('zh-TW')
        };
        localStorage.setItem('lunchOrderData', JSON.stringify(initialData));
    }
};

// 獲取資料
const getData = () => {
    return JSON.parse(localStorage.getItem('lunchOrderData'));
};

// 儲存資料
const saveData = (data) => {
    localStorage.setItem('lunchOrderData', JSON.stringify(data));
};
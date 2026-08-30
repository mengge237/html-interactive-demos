let elements;
const { PI, sin, cos, random } = Math;
const TAU = 2 * PI;
const range = (n, m = 0) =>
    Array(n)
        .fill(m)
        .map((i, j) => i + j);

const map = (value, sMin, sMax, dMin, dMax) => {
    return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
}

const polar = (ang, r = 1, [x = 0, y = 0] = []) => [
    x + r * cos(ang),
    y + r * sin(ang)
];

const container = d3.select("#container");

const setStyle = (el, attrs) =>
    Object.entries(attrs).reduce((acc, [key, val]) => acc.style(key, val), el);

const setAttrs = (el, attrs) =>
    Object.entries(attrs).reduce((acc, [key, val]) => acc.attr(key, val), el);

// 创建竖着的六边形坐标
const clipCoords = range(6).map((i) => {
    const ang = map(i, 0, 6, -PI/2, 3*PI/2); // 从顶部开始
    return polar(ang, 50);
});

const clipPathD = `M${[...clipCoords, clipCoords[0]]
    .map(([x, y]) => `${x},${y}`)
    .join(" L")}Z`;

const svgRoot = container.append("svg");
setAttrs(svgRoot, { width: "0", height: "0" });
const defs = svgRoot.append("defs");
const clipPath = defs.append("clipPath");
setAttrs(clipPath, { id: "clipPath" });
const clipPathPath = clipPath.append("path");
setAttrs(clipPathPath, { d: clipPathD });

class Atom {
    constructor(parent, color, isLiquid = false) {
        this.element = parent.append("circle");
        setAttrs(this.element, { cx: 0, cy: 0, r: isLiquid ? 6 : 4, fill: `${color}${isLiquid ? 'CC' : 'AA'}` });

        this.seed1 = random() * TAU;
        this.seed2 = random() * TAU;
        this.isLiquid = isLiquid;
    }

    updatePosition(t) {
        const cx = 25 * sin(this.seed1 + t*0.3);
        const cy = 25 * sin(this.seed2 + t*0.3);
        // 气体动画更慢，液体动画不同
        // const speed = this.isLiquid ? 0.02 : 0.01;
        // const range = this.isLiquid ? 20 : 25;
        // const cx = range * sin(this.seed1 + t * speed);
        // const cy = range * sin(this.seed2 + t * speed * 1.3);
        setAttrs(this.element, { cx, cy });
    }
}

class Element {
    constructor(gridX, gridY, name, number, phase, color, group = "main") {
        // 增加元素间距
        const elementWidth = 3.8;
        const elementHeight = 3.8;
        
        // 增加蜂巢间距
        const hexWidth = elementWidth * 1.0;
        const hexHeight = elementHeight * 1.0;
        
        // 精确居中计算 - 基于最大宽度
        const maxGridX = 18; // 最宽一行的gridX值
        const centerOffsetX = (maxGridX * hexWidth) / 6; // 居中偏移
        
        // 蜂巢状错位排列：奇数行向右偏移半个宽度
        const offsetX = (gridY % 2) * (hexWidth / 2);
        const x = gridX * hexWidth + offsetX + centerOffsetX; // 添加居中偏移
        const y = gridY * hexHeight * 0.9;
        
        this.root = container.append("div");
        setStyle(this.root, {
            width: `${elementWidth}vw`,
            height: `${elementHeight}vw`,
            transform: `translate(${x}vw,${y}vw)`,
            position: "absolute",
            "pointer-events": "all"
        });

        this.phase = phase;

        this.svg = this.root.append("svg");
        setAttrs(this.svg, { 
            viewBox: "0 0 100 100", 
            class: "svg",
            width: "100%",
            height: "100%"
        });
        this.group = this.svg.append("g");
        setAttrs(this.group, { transform: "translate(50,50)" });

        // 调整边框透明度（降低透明度），填充色大小和透明度
        this.border = this.group.append("path");
        setAttrs(this.border, { 
            d: clipPathD, 
            fill: "none", 
            stroke: `${color}44`, // 增加边框透明度
            "stroke-width": 3
        });

        // 减小填充色大小，增加透明度
        this.bottomFill = this.group.append("path");
        if (phase !== "Gas" && phase !== "Liquid") {
            this.bottomFill = this.group.append("path");
            setAttrs(this.bottomFill, { 
                d: "M-50,15 L50,15 L50,45 L-50,55 Z", // 减小填充区域
                fill: `${color}88`, // 增加填充透明度
                "clip-path": "url(#clipPath)"
            });
        }

        // 元素名称显示在中间
        this.nameText = this.group.append("text");
        setAttrs(this.nameText, {
            x: 0,
            y: 0,
            "text-anchor": "middle",
            "dominant-baseline": "middle",
            fill: `${color}66`,
            "font-size": "22px",
            "font-weight": "bold",
            "font-family": "Arial, sans-serif"
        }).text(name);
        // 存储原始名称和中文名
        this.originalName = name;
        this.chineseName = chineseNames[name] || name;

        // 原子序数显示在上方
        this.numberText = this.group.append("text");
        setAttrs(this.numberText, {
            x: 0,
            y: -28,
            "text-anchor": "middle",
            "dominant-baseline": "middle",
            fill: `${color}66`,
            "font-size": "11px",
            "font-family": "Arial, sans-serif"
        }).text(number);

        // 为气体和液体创建动画
        if (phase === "Gas") {
            this.atoms = [];
            const atomCount = phase === "Gas" ? 8 : 10; // 减少原子数量
            
            for (let i = 0; i < atomCount; i++) {
                this.atoms.push(new Atom(this.group, color, phase === "Liquid"));
            }
        }

        if (phase === "Liquid") {
        this.wave1 = this.group.append("path");
        setAttrs(this.wave1, {
            fill: `${color}88`,
            "clip-path": "url(#clipPath)"
        });
        this.wave2 = this.group.append("path");
        setAttrs(this.wave2, {
            fill: `${color}66`,
            "clip-path": "url(#clipPath)"
        });
        this.waveSeed1 = random() * TAU;
        this.waveSeed2 = random() * TAU;
    }

    // 添加悬停效果
    this.hoverTimer = null;
    this.root.on("mouseover", () => {
        setAttrs(this.border, { stroke: "#ffffff", "stroke-width": 4 });
        if (this.bottomFill) {
            setAttrs(this.bottomFill, { fill: `${color}BB` });
        }
        if (this.wave1) {
            setAttrs(this.wave1, { fill: `${color}BB` });
        }
        if (this.wave2) {
            setAttrs(this.wave2, { fill: `${color}99` });
        }
        // 鼠标悬停时也提高文字透明度
        setAttrs(this.nameText, { fill: `${color}BB` });
        setAttrs(this.numberText, { fill: `${color}BB` });
        setStyle(this.root, { "z-index": 1000 });
        
         // 立即显示中文名
        this.nameText.text(this.chineseName);
        setAttrs(this.nameText, { 
            "font-size": "18px" // 中文名可以稍微小一点
        });
        
        // 设置定时器，300ms后恢复原始名称
        this.hoverTimer = setTimeout(() => {
            this.nameText.text(this.originalName);
            setAttrs(this.nameText, { 
                "font-size": "22px" // 恢复原始字体大小
            });
        }, 2000);
    }).on("mouseout", () => {
        // 清除悬停计时器
        if (this.hoverTimer) {
            clearTimeout(this.hoverTimer);
            this.hoverTimer = null;
        }
        
        setAttrs(this.border, { stroke: `${color}DD`, "stroke-width": 3 });
        if (this.bottomFill) {
            setAttrs(this.bottomFill, { fill: `${color}88` });
        }
        if (this.wave1) {
            setAttrs(this.wave1, { fill: `${color}88` });
        }
        if (this.wave2) {
            setAttrs(this.wave2, { fill: `${color}66` });
        }
        // 鼠标离开时恢复文字透明度和原始名称
        this.nameText.text(this.originalName);
        setAttrs(this.nameText, { 
            fill: `${color}66`,
            "font-size": "22px" // 恢复原始字体大小
        });
        this.nameText.text(this.originalName);
        setAttrs(this.numberText, { fill: `${color}66` });
        setStyle(this.root, { "z-index": "auto" });
    });

    }

    update(t) {
        if (this.atoms) {
            this.atoms.forEach(atom => atom.updatePosition(t));
        }
        if (this.phase === "Liquid" && this.wave1 && this.wave2) {
            // 第一条波浪
            const points1 = range(20).map(i => {
                const x = map(i, 0, 19, -45, 45);
                const y = 12 + sin(this.waveSeed1 + t * 0.5 + x * 0.1) * 6;
                return [x, y];
            });
            
            const wavePath1 = `M${points1.map(([x, y]) => `${x},${y}`).join(" L")} L45,50 L-45,50 Z`;
            setAttrs(this.wave1, { d: wavePath1 });
            
            // 第二条波浪
            const points2 = range(20).map(i => {
                const x = map(i, 0, 19, -45, 45);
                const y = 8 + sin(this.waveSeed2 + t * 0.3 + x * 0.15) * 4;
                return [x, y];
            });
            
            const wavePath2 = `M${points2.map(([x, y]) => `${x},${y}`).join(" L")} L45,50 L-45,50 Z`;
            setAttrs(this.wave2, { d: wavePath2 });
        }
    }
}

//添加中文名映射
const chineseNames = {
    "H": "氢", "He": "氦", "Li": "锂", "Be": "铍", "B": "硼", "C": "碳", "N": "氮", "O": "氧", "F": "氟", "Ne": "氖",
    "Na": "钠", "Mg": "镁", "Al": "铝", "Si": "硅", "P": "磷", "S": "硫", "Cl": "氯", "Ar": "氩",
    "K": "钾", "Ca": "钙", "Sc": "钪", "Ti": "钛", "V": "钒", "Cr": "铬", "Mn": "锰", "Fe": "铁", "Co": "钴", "Ni": "镍",
    "Cu": "铜", "Zn": "锌", "Ga": "镓", "Ge": "锗", "As": "砷", "Se": "硒", "Br": "溴", "Kr": "氪",
    "Rb": "铷", "Sr": "锶", "Y": "钇", "Zr": "锆", "Nb": "铌", "Mo": "钼", "Tc": "锝", "Ru": "钌", "Rh": "铑", "Pd": "钯",
    "Ag": "银", "Cd": "镉", "In": "铟", "Sn": "锡", "Sb": "锑", "Te": "碲", "I": "碘", "Xe": "氙",
    "Cs": "铯", "Ba": "钡", "La": "镧", "Ce": "铈", "Pr": "镨", "Nd": "钕", "Pm": "钷", "Sm": "钐", "Eu": "铕", "Gd": "钆",
    "Tb": "铽", "Dy": "镝", "Ho": "钬", "Er": "铒", "Tm": "铥", "Yb": "镱", "Lu": "镥",
    "Hf": "铪", "Ta": "钽", "W": "钨", "Re": "铼", "Os": "锇", "Ir": "铱", "Pt": "铂", "Au": "金", "Hg": "汞",
    "Tl": "铊", "Pb": "铅", "Bi": "铋", "Po": "钋", "At": "砹", "Rn": "氡",
    "Fr": "钫", "Ra": "镭", "Ac": "锕", "Th": "钍", "Pa": "镤", "U": "铀", "Np": "镎", "Pu": "钚", "Am": "镅", "Cm": "锔",
    "Bk": "锫", "Cf": "锎", "Es": "锿", "Fm": "镄", "Md": "钔", "No": "锘", "Lr": "铹",
    "Rf": "鑪", "Db": "𨧀", "Sg": "𨭎", "Bh": "𨨏", "Hs": "𨭆", "Mt": "䥑", "Ds": "鐽", "Rg": "錀", "Cn": "鎶",
    "Nh": "鉨", "Fl": "鈇", "Mc": "镆", "Lv": "鉝", "Ts": "石田", "Og": "气奥",
    "Une": "一一九"
};

// 颜色定义按照从左往右的渐变规律
const colors = {
    alkali: "#f05454",        // 红色 - 碱金属
    alkalineEarth: "#ffa36c", // 橙色 - 碱土金属
    transition1: "#fcf876",   // 黄色 - Sc,Y,Ti,Zr等
    otherMetals: "#c0e218",   // 绿色 - Al,Ga,In,Sn等
    metalloid: "#66CDAA",     // 海蓝宝石色 - 类金属
    nobleGas: "#bc6ff1",      // 紫色 - 稀有气体
    halogen: "#0066cc",       // 深蓝色 - 卤素
    lanthanide: "#9b87f5",    // 浅紫色 - 镧系
    actinide: "#5F9EA0",      // cadetblue色 - 锕系
    transition2: "#D7DBDD",    // 灰色 - 后期过渡金属
    carbonGroup: "#888888"    // 新增：C,P,S,Se的灰色
};

// 完整的元素周期表数据
const elementsData = [
    // 第一周期
    { gridX: 0, gridY: 0, name: "H", number: 1, phase: "Gas", color: colors.halogen },
    { gridX: 17, gridY: 0, name: "He", number: 2, phase: "Gas", color: colors.nobleGas },
    
    // 第二周期
    { gridX: 0, gridY: 1, name: "Li", number: 3, phase: "Solid", color: colors.alkali },
    { gridX: 1, gridY: 1, name: "Be", number: 4, phase: "Solid", color: colors.alkalineEarth },
    { gridX: 12, gridY: 1, name: "B", number: 5, phase: "Solid", color: colors.metalloid },
    { gridX: 13, gridY: 1, name: "C", number: 6, phase: "Solid", color: colors.carbonGroup },
    { gridX: 14, gridY: 1, name: "N", number: 7, phase: "Gas", color: colors.halogen },
    { gridX: 15, gridY: 1, name: "O", number: 8, phase: "Gas", color: colors.halogen },
    { gridX: 16, gridY: 1, name: "F", number: 9, phase: "Gas", color: colors.halogen },
    { gridX: 17, gridY: 1, name: "Ne", number: 10, phase: "Gas", color: colors.nobleGas },
    
    // 第三周期
    { gridX: 0, gridY: 2, name: "Na", number: 11, phase: "Solid", color: colors.alkali },
    { gridX: 1, gridY: 2, name: "Mg", number: 12, phase: "Solid", color: colors.alkalineEarth },
    { gridX: 12, gridY: 2, name: "Al", number: 13, phase: "Solid", color: colors.otherMetals },
    { gridX: 13, gridY: 2, name: "Si", number: 14, phase: "Solid", color: colors.metalloid },
    { gridX: 14, gridY: 2, name: "P", number: 15, phase: "Solid", color: colors.carbonGroup },
    { gridX: 15, gridY: 2, name: "S", number: 16, phase: "Solid", color: colors.carbonGroup },
    { gridX: 16, gridY: 2, name: "Cl", number: 17, phase: "Gas", color: colors.halogen },
    { gridX: 17, gridY: 2, name: "Ar", number: 18, phase: "Gas", color: colors.nobleGas },
    
    // 第四周期
    { gridX: 0, gridY: 3, name: "K", number: 19, phase: "Solid", color: colors.alkali },
    { gridX: 1, gridY: 3, name: "Ca", number: 20, phase: "Solid", color: colors.alkalineEarth },
    { gridX: 2, gridY: 3, name: "Sc", number: 21, phase: "Solid", color: colors.transition1 },
    { gridX: 3, gridY: 3, name: "Ti", number: 22, phase: "Solid", color: colors.transition1 },
    { gridX: 4, gridY: 3, name: "V", number: 23, phase: "Solid", color: colors.transition1 },
    { gridX: 5, gridY: 3, name: "Cr", number: 24, phase: "Solid", color: colors.transition1 },
    { gridX: 6, gridY: 3, name: "Mn", number: 25, phase: "Solid", color: colors.transition1 },
    { gridX: 7, gridY: 3, name: "Fe", number: 26, phase: "Solid", color: colors.transition1 },
    { gridX: 8, gridY: 3, name: "Co", number: 27, phase: "Solid", color: colors.transition1 },
    { gridX: 9, gridY: 3, name: "Ni", number: 28, phase: "Solid", color: colors.transition1 },
    { gridX: 10, gridY: 3, name: "Cu", number: 29, phase: "Solid", color: colors.transition1 },
    { gridX: 11, gridY: 3, name: "Zn", number: 30, phase: "Solid", color: colors.transition1 },
    { gridX: 12, gridY: 3, name: "Ga", number: 31, phase: "Solid", color: colors.otherMetals },
    { gridX: 13, gridY: 3, name: "Ge", number: 32, phase: "Solid", color: colors.metalloid },
    { gridX: 14, gridY: 3, name: "As", number: 33, phase: "Solid", color: colors.metalloid },
    { gridX: 15, gridY: 3, name: "Se", number: 34, phase: "Solid", color: colors.carbonGroup },
    { gridX: 16, gridY: 3, name: "Br", number: 35, phase: "Liquid", color: colors.halogen },
    { gridX: 17, gridY: 3, name: "Kr", number: 36, phase: "Gas", color: colors.nobleGas },
    
    // 第五周期
    { gridX: 0, gridY: 4, name: "Rb", number: 37, phase: "Solid", color: colors.alkali },
    { gridX: 1, gridY: 4, name: "Sr", number: 38, phase: "Solid", color: colors.alkalineEarth },
    { gridX: 2, gridY: 4, name: "Y", number: 39, phase: "Solid", color: colors.transition1 },
    { gridX: 3, gridY: 4, name: "Zr", number: 40, phase: "Solid", color: colors.transition1 },
    { gridX: 4, gridY: 4, name: "Nb", number: 41, phase: "Solid", color: colors.transition1 },
    { gridX: 5, gridY: 4, name: "Mo", number: 42, phase: "Solid", color: colors.transition1 },
    { gridX: 6, gridY: 4, name: "Tc", number: 43, phase: "Solid", color: colors.transition1 },
    { gridX: 7, gridY: 4, name: "Ru", number: 44, phase: "Solid", color: colors.transition1 },
    { gridX: 8, gridY: 4, name: "Rh", number: 45, phase: "Solid", color: colors.transition1 },
    { gridX: 9, gridY: 4, name: "Pd", number: 46, phase: "Solid", color: colors.transition1 },
    { gridX: 10, gridY: 4, name: "Ag", number: 47, phase: "Solid", color: colors.transition1 },
    { gridX: 11, gridY: 4, name: "Cd", number: 48, phase: "Solid", color: colors.transition1 },
    { gridX: 12, gridY: 4, name: "In", number: 49, phase: "Solid", color: colors.otherMetals },
    { gridX: 13, gridY: 4, name: "Sn", number: 50, phase: "Solid", color: colors.otherMetals },
    { gridX: 14, gridY: 4, name: "Sb", number: 51, phase: "Solid", color: colors.metalloid },
    { gridX: 15, gridY: 4, name: "Te", number: 52, phase: "Solid", color: colors.metalloid },
    { gridX: 16, gridY: 4, name: "I", number: 53, phase: "Solid", color: colors.halogen },
    { gridX: 17, gridY: 4, name: "Xe", number: 54, phase: "Gas", color: colors.nobleGas },
    
    // 第六周期
    { gridX: 0, gridY: 5, name: "Cs", number: 55, phase: "Solid", color: colors.alkali },
    { gridX: 1, gridY: 5, name: "Ba", number: 56, phase: "Solid", color: colors.alkalineEarth },
    
    { gridX: 3, gridY: 5, name: "Hf", number: 72, phase: "Solid", color: colors.transition1 },
    { gridX: 4, gridY: 5, name: "Ta", number: 73, phase: "Solid", color: colors.transition1 },
    { gridX: 5, gridY: 5, name: "W", number: 74, phase: "Solid", color: colors.transition1 },
    { gridX: 6, gridY: 5, name: "Re", number: 75, phase: "Solid", color: colors.transition1 },
    { gridX: 7, gridY: 5, name: "Os", number: 76, phase: "Solid", color: colors.transition1 },
    { gridX: 8, gridY: 5, name: "Ir", number: 77, phase: "Solid", color: colors.transition1 },
    { gridX: 9, gridY: 5, name: "Pt", number: 78, phase: "Solid", color: colors.transition1 },
    { gridX: 10, gridY: 5, name: "Au", number: 79, phase: "Solid", color: colors.transition1 },
    { gridX: 11, gridY: 5, name: "Hg", number: 80, phase: "Liquid", color: colors.transition1 },
    { gridX: 12, gridY: 5, name: "Tl", number: 81, phase: "Solid", color: colors.otherMetals },
    { gridX: 13, gridY: 5, name: "Pb", number: 82, phase: "Solid", color: colors.otherMetals },
    { gridX: 14, gridY: 5, name: "Bi", number: 83, phase: "Solid", color: colors.otherMetals },
    { gridX: 15, gridY: 5, name: "Po", number: 84, phase: "Solid", color: colors.otherMetals },
    { gridX: 16, gridY: 5, name: "At", number: 85, phase: "Solid", color: colors.metalloid },
    { gridX: 17, gridY: 5, name: "Rn", number: 86, phase: "Gas", color: colors.nobleGas },
    
    // 第七周期
    { gridX: 0, gridY: 6, name: "Fr", number: 87, phase: "Solid", color: colors.alkali },
    { gridX: 1, gridY: 6, name: "Ra", number: 88, phase: "Solid", color: colors.alkalineEarth },
    
    { gridX: 3, gridY: 6, name: "Rf", number: 104, phase: "Solid", color: colors.transition1 },
    { gridX: 4, gridY: 6, name: "Db", number: 105, phase: "Solid", color: colors.transition1 },
    { gridX: 5, gridY: 6, name: "Sg", number: 106, phase: "Solid", color: colors.transition1 },
    { gridX: 6, gridY: 6, name: "Bh", number: 107, phase: "Solid", color: colors.transition1 },
    { gridX: 7, gridY: 6, name: "Hs", number: 108, phase: "Solid", color: colors.transition1 },
    { gridX: 8, gridY: 6, name: "Mt", number: 109, phase: "Solid", color: colors.transition2 },
    { gridX: 9, gridY: 6, name: "Ds", number: 110, phase: "Solid", color: colors.transition2 },
    { gridX: 10, gridY: 6, name: "Rg", number: 111, phase: "Solid", color: colors.transition2 },
    { gridX: 11, gridY: 6, name: "Cn", number: 112, phase: "Gas", color: colors.transition1 },
    { gridX: 12, gridY: 6, name: "Nh", number: 113, phase: "Solid", color: colors.transition2 },
    { gridX: 13, gridY: 6, name: "Fl", number: 114, phase: "Solid", color: colors.otherMetals },
    { gridX: 14, gridY: 6, name: "Mc", number: 115, phase: "Solid", color: colors.transition2 },
    { gridX: 15, gridY: 6, name: "Lv", number: 116, phase: "Solid", color: colors.transition2 },
    { gridX: 16, gridY: 6, name: "Ts", number: 117, phase: "Solid", color: colors.transition2 },
    { gridX: 17, gridY: 6, name: "Og", number: 118, phase: "Gas", color: colors.transition2 },
    
    { gridX: 0, gridY: 7, name: "Une", number: 119, phase: "Solid", color: colors.transition2 },
    // 镧系元素
    { gridX: 2, gridY: 8, name: "La", number: 57, phase: "Solid", color: colors.lanthanide },
    { gridX: 3, gridY: 8, name: "Ce", number: 58, phase: "Solid", color: colors.lanthanide },
    { gridX: 4, gridY: 8, name: "Pr", number: 59, phase: "Solid", color: colors.lanthanide },
    { gridX: 5, gridY: 8, name: "Nd", number: 60, phase: "Solid", color: colors.lanthanide },
    { gridX: 6, gridY: 8, name: "Pm", number: 61, phase: "Solid", color: colors.lanthanide },
    { gridX: 7, gridY: 8, name: "Sm", number: 62, phase: "Solid", color: colors.lanthanide },
    { gridX: 8, gridY: 8, name: "Eu", number: 63, phase: "Solid", color: colors.lanthanide },
    { gridX: 9, gridY: 8, name: "Gd", number: 64, phase: "Solid", color: colors.lanthanide },
    { gridX: 10, gridY: 8, name: "Tb", number: 65, phase: "Solid", color: colors.lanthanide },
    { gridX: 11, gridY: 8, name: "Dy", number: 66, phase: "Solid", color: colors.lanthanide },
    { gridX: 12, gridY: 8, name: "Ho", number: 67, phase: "Solid", color: colors.lanthanide },
    { gridX: 13, gridY: 8, name: "Er", number: 68, phase: "Solid", color: colors.lanthanide },
    { gridX: 14, gridY: 8, name: "Tm", number: 69, phase: "Solid", color: colors.lanthanide },
    { gridX: 15, gridY: 8, name: "Yb", number: 70, phase: "Solid", color: colors.lanthanide },
    { gridX: 16, gridY: 8, name: "Lu", number: 71, phase: "Solid", color: colors.lanthanide },
    
    // 锕系元素
    { gridX: 2, gridY: 9, name: "Ac", number: 89, phase: "Solid", color: colors.actinide },
    { gridX: 3, gridY: 9, name: "Th", number: 90, phase: "Solid", color: colors.actinide },
    { gridX: 4, gridY: 9, name: "Pa", number: 91, phase: "Solid", color: colors.actinide },
    { gridX: 5, gridY: 9, name: "U", number: 92, phase: "Solid", color: colors.actinide },
    { gridX: 6, gridY: 9, name: "Np", number: 93, phase: "Solid", color: colors.actinide },
    { gridX: 7, gridY: 9, name: "Pu", number: 94, phase: "Solid", color: colors.actinide },
    { gridX: 8, gridY: 9, name: "Am", number: 95, phase: "Solid", color: colors.actinide },
    { gridX: 9, gridY: 9, name: "Cm", number: 96, phase: "Solid", color: colors.actinide },
    { gridX: 10, gridY: 9, name: "Bk", number: 97, phase: "Solid", color: colors.actinide },
    { gridX: 11, gridY: 9, name: "Cf", number: 98, phase: "Solid", color: colors.actinide },
    { gridX: 12, gridY: 9, name: "Es", number: 99, phase: "Solid", color: colors.actinide },
    { gridX: 13, gridY: 9, name: "Fm", number: 100, phase: "Solid", color: colors.actinide },
    { gridX: 14, gridY: 9, name: "Md", number: 101, phase: "Solid", color: colors.actinide },
    { gridX: 15, gridY: 9, name: "No", number: 102, phase: "Solid", color: colors.actinide },
    { gridX: 16, gridY: 9, name: "Lr", number: 103, phase: "Solid", color: colors.actinide }
];

// 初始化所有元素
elements = elementsData.map(data => 
    new Element(data.gridX, data.gridY, data.name, data.number, data.phase, data.color)
);

// 动画循环
let time = 0;
function animate() {
    time += 0.05; // 减慢动画速度
    elements.forEach(element => {
        if (element.update) {
            element.update(time);
        }
    });
    requestAnimationFrame(animate);
}

animate();
// swiper js库, 轮播图
const subSwiper = new Swiper(".sub-swiper", {
    allowTouchMove: false, // 禁止触摸滑动
    loop: true, // 循环模式选项
    effect: "fade", // 切换动画
    fadeEffect:{
        crossFade: true // 开启淡入淡出
    },
});

const mainSwiper = new Swiper(".main-swiper", {
    effect: "cards", // 卡片切换效果
    grabCursor: true, // 鼠标手型
    initialSlide: 2, // 初始显示第3张
    loop: true, // 循环模式选项
    mousewheel: {
        invert: false,
    },//鼠标滑动切换
    pagination: {
        el: ".swiper-pagination",
    },
    autoplay: {
        delay: 3000,    //间隔3s
        disableOnInteraction: false,//操作后停止自动播放
    },
    thumbs:{
        swiper: subSwiper,
    }
});
//通过类名获取所有元素
const coloritems = document.querySelectorAll('.tag');
//定义颜色组
const colors = ["#f35a5a","#f89e37","#3a77fa","#27c263"];
//遍历所有元素
coloritems.forEach((element, index) => {
    //设置背景颜色
    const colorindex = index % colors.length; //循环使用颜色
    element.style.backgroundColor = colors[colorindex];
});
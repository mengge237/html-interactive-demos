var duration = 999 * 100000;//动画持续时间
var animationEnd = Date.now() + duration;
var skew = 1;
var scalar = 2;

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

(function frame(){
    var timeLeft = animationEnd - Date.now();
    var ticks = Math.max(200, 500 * (timeLeft / duration));
    skew = Math.max(0.8, skew - 0.001);
    confetti({
        particleCount: 1,//雪花数量
        startVelocity: 5,//开始的速度
        ticks: 50,//移动次数
        decay: 0.5,//减速的速度
        origin:{ //飘落位置
            x: Math.random(),
            y: (Math.random() * skew) - 0.2
        },
        colors:['#ffffff'],//定义颜色
        shapes:['circle'],//定义形状
        gravity:0.5,
        scalar: randomInRange(0.4, 1),//大小
        drift: randomInRange(-0.4, 0.8)//飘落的距离
    });
    if (timeLeft > 0){
        requestAnimationFrame(frame);
    }
}());
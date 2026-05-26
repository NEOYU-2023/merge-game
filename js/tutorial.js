var Tutorial = (function() {
    var steps = [
        {
            icon: '👋',
            title: '欢迎来到合成消除',
            desc: '一款简单有趣的数字合成游戏，\n滑动屏幕即可开始挑战！'
        },
        {
            icon: '👆',
            title: '滑动移动',
            desc: '上下左右滑动屏幕，\n所有数字会沿滑动方向移动到边界。'
        },
        {
            icon: '🔢',
            title: '合成升级',
            desc: '相同数字碰撞会合成为更高数字：\n1+1=2, 2+2=3, 3+3=4...\n合成后的数字需要再次滑动才能继续合并。'
        },
        {
            icon: '💥',
            title: '消除规则',
            desc: '合成10后自动消除，得100分！\n特殊消除：1+9, 2+8, 3+7, 4+6\n滑动方向碰撞即可消除！'
        },
        {
            icon: '🎯',
            title: '闯关目标',
            desc: '在有限步数内达到目标分数即可通关，\n合理规划每一步，挑战更高星级！'
        }
    ];

    var endlessSteps = [
        {
            icon: '♾️',
            title: '无尽模式',
            desc: '没有步数限制，没有目标分数，\n一直玩到棋盘满无法移动为止！'
        },
        {
            icon: '🔥',
            title: '高阶数字挑战',
            desc: '每次滑动后，棋盘会额外刷出\n4、5、6 的中等数字！\n需要更多策略来合成消除。'
        },
        {
            icon: '🏆',
            title: '每日排行',
            desc: '每次游戏结束自动记录分数，\n按当天积分排名，\n挑战无尽模式最高分吧！'
        }
    ];

    var currentStep = 0;
    var currentSteps = [];
    var overlay = null;
    var onDone = null;

    function show(callback) {
        if (Storage.isTutorialDone()) {
            if (callback) callback();
            return;
        }
        onDone = callback;
        currentSteps = steps;
        currentStep = 0;
        overlay = document.getElementById('tutorialOverlay');
        renderStep();
        overlay.classList.add('show');
    }

    function showEndless(callback) {
        if (Storage.isTutorialEndlessDone()) {
            if (callback) callback();
            return;
        }
        onDone = callback;
        currentSteps = endlessSteps;
        currentStep = 0;
        overlay = document.getElementById('tutorialOverlay');
        renderStep();
        overlay.classList.add('show');
    }

    function renderStep() {
        var content = document.getElementById('tutorialContent');
        var step = currentSteps[currentStep];
        var dotsHtml = '';
        for (var i = 0; i < currentSteps.length; i++) {
            dotsHtml += '<div class="tutorial-dot' + (i === currentStep ? ' active' : '') + '"></div>';
        }
        content.innerHTML =
            '<div class="tutorial-step-icon">' + step.icon + '</div>' +
            '<div class="tutorial-title">' + step.title + '</div>' +
            '<div class="tutorial-desc">' + step.desc.replace(/\n/g, '<br>') + '</div>' +
            '<div class="tutorial-dots">' + dotsHtml + '</div>' +
            '<div class="modal-btn-row">' +
                (currentStep > 0 ? '<button class="btn btn-outline btn-sm" id="tutPrev" style="color:#667eea;border-color:#667eea;">上一步</button>' : '') +
                '<button class="btn btn-primary-dark btn-sm" id="tutNext">' +
                    (currentStep === currentSteps.length - 1 ? '开始游戏 ▶' : '下一步 →') +
                '</button>' +
            '</div>';

        var prevBtn = document.getElementById('tutPrev');
        var nextBtn = document.getElementById('tutNext');
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                Audio.playClick();
                currentStep--;
                renderStep();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                Audio.playClick();
                if (currentStep < currentSteps.length - 1) {
                    currentStep++;
                    renderStep();
                } else {
                    close();
                }
            });
        }
    }

    function close() {
        if (overlay) {
            overlay.classList.remove('show');
        }
        if (currentSteps === endlessSteps) {
            Storage.setTutorialEndlessDone(true);
        } else {
            Storage.setTutorialDone(true);
        }
        if (onDone) onDone();
    }

    function reset() {
        Storage.setTutorialDone(false);
    }

    return {
        show: show,
        showEndless: showEndless,
        close: close,
        reset: reset
    };
})();

var Levels = (function() {
    var baseLevels = [
        { id: 1, name: '初识合成', gridSize: 4, targetScore: 300, maxMoves: 65, initialTiles: 2, spawnValues: [1, 1, 1, 2], difficulty: 'easy' },
        { id: 2, name: '小试牛刀', gridSize: 4, targetScore: 500, maxMoves: 60, initialTiles: 3, spawnValues: [1, 1, 1, 2], difficulty: 'easy' },
        { id: 3, name: '渐入佳境', gridSize: 4, targetScore: 800, maxMoves: 60, initialTiles: 3, spawnValues: [1, 1, 2, 2], difficulty: 'easy' },
        { id: 4, name: '步步为营', gridSize: 4, targetScore: 1100, maxMoves: 60, initialTiles: 4, spawnValues: [1, 1, 2, 2], difficulty: 'normal' },
        { id: 5, name: '消除大师', gridSize: 4, targetScore: 1400, maxMoves: 58, initialTiles: 4, spawnValues: [1, 1, 2, 2, 3], difficulty: 'normal' },
        { id: 6, name: '数字风暴', gridSize: 4, targetScore: 1700, maxMoves: 55, initialTiles: 5, spawnValues: [1, 2, 2, 3], difficulty: 'normal' }
    ];

    var normalNames = [
        '策略对决', '高阶挑战', '极限合成', '突破重围',
        '乘风破浪', '势不可挡', '勇攀高峰', '所向披靡',
        '一往无前', '锐不可当', '开天辟地', '百战百胜'
    ];

    var bossNames = [
        '终极消除', '传奇之路', '巅峰王者', '逆风翻盘',
        '绝地反击', '凤凰涅槃', '登峰造极', '傲视群雄',
        '横扫千军', '王者归来', '至尊传奇', '独步天下'
    ];

    function generateLevel(id) {
        if (id <= baseLevels.length) {
            return baseLevels[id - 1];
        }

        var stage = id - baseLevels.length;
        var posInCycle = (stage - 1) % 6;
        var cycle = Math.floor((stage - 1) / 6);
        var isBoss = (posInCycle === 3 || posInCycle === 5);

        var gridSize = 4 + (stage >= 7 ? 1 : 0);

        var avgPtPerMove = gridSize === 4 ? 28 : 32;

        var baseMoves;
        if (isBoss) {
            baseMoves = Math.max(25, 32 - cycle);
        } else {
            baseMoves = Math.max(30, 38 - cycle);
        }

        var revivesNeeded = isBoss ? 2 : 1;
        var efficiency = 0.62 - cycle * 0.01;
        efficiency = Math.max(efficiency, 0.48);

        var totalMoves = baseMoves * (revivesNeeded + 1);
        var targetScore = Math.round(totalMoves * avgPtPerMove * efficiency / 50) * 50;

        var initialTiles = Math.min(4 + cycle, gridSize * gridSize - 4);

        var spawnMax = Math.min(2 + Math.floor(cycle / 2), 4);
        var spawnValues = [];
        for (var v = 1; v <= spawnMax; v++) {
            var count = Math.max(1, spawnMax - v + 1);
            for (var j = 0; j < count; j++) {
                spawnValues.push(v);
            }
        }

        var difficulty = isBoss ? 'expert' : 'hard';
        var nameIdx = cycle % normalNames.length;
        var name = isBoss
            ? bossNames[nameIdx] + (cycle >= normalNames.length ? ' ×' + (cycle + 1) : '')
            : normalNames[nameIdx] + (cycle >= normalNames.length ? ' ×' + (cycle + 1) : '');

        return {
            id: id,
            name: name,
            gridSize: gridSize,
            targetScore: targetScore,
            maxMoves: baseMoves,
            initialTiles: initialTiles,
            spawnValues: spawnValues,
            difficulty: difficulty
        };
    }

    var cache = {};

    function getAll() {
        var passedCount = Storage.getPassedLevelsCount();
        var total = Math.max(12, passedCount + 5);
        var result = [];
        for (var i = 1; i <= total; i++) {
            result.push(getById(i));
        }
        return result;
    }

    function getById(id) {
        if (id <= baseLevels.length) {
            return baseLevels[id - 1];
        }
        if (cache[id]) return cache[id];
        var level = generateLevel(id);
        cache[id] = level;
        return level;
    }

    function isUnlocked(levelId) {
        if (levelId === 1) return true;
        var prevData = Storage.getLevelData(levelId - 1);
        return prevData && prevData.passed;
    }

    function getEndlessConfig() {
        return {
            id: 'endless',
            name: '无尽模式',
            gridSize: 4,
            targetScore: 999999,
            maxMoves: 999999,
            initialTiles: 3,
            spawnValues: [1, 1, 1, 2, 2],
            difficulty: 'endless',
            endless: true
        };
    }

    function isEndless(id) {
        return id === 'endless';
    }

    function getDifficultyLabel(diff) {
        var map = {
            easy: '简单',
            normal: '普通',
            hard: '困难',
            expert: '专家',
            endless: '无尽'
        };
        return map[diff] || diff;
    }

    function getDifficultyColor(diff) {
        var map = {
            easy: '#48bb78',
            normal: '#667eea',
            hard: '#f6ad55',
            expert: '#fc8181',
            endless: '#f093fb'
        };
        return map[diff] || '#667eea';
    }

    function calculateStars(levelId, score) {
        var level = getById(levelId);
        if (!level) return 0;
        var target = level.targetScore;
        if (score >= target * 1.8) return 3;
        if (score >= target * 1.3) return 2;
        if (score >= target) return 1;
        return 0;
    }

    return {
        getAll: getAll,
        getById: getById,
        isUnlocked: isUnlocked,
        getEndlessConfig: getEndlessConfig,
        isEndless: isEndless,
        getDifficultyLabel: getDifficultyLabel,
        getDifficultyColor: getDifficultyColor,
        calculateStars: calculateStars
    };
})();

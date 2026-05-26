var Storage = (function() {
    var KEYS = {
        HIGH_SCORE: 'mg_high_score',
        TOTAL_GAMES: 'mg_total_games',
        TOTAL_TIME: 'mg_total_time',
        MAX_MERGE: 'mg_max_merge',
        LEVELS_DATA: 'mg_levels_data',
        SETTINGS: 'mg_settings',
        TUTORIAL_DONE: 'mg_tutorial_done',
        TUTORIAL_ENDLESS_DONE: 'mg_tutorial_endless',
        CURRENT_LEVEL: 'mg_current_level',
        RANKING: 'mg_ranking',
        GAME_STATE: 'mg_game_state',
        ENDLESS_HIGH_SCORE: 'mg_endless_high',
        ENDLESS_DAILY: 'mg_endless_daily'
    };

    function get(key) {
        try {
            var data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    }

    function remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {}
    }

    function getDefaults() {
        return {
            highScore: 0,
            totalGames: 0,
            totalTime: 0,
            maxMerge: 0,
            levelsData: {},
            settings: {
                sound: true,
                music: true,
                animation: true
            },
            tutorialDone: false,
            currentLevel: 1,
            ranking: [],
            gameState: null
        };
    }

    function getHighScore() {
        return get(KEYS.HIGH_SCORE) || 0;
    }

    function setHighScore(score) {
        if (score > getHighScore()) {
            set(KEYS.HIGH_SCORE, score);
            return true;
        }
        return false;
    }

    function getTotalGames() {
        return get(KEYS.TOTAL_GAMES) || 0;
    }

    function incrementTotalGames() {
        set(KEYS.TOTAL_GAMES, getTotalGames() + 1);
    }

    function getTotalTime() {
        return get(KEYS.TOTAL_TIME) || 0;
    }

    function addTotalTime(seconds) {
        set(KEYS.TOTAL_TIME, getTotalTime() + seconds);
    }

    function getMaxMerge() {
        return get(KEYS.MAX_MERGE) || 0;
    }

    function setMaxMerge(val) {
        if (val > getMaxMerge()) {
            set(KEYS.MAX_MERGE, val);
        }
    }

    function getLevelsData() {
        return get(KEYS.LEVELS_DATA) || {};
    }

    function getLevelData(levelId) {
        var data = getLevelsData();
        return data[levelId] || { passed: false, bestScore: 0, stars: 0 };
    }

    function setLevelData(levelId, levelData) {
        var data = getLevelsData();
        var existing = data[levelId] || { passed: false, bestScore: 0, stars: 0 };
        data[levelId] = {
            passed: levelData.passed || existing.passed,
            bestScore: Math.max(levelData.bestScore || 0, existing.bestScore),
            stars: Math.max(levelData.stars || 0, existing.stars)
        };
        set(KEYS.LEVELS_DATA, data);
    }

    function getPassedLevelsCount() {
        var data = getLevelsData();
        var count = 0;
        for (var key in data) {
            if (data[key].passed) count++;
        }
        return count;
    }

    function getCurrentLevel() {
        return get(KEYS.CURRENT_LEVEL) || 1;
    }

    function setCurrentLevel(level) {
        set(KEYS.CURRENT_LEVEL, level);
    }

    function getSettings() {
        return get(KEYS.SETTINGS) || getDefaults().settings;
    }

    function setSettings(settings) {
        set(KEYS.SETTINGS, settings);
    }

    function isTutorialDone() {
        return get(KEYS.TUTORIAL_DONE) || false;
    }

    function setTutorialDone(done) {
        set(KEYS.TUTORIAL_DONE, done);
    }

    function isTutorialEndlessDone() {
        return get(KEYS.TUTORIAL_ENDLESS_DONE) || false;
    }

    function setTutorialEndlessDone(done) {
        set(KEYS.TUTORIAL_ENDLESS_DONE, done);
    }

    function getRanking() {
        return get(KEYS.RANKING) || [];
    }

    function addRanking(levelId, score, moves) {
        var ranking = getRanking();
        ranking.push({
            levelId: levelId,
            score: score,
            moves: moves,
            date: Date.now()
        });
        ranking.sort(function(a, b) { return b.score - a.score; });
        if (ranking.length > 50) ranking = ranking.slice(0, 50);
        set(KEYS.RANKING, ranking);
    }

    function getGameState() {
        return get(KEYS.GAME_STATE);
    }

    function setGameState(state) {
        set(KEYS.GAME_STATE, state);
    }

    function clearGameState() {
        remove(KEYS.GAME_STATE);
    }

    function clearAllData() {
        for (var key in KEYS) {
            remove(KEYS[key]);
        }
    }

    function getEndlessHighScore() {
        return get(KEYS.ENDLESS_HIGH_SCORE) || 0;
    }

    function setEndlessHighScore(score) {
        if (score > getEndlessHighScore()) {
            set(KEYS.ENDLESS_HIGH_SCORE, score);
            return true;
        }
        return false;
    }

    function pad2(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function getTodayKey() {
        var d = new Date();
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }

    function getEndlessDaily() {
        var all = get(KEYS.ENDLESS_DAILY) || {};
        return all;
    }

    function addEndlessDaily(score, moves, elapsed) {
        var all = getEndlessDaily();
        var todayKey = getTodayKey();

        if (!all[todayKey]) {
            all[todayKey] = [];
        }

        all[todayKey].push({
            score: score,
            moves: moves,
            elapsed: elapsed,
            date: Date.now()
        });

        all[todayKey].sort(function(a, b) { return b.score - a.score; });
        if (all[todayKey].length > 20) {
            all[todayKey] = all[todayKey].slice(0, 20);
        }

        var allDates = Object.keys(all).sort().reverse();
        if (allDates.length > 7) {
            for (var i = 7; i < allDates.length; i++) {
                delete all[allDates[i]];
            }
        }

        set(KEYS.ENDLESS_DAILY, all);
    }

    function getEndlessDailyRanking(dayKey) {
        var all = getEndlessDaily();
        var key = dayKey || getTodayKey();
        return all[key] || [];
    }

    function getEndlessDailyDates() {
        var all = getEndlessDaily();
        return Object.keys(all).sort().reverse();
    }

    function formatTime(totalSeconds) {
        if (totalSeconds < 60) return totalSeconds + 's';
        var minutes = Math.floor(totalSeconds / 60);
        if (minutes < 60) return minutes + 'm';
        var hours = Math.floor(minutes / 60);
        return hours + 'h' + (minutes % 60) + 'm';
    }

    return {
        getDefaults: getDefaults,
        getHighScore: getHighScore,
        setHighScore: setHighScore,
        getTotalGames: getTotalGames,
        incrementTotalGames: incrementTotalGames,
        getTotalTime: getTotalTime,
        addTotalTime: addTotalTime,
        getMaxMerge: getMaxMerge,
        setMaxMerge: setMaxMerge,
        getLevelsData: getLevelsData,
        getLevelData: getLevelData,
        setLevelData: setLevelData,
        getPassedLevelsCount: getPassedLevelsCount,
        getCurrentLevel: getCurrentLevel,
        setCurrentLevel: setCurrentLevel,
        getSettings: getSettings,
        setSettings: setSettings,
        isTutorialDone: isTutorialDone,
        setTutorialDone: setTutorialDone,
        isTutorialEndlessDone: isTutorialEndlessDone,
        setTutorialEndlessDone: setTutorialEndlessDone,
        getRanking: getRanking,
        addRanking: addRanking,
        getGameState: getGameState,
        setGameState: setGameState,
        clearGameState: clearGameState,
        clearAllData: clearAllData,
        getEndlessHighScore: getEndlessHighScore,
        setEndlessHighScore: setEndlessHighScore,
        addEndlessDaily: addEndlessDaily,
        getEndlessDailyRanking: getEndlessDailyRanking,
        getEndlessDailyDates: getEndlessDailyDates,
        getTodayKey: getTodayKey,
        formatTime: formatTime
    };
})();

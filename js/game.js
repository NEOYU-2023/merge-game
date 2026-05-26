var Game = (function() {
    var grid = [];
    var gridSize = 4;
    var score = 0;
    var moves = 0;
    var maxMoves = 50;
    var targetScore = 500;
    var levelId = 1;
    var levelConfig = null;
    var gameOver = false;
    var gameWon = false;
    var isEndlessMode = false;
    var history = [];
    var maxHistorySteps = 5;
    var scoreMap = { 2: 20, 3: 30, 4: 40, 5: 50, 6: 60, 7: 70, 8: 80, 9: 90, 10: 100 };
    var collidePairs = {
        '1_9': true, '9_1': true,
        '2_8': true, '8_2': true,
        '3_7': true, '7_3': true,
        '4_6': true, '6_4': true
    };
    var onScoreChange = null;
    var onMovesChange = null;
    var onGridChange = null;
    var onGameOverCallback = null;
    var onGameWinCallback = null;
    var onMergeCallback = null;
    var onEliminateCallback = null;
    var startTime = 0;

    function init(level) {
        levelId = level.id;
        levelConfig = level;
        gridSize = level.gridSize;
        targetScore = level.targetScore || 999999;
        maxMoves = level.maxMoves || 999999;
        score = 0;
        moves = 0;
        gameOver = false;
        gameWon = false;
        isEndlessMode = level.endless === true;
        history = [];
        startTime = Date.now();

        grid = [];
        for (var r = 0; r < gridSize; r++) {
            grid[r] = [];
            for (var c = 0; c < gridSize; c++) {
                grid[r][c] = 0;
            }
        }

        for (var i = 0; i < level.initialTiles; i++) {
            spawnTile();
        }

        if (onGridChange) onGridChange(grid);
        if (onScoreChange) onScoreChange(score);
        if (onMovesChange) onMovesChange(moves);
    }

    function spawnTile() {
        var emptyCells = [];
        for (var r = 0; r < gridSize; r++) {
            for (var c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) {
                    emptyCells.push({ r: r, c: c });
                }
            }
        }
        if (emptyCells.length === 0) return null;

        var cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        var vals = levelConfig.spawnValues;
        grid[cell.r][cell.c] = vals[Math.floor(Math.random() * vals.length)];
        return cell;
    }

    function spawnExtraTile(values) {
        var emptyCells = [];
        for (var r = 0; r < gridSize; r++) {
            for (var c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) {
                    emptyCells.push({ r: r, c: c });
                }
            }
        }
        if (emptyCells.length === 0) return null;
        var cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[cell.r][cell.c] = values[Math.floor(Math.random() * values.length)];
        return cell;
    }

    function cloneGrid() {
        return grid.map(function(row) { return row.slice(); });
    }

    function saveHistory() {
        history.push({
            grid: cloneGrid(),
            score: score,
            moves: moves
        });
        if (history.length > maxHistorySteps) {
            history.shift();
        }
    }

    function undo() {
        if (history.length === 0 || gameOver || gameWon) return false;
        var state = history.pop();
        grid = state.grid;
        score = state.score;
        moves = state.moves;
        if (onGridChange) onGridChange(grid);
        if (onScoreChange) onScoreChange(score);
        if (onMovesChange) onMovesChange(moves);
        return true;
    }

    function revive() {
        if (!gameOver || gameWon) return false;
        gameOver = false;
        moves = 0;
        history = [];
        if (onMovesChange) onMovesChange(moves);
        if (onGridChange) onGridChange(grid);
        return true;
    }

    function reviveEndless() {
        if (!gameOver || gameWon || !isEndlessMode) return false;
        gameOver = false;
        moves = 0;
        history = [];

        var filledCells = [];
        for (var r = 0; r < gridSize; r++) {
            for (var c = 0; c < gridSize; c++) {
                if (grid[r][c] !== 0) {
                    filledCells.push({ r: r, c: c, value: grid[r][c] });
                }
            }
        }

        for (var r2 = 0; r2 < gridSize; r2++) {
            for (var c2 = 0; c2 < gridSize; c2++) {
                grid[r2][c2] = 0;
            }
        }

        if (filledCells.length > 0) {
            var minVal = Infinity;
            for (var i = 0; i < filledCells.length; i++) {
                if (filledCells[i].value < minVal) minVal = filledCells[i].value;
            }
            var target = filledCells[Math.floor(Math.random() * filledCells.length)];
            grid[target.r][target.c] = minVal;
        }

        return filledCells;
    }

    function move(direction) {
        if (gameOver || gameWon) return false;

        var moved = false;
        var mergedCells = [];
        var eliminatedCells = [];
        var scoreGained = 0;

        saveHistory();

        if (direction === 'left' || direction === 'right') {
            for (var r = 0; r < gridSize; r++) {
                var row = grid[r].slice();
                var result = processLine(row, direction === 'right');
                if (!arraysEqual(grid[r], result.line)) {
                    moved = true;
                }
                grid[r] = result.line;
                scoreGained += result.score;
                for (var m = 0; m < result.merges.length; m++) {
                    var mg = result.merges[m];
                    mergedCells.push({ r: r, c: mg.index, value: mg.value, eliminated: mg.eliminated, collide: mg.collide, v1: mg.v1, v2: mg.v2 });
                }
            }
        } else {
            for (var c = 0; c < gridSize; c++) {
                var col = [];
                for (var r2 = 0; r2 < gridSize; r2++) {
                    col.push(grid[r2][c]);
                }
                var result2 = processLine(col, direction === 'down');
                var colMoved = false;
                for (var r3 = 0; r3 < gridSize; r3++) {
                    if (grid[r3][c] !== result2.line[r3]) colMoved = true;
                    grid[r3][c] = result2.line[r3];
                }
                if (colMoved) moved = true;
                scoreGained += result2.score;
                for (var m2 = 0; m2 < result2.merges.length; m2++) {
                    var mg2 = result2.merges[m2];
                    mergedCells.push({ r: mg2.index, c: c, value: mg2.value, eliminated: mg2.eliminated, collide: mg2.collide, v1: mg2.v1, v2: mg2.v2 });
                }
            }
        }

        if (!moved) {
            history.pop();
            return false;
        }

        score += scoreGained;
        moves++;

        if (onGridChange) onGridChange(grid);
        if (onScoreChange) onScoreChange(score);
        if (onMovesChange) onMovesChange(moves);

        if (scoreGained > 0 && onMergeCallback) {
            onMergeCallback(mergedCells, scoreGained);
        }

        Storage.setMaxMerge(getMaxValue());

        if (!isEndlessMode && score >= targetScore && !gameWon) {
            gameWon = true;
            var elapsed = Math.floor((Date.now() - startTime) / 1000);
            if (onGameWinCallback) {
                setTimeout(function() {
                    onGameWinCallback(score, moves, elapsed);
                }, 400);
            }
            return true;
        }

        setTimeout(function() {
            var spawned = spawnTile();

            if (isEndlessMode) {
                spawnExtraTile([4, 5, 6]);
            }

            if (onGridChange) onGridChange(grid);

            if (!canMove()) {
                gameOver = true;
                var elapsed3 = Math.floor((Date.now() - startTime) / 1000);
                if (onGameOverCallback) {
                    setTimeout(function() {
                        onGameOverCallback(score, moves, elapsed3);
                    }, 200);
                }
            } else if (!isEndlessMode && moves >= maxMoves && !gameWon) {
                gameOver = true;
                var elapsed2 = Math.floor((Date.now() - startTime) / 1000);
                if (onGameOverCallback) {
                    setTimeout(function() {
                        onGameOverCallback(score, moves, elapsed2);
                    }, 200);
                }
            }
        }, 150);

        return true;
    }

    function processLine(line, reverse) {
        if (reverse) {
            line = line.slice().reverse();
        }

        var filtered = [];
        for (var i = 0; i < line.length; i++) {
            if (line[i] !== 0) filtered.push(line[i]);
        }

        var newLine = [];
        var merges = [];
        var lineScore = 0;
        var i = 0;

        while (i < filtered.length) {
            if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
                var merged = filtered[i] + 1;
                if (merged === 10) {
                    lineScore += 100;
                    merges.push({ index: newLine.length, value: 10, eliminated: true });
                } else {
                    lineScore += (scoreMap[merged] || 0);
                    newLine.push(merged);
                    merges.push({ index: newLine.length - 1, value: merged, eliminated: false });
                }
                i += 2;
            } else if (i + 1 < filtered.length && collidePairs[filtered[i] + '_' + filtered[i + 1]]) {
                lineScore += 100;
                merges.push({ index: newLine.length, value: 0, eliminated: true, collide: true, v1: filtered[i], v2: filtered[i + 1] });
                i += 2;
            } else {
                newLine.push(filtered[i]);
                i++;
            }
        }

        while (newLine.length < line.length) {
            newLine.push(0);
        }

        if (reverse) {
            newLine = newLine.slice().reverse();
            for (var mi = 0; mi < merges.length; mi++) {
                merges[mi].index = line.length - 1 - merges[mi].index;
            }
        }

        return { line: newLine, score: lineScore, merges: merges };
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function getMaxValue() {
        var max = 0;
        for (var r = 0; r < gridSize; r++) {
            for (var c = 0; c < gridSize; c++) {
                if (grid[r][c] > max) max = grid[r][c];
            }
        }
        return max;
    }

    function canMove() {
        for (var r = 0; r < gridSize; r++) {
            for (var c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) return true;
            }
        }
        for (var r2 = 0; r2 < gridSize; r2++) {
            for (var c2 = 0; c2 < gridSize; c2++) {
                var v = grid[r2][c2];
                if (c2 + 1 < gridSize) {
                    var right = grid[r2][c2 + 1];
                    if (right === v || collidePairs[v + '_' + right]) return true;
                }
                if (r2 + 1 < gridSize) {
                    var below = grid[r2 + 1][c2];
                    if (below === v || collidePairs[v + '_' + below]) return true;
                }
            }
        }
        return false;
    }

    function getGrid() { return grid; }
    function getScore() { return score; }
    function getMoves() { return moves; }
    function getMaxMoves() { return maxMoves; }
    function getTargetScore() { return targetScore; }
    function getLevelId() { return levelId; }
    function isGameOver() { return gameOver; }
    function isGameWon() { return gameWon; }
    function isEndless() { return isEndlessMode; }
    function getGridSize() { return gridSize; }
    function getHistoryLength() { return history.length; }
    function getElapsedTime() { return Math.floor((Date.now() - startTime) / 1000); }
    function canMoveCheck() { return canMove(); }

    function setOnScoreChange(cb) { onScoreChange = cb; }
    function setOnMovesChange(cb) { onMovesChange = cb; }
    function setOnGridChange(cb) { onGridChange = cb; }
    function setOnGameOver(cb) { onGameOverCallback = cb; }
    function setOnGameWin(cb) { onGameWinCallback = cb; }
    function setOnMerge(cb) { onMergeCallback = cb; }
    function setOnEliminate(cb) { onEliminateCallback = cb; }

    function getState() {
        return {
            grid: cloneGrid(),
            score: score,
            moves: moves,
            levelId: levelId,
            gameOver: gameOver,
            gameWon: gameWon,
            startTime: startTime
        };
    }

    function restoreState(state) {
        grid = state.grid;
        score = state.score;
        moves = state.moves;
        levelId = state.levelId;
        gameOver = state.gameOver;
        gameWon = state.gameWon;
        startTime = state.startTime || Date.now();
        levelConfig = Levels.getById(levelId);
        if (levelConfig) {
            gridSize = levelConfig.gridSize;
            targetScore = levelConfig.targetScore;
            maxMoves = levelConfig.maxMoves;
        }
        history = [];
    }

    return {
        init: init,
        move: move,
        undo: undo,
        revive: revive,
        reviveEndless: reviveEndless,
        getGrid: getGrid,
        getScore: getScore,
        getMoves: getMoves,
        getMaxMoves: getMaxMoves,
        getTargetScore: getTargetScore,
        getLevelId: getLevelId,
        isGameOver: isGameOver,
        isGameWon: isGameWon,
        isEndless: isEndless,
        getGridSize: getGridSize,
        getHistoryLength: getHistoryLength,
        getElapsedTime: getElapsedTime,
        canMoveCheck: canMoveCheck,
        getState: getState,
        restoreState: restoreState,
        setOnScoreChange: setOnScoreChange,
        setOnMovesChange: setOnMovesChange,
        setOnGridChange: setOnGridChange,
        setOnGameOver: setOnGameOver,
        setOnGameWin: setOnGameWin,
        setOnMerge: setOnMerge,
        setOnEliminate: setOnEliminate
    };
})();

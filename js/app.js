var App = (function() {
    var currentPage = 'home';
    var touchStartX = 0;
    var touchStartY = 0;
    var touchStartTime = 0;
    var gameTimer = null;
    var isAnimating = false;
    var endlessTimerDisplay = null;
    var endlessReviveUsed = false;
    var levelReviveUsed = false;

    function init() {
        setupPageTransitions();
        setupHomeEvents();
        setupGameEvents();
        setupLevelsPage();
        setupRankingPage();
        setupSettingsPage();
        updateHomeStats();
        Animations.createHomeParticles();

        Tutorial.show(function() {
            var currentLevel = Storage.getCurrentLevel();
            startLevel(currentLevel);
        });

        document.addEventListener('visibilitychange', function() {
            if (document.hidden && currentPage === 'game') {
                saveCurrentGame();
            }
        });

        window.addEventListener('beforeunload', function() {
            if (currentPage === 'game') {
                saveCurrentGame();
            }
        });
    }

    function navigateTo(pageId) {
        var current = document.querySelector('.page.active');
        var next = document.getElementById('page-' + pageId);
        if (!next || current === next) return;

        current.classList.remove('active');
        next.classList.add('active');
        currentPage = pageId;

        if (pageId === 'home') {
            updateHomeStats();
            Animations.createHomeParticles();
        }
        if (pageId === 'levels') {
            renderLevelsList();
        }
        if (pageId === 'ranking') {
            renderRankingList();
        }
        if (pageId === 'settings') {
            loadSettingsUI();
        }
    }

    function setupPageTransitions() {
        document.getElementById('btnGameBack').addEventListener('click', function() {
            Audio.playClick();
            saveCurrentGame();
            stopEndlessTimerDisplay();
            navigateTo('home');
        });
        document.getElementById('btnLevelsBack').addEventListener('click', function() {
            Audio.playClick();
            navigateTo('home');
        });
        document.getElementById('btnRankingBack').addEventListener('click', function() {
            Audio.playClick();
            navigateTo('home');
        });
        document.getElementById('btnSettingsBack').addEventListener('click', function() {
            Audio.playClick();
            navigateTo('home');
        });
    }

    function setupHomeEvents() {
        document.getElementById('btnStartGame').addEventListener('click', function(e) {
            Audio.playClick();
            Animations.addRipple(this, e.clientX, e.clientY);
            var currentLevel = Storage.getCurrentLevel();
            var level = Levels.getById(currentLevel);
            if (level) {
                startLevel(currentLevel);
            }
        });

        document.getElementById('btnEndless').addEventListener('click', function(e) {
            Audio.playClick();
            Animations.addRipple(this, e.clientX, e.clientY);
            startEndless();
        });

        document.getElementById('btnLevels').addEventListener('click', function(e) {
            Audio.playClick();
            Animations.addRipple(this, e.clientX, e.clientY);
            navigateTo('levels');
        });

        document.getElementById('btnSettings').addEventListener('click', function() {
            Audio.playClick();
            navigateTo('settings');
        });

        document.getElementById('btnRanking').addEventListener('click', function(e) {
            Audio.playClick();
            Animations.addRipple(this, e.clientX, e.clientY);
            navigateTo('ranking');
        });
    }

    function setupGameEvents() {
        var boardWrapper = document.getElementById('gameBoard').parentElement;
        var gamePage = document.getElementById('page-game');

        gamePage.addEventListener('touchstart', function(e) {
            if (currentPage !== 'game') return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        gamePage.addEventListener('touchmove', function(e) {
            if (currentPage !== 'game') return;
            e.preventDefault();
        }, { passive: false });

        gamePage.addEventListener('touchend', function(e) {
            if (currentPage !== 'game') return;
            if (isAnimating) return;
            if (!touchStartTime) return;

            var touch = e.changedTouches[0];
            var dx = touch.clientX - touchStartX;
            var dy = touch.clientY - touchStartY;
            var dt = Date.now() - touchStartTime;

            touchStartTime = 0;

            if (dt > 800) return;
            if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;

            var direction;
            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }

            handleSwipe(direction);
        }, { passive: true });

        gamePage.addEventListener('mousedown', function(e) {
            if (currentPage !== 'game') return;
            touchStartX = e.clientX;
            touchStartY = e.clientY;
            touchStartTime = Date.now();
        });

        gamePage.addEventListener('mouseup', function(e) {
            if (currentPage !== 'game') return;
            if (isAnimating) return;
            if (!touchStartTime) return;

            var dx = e.clientX - touchStartX;
            var dy = e.clientY - touchStartY;
            var dt = Date.now() - touchStartTime;

            touchStartTime = 0;

            if (dt > 800) return;
            if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;

            var direction;
            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }

            handleSwipe(direction);
        });

        document.addEventListener('keydown', function(e) {
            if (currentPage !== 'game') return;
            if (isAnimating) return;
            var keyMap = {
                'ArrowUp': 'up', 'ArrowDown': 'down',
                'ArrowLeft': 'left', 'ArrowRight': 'right',
                'w': 'up', 's': 'down', 'a': 'left', 'd': 'right'
            };
            var dir = keyMap[e.key];
            if (dir) {
                e.preventDefault();
                handleSwipe(dir);
            }
        });
    }

    function handleSwipe(direction) {
        if (Game.isGameOver() || Game.isGameWon()) return;

        isAnimating = true;
        Audio.playSlide();

        var moved = Game.move(direction);
        if (moved) {
            renderBoard();
        }

        setTimeout(function() {
            isAnimating = false;
        }, 150);
    }

    function startLevel(levelId) {
        var level = Levels.getById(levelId);
        if (!level) return;

        Storage.setCurrentLevel(levelId);
        Storage.incrementTotalGames();
        levelReviveUsed = false;

        Game.init(level);
        setupGameCallbacks();
        renderBoard();
        updateGameHeader();
        navigateTo('game');

        startGameTimer();
    }

    function startEndless() {
        Storage.incrementTotalGames();
        endlessReviveUsed = false;

        var config = Levels.getEndlessConfig();
        Game.init(config);
        setupGameCallbacks();
        renderBoard();
        updateGameHeader();
        navigateTo('game');

        startGameTimer();
        startEndlessTimerDisplay();

        Tutorial.showEndless(function() {});
    }

    function startEndlessTimerDisplay() {
        stopEndlessTimerDisplay();
        endlessTimerDisplay = setInterval(function() {
            if (currentPage === 'game' && Game.isEndless()) {
                var movesEl = document.getElementById('gameMoves');
                if (movesEl) {
                    movesEl.textContent = Storage.formatTime(Game.getElapsedTime());
                }
            }
        }, 1000);
    }

    function stopEndlessTimerDisplay() {
        if (endlessTimerDisplay) {
            clearInterval(endlessTimerDisplay);
            endlessTimerDisplay = null;
        }
    }

    function setupGameCallbacks() {
        Game.setOnGridChange(function(g) {
            renderBoard();
        });

        Game.setOnScoreChange(function(s) {
            var el = document.getElementById('gameScore');
            el.textContent = s;
            el.classList.remove('pop');
            void el.offsetWidth;
            el.classList.add('pop');
            updateProgressBar();
        });

        Game.setOnMovesChange(function(m) {
            if (Game.isEndless()) return;
            var remaining = Game.getMaxMoves() - m;
            var movesVal = document.getElementById('gameMoves');
            if (movesVal) movesVal.textContent = remaining;
            var movesBox = document.getElementById('gameMovesBox');
            if (movesBox) {
                movesBox.className = 'game-moves';
                if (remaining <= 5) {
                    movesBox.classList.add('moves-danger');
                } else if (remaining <= 15) {
                    movesBox.classList.add('moves-warning');
                }
            }
        });

        Game.setOnMerge(function(cells, scoreGained) {
            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];

                if (cell.collide || cell.eliminated) {
                    Audio.playEliminate();
                    var pos = getCellScreenPos(cell.r, cell.c);
                    Animations.spawnParticles(pos.x, pos.y, '#ffd700', 12);
                    Animations.showFloatScore(pos.x - 15, pos.y, 100);
                    if (cell.collide) {
                        showEliminateHintText(cell.v1, cell.v2);
                    } else {
                        showEliminateHintText(cell.value - 1, cell.value - 1);
                    }
                } else {
                    Audio.playMerge(cell.value);
                    var cellEl = getCellElement(cell.r, cell.c);
                    if (cellEl) {
                        Animations.animateCellMerge(cellEl);
                        var rect = cellEl.getBoundingClientRect();
                        Animations.spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, getCellColor(cell.value));
                        Animations.showFloatScore(rect.left + rect.width / 2 - 15, rect.top, scoreGained / cells.length | 0);
                    }
                }
            }
        });

        Game.setOnEliminate(function(cells, scoreGained) {
        });

        Game.setOnGameWin(function(score, moves, elapsed) {
            stopGameTimer();
            Storage.addTotalTime(elapsed);
            Storage.setHighScore(score);

            var currentLid = Game.getLevelId();
            var stars = Levels.calculateStars(currentLid, score);
            Storage.setLevelData(currentLid, {
                passed: true,
                bestScore: score,
                stars: stars
            });

            var nextLevel = currentLid + 1;
            Storage.setCurrentLevel(nextLevel);

            setTimeout(function() {
                Animations.celebrateWin();
                Audio.playWin();
                showWinModal(score, stars, elapsed);
            }, 300);
        });

        Game.setOnGameOver(function(score, moves, elapsed) {
            stopGameTimer();
            stopEndlessTimerDisplay();
            Storage.addTotalTime(elapsed);
            Storage.setHighScore(score);

            if (Game.isEndless()) {
                Storage.setEndlessHighScore(score);
                Storage.addEndlessDaily(score, moves, elapsed);
            }

            setTimeout(function() {
                Audio.playFail();
                if (Game.isEndless()) {
                    showEndlessOverModal(score, moves, elapsed);
                } else {
                    showFailModal(score);
                }
            }, 200);
        });
    }

    function showEliminateHintText(v1, v2) {
        var hint = document.getElementById('eliminateHint');
        hint.textContent = v1 + ' + ' + v2 + ' = 10 消除！+100分';
        setTimeout(function() { hint.textContent = ''; }, 2000);
    }

    function renderBoard() {
        var board = document.getElementById('gameBoard');
        var g = Game.getGrid();
        var size = Game.getGridSize();
        var boardSize = Math.min(window.innerWidth - 32, 400);
        var gap = 8;
        var cellSize = (boardSize - gap * (size + 1)) / size;

        board.style.gridTemplateColumns = 'repeat(' + size + ', ' + cellSize + 'px)';
        board.style.gridTemplateRows = 'repeat(' + size + ', ' + cellSize + 'px)';
        board.style.width = boardSize + 'px';
        board.style.height = boardSize + 'px';

        var fontSize = cellSize * 0.45;

        board.innerHTML = '';
        for (var r = 0; r < size; r++) {
            for (var c = 0; c < size; c++) {
                var cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.fontSize = fontSize + 'px';
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (g[r][c] === 0) {
                    cell.classList.add('empty');
                } else {
                    cell.classList.add('filled');
                    cell.dataset.value = g[r][c];
                    cell.textContent = g[r][c];
                }

                board.appendChild(cell);
            }
        }
    }

    function getCellElement(r, c) {
        return document.querySelector('.cell[data-row="' + r + '"][data-col="' + c + '"]');
    }

    function getCellScreenPos(r, c) {
        var board = document.getElementById('gameBoard');
        if (!board) return { x: 0, y: 0 };
        var boardRect = board.getBoundingClientRect();
        var size = Game.getGridSize();
        var gap = 8;
        var padding = gap;
        var boardWidth = boardRect.width;
        var cellSize = (boardWidth - gap * (size + 1)) / size;
        var x = boardRect.left + padding + c * (cellSize + gap) + cellSize / 2;
        var y = boardRect.top + padding + r * (cellSize + gap) + cellSize / 2;
        return { x: x, y: y };
    }

    function getCellColor(value) {
        var colors = {
            1: '#a0aec0', 2: '#667eea', 3: '#4fd1c5', 4: '#48bb78',
            5: '#f6ad55', 6: '#fc8181', 7: '#f093fb', 8: '#b794f4',
            9: '#ffd700', 10: '#ff6b6b'
        };
        return colors[value] || '#667eea';
    }

    function updateGameHeader() {
        var endless = Game.isEndless();
        if (endless) {
            document.getElementById('gameLevelTag').textContent = '♾️ 无尽模式';
            document.getElementById('gameTarget').textContent = '∞';
            var movesBox = document.querySelector('.game-moves');
            if (movesBox) {
                movesBox.querySelector('.moves-label').textContent = '时长';
                movesBox.querySelector('.moves-value').textContent = '0s';
            }
        } else {
            var level = Levels.getById(Game.getLevelId());
            document.getElementById('gameLevelTag').textContent = '第' + Game.getLevelId() + '关 · ' + (level ? level.name : '');
            document.getElementById('gameTarget').textContent = Game.getTargetScore();
            var movesBox2 = document.querySelector('.game-moves');
            if (movesBox2) {
                var remaining = Game.getMaxMoves() - Game.getMoves();
                movesBox2.querySelector('.moves-label').textContent = '剩余';
                var movesVal = movesBox2.querySelector('.moves-value');
                movesVal.textContent = remaining;
                movesBox2.className = 'game-moves';
                if (remaining <= 5) {
                    movesBox2.classList.add('moves-danger');
                } else if (remaining <= 15) {
                    movesBox2.classList.add('moves-warning');
                }
            }
        }
        document.getElementById('gameScore').textContent = Game.getScore();
        updateProgressBar();
    }

    function updateProgressBar() {
        if (Game.isEndless()) {
            var high = Storage.getEndlessHighScore();
            var pct = high > 0 ? Math.min(100, (Game.getScore() / high) * 100) : 0;
            document.getElementById('progressFill').style.width = pct + '%';
        } else {
            var pct2 = Math.min(100, (Game.getScore() / Game.getTargetScore()) * 100);
            document.getElementById('progressFill').style.width = pct2 + '%';
        }
    }

    function startGameTimer() {
        stopGameTimer();
        gameTimer = setInterval(function() {
            Storage.setGameState(Game.getState());
        }, 5000);
    }

    function stopGameTimer() {
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
    }

    function saveCurrentGame() {
        if (currentPage === 'game' && !Game.isGameOver() && !Game.isGameWon()) {
            Storage.setGameState(Game.getState());
        }
    }

    function updateHomeStats() {
        document.getElementById('homeHighScore').textContent = Storage.getHighScore();
        document.getElementById('homeEndlessHigh').textContent = Storage.getEndlessHighScore();
        document.getElementById('homeLevelPassed').textContent = Storage.getPassedLevelsCount();
    }

    function renderLevelsList() {
        var grid = document.getElementById('levelsGrid');
        var levels = Levels.getAll();
        var html = '';

        for (var i = 0; i < levels.length; i++) {
            var lv = levels[i];
            var unlocked = Levels.isUnlocked(lv.id);
            var data = Storage.getLevelData(lv.id);
            var current = lv.id === Storage.getCurrentLevel();
            var passed = data.passed;

            var cls = 'level-card';
            if (!unlocked) cls += ' locked';
            if (current) cls += ' current';
            if (passed) cls += ' passed';

            var starsHtml = '';
            if (passed) {
                for (var s = 0; s < 3; s++) {
                    starsHtml += s < data.stars ? '⭐' : '☆';
                }
            }

            html += '<div class="' + cls + '" data-level="' + lv.id + '">' +
                '<div class="level-num">' + lv.id + '</div>' +
                '<div class="level-name">' + lv.name + '</div>' +
                '<div class="level-target">目标 ' + lv.targetScore + '分</div>' +
                (passed ? '<div class="level-stars">' + starsHtml + '</div>' : '') +
                '</div>';
        }

        grid.innerHTML = html;

        var cards = grid.querySelectorAll('.level-card:not(.locked)');
        for (var j = 0; j < cards.length; j++) {
            cards[j].addEventListener('click', function() {
                Audio.playClick();
                var lid = parseInt(this.dataset.level);
                startLevel(lid);
            });
        }
    }

    function setupLevelsPage() {}

    function setupRankingPage() {}

    function renderRankingList() {
        var list = document.getElementById('rankingList');
        var dates = Storage.getEndlessDailyDates();

        if (dates.length === 0) {
            list.innerHTML = '<div class="ranking-empty">暂无记录<br>快去无尽模式挑战吧！</div>';
            return;
        }

        var html = '';
        for (var d = 0; d < dates.length; d++) {
            var dateKey = dates[d];
            var records = Storage.getEndlessDailyRanking(dateKey);
            var isToday = dateKey === Storage.getTodayKey();

            html += '<div class="ranking-date-header">' +
                '<span>' + (isToday ? '📅 今天' : dateKey) + '</span>' +
                '<span class="ranking-badge">' + records.length + '局</span>' +
                '</div>';

            for (var i = 0; i < records.length; i++) {
                var item = records[i];
                var rankClass = '';
                if (i === 0) rankClass = ' top1';
                else if (i === 1) rankClass = ' top2';
                else if (i === 2) rankClass = ' top3';

                html += '<div class="ranking-item">' +
                    '<div class="ranking-rank' + rankClass + '">' + (i + 1) + '</div>' +
                    '<div class="ranking-info">' +
                        '<div class="ranking-level endless-score">' + item.score + '分</div>' +
                        '<div class="ranking-meta">' +
                            '<span>' + item.moves + '步</span>' +
                            '<span>' + Storage.formatTime(item.elapsed) + '</span>' +
                            '<span>' + new Date(item.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="endless-score">' + item.score + '</div>' +
                    '</div>';
            }
        }

        list.innerHTML = html;
    }

    function setupSettingsPage() {
        document.getElementById('settingSound').addEventListener('change', function() {
            var settings = Storage.getSettings();
            settings.sound = this.checked;
            Storage.setSettings(settings);
            Audio.updateSettings(settings);
            Audio.playClick();
        });

        document.getElementById('settingMusic').addEventListener('change', function() {
            var settings = Storage.getSettings();
            settings.music = this.checked;
            Storage.setSettings(settings);
            Audio.updateSettings(settings);
            if (this.checked) Audio.startBgMusic();
            Audio.playClick();
        });

        document.getElementById('settingAnimation').addEventListener('change', function() {
            var settings = Storage.getSettings();
            settings.animation = this.checked;
            Storage.setSettings(settings);
            Animations.loadSettings();
            Audio.playClick();
        });

        document.getElementById('settingResetGame').addEventListener('click', function() {
            Audio.playClick();
            showConfirmModal('确定要重启当前关卡吗？进度将丢失。', function() {
                Storage.clearGameState();
                navigateTo('home');
            });
        });

        document.getElementById('settingClearData').addEventListener('click', function() {
            Audio.playClick();
            showConfirmModal('确定要清空所有数据吗？此操作不可恢复！', function() {
                Storage.clearAllData();
                navigateTo('home');
                updateHomeStats();
            });
        });
    }

    function loadSettingsUI() {
        var settings = Storage.getSettings();
        document.getElementById('settingSound').checked = settings.sound;
        document.getElementById('settingMusic').checked = settings.music;
        document.getElementById('settingAnimation').checked = settings.animation;

        document.getElementById('statTotalGames').textContent = Storage.getTotalGames();
        document.getElementById('statHighScore').textContent = Storage.getHighScore();
        document.getElementById('statLevelsPassed').textContent = Storage.getPassedLevelsCount();
        document.getElementById('statTotalTime').textContent = Storage.formatTime(Storage.getTotalTime());
        document.getElementById('statMaxMerge').textContent = Storage.getMaxMerge();
    }

    function showModal(html) {
        var overlay = document.getElementById('modalOverlay');
        document.getElementById('modalContent').innerHTML = html;
        overlay.classList.add('show');
    }

    function hideModal() {
        document.getElementById('modalOverlay').classList.remove('show');
    }

    function showConfirmModal(message, onConfirm) {
        var html = '<div class="confirm-dialog">' +
            '<div class="modal-icon">❓</div>' +
            '<div class="confirm-msg">' + message + '</div>' +
            '<div class="modal-btn-row">' +
                '<button class="btn btn-outline btn-sm" id="confirmCancel" style="color:#718096;border-color:#cbd5e0;">取消</button>' +
                '<button class="btn btn-danger btn-sm" id="confirmOk">确定</button>' +
            '</div>' +
            '</div>';

        showModal(html);

        document.getElementById('confirmCancel').addEventListener('click', function() {
            Audio.playClick();
            hideModal();
        });
        document.getElementById('confirmOk').addEventListener('click', function() {
            Audio.playClick();
            hideModal();
            if (onConfirm) onConfirm();
        });
    }

    function showWinModal(score, stars, elapsed) {
        var starsHtml = '';
        for (var i = 0; i < 3; i++) {
            starsHtml += i < stars ? '⭐' : '☆';
        }

        var nextExists = Levels.getById(Game.getLevelId() + 1);

        var html = '<div class="modal-icon">🎉</div>' +
            '<div class="modal-title">恭喜通关！</div>' +
            '<div class="modal-stars">' + starsHtml + '</div>' +
            '<div class="modal-score">' + score + '分</div>' +
            '<div class="modal-desc">用时 ' + Storage.formatTime(elapsed) + ' · ' + Game.getMoves() + '步</div>' +
            '<div class="modal-buttons">' +
                (nextExists ? '<button class="btn btn-primary-dark btn-lg" id="winNext">下一关 →</button>' : '') +
                '<button class="btn btn-outline btn-lg" id="winHome" style="color:#667eea;border-color:#667eea;">返回首页</button>' +
                '<button class="btn btn-outline btn-sm" id="winReplay" style="color:#718096;border-color:#cbd5e0;">再玩一次</button>' +
            '</div>';

        showModal(html);

        if (nextExists) {
            document.getElementById('winNext').addEventListener('click', function() {
                Audio.playClick();
                hideModal();
                startLevel(Game.getLevelId() + 1);
            });
        }
        document.getElementById('winHome').addEventListener('click', function() {
            Audio.playClick();
            hideModal();
            navigateTo('home');
        });
        document.getElementById('winReplay').addEventListener('click', function() {
            Audio.playClick();
            hideModal();
            startLevel(Game.getLevelId());
        });
    }

    function showFailModal(score) {
        var target = Game.getTargetScore();
        var pct = Math.round((score / target) * 100);

        var html = '<div class="modal-icon">😢</div>' +
            '<div class="modal-title">步数用完了</div>' +
            '<div class="modal-score">' + score + '<span style="font-size:14px;color:#a0aec0;">/' + target + '</span></div>' +
            '<div class="modal-desc">完成度 ' + pct + '%，差一点就通关了！</div>' +
            '<div class="modal-buttons">' +
                '<button class="btn btn-success btn-lg" id="failRevive">🎬 看广告复活</button>' +
                '<button class="btn btn-primary-dark btn-lg" id="failRetry">重新挑战</button>' +
                '<button class="btn btn-outline btn-lg" id="failHome" style="color:#667eea;border-color:#667eea;">返回首页</button>' +
            '</div>';

        showModal(html);

        var reviveBtn = document.getElementById('failRevive');
        if (reviveBtn) {
            reviveBtn.addEventListener('click', function() {
                Audio.playClick();
                hideModal();
                showAdModal();
            });
        }
        document.getElementById('failRetry').addEventListener('click', function() {
            Audio.playClick();
            hideModal();
            startLevel(Game.getLevelId());
        });
        document.getElementById('failHome').addEventListener('click', function() {
            Audio.playClick();
            hideModal();
            navigateTo('home');
        });
    }

    function showAdModal() {
        var countdown = 5;
        var html = '<div class="modal-icon">🎬</div>' +
            '<div class="modal-title">观看广告复活</div>' +
            '<div class="modal-desc">观看广告后可获得额外步数继续游戏</div>' +
            '<div class="ad-placeholder" id="adPlaceholder">' +
                '<div class="ad-fake-banner">' +
                    '<div class="ad-fake-text">📢 精彩推荐</div>' +
                    '<div class="ad-fake-bar">' +
                        '<div class="ad-fake-progress" id="adProgress"></div>' +
                    '</div>' +
                    '<div class="ad-fake-countdown" id="adCountdown">' + countdown + '秒</div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-buttons">' +
                '<button class="btn btn-outline btn-sm" id="adCancel" style="color:#a0aec0;border-color:#e2e8f0;display:none;">跳过广告</button>' +
            '</div>';

        showModal(html);

        var progressBar = document.getElementById('adProgress');
        var countdownEl = document.getElementById('adCountdown');
        var cancelBtn = document.getElementById('adCancel');

        var timer = setInterval(function() {
            countdown--;
            if (countdownEl) countdownEl.textContent = countdown + '秒';
            if (progressBar) progressBar.style.width = ((5 - countdown) / 5 * 100) + '%';

            if (countdown <= 0) {
                clearInterval(timer);
                hideModal();
                doRevive();
            }
        }, 1000);

        setTimeout(function() {
            if (cancelBtn) {
                cancelBtn.style.display = 'inline-flex';
                cancelBtn.addEventListener('click', function() {
                    Audio.playClick();
                    clearInterval(timer);
                    hideModal();
                    doRevive();
                });
            }
        }, 3000);
    }

    function doRevive() {
        if (Game.isEndless()) {
            endlessReviveUsed = true;
            var clearedCells = Game.reviveEndless();
            if (clearedCells && clearedCells.length > 0) {
                renderBoard();
                playCascadeEliminate(clearedCells, function() {
                    Game.reviveEndless();
                    renderBoard();
                    updateGameHeader();
                    startGameTimer();
                    var hint = document.getElementById('eliminateHint');
                    if (hint) {
                        hint.textContent = '🎉 棋盘已清除！重新出发！';
                        hint.style.color = '#f093fb';
                        hint.style.fontSize = '16px';
                        hint.style.fontWeight = '700';
                        setTimeout(function() {
                            hint.textContent = '';
                            hint.style.color = '';
                            hint.style.fontSize = '';
                            hint.style.fontWeight = '';
                        }, 3000);
                    }
                });
                return;
            }
        }

        if (Game.revive()) {
            levelReviveUsed = true;
            updateGameHeader();
            renderBoard();
            startGameTimer();
            Animations.celebrateWin();
            var hint2 = document.getElementById('eliminateHint');
            if (hint2) {
                hint2.textContent = '🎉 复活成功！继续加油！';
                setTimeout(function() { hint2.textContent = ''; }, 3000);
            }
        }
    }

    function playCascadeEliminate(cells, callback) {
        var shuffled = cells.slice().sort(function() {
            return Math.random() - 0.5;
        });
        var board = document.getElementById('gameBoard');
        var delay = 0;
        var interval = 60;
        var colors = ['#fc8181', '#f6ad55', '#48bb78', '#4fd1c5', '#667eea', '#b794f4', '#f093fb', '#ffd700'];

        for (var i = 0; i < shuffled.length; i++) {
            (function(cell, index) {
                setTimeout(function() {
                    var cellEl = getCellElement(cell.r, cell.c);
                    if (cellEl) {
                        cellEl.style.transition = 'all 0.25s ease-out';
                        cellEl.style.transform = 'scale(1.2)';
                        cellEl.style.boxShadow = '0 0 20px rgba(255,215,0,0.8)';
                        cellEl.style.zIndex = '10';
                    }

                    setTimeout(function() {
                        if (cellEl) {
                            cellEl.style.transform = 'scale(0) rotate(180deg)';
                            cellEl.style.opacity = '0';
                        }

                        var pos = getCellScreenPos(cell.r, cell.c);
                        var color = colors[index % colors.length];
                        Animations.spawnParticles(pos.x, pos.y, color, 6);

                        Audio.playEliminate();
                    }, 120);
                }, delay);
                delay += interval;
            })(shuffled[i], i);
        }

        setTimeout(function() {
            Animations.celebrateWin();
            setTimeout(callback, 400);
        }, delay + 300);
    }

    function showEndlessOverModal(score, moves, elapsed) {
        var isNewHigh = score >= Storage.getEndlessHighScore();
        var todayRanking = Storage.getEndlessDailyRanking();
        var todayRank = todayRanking.length;
        for (var i = 0; i < todayRanking.length; i++) {
            if (todayRanking[i].score <= score) {
                todayRank = i + 1;
                break;
            }
        }
        if (todayRanking.length === 0) todayRank = 1;

        var reviveBtnHtml = '';
        if (!endlessReviveUsed) {
            reviveBtnHtml = '<button class="btn btn-success btn-lg" id="endlessRevive">🎬 看广告复活</button>';
        }

        var html = '<div class="modal-icon">' + (isNewHigh ? '🏆' : '😢') + '</div>' +
            '<div class="modal-title">' + (isNewHigh ? '新纪录！' : '游戏结束') + '</div>' +
            '<div class="modal-score" style="background:linear-gradient(135deg,#f093fb,#f5576c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">' + score + '分</div>' +
            '<div class="modal-desc">' + moves + '步 · 用时 ' + Storage.formatTime(elapsed) + '</div>' +
            '<div class="modal-desc" style="color:var(--primary);font-weight:600;">今日排名 #' + todayRank + '</div>' +
            '<div class="modal-buttons">' +
                reviveBtnHtml +
                '<button class="btn btn-endless btn-lg" id="endlessRetry">再来一局</button>' +
                '<button class="btn btn-outline btn-lg" id="endlessHome" style="color:#667eea;border-color:#667eea;">返回首页</button>' +
                '<button class="btn btn-outline btn-sm" id="endlessRank" style="color:#718096;border-color:#cbd5e0;">查看排行榜</button>' +
            '</div>';

        showModal(html);

        var reviveBtn = document.getElementById('endlessRevive');
        if (reviveBtn) {
            reviveBtn.addEventListener('click', function() {
                Audio.playClick();
                hideModal();
                showAdModal();
            });
        }

        document.getElementById('endlessRetry').addEventListener('click', function() {
            Audio.playClick();
            hideModal();
            startEndless();
        });
        document.getElementById('endlessHome').addEventListener('click', function() {
            Audio.playClick();
            hideModal();
            navigateTo('home');
        });
        document.getElementById('endlessRank').addEventListener('click', function() {
            Audio.playClick();
            hideModal();
            navigateTo('ranking');
        });
    }

    return {
        init: init,
        navigateTo: navigateTo,
        startLevel: startLevel,
        startEndless: startEndless
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

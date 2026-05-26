var Animations = (function() {
    var enabled = true;

    function loadSettings() {
        var settings = Storage.getSettings();
        enabled = settings.animation !== false;
    }

    function spawnParticles(x, y, color, count) {
        if (!enabled) return;
        count = count || 8;
        for (var i = 0; i < count; i++) {
            var p = document.createElement('div');
            p.className = 'particle';
            var size = Math.random() * 8 + 4;
            var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
            var dist = Math.random() * 60 + 30;
            var px = Math.cos(angle) * dist;
            var py = Math.sin(angle) * dist;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.background = color || '#667eea';
            p.style.setProperty('--px', px + 'px');
            p.style.setProperty('--py', py + 'px');
            document.body.appendChild(p);
            (function(el) {
                setTimeout(function() {
                    if (el.parentNode) el.parentNode.removeChild(el);
                }, 800);
            })(p);
        }
    }

    function showFloatScore(x, y, score) {
        if (!enabled) return;
        var el = document.createElement('div');
        el.className = 'float-score';
        el.textContent = '+' + score;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        document.body.appendChild(el);
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 800);
    }

    function animateCellMerge(cellEl) {
        if (!enabled || !cellEl) return;
        cellEl.classList.remove('merge-anim');
        void cellEl.offsetWidth;
        cellEl.classList.add('merge-anim');
        setTimeout(function() {
            cellEl.classList.remove('merge-anim');
        }, 350);
    }

    function animateCellEliminate(cellEl, callback) {
        if (!cellEl) { if (callback) callback(); return; }
        cellEl.classList.add('eliminate-anim');
        setTimeout(function() {
            if (callback) callback();
        }, 500);
    }

    function shakeBoard(boardEl) {
        if (!enabled || !boardEl) return;
        boardEl.style.animation = 'none';
        void boardEl.offsetWidth;
        boardEl.style.animation = 'shake 0.3s ease';
        setTimeout(function() {
            boardEl.style.animation = '';
        }, 300);
    }

    function addRipple(btnEl, x, y) {
        if (!enabled || !btnEl) return;
        var rect = btnEl.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'ripple';
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (x - rect.left - size / 2) + 'px';
        ripple.style.top = (y - rect.top - size / 2) + 'px';
        btnEl.style.position = btnEl.style.position || 'relative';
        btnEl.style.overflow = 'hidden';
        btnEl.appendChild(ripple);
        setTimeout(function() {
            if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 600);
    }

    function celebrateWin() {
        if (!enabled) return;
        var colors = ['#667eea', '#f093fb', '#4fd1c5', '#ffd700', '#fc8181', '#48bb78'];
        for (var i = 0; i < 30; i++) {
            (function(idx) {
                setTimeout(function() {
                    var x = Math.random() * window.innerWidth;
                    var y = Math.random() * window.innerHeight * 0.5;
                    var color = colors[Math.floor(Math.random() * colors.length)];
                    spawnParticles(x, y, color, 4);
                }, idx * 80);
            })(i);
        }
    }

    var shakeKeyframes = '@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }';
    var styleSheet = document.createElement('style');
    styleSheet.textContent = shakeKeyframes;
    document.head.appendChild(styleSheet);

    function createHomeParticles() {
        if (!enabled) return;
        var container = document.getElementById('homeParticles');
        if (!container) return;
        container.innerHTML = '';
        for (var i = 0; i < 20; i++) {
            var dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.width = dot.style.height = (Math.random() * 6 + 3) + 'px';
            dot.style.borderRadius = '50%';
            dot.style.background = 'rgba(255,255,255,' + (Math.random() * 0.3 + 0.1) + ')';
            dot.style.left = Math.random() * 100 + '%';
            dot.style.top = Math.random() * 100 + '%';
            dot.style.animation = 'particleFloat ' + (Math.random() * 4 + 3) + 's ease-in-out infinite';
            dot.style.animationDelay = (Math.random() * 3) + 's';
            container.appendChild(dot);
        }
        var floatStyle = '@keyframes particleFloat { 0%,100%{transform:translateY(0) translateX(0);opacity:0.3} 50%{transform:translateY(-20px) translateX(10px);opacity:0.7} }';
        var s = document.createElement('style');
        s.textContent = floatStyle;
        document.head.appendChild(s);
    }

    loadSettings();

    return {
        spawnParticles: spawnParticles,
        showFloatScore: showFloatScore,
        animateCellMerge: animateCellMerge,
        animateCellEliminate: animateCellEliminate,
        shakeBoard: shakeBoard,
        addRipple: addRipple,
        celebrateWin: celebrateWin,
        createHomeParticles: createHomeParticles,
        loadSettings: loadSettings
    };
})();

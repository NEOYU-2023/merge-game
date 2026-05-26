var Audio = (function() {
    var audioCtx = null;
    var settings = { sound: true, music: true };
    var bgMusicOsc = null;
    var bgMusicGain = null;

    function getContext() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function loadSettings() {
        settings = Storage.getSettings();
    }

    function playTone(freq, duration, type, volume) {
        if (!settings.sound) return;
        var ctx = getContext();
        if (!ctx) return;
        try {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(volume || 0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.15));
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + (duration || 0.15));
        } catch (e) {}
    }

    function playMerge(value) {
        var freqMap = {
            2: 523, 3: 587, 4: 659, 5: 698,
            6: 784, 7: 880, 8: 988, 9: 1047, 10: 1175
        };
        var freq = freqMap[value] || 523;
        playTone(freq, 0.2, 'sine', 0.12);
        setTimeout(function() {
            playTone(freq * 1.25, 0.15, 'sine', 0.08);
        }, 80);
    }

    function playEliminate() {
        playTone(880, 0.1, 'square', 0.08);
        setTimeout(function() { playTone(1100, 0.1, 'square', 0.08); }, 60);
        setTimeout(function() { playTone(1320, 0.15, 'square', 0.06); }, 120);
    }

    function playSlide() {
        playTone(300, 0.06, 'sine', 0.05);
    }

    function playClick() {
        playTone(600, 0.05, 'sine', 0.08);
    }

    function playWin() {
        var notes = [523, 659, 784, 1047];
        notes.forEach(function(freq, i) {
            setTimeout(function() {
                playTone(freq, 0.25, 'sine', 0.1);
            }, i * 150);
        });
    }

    function playFail() {
        var notes = [400, 350, 300, 250];
        notes.forEach(function(freq, i) {
            setTimeout(function() {
                playTone(freq, 0.2, 'sine', 0.08);
            }, i * 150);
        });
    }

    function startBgMusic() {
        if (!settings.music) return;
        stopBgMusic();
        var ctx = getContext();
        if (!ctx) return;
        try {
            bgMusicOsc = ctx.createOscillator();
            bgMusicGain = ctx.createGain();
            bgMusicOsc.type = 'sine';
            bgMusicOsc.frequency.setValueAtTime(220, ctx.currentTime);
            bgMusicGain.gain.setValueAtTime(0.02, ctx.currentTime);
            bgMusicOsc.connect(bgMusicGain);
            bgMusicGain.connect(ctx.destination);
            bgMusicOsc.start();
        } catch (e) {}
    }

    function stopBgMusic() {
        try {
            if (bgMusicOsc) {
                bgMusicOsc.stop();
                bgMusicOsc = null;
            }
        } catch (e) {}
    }

    function updateSettings(newSettings) {
        settings = newSettings;
        if (!settings.music) {
            stopBgMusic();
        }
    }

    loadSettings();

    return {
        playMerge: playMerge,
        playEliminate: playEliminate,
        playSlide: playSlide,
        playClick: playClick,
        playWin: playWin,
        playFail: playFail,
        startBgMusic: startBgMusic,
        stopBgMusic: stopBgMusic,
        updateSettings: updateSettings,
        getContext: getContext
    };
})();

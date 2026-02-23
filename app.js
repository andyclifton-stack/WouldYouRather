/* ═══════════════════════════════════════════════
   WOULD YOU RATHER — Main Application
   ═══════════════════════════════════════════════ */

import { getTopicNames, generateRounds, getOptionImageUrl, preloadRoundImages } from './topics.js';
import { swoosh, lockIn, tick, urgentTick, revealSting, matchChime, clashBuzz, celebration, unlockAudio } from './audio.js';

/* ═══════════ FIREBASE INIT ═══════════ */
const firebaseConfig = {
    apiKey: "AIza" + "SyDjEu" + "71FYxr8" + "Ebqhd3fy" + "SP-4qx" + "uWNxSC6Q",
    authDomain: "finger-of-shame.firebaseapp.com",
    projectId: "finger-of-shame",
    storageBucket: "finger-of-shame.firebasestorage.app",
    messagingSenderId: "940288270460",
    appId: "1:940288270460:web:fb2681477c29523b7269f9",
    databaseURL: "https://finger-of-shame-default-rtdb.europe-west1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ═══════════ LOCAL STATE ═══════════ */
let localPlayerId = localStorage.getItem('wyr_player_id');
if (!localPlayerId) {
    localPlayerId = 'wyr_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('wyr_player_id', localPlayerId);
}

let gameCode = '';
let gameRef = null;
let gameState = null;
let myRole = null; // 'player1' | 'player2'
let countdownInterval = null;
let countdownActive = false;
let hasChosen = false;
let roundHistory = []; // { p1Choice, p2Choice, optionA, optionB, matched }

/* ═══════════ DOM REFS ═══════════ */
const $ = id => document.getElementById(id);

/* ═══════════ PARTICLES ═══════════ */
function spawnParticles() {
    const container = $('particles');
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 5 + 2;
        const left = Math.random() * 100;
        const dur = Math.random() * 15 + 10;
        const delay = Math.random() * 10;
        const hue = Math.random() > 0.5 ? '280' : '330';
        p.style.cssText = `width:${size}px;height:${size}px;left:${left}%;animation-duration:${dur}s;animation-delay:${delay}s;background:hsl(${hue},70%,60%)`;
        container.appendChild(p);
    }
}

/* ═══════════ SCREEN MANAGEMENT ═══════════ */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
}

/* ═══════════ SPLASH ═══════════ */
function initSplash() {
    spawnParticles();
    setTimeout(() => {
        showScreen('screen-lobby');
        swoosh();
    }, 2600);
}

/* ═══════════ LOBBY SETUP ═══════════ */
function initLobby() {
    // Populate topics
    const select = $('topic-select');
    getTopicNames().forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    // Slider
    const slider = $('round-slider');
    const badge = $('round-count');
    slider.addEventListener('input', () => {
        badge.textContent = slider.value;
    });

    // Tabs
    $('tab-create').addEventListener('click', () => switchTab('create'));
    $('tab-join').addEventListener('click', () => switchTab('join'));

    // Create game
    $('btn-create-game').addEventListener('click', createGame);

    // Join game
    $('btn-join-game').addEventListener('click', joinGame);

    // Code digit inputs (auto-focus next)
    const digits = document.querySelectorAll('.code-digit');
    digits.forEach((input, i) => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g, '');
            if (input.value && i < digits.length - 1) {
                digits[i + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && i > 0) {
                digits[i - 1].focus();
            }
        });
    });

    // Check URL for join code
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode && urlCode.length === 4) {
        switchTab('join');
        const codeDigits = urlCode.split('');
        digits.forEach((d, i) => { d.value = codeDigits[i] || ''; });
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    $(`tab-${tab}`).classList.add('active');
    $(`panel-${tab}`).classList.add('active');
}

/* ═══════════ CREATE GAME ═══════════ */
function createGame() {
    const name = $('player-name-create').value.trim();
    if (!name) { $('player-name-create').focus(); return; }

    const topic = $('topic-select').value;
    const totalRounds = parseInt($('round-slider').value);
    const rounds = generateRounds(topic, totalRounds);

    // 4-digit numeric code
    gameCode = String(Math.floor(1000 + Math.random() * 9000));
    myRole = 'player1';

    const sessionData = {
        topic,
        totalRounds,
        currentRound: 0,
        rounds,
        player1: { id: localPlayerId, name, choice: null, ready: false },
        player2: null,
        phase: 'waiting',
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    gameRef = db.ref('wyr-games/' + gameCode);
    gameRef.set(sessionData).then(() => {
        showWaitingRoom(name);
        listenForUpdates();
        preloadAllRoundImages(rounds, topic);
        lockIn();
    }).catch(err => {
        console.error('Create failed:', err);
        alert('Failed to create game. Try again.');
    });
}

/* ═══════════ JOIN GAME ═══════════ */
function joinGame() {
    const name = $('player-name-join').value.trim();
    if (!name) { $('player-name-join').focus(); return; }

    const digits = document.querySelectorAll('.code-digit');
    gameCode = Array.from(digits).map(d => d.value).join('');
    if (gameCode.length !== 4) { digits[0].focus(); return; }

    gameRef = db.ref('wyr-games/' + gameCode);
    gameRef.once('value', snap => {
        const data = snap.val();
        if (!data) {
            alert('Game not found! Check the code.');
            return;
        }
        if (data.player2) {
            alert('Game is full!');
            return;
        }

        myRole = 'player2';
        gameRef.update({
            player2: { id: localPlayerId, name, choice: null, ready: false },
            phase: 'playing'
        }).then(() => {
            listenForUpdates();
            preloadAllRoundImages(data.rounds, data.topic);
            lockIn();
        });
    });
}

/* ═══════════ WAITING ROOM ═══════════ */
function showWaitingRoom(myName) {
    showScreen('screen-waiting');
    $('display-code').textContent = gameCode;
    $('p1-name').textContent = myName;
    $('p1-status').textContent = 'Ready';
    $('p1-status').classList.add('ready');

    // WhatsApp share
    const shareUrl = window.location.href.split('?')[0] + '?code=' + gameCode;
    $('btn-share-whatsapp').onclick = () => {
        const msg = `🤔 Would You Rather?\n\nJoin my game! Code: ${gameCode}\n${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };
}

/**
 * Pre-warm all Pollinations images for every round.
 * Called during waiting room so images are browser-cached by game start.
 */
function preloadAllRoundImages(rounds, topic) {
    if (!rounds) return;
    console.log(`Pre-warming ${rounds.length * 2} AI images...`);
    rounds.forEach((round, i) => {
        // Stagger requests slightly to avoid overwhelming Pollinations
        setTimeout(() => {
            const imgA = new Image();
            imgA.src = getOptionImageUrl(round.optionA, topic);
            const imgB = new Image();
            imgB.src = getOptionImageUrl(round.optionB, topic);
        }, i * 300); // 300ms gap between each round's pair
    });
}

/* ═══════════ FIREBASE LISTENER ═══════════ */
function listenForUpdates() {
    gameRef.on('value', snap => {
        const data = snap.val();
        if (!data) return;
        gameState = data;
        handleStateChange();
    });
}

function handleStateChange() {
    const { phase } = gameState;

    if (phase === 'waiting') {
        if (myRole === 'player1') {
            // Still in waiting room, update P2 status
            if (gameState.player2) {
                $('p2-name').textContent = gameState.player2.name;
                $('p2-status').textContent = 'Ready';
                $('p2-status').classList.add('ready');
                // Auto-start after brief delay
                setTimeout(() => {
                    if (gameState.phase === 'waiting' && gameState.player2) {
                        gameRef.update({ phase: 'playing' });
                    }
                }, 1500);
            }
        }
        showScreen('screen-waiting');
        return;
    }

    if (phase === 'playing') {
        showRound();
        return;
    }

    if (phase === 'reveal') {
        showReveal();
        return;
    }

    if (phase === 'finale') {
        showFinale();
        return;
    }
}

/* ═══════════ IMAGE LOADER ═══════════ */
function loadOptionImage(imgId, shimmerId, option, topic) {
    const img = $(imgId);
    const shimmer = $(shimmerId);
    const url = getOptionImageUrl(option, topic);

    // Reset state
    img.classList.remove('loaded');
    shimmer.classList.remove('hidden');

    // Set src directly on the <img> element — avoids ORB issues with redirects
    img.onload = () => {
        img.classList.add('loaded');
        shimmer.classList.add('hidden');
    };
    img.onerror = () => {
        shimmer.classList.add('hidden');
    };
    img.src = url;
}

/* ═══════════ GAME ROUND ═══════════ */
function showRound() {
    const round = gameState.rounds[gameState.currentRound];
    if (!round) return;

    showScreen('screen-game');

    // Update round label
    $('round-label').textContent = `Round ${gameState.currentRound + 1} / ${gameState.totalRounds}`;

    // Set options
    $('option-a-text').textContent = round.optionA;
    $('option-b-text').textContent = round.optionB;

    // Load AI images for each option
    loadOptionImage('img-a', 'shimmer-a', round.optionA, gameState.topic);
    loadOptionImage('img-b', 'shimmer-b', round.optionB, gameState.topic);

    // Preload next round images
    if (gameState.currentRound < gameState.totalRounds - 1) {
        const nextRound = gameState.rounds[gameState.currentRound + 1];
        if (nextRound) {
            preloadRoundImages(nextRound.optionA, nextRound.optionB, gameState.topic);
        }
    }

    // Reset choice state
    const myData = gameState[myRole];
    hasChosen = myData && myData.choice != null;

    $('choice-a').classList.remove('selected', 'disabled');
    $('choice-b').classList.remove('selected', 'disabled');

    if (hasChosen) {
        const chosen = myData.choice;
        if (chosen === 'A') {
            $('choice-a').classList.add('selected');
            $('choice-b').classList.add('disabled');
        } else {
            $('choice-b').classList.add('selected');
            $('choice-a').classList.add('disabled');
        }
    }

    // Opponent status
    const oppRole = myRole === 'player1' ? 'player2' : 'player1';
    const oppData = gameState[oppRole];
    if (oppData && oppData.choice != null) {
        $('opp-status-text').textContent = `${oppData.name} has locked in!`;
        document.querySelector('.opp-dot').classList.add('locked');
    } else if (oppData) {
        $('opp-status-text').textContent = `${oppData.name} is choosing...`;
        document.querySelector('.opp-dot').classList.remove('locked');
    }

    // Check if both chose — trigger reveal
    const p1Chose = gameState.player1?.choice != null;
    const p2Chose = gameState.player2?.choice != null;

    if (p1Chose && p2Chose) {
        scheduleRevealTransition(800);
        return;
    }

    // Start 10s countdown ONLY if one player has locked in
    if (p1Chose || p2Chose) {
        startCountdown();
    } else {
        resetCountdown();
    }
}

/* ═══════════ CHOICE HANDLERS ═══════════ */
function makeChoice(choice, isRandom = false) {
    if (hasChosen) return;
    hasChosen = true;
    if (!isRandom) lockIn();

    gameRef.child(myRole).update({ choice, isRandom });

    // Update UI immediately
    if (choice === 'A') {
        $('choice-a').classList.add('selected');
        $('choice-b').classList.add('disabled');
    } else {
        $('choice-b').classList.add('selected');
        $('choice-a').classList.add('disabled');
    }
}

$('choice-a').addEventListener('click', () => makeChoice('A'));
$('choice-b').addEventListener('click', () => makeChoice('B'));

/* ═══════════ COUNTDOWN ═══════════ */
function resetCountdown() {
    clearInterval(countdownInterval);
    countdownActive = false;
    const ring = $('ring-progress');
    const num = $('countdown-num');
    ring.style.strokeDashoffset = 0;
    ring.classList.remove('danger');
    num.textContent = '∞';
}

function startCountdown() {
    if (countdownActive) return;
    countdownActive = true;
    clearInterval(countdownInterval);

    let timeLeft = 10;
    const circumference = 2 * Math.PI * 45; // r=45 in SVG
    const ring = $('ring-progress');
    const num = $('countdown-num');

    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = 0;
    ring.classList.remove('danger');
    num.textContent = timeLeft;

    countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            countdownActive = false;
            num.textContent = '0';
            ring.style.strokeDashoffset = circumference;
            handleTimeout();
            return;
        }

        num.textContent = timeLeft;
        const progress = (10 - timeLeft) / 10;
        ring.style.strokeDashoffset = circumference * progress;

        if (timeLeft <= 3) {
            ring.classList.add('danger');
            urgentTick();
        } else {
            ring.classList.remove('danger');
            tick();
        }
    }, 1000);
}

function handleTimeout() {
    if (!hasChosen) {
        // Auto-select random
        const randomChoice = Math.random() > 0.5 ? 'A' : 'B';
        makeChoice(randomChoice, true);
    }

    // Any connected player can safely promote to reveal once both are locked.
    scheduleRevealTransition(1200);
}

function scheduleRevealTransition(delayMs = 0) {
    setTimeout(() => {
        gameRef.once('value', snap => {
            const data = snap.val();
            if (!data || data.phase !== 'playing') return;
            const p1Chose = data.player1?.choice != null;
            const p2Chose = data.player2?.choice != null;
            if (p1Chose && p2Chose) {
                gameRef.update({ phase: 'reveal' });
            }
        });
    }, delayMs);
}

/* ═══════════ REVEAL ═══════════ */
function showReveal() {
    clearInterval(countdownInterval);
    showScreen('screen-reveal');
    revealSting();

    const p1 = gameState.player1;
    const p2 = gameState.player2;
    const round = gameState.rounds[gameState.currentRound];

    const p1Choice = p1.choice === 'A' ? round.optionA : round.optionB;
    const p2Choice = p2.choice === 'A' ? round.optionA : round.optionB;
    const matched = p1.choice === p2.choice;

    // Store result locally
    const result = { p1Choice, p2Choice, optionA: round.optionA, optionB: round.optionB, matched };
    roundHistory[gameState.currentRound] = result;

    $('reveal-p1-name').textContent = p1.name;
    $('reveal-p2-name').textContent = p2.name;
    $('reveal-p1-choice').textContent = p1Choice;
    $('reveal-p2-choice').textContent = p2Choice;

    // Show random pick badges
    if (p1.isRandom) $('reveal-p1-random').classList.add('show');
    else $('reveal-p1-random').classList.remove('show');

    if (p2.isRandom) $('reveal-p2-random').classList.add('show');
    else $('reveal-p2-random').classList.remove('show');

    const tag = $('reveal-result-tag');
    const msgEl = $('reveal-message');

    if (matched) {
        tag.textContent = 'MATCH! ✨';
        tag.className = 'reveal-tag match';
        msgEl.textContent = 'Great minds think alike!';
        setTimeout(() => matchChime(), 400);
    } else {
        tag.textContent = 'CLASH! 💥';
        tag.className = 'reveal-tag clash';
        msgEl.textContent = 'Opposites attract... right?';
        setTimeout(() => clashBuzz(), 400);
    }

    // Next round button — only player1 (the host) controls progression
    const nextBtn = $('btn-next-round');
    const waitMsg = $('reveal-wait-msg');
    const isLastRound = gameState.currentRound >= gameState.totalRounds - 1;
    nextBtn.querySelector('span').textContent = isLastRound ? 'See Results' : 'Next Round';

    if (myRole === 'player1') {
        nextBtn.style.display = '';
        if (waitMsg) waitMsg.style.display = 'none';
    } else {
        nextBtn.style.display = 'none';
        if (waitMsg) waitMsg.style.display = '';
    }

    nextBtn.onclick = () => {
        // Write this round's history ATOMICALLY with the phase change
        // so it's guaranteed to arrive at all devices together
        const update = {
            [`history/${gameState.currentRound}`]: result
        };

        if (isLastRound) {
            update.phase = 'finale';
        } else {
            update.currentRound = gameState.currentRound + 1;
            update.phase = 'playing';
            update['player1/choice'] = null;
            update['player2/choice'] = null;
        }

        gameRef.update(update);
        hasChosen = false;
        swoosh();
    };
}

/* ═══════════ FINALE ═══════════ */
function showFinale() {
    clearInterval(countdownInterval);
    showScreen('screen-finale');
    celebration();

    // Read history from Firebase (written atomically with phase transitions)
    // Falls back to local roundHistory if Firebase entry is missing
    const historyData = gameState.history || {};
    const history = [];
    for (let i = 0; i < (gameState.totalRounds || 0); i++) {
        if (historyData[i]) {
            history.push(historyData[i]);
        } else if (roundHistory[i]) {
            history.push(roundHistory[i]);
        }
    }

    const total = Math.max(1, history.length);
    const matches = history.filter(r => r.matched).length;
    const clashes = history.length - matches;
    const pct = Math.round((matches / total) * 100);

    // Fun title
    let title, emoji;
    if (pct >= 90) { title = 'Soulmates'; emoji = '💕'; }
    else if (pct >= 70) { title = 'Two Peas in a Pod'; emoji = '🫛'; }
    else if (pct >= 50) { title = 'Friendly Rivals'; emoji = '⚔️'; }
    else if (pct >= 30) { title = 'Polar Opposites'; emoji = '🧲'; }
    else { title = 'Chaotic Duo'; emoji = '🌪️'; }

    $('finale-emoji').textContent = emoji;
    $('finale-title').textContent = title;

    // Animated counters
    animateCount('finale-pct', 0, pct, '%');
    animateCount('stat-matches', 0, matches);
    animateCount('stat-clashes', 0, clashes);

    // Round breakdown
    const breakdown = $('round-breakdown');
    breakdown.innerHTML = '';
    roundHistory.forEach((r, i) => {
        if (!r) return;
        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `
      <span class="br-round">${i + 1}</span>
      <span class="br-choice">${r.optionA} vs ${r.optionB}</span>
      <span class="br-result ${r.matched ? 'match' : 'clash'}">${r.matched ? '✓ Match' : '✗ Clash'}</span>
    `;
        breakdown.appendChild(row);
    });

    // Confetti
    startConfetti();

    // Play Again — only shown to player1 (host), player2 sees a waiting message
    const playAgainBtn = $('btn-play-again');
    const finaleWaitMsg = $('finale-wait-msg');
    if (myRole === 'player1') {
        playAgainBtn.style.display = '';
        if (finaleWaitMsg) finaleWaitMsg.style.display = 'none';
        playAgainBtn.onclick = () => {
            roundHistory = [];
            gameRef.remove();
            showScreen('screen-lobby');
        };
    } else {
        playAgainBtn.style.display = 'none';
        if (finaleWaitMsg) finaleWaitMsg.style.display = '';
    }

    // Share Results (both players can share)
    $('btn-share-results').onclick = () => {
        const msg = `🤔 Would You Rather?\n\n${gameState.player1.name} & ${gameState.player2.name}\n📊 ${pct}% similarity — "${title}" ${emoji}\n✅ ${matches} matches / ❌ ${clashes} clashes\n\nPlay: ${window.location.href.split('?')[0]}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };
}



function animateCount(elementId, from, to, suffix = '') {
    const el = $(elementId);
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(from + (to - from) * eased);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

/* ═══════════ CONFETTI ═══════════ */
function startConfetti() {
    const canvas = $('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#7c3aed', '#ec4899', '#06b6d4', '#22c55e', '#f59e0b', '#f43f5e'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 8 + 4,
            h: Math.random() * 6 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 3 + 2,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        });
    }

    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotSpeed;
            p.vy += 0.05;
            if (frame > 120) p.opacity -= 0.008;
            if (p.opacity <= 0) return;
            alive = true;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });

        frame++;
        if (alive && frame < 400) requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(draw);
}

/* ═══════════ AUDIO UNLOCK ═══════════ */
document.addEventListener('click', () => unlockAudio(), { once: true });

/* ═══════════ INIT ═══════════ */
initLobby();
initSplash();

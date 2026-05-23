// ==========================================
// CONFIGURATION & STATE
// ==========================================
let audioCtx = null;
let bgMusic = null;
let isAudioPlaying = false;
let currentMessageIndex = 0;
let animationFrameId = null;

// Blessings library
const blessings = [
    "Made for each other! ❤️",
    "Wishing you lifetime happiness! ✨",
    "Perfect Couple! 👑",
    "Cheer to endless love! 🥂",
    "Stay blessed forever! 🌸",
    "Happy Together! 💕",
    "Best Couple Ever! 🌟",
    "Love, Laughter & Happily Ever After! 🌹",
    "May your bond grow stronger! 💍",
    "Warmest wishes to you both! 🎉"
];

// Document Elements
const waxSeal = document.getElementById('waxSeal');
const envelope = document.getElementById('envelope');
const envelopeWrapper = document.getElementById('envelopeWrapper');
const mainCardContainer = document.getElementById('mainCardContainer');
const audioBtn = document.getElementById('audioBtn');
const visualizer = document.getElementById('visualizer');
const messageFader = document.getElementById('messageFader');
const messages = document.querySelectorAll('.message');
const blessBtn = document.getElementById('blessBtn');
const replayBtn = document.getElementById('replayBtn');
const blessingsOverlay = document.getElementById('blessingsOverlay');
const interactiveFrame = document.getElementById('interactiveFrame');
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==========================================
// AUDIO SYSTEM (MP3 BGM & SYNTH EFFECTS)
// ==========================================
function initAudio() {
    // Initialize Web Audio API for interactive chime effects
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Setup reverb/delay for sound effects
        const delay = audioCtx.createDelay(1.0);
        const delayGain = audioCtx.createGain();
        const sfxVolume = audioCtx.createGain();

        delay.delayTime.value = 0.25;
        delayGain.gain.value = 0.3;
        sfxVolume.gain.value = 0.15; // Soft chime effect volume

        delay.connect(delayGain);
        delayGain.connect(delay);
        delay.connect(sfxVolume);
        sfxVolume.connect(audioCtx.destination);

        const directVolume = audioCtx.createGain();
        directVolume.gain.value = 0.5;
        directVolume.connect(sfxVolume);

        audioCtx.sfxVolume = sfxVolume;
        audioCtx.directVolume = directVolume;
        audioCtx.delay = delay;
    }

    // Initialize MP3 Background Music
    if (!bgMusic) {
        bgMusic = new Audio('romantic-music.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.5; // Balanced volume for background
    }
}

// Synth engine for sound effects (clicks / blessings / chimes)
function playTone(freq, time, duration) {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    
    // Sub-oscillator for chime warmth
    const subOsc = audioCtx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.value = freq / 2;
    const subGain = audioCtx.createGain();
    subGain.gain.value = 0.15;

    osc.frequency.value = freq;

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.4, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gainNode);
    subOsc.connect(subGain);
    subGain.connect(gainNode);

    gainNode.connect(audioCtx.directVolume);
    gainNode.connect(audioCtx.delay);

    osc.start(time);
    osc.stop(time + duration);
    subOsc.start(time);
    subOsc.stop(time + duration);
}

function midiToFreq(note) {
    if (note === 0) return 0;
    return 440 * Math.pow(2, (note - 69) / 12);
}

function playOpeningChime() {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    const chimeNotes = [60, 64, 67, 72, 76, 79, 84, 88]; // Upward harp sweep
    chimeNotes.forEach((note, index) => {
        const time = now + index * 0.05;
        const freq = midiToFreq(note);
        playTone(freq, time, 1.0);
    });
}

function startMelodyLoop() {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (bgMusic) {
        bgMusic.play().catch(err => console.log("Music play failed:", err));
    }
    
    isAudioPlaying = true;
    audioBtn.classList.remove('muted');
    audioBtn.querySelector('.icon-play').style.display = 'none';
    audioBtn.querySelector('.icon-mute').style.display = 'block';
    visualizer.classList.add('active');
}

function stopMelodyLoop() {
    if (bgMusic) {
        bgMusic.pause();
    }
    isAudioPlaying = false;
    audioBtn.classList.add('muted');
    audioBtn.querySelector('.icon-play').style.display = 'block';
    audioBtn.querySelector('.icon-mute').style.display = 'none';
    visualizer.classList.remove('active');
}

// Toggle audio control
audioBtn.addEventListener('click', () => {
    if (isAudioPlaying) {
        stopMelodyLoop();
    } else {
        startMelodyLoop();
    }
});


// ==========================================
// PARTICLE CANVAS ANIMATION SYSTEM
// ==========================================
// Beautiful falling rose petals and glittering gold dust
const petals = [];
const sparkles = [];

class Petal {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height; // Distribute initial petals
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * 12 + 8;
        this.speedY = Math.random() * 1.5 + 0.8;
        this.speedX = Math.random() * 1.5 - 0.75;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.02 - 0.01;
        this.opacity = Math.random() * 0.5 + 0.4;
        
        // Random romantic colors: pink, deep rose, crimson
        const colors = [
            'rgba(177, 29, 77, ',   // Deep burgundy/pink
            'rgba(211, 45, 97, ',   // Bright pink
            'rgba(235, 120, 150, ', // Rose pink
            'rgba(124, 13, 48, '    // Wine red
        ];
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.y / 30) * 0.5; // Swaying motion
        this.angle += this.rotationSpeed;

        if (this.y > canvas.height + 20) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        
        // Draw an organic petal shape using curves
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size, -this.size / 2, -this.size, this.size, 0, this.size * 1.5);
        ctx.bezierCurveTo(this.size, this.size, this.size, -this.size / 2, 0, 0);

        ctx.fillStyle = this.colorBase + this.opacity + ')';
        ctx.fill();
        ctx.restore();
    }
}

class Sparkle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedY = Math.random() * 0.4 + 0.1;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.opacity = Math.random() * 0.6 + 0.2;
        this.fadeSpeed = Math.random() * 0.01 + 0.005;
        this.glow = Math.random() > 0.5;
    }

    update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        
        // Twinkling effect
        if (this.glow) {
            this.opacity += 0.02;
            if (this.opacity >= 0.9) this.glow = false;
        } else {
            this.opacity -= this.fadeSpeed;
            if (this.opacity <= 0.1) this.glow = true;
        }

        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
            this.reset();
            this.y = canvas.height + 10;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Golden sparkling colors
        ctx.fillStyle = `rgba(235, 208, 123, ${this.opacity})`;
        ctx.shadowBlur = this.size * 3;
        ctx.shadowColor = '#d4af37';
        ctx.fill();
        ctx.shadowBlur = 0; // reset
    }
}

// Initialize particles
function initParticles() {
    petals.length = 0;
    sparkles.length = 0;
    
    const petalCount = Math.min(60, Math.floor(window.innerWidth / 20));
    const sparkleCount = Math.min(80, Math.floor(window.innerWidth / 15));

    for (let i = 0; i < petalCount; i++) {
        petals.push(new Petal());
    }
    for (let i = 0; i < sparkleCount; i++) {
        sparkles.push(new Sparkle());
    }
}

// Particle Loop
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw and update sparkles
    for (let i = 0; i < sparkles.length; i++) {
        sparkles[i].update();
        sparkles[i].draw();
    }

    // Draw and update petals
    for (let i = 0; i < petals.length; i++) {
        petals[i].update();
        petals[i].draw();
    }

    animationFrameId = requestAnimationFrame(animateParticles);
}

// ==========================================
// MESSAGE ROTATOR
// ==========================================
function startMessageRotation() {
    setInterval(() => {
        // Fade out current message
        messages[currentMessageIndex].classList.remove('active');
        
        // Next message index
        currentMessageIndex = (currentMessageIndex + 1) % messages.length;
        
        // Fade in new message
        messages[currentMessageIndex].classList.add('active');
    }, 6000);
}

// ==========================================
// INTERACTIVE PHOTO TILT PARALLAX
// ==========================================
if (window.innerWidth > 768) {
    interactiveFrame.addEventListener('mousemove', (e) => {
        const rect = interactiveFrame.getBoundingClientRect();
        
        // Mouse coordinate relative to the frame
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Normalize coordinates to [-1, 1]
        const normX = (x / rect.width) * 2 - 1;
        const normY = (y / rect.height) * 2 - 1;
        
        // Calculate rotation angles (max 12 degrees)
        const rotateY = normX * 10;
        const rotateX = -normY * 10;
        
        // Apply transform
        interactiveFrame.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        interactiveFrame.querySelector('.gold-rim').style.boxShadow = `
            ${-normX * 15}px ${-normY * 15}px 30px rgba(0,0,0,0.6),
            0 0 25px rgba(212, 175, 55, 0.3)
        `;
    });

    interactiveFrame.addEventListener('mouseleave', () => {
        interactiveFrame.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        interactiveFrame.querySelector('.gold-rim').style.boxShadow = '0 15px 35px rgba(0,0,0,0.5), inset 0 0 15px rgba(212, 175, 55, 0.4)';
    });
}

// ==========================================
// EVENT HANDLERS & FLOW
// ==========================================

// Handle envelope click to open
waxSeal.addEventListener('click', openEnvelope);
envelope.addEventListener('click', (e) => {
    // Only open if seal is clicked or top flap is not yet open
    if (!envelope.classList.contains('open')) {
        openEnvelope();
    }
});

function openEnvelope() {
    if (envelope.classList.contains('open')) return;
    
    // Play chime sound
    playOpeningChime();
    
    // Start opening class animation
    envelope.classList.add('open');
    
    // Transition to main card
    setTimeout(() => {
        envelopeWrapper.classList.add('fade-out');
        
        setTimeout(() => {
            envelopeWrapper.style.display = 'none';
            mainCardContainer.style.display = 'block';
            mainCardContainer.classList.add('fade-in');
            audioBtn.style.display = 'flex';
            
            // Start components
            initParticles();
            animateParticles();
            startMelodyLoop();
            startMessageRotation();
            
            // Trigger initial blessings explosion
            triggerBlessingsBurst(6);
        }, 1000);
    }, 1500);
}

// Replay Animation
replayBtn.addEventListener('click', () => {
    // Stop audio & loop
    stopMelodyLoop();
    cancelAnimationFrame(animationFrameId);
    
    // Hide main card
    mainCardContainer.style.display = 'none';
    mainCardContainer.classList.remove('fade-in');
    audioBtn.style.display = 'none';
    
    // Reset envelope
    envelope.classList.remove('open');
    envelopeWrapper.style.display = 'flex';
    envelopeWrapper.classList.remove('fade-out');
});

// Blessings Burst
blessBtn.addEventListener('click', () => {
    triggerBlessingsBurst(5);
    // Synth a sweet high chord sound when sending blessings
    if (audioCtx && audioCtx.state !== 'suspended') {
        const now = audioCtx.currentTime;
        const notes = [72, 76, 79, 84]; // C5 major arpeggio
        notes.forEach((note, index) => {
            playTone(midiToFreq(note), now + index * 0.05, 0.8);
        });
    }
});

function triggerBlessingsBurst(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            createFloatingBlessing();
        }, i * 300);
    }
}

function createFloatingBlessing() {
    const el = document.createElement('div');
    el.className = 'floating-blessing';
    
    // Random blessing text
    el.textContent = blessings[Math.floor(Math.random() * blessings.length)];
    
    // Random horizontal position and speed
    const startX = Math.random() * 80 + 10; // 10% to 90%
    el.style.left = `${startX}%`;
    
    // Randomize vertical speed and size
    const duration = Math.random() * 2 + 3; // 3s to 5s
    el.style.animationDuration = `${duration}s`;
    
    blessingsOverlay.appendChild(el);
    
    // Remove element when animation completes
    setTimeout(() => {
        el.remove();
    }, duration * 1000);
}

// Click anywhere to spawn floating heart
document.body.addEventListener('mousedown', (e) => {
    // Don't spawn hearts on buttons
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.wax-seal') || e.target.closest('.audio-control')) return;
    
    const heart = document.createElement('div');
    heart.className = 'click-heart';
    
    // Random heart emoji or spark
    const shapes = ['❤️', '💖', '✨', '💕', '🌸', '💛'];
    heart.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    
    heart.style.left = `${e.clientX}px`;
    heart.style.top = `${e.clientY}px`;
    
    document.body.appendChild(heart);
    
    // Play a tiny sweet harp note on click
    if (audioCtx && audioCtx.state !== 'suspended' && isAudioPlaying) {
        const clickNotes = [72, 74, 76, 79, 81, 84];
        const randomNote = clickNotes[Math.floor(Math.random() * clickNotes.length)];
        playTone(midiToFreq(randomNote), audioCtx.currentTime, 0.5);
    }

    setTimeout(() => {
        heart.remove();
    }, 1000);
});

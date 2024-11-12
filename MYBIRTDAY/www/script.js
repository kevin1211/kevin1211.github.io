// Définir les paramètres par défaut pour les confettis
const count = 200;
const confettiDefaults = {
    origin: {y: 0.7}
};

// Fonction pour lancer les confettis
function fire(particleRatio, opts) {
    confetti({
        ...confettiDefaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
    });
}

// Lancer les confettis avec différentes options
fire(0.25, {
    spread: 26,
    startVelocity: 55,
});
fire(0.2, {
    spread: 60,
});
fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
});
fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
});
fire(0.1, {
    spread: 120,
    startVelocity: 45,
});

// Définir la durée de l'animation des confettis
const duration = 15 * 1000;
const animationEnd = Date.now() + duration;

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
        return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({...confettiDefaults, particleCount, origin: {x: randomInRange(0.1, 0.3), y: Math.random() - 0.2}});
    confetti({...confettiDefaults, particleCount, origin: {x: randomInRange(0.7, 0.9), y: Math.random() - 0.2}});
}, 250);

// Paramètres supplémentaires pour les confettis en forme d'étoile et de cercle
const starConfettiDefaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
};

// Fonction pour tirer des confettis en forme d'étoile et de cercle
function shoot() {
    confetti({
        ...starConfettiDefaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star']
    });

    confetti({
        ...starConfettiDefaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ['circle']
    });
}

// Lancer des confettis étoilés et en forme de cercle avec des délais
setTimeout(shoot, 0);
setTimeout(shoot, 100);
setTimeout(shoot, 200);

// Initialisation du canvas pour les confettis
const canvas = document.getElementById('my-canvas');
if (canvas) {
    // Assurez-vous que le canvas est bien configuré pour utiliser confetti
    const confettiCanvas = confetti.create(canvas, {resize: true});

    // Lancer les confettis avec les paramètres souhaités
    confettiCanvas({
        spread: 70,
        origin: {y: 1.2}
    });
} else {
    console.error("Canvas not found!");
}

// ** Animation des ballons **
// Définir les options pour l'animation des ballons
const options = {
    containerId: 'balloon-confetti-celebration',  // ID du conteneur pour les ballons
    balloonCount: 40,  // Nombre de ballons
    confettiColors: [{front: "#FEDB37", back: "#FDB931"}],  // Couleurs des confettis
    balloonSpeed: 1.5, // Vitesse des ballons
    confettiParams: {
        delay: 1700,  // Délai avant de commencer les confettis
        number: 120,  // Nombre de confettis par émission
        size: {x: [10, 30], y: [15, 25]},  // Taille des confettis
        initSpeed: 35,  // Vitesse initiale des confettis
        gravity: 0.65,  // Gravité des confettis
        drag: 0.08,  // Résistance de l'air pour les confettis
        terminalVelocity: 6,  // Vitesse terminale des confettis
        flipSpeed: 0.017,  // Vitesse de rotation des confettis
    }
};

// Initialisation du gestionnaire de célébration des ballons
const celebrationManager = new CelebrationManager(options);

// Lancer l'animation des ballons
celebrationManager.setupConfettiCanvas();
celebrationManager.startCelebration();

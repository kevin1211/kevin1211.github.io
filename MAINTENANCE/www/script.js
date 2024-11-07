// Fonction pour mettre à jour le compte à rebours
function startCountdown(duration, display) {
    let timer = duration, weeks, days, hours, minutes, seconds;

    // Mise à jour du compte à rebours toutes les secondes
    let countdownInterval = setInterval(function () {
        // Calcul des unités de temps
        weeks = Math.floor(timer / (60 * 60 * 24 * 7));
        days = Math.floor((timer % (60 * 60 * 24 * 7)) / (60 * 60 * 24));
        hours = Math.floor((timer % (60 * 60 * 24)) / 3600);
        minutes = Math.floor((timer % 3600) / 60);
        seconds = timer % 60;

        // Mise à jour du compte à rebours dans l'élément HTML
        display.textContent = `${formatTime(weeks)}:${formatTime(days)}:${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;

        // Si le compte à rebours est terminé
        if (--timer < 0) {
            clearInterval(countdownInterval);
            timer = 0;
            alert("La maintenance est terminée !");
            // Redirige vers la page principale après la maintenance
            window.location.href = "../COCOVOIT/www/index.html";
        }
    }, 1000);
}

// Fonction pour formater les valeurs (ajouter un zéro devant les nombres inférieurs à 10)
function formatTime(time) {
    return time < 10 ? "0" + time : time;
}

// Démarrage du compte à rebours au chargement de la page
window.onload = function () {
    // Calcul du temps restant en secondes
    let countdownDuration = (2 * 7 * 24 * 60 * 60) +
        (2 * 24 * 60 * 60) +
        (2 * 3600) +
        (2 * 60) +
        2;

    let display = document.querySelector('#countdown');
    startCountdown(countdownDuration, display);
};

// Fonction pour l'action du bouton "M'avertir quand c'est prêt"
document.getElementById('notify-button').addEventListener('click', function () {
    alert("Merci de votre patience ! Nous vous informerons dès que le site sera prêt.");
});

class Trajet {
    constructor(depart, destination, places, departureDate, departureTime) {
        this.depart = depart;
        this.destination = destination;
        this.places = places;
        this.departureDate = departureDate;
        this.departureTime = departureTime;
        this.valid = this.validate();
        this.distance = 0;
        this.duree = 0;
        this.covoitureurs = [];
        this.arrivalTime = '';
    }

    validate() {
        return this.depart && this.destination && this.places > 0 && this.departureDate && this.departureTime;
    }

    async calculateRoute() {
        const apiKey = 'dbd951e0-11ea-47a2-9da1-881646f25478';
        const from = await this.convertAddress(this.depart);
        const to = await this.convertAddress(this.destination);
        const response = await fetch(`https://graphhopper.com/api/1/route?point=${from}&point=${to}&profile=car&points_encoded=false&locale=fr&calc_points=true&key=${apiKey}`);
        const data = await response.json();
        if (data.paths && data.paths.length > 0) {
            const path = data.paths[0];
            this.distance = path.distance;
            this.duree = path.time / 60000; // Convert duration to minutes
            this.calculateArrivalTime();
        } else {
            throw new Error('Aucun trajet trouvé');
        }
    }

    async convertAddress(address) {
        const apiKey = 'dbd951e0-11ea-47a2-9da1-881646f25478';
        const response = await fetch(`https://graphhopper.com/api/1/geocode?q=${address}&locale=fr&limit=1&key=${apiKey}`);
        const data = await response.json();
        if (data.hits && data.hits.length > 0) {
            const point = data.hits[0].point;
            return `${point.lat},${point.lng}`;
        } else {
            throw new Error('Adresse non trouvée');
        }
    }

    addPassager(nom, places) {
        if (this.places >= places) {
            this.covoitureurs.push({ nom, places });
            this.places -= places;
        } else {
            throw new Error('Pas assez de places disponibles');
        }
    }

    toString() {
        return `De ${this.depart} à ${this.destination}, Places disponibles: ${this.places}, Distance: ${(this.distance / 1000).toFixed(2)} km, Durée: ${this.formatTime(this.duree)}, Heure d'arrivée: ${this.arrivalTime}`;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours} h ${mins} min`;
    }

    calculateArrivalTime() {
        const departure = new Date(`${this.departureDate}T${this.departureTime}`);
        const arrival = new Date(departure.getTime() + this.duree * 60000); // Convert duration to milliseconds
        this.arrivalTime = arrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
}

const trajets = [];

function register(role) {
    document.getElementById('registration').style.display = 'none';
    if (role === 'pilote') {
        document.getElementById('pilotForm').style.display = 'block';
    } else if (role === 'covoitureur') {
        document.getElementById('covoitureurView').style.display = 'block';
        updateTrajetSelect();
    }
}

function goBack() {
    document.getElementById('pilotForm').style.display = 'none';
    document.getElementById('covoitureurView').style.display = 'none';
    document.getElementById('registration').style.display = 'block';
}

async function addTrajet() {
    const depart = document.getElementById('depart').value;
    const destination = document.getElementById('destination').value;
    const places = parseInt(document.getElementById('places').value);
    const departureDate = document.getElementById('departureDate').value;
    const departureTime = document.getElementById('departureTime').value;
    const trajet = new Trajet(depart, destination, places, departureDate, departureTime);
    if (trajet.valid) {
        try {
            await trajet.calculateRoute();
            trajets.push(trajet);
            alert('Trajet ajouté avec succès');
            document.getElementById('addTrajetForm').reset();
            document.getElementById('pilotForm').style.display = 'none';
            document.getElementById('registration').style.display = 'block';
            updateTrajetSelect();
            updateTrajetList();
        } catch (err) {
            alert('Erreur lors du calcul de l\'itinéraire: ' + err.message);
        }
    } else {
        alert('Veuillez entrer des informations valides');
    }
}

function updateTrajetSelect() {
    const trajetSelect = document.getElementById('trajetSelect');
    trajetSelect.innerHTML = '';
    trajets.forEach((trajet, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${index + 1}. De ${trajet.depart} à ${trajet.destination} (${trajet.places} places)`;
        trajetSelect.appendChild(option);
    });
}

function updateTrajetList() {
    const trajetList = document.getElementById('trajetList');
    trajetList.innerHTML = '';
    trajets.forEach((trajet) => {
        const li = document.createElement('li');
        li.textContent = trajet.toString();
        trajetList.appendChild(li);
    });
}

function registerUserAndReserve() {
    const username = document.getElementById('usernameCopilot').value;
    const trajetIndex = parseInt(document.getElementById('trajetSelect').value);
    const seats = parseInt(document.getElementById('seats').value);

    if (username && trajets[trajetIndex]) {
        try {
            trajets[trajetIndex].addPassager(username, seats);
            alert(`Réservation confirmée pour ${username}`);
            document.getElementById('registerForm').reset();
            updateTrajetList();
        } catch (error) {
            alert(error.message);
        }
    } else {
        alert('Veuillez vérifier le trajet sélectionné et votre nom d\'utilisateur');
    }
}

function showInscrits() {
    const trajetIndex = parseInt(document.getElementById('trajetSelect').value);
    const trajet = trajets[trajetIndex];
    const inscritsSection = document.getElementById('inscritsSection');
    if (trajet) {
        inscritsSection.innerHTML = `<h2>Inscrits pour le trajet de ${trajet.depart} à ${trajet.destination}</h2>`;
        const ul = document.createElement('ul');
        trajet.covoitureurs.forEach(covoitureur => {
            const li = document.createElement('li');
            li.textContent = `${covoitureur.nom} (${covoitureur.places} places)`;
            ul.appendChild(li);
        });
        inscritsSection.appendChild(ul);
    } else {
        alert('Veuillez sélectionner un trajet valide.');
    }
}
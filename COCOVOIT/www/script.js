class Trajet {
    constructor(pilote, depart, destination, places, departureDate, departureTime, fuelType, fuelConsumption) {
        this.pilote = pilote;
        this.depart = depart;
        this.destination = destination;
        this.places = places;
        this.departureDate = departureDate;
        this.departureTime = departureTime;
        this.fuelType = fuelType;
        this.fuelConsumption = fuelConsumption;
        this.distance = 0;
        this.duree = 0;
        this.covoitureurs = [];
        this.arrivalTime = '';
        this.itinerary = [];
    }

    async validate() {
        return this.pilote && this.depart && this.destination && this.places > 0 && this.departureDate && this.departureTime && this.fuelType && this.fuelConsumption > 0;
    }

    async calculateRoute() {
        await this.calculateRouteInternal(this.depart, this.destination);
        this.arrivalTime = this.calculateArrivalTime(this.departureTime, this.duree);
    }

    async calculateRouteInternal(start, end) {
        try {
            const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
            if (response.ok) {
                const data = await response.json();
                this.distance = data.routes[0].segments[0].distance;
                this.duree = data.routes[0].segments[0].duration;
                this.itinerary = data.routes[0].geometry.coordinates;
            } else {
                throw new Error('Error fetching route data');
            }
        } catch (error) {
            console.error('Error calculating route:', error);
        }
    }

    calculateArrivalTime(startTime, duration) {
        const departureDateTime = new Date(`${this.departureDate}T${startTime}`);
        const arrivalDateTime = new Date(departureDateTime.getTime() + duration * 1000);
        return arrivalDateTime.toISOString().slice(11, 16);
    }
}

class Covoitureur {
    constructor(nom, trajet, nombrePlaces, adresseReservation, adresseArret) {
        this.nom = nom;
        this.trajet = trajet;
        this.nombrePlaces = nombrePlaces;
        this.adresseReservation = adresseReservation;
        this.adresseArret = adresseArret;
    }
}

const apiKey = 'cac71ff8-8896-4b85-a956-5f92f9d8d344';
const trajets = [];
const covoitureurs = [];

function register(type) {
    document.getElementById('registration').style.display = 'none';
    if (type === 'pilote') {
        document.getElementById('pilotForm').style.display = 'block';
    } else if (type === 'covoitureur') {
        document.getElementById('covoitureurView').style.display = 'block';
        populateTrajetSelect();
    }
}

function goBack() {
    hideAllSections();
    document.getElementById('registration').style.display = 'block';
}

function hideAllSections() {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => section.style.display = 'none');
}

async function addTrajet() {
    const pilote = document.getElementById('usernamePilot').value;
    const depart = document.getElementById('depart').value;
    const destination = document.getElementById('destination').value;
    const places = document.getElementById('places').value;
    const departureDate = document.getElementById('departureDate').value;
    const departureTime = document.getElementById('departureTime').value;
    const fuelType = document.getElementById('fuelType').value;
    const fuelConsumption = document.getElementById('fuelConsumption').value;

    const trajet = new Trajet(pilote, depart, destination, places, departureDate, departureTime, fuelType, fuelConsumption);
    if (await trajet.validate()) {
        await trajet.calculateRoute();
        trajets.push(trajet);
        alert('Trajet ajouté avec succès !');
        goBack();
    } else {
        alert('Veuillez remplir tous les champs correctement.');
    }
}

function populateTrajetSelect() {
    const trajetSelect = document.getElementById('trajetSelect');
    trajetSelect.innerHTML = ''; // Clear existing options
    trajets.forEach((trajet, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${trajet.depart} - ${trajet.destination}`;
        trajetSelect.appendChild(option);
    });
}

function showTrajetDetails() {
    const selectedIndex = document.getElementById('trajetSelect').value;
    const trajet = trajets[selectedIndex];
    const trajetDetails = document.getElementById('trajetDetails');
    trajetDetails.innerHTML = `
        <p>Départ : ${trajet.depart}</p>
        <p>Destination : ${trajet.destination}</p>
        <p>Distance : ${(trajet.distance / 1000).toFixed(2)} km</p>
        <p>Durée : ${(trajet.duree / 3600).toFixed(2)} h</p>
        <p>Heure d'arrivée estimée : ${trajet.arrivalTime}</p>
    `;
}

function registerUserAndReserve() {
    const nom = document.getElementById('usernameCopilot').value;
    const trajetIndex = document.getElementById('trajetSelect').value;
    const nombrePlaces = document.getElementById('seats').value;
    const adresseReservation = document.getElementById('adresseReservation').value;
    const adresseArret = document.getElementById('adresseArret').value;

    if (nom && trajetIndex !== '' && nombrePlaces && adresseReservation) {
        const trajet = trajets[trajetIndex];
        if (trajet.places >= nombrePlaces) {
            const covoitureur = new Covoitureur(nom, trajet, nombrePlaces, adresseReservation, adresseArret);
            covoitureurs.push(covoitureur);
            trajet.covoitureurs.push(covoitureur);
            trajet.places -= nombrePlaces;
            alert('Réservation effectuée avec succès !');
            goBack();
        } else {
            alert('Pas assez de places disponibles.');
        }
    } else {
        alert('Veuillez remplir tous les champs correctement.');
    }
}

function showSection(sectionId) {
    hideAllSections();
    document.getElementById(sectionId).style.display = 'block';
}

function showInscrits() {
    const selectTrajetForInscrits = document.getElementById('selectTrajetForInscrits');
    const selectedIndex = selectTrajetForInscrits.value;
    const trajet = trajets[selectedIndex];
    const inscritsList = document.getElementById('inscritsList');
    inscritsList.innerHTML = '<h3>Liste des inscrits</h3>';
    trajet.covoitureurs.forEach(covoitureur => {
        const div = document.createElement('div');
        div.textContent = `Nom: ${covoitureur.nom}, Places réservées: ${covoitureur.nombrePlaces}`;
        inscritsList.appendChild(div);
    });
}

document.getElementById('trajetSelect').addEventListener('change', showTrajetDetails);
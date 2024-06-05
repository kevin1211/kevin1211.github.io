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
        await this.calculateRouteInternal(this.depart, this.destination, this.departureTime);
        this.arrivalTime = this.calculateArrivalTime(this.departureTime, this.duree);
    }

    async calculateRouteInternal(start, end, startTime) {
        try {
            const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
            if (response.ok) {
                const data = await response.json();
                this.distance = data.features[0].properties.segments[0].distance;
                this.duree = data.features[0].properties.segments[0].duration;
                this.itinerary = data.features[0].geometry.coordinates;
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

const apiKey = 'cac71ff8-8896-4b85-a956-5f92f9d8d344'; // Remplacez par votre clé API

document.addEventListener('DOMContentLoaded', () => {
    const usernamePilotInput = document.getElementById('usernamePilot');
    const departInput = document.getElementById('depart');
    const destinationInput = document.getElementById('destination');
    const placesInput = document.getElementById('places');
    const departureDateInput = document.getElementById('departureDate');
    const departureTimeInput = document.getElementById('departureTime');
    const fuelTypeInput = document.getElementById('fuelType');
    const fuelConsumptionInput = document.getElementById('fuelConsumption');
    const usernameCopilotInput = document.getElementById('usernameCopilot');
    const trajetSelect = document.getElementById('trajetSelect');
    const seatsInput = document.getElementById('seats');
    const adresseReservationInput = document.getElementById('adresseReservation');
    const adresseArretInput = document.getElementById('adresseArret');
    const trajetDetails = document.getElementById('trajetDetails');
    const selectTrajetForInscrits = document.getElementById('selectTrajetForInscrits');
    const inscritsList = document.getElementById('inscritsList');

    const trajets = JSON.parse(localStorage.getItem('trajets')) || [];

    function goBack() {
        showSection('registration');
    }

    function showSection(sectionId) {
        document.querySelectorAll('section').forEach(section => {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        });
    }

    function register(role) {
        if (role === 'pilote') {
            showSection('pilotForm');
        } else {
            showSection('covoitureurView');
            updateTrajetOptions();
        }
    }

    async function addTrajet() {
        const trajet = new Trajet(
            usernamePilotInput.value,
            departInput.value,
            destinationInput.value,
            parseInt(placesInput.value),
            departureDateInput.value,
            departureTimeInput.value,
            fuelTypeInput.value,
            parseFloat(fuelConsumptionInput.value)
        );

        if (await trajet.validate()) {
            await trajet.calculateRoute();
            trajets.push(trajet);
            localStorage.setItem('trajets', JSON.stringify(trajets));
            alert('Trajet ajouté avec succès.');
            goBack();
        } else {
            alert('Veuillez remplir tous les champs.');
        }
    }

    function updateTrajetOptions() {
        trajetSelect.innerHTML = '';
        trajets.forEach((trajet, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${trajet.depart} - ${trajet.destination}`;
            trajetSelect.appendChild(option);
        });
    }

    function updateTrajetDetails() {
        const selectedTrajet = trajets[trajetSelect.value];
        if (selectedTrajet) {
            trajetDetails.innerHTML = `
                <p><strong>Pilote:</strong> ${selectedTrajet.pilote}</p>
                <p><strong>Départ:</strong> ${selectedTrajet.depart}</p>
                <p><strong>Destination:</strong> ${selectedTrajet.destination}</p>
                <p><strong>Heure de départ:</strong> ${selectedTrajet.departureTime}</p>
                <p><strong>Heure d'arrivée estimée:</strong> ${selectedTrajet.arrivalTime}</p>
                <p><strong>Distance:</strong> ${(selectedTrajet.distance / 1000).toFixed(2)} km</p>
                <p><strong>Durée:</strong> ${(selectedTrajet.duree / 3600).toFixed(2)} heures</p>
                <p><strong>Type de carburant:</strong> ${selectedTrajet.fuelType}</p>
                <p><strong>Consommation de carburant:</strong> ${selectedTrajet.fuelConsumption} L/100km</p>
                <p><strong>Places disponibles:</strong> ${selectedTrajet.places}</p>
            `;
        }
    }

    async function registerUserAndReserve() {
        const selectedTrajet = trajets[trajetSelect.value];
        if (selectedTrajet && seatsInput.value <= selectedTrajet.places) {
            const covoitureur = new Covoitureur(
                usernameCopilotInput.value,
                selectedTrajet,
                parseInt(seatsInput.value),
                adresseReservationInput.value,
                adresseArretInput.value
            );

            selectedTrajet.covoitureurs.push(covoitureur);
            selectedTrajet.places -= covoitureur.nombrePlaces;
            localStorage.setItem('trajets', JSON.stringify(trajets));
            alert('Réservation réussie.');
            goBack();
        } else {
            alert('Pas assez de places disponibles ou trajet non sélectionné.');
        }
    }

    function showInscrits() {
        inscritsList.innerHTML = '';
        const selectedTrajet = trajets[selectTrajetForInscrits.value];
        if (selectedTrajet) {
            selectedTrajet.covoitureurs.forEach(covoitureur => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <p><strong>Nom:</strong> ${covoitureur.nom}</p>
                    <p><strong>Places réservées:</strong> ${covoitureur.nombrePlaces}</p>
                    <p><strong>Adresse de montée:</strong> ${covoitureur.adresseReservation}</p>
                    <p><strong>Adresse de l'arrêt:</strong> ${covoitureur.adresseArret}</p>
                `;
                inscritsList.appendChild(div);
            });
        }
    }

    // Event Listeners
    trajetSelect.addEventListener('change', updateTrajetDetails);

    // Initial Setup
    showSection('registration');
    updateTrajetOptions();
});
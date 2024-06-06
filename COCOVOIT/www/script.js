const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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
        const apiKey = 'cac71ff8-8896-4b85-a956-5f92f9d8d344';
        const from = await this.convertAddress(this.depart);
        const to = await this.convertAddress(this.destination);
        const response = await fetch(`https://graphhopper.com/api/1/route?point=${from}&point=${to}&profile=car&points_encoded=false&locale=fr&calc_points=true&key=${apiKey}`);
        const data = await response.json();
        if (data.paths && data.paths.length > 0) {
            const path = data.paths[0];
            this.distance = path.distance;
            this.duree = path.time / 60000; // Convertir la durée en minutes
            this.calculateArrivalTime();
            this.drawRouteOnMap(path.points.coordinates);
        } else {
            throw new Error('Aucun trajet trouvé');
        }
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

    async convertAddress(address) {
        const apiKey = 'cac71ff8-8896-4b85-a956-5f92f9d8d344';
        const response = await fetch(`https://graphhopper.com/api/1/geocode?q=${address}&locale=fr&limit=1&key=${apiKey}`);
        const data = await response.json();
        if (data.hits && data.hits.length > 0) {
            const point = data.hits[0].point;
            return `${point.lat},${point.lng}`;
        } else {
            throw new Error('Adresse non trouvée');
        }
    }

    async calculateArrivalTime(startTime, duration) {
        const departureDateTime = new Date(`${this.departureDate}T${startTime}`);
        const arrivalDateTime = new Date(departureDateTime.getTime() + duration * 60000); // Add duration in milliseconds
        const hours = arrivalDateTime.getHours().toString().padStart(2, '0');
        const minutes = arrivalDateTime.getMinutes().toString().padStart(2, '0');
        this.arrivalTime = `${hours}:${minutes}`;
    }

    drawRouteOnMap(coordinates) {
        const polylinePoints = coordinates.map(coord => [coord[1], coord[0]]);
        const polyline = L.polyline(polylinePoints, {color: 'blue'}).addTo(map);
        map.fitBounds(polyline.getBounds());
    }
}

const trajets = [];
const inscrits = {};

function register(role) {
    document.getElementById('registration').style.display = 'none';
    if (role === 'pilote') {
        document.getElementById('pilotForm').style.display = 'block';
    } else {
        document.getElementById('covoitureurView').style.display = 'block';
        updateTrajetSelect();
    }
}

function addTrajet() {
    const pilote = document.getElementById('usernamePilot').value;
    const depart = document.getElementById('depart').value;
    const destination = document.getElementById('destination').value;
    const places = parseInt(document.getElementById('places').value);
    const departureDate = document.getElementById('departureDate').value;
    const departureTime = document.getElementById('departureTime').value;
    const fuelType = document.getElementById('fuelType').value;
    const fuelConsumption = parseFloat(document.getElementById('fuelConsumption').value);
    const trajet = new Trajet(pilote, depart, destination, places, departureDate, departureTime, fuelType, fuelConsumption);
    trajet.validate().then(valid => {
        if (valid) {
            trajet.calculateRoute().then(() => {
                trajets.push(trajet);
                alert('Trajet ajouté avec succès');
                goBack();
            }).catch(error => {
                console.error('Error calculating route:', error);
                alert('Erreur lors du calcul de l\'itinéraire');
            });
        } else {
            alert('Veuillez remplir tous les champs');
        }
    });
}

function goBack() {
    document.getElementById('pilotForm').style.display = 'none';
    document.getElementById('covoitureurView').style.display = 'none';
    document.getElementById('trajetListSection').style.display = 'none';
    document.getElementById('inscritsSection').style.display = 'none';
    document.getElementById('registration').style.display = 'block';
}

function updateTrajetSelect() {
    const select = document.getElementById('trajetSelect');
    select.innerHTML = '';
    trajets.forEach((trajet, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = `${trajet.depart} - ${trajet.destination}`;
        select.appendChild(option);
    });
    select.onchange = updateTrajetDetails;
    updateTrajetDetails();
}

function updateTrajetDetails() {
    const select = document.getElementById('trajetSelect');
    const index = select.value;
    const trajet = trajets[index];
    if (trajet) {
        document.getElementById('trajetDetails').innerHTML = `
                <p><strong>Pilote :</strong> ${trajet.pilote}</p>
                <p><strong>Départ :</strong> ${trajet.depart}</p>
                <p><strong>Destination :</strong> ${trajet.destination}</p>
                <p><strong>Places disponibles :</strong> ${trajet.places}</p>
                <p><strong>Date et heure de départ :</strong> ${trajet.departureDate} ${trajet.departureTime}</p>
                <p><strong>Type de carburant :</strong> ${trajet.fuelType}</p>
                <p><strong>Consommation de carburant :</strong> ${trajet.fuelConsumption} L/100km</p>
                <p><strong>Distance :</strong> ${(trajet.distance / 1000).toFixed(2)} km</p>
                <p><strong>Durée :</strong> ${(trajet.duree / 60).toFixed(2)} heures</p>
                <p><strong>Heure d'arrivée estimée :</strong> ${trajet.arrivalTime}</p>
            `;
        trajet.drawRouteOnMap(trajet.itinerary);
    }
}

function registerUserAndReserve() {
    const username = document.getElementById('usernameCopilot').value;
    const seats = parseInt(document.getElementById('seats').value);
    const adresseReservation = document.getElementById('adresseReservation').value;
    const adresseArret = document.getElementById('adresseArret').value || null;
    const trajetIndex = parseInt(document.getElementById('trajetSelect').value);
    const trajet = trajets[trajetIndex];
    if (username && seats > 0 && adresseReservation && trajet && seats <= trajet.places) {
        if (!inscrits[trajetIndex]) {
            inscrits[trajetIndex] = [];
        }
        inscrits[trajetIndex].push({username, seats, adresseReservation, adresseArret});
        trajet.places -= seats;
        alert('Réservation effectuée avec succès');
        goBack();
    } else {
        alert('Veuillez remplir tous les champs et vérifier le nombre de places disponibles');
    }
}

function showSection(sectionId) {
    document.getElementById('registration').style.display = 'none';
    document.getElementById(sectionId).style.display = 'block';
    if (sectionId === 'trajetListSection') {
        const list = document.getElementById('trajetList');
        list.innerHTML = '';
        trajets.forEach((trajet, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `${trajet.depart} - ${trajet.destination} (${trajet.places} places disponibles)`;
            list.appendChild(listItem);
        });
    } else if (sectionId === 'inscritsSection') {
        const select = document.getElementById('selectTrajetForInscrits');
        select.innerHTML = '';
        trajets.forEach((trajet, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.text = `${trajet.depart} - ${trajet.destination}`;
            select.appendChild(option);
        });
        select.onchange = updateInscritsList;
        updateInscritsList();
    }
}

function updateInscritsList() {
    const select = document.getElementById('selectTrajetForInscrits');
    const index = select.value;
    const list = document.getElementById('inscritsList');
    list.innerHTML = '';
    const users = inscrits[index];
    if (users) {
        users.forEach(user => {
            const listItem = document.createElement('div');
            listItem.innerHTML = `
                    <p><strong>Nom :</strong> ${user.username}</p>
                    <p><strong>Places réservées :</strong> ${user.seats}</p>
                    <p><strong>Adresse de montée :</strong> ${user.adresseReservation}</p>
                    <p><strong>Adresse d'arrêt :</strong> ${user.adresseArret || 'N/A'}</p>
                `;
            list.appendChild(listItem);
        });
    } else {
        list.innerHTML = '<p>Aucun inscrit pour ce trajet</p>';
    }
}
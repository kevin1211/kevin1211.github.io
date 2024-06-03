class Trajet {
    constructor(pilote, depart, destination, places, departureDate, departureTime) {
        this.pilote = pilote;
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
        this.itinerary = [];
    }

    validate() {
        return this.pilote && this.depart && this.destination && this.places > 0 && this.departureDate && this.departureTime;
    }

    async calculateRoute() {
        const apiKey = 'AIzaSyDSoRrEQNnt4MOMLLYUEa-wLykNnjz70to';
        try {
            const from = await this.convertAddressToCoordinates(this.depart, apiKey);
            const to = await this.convertAddressToCoordinates(this.destination, apiKey);
            const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${from}&destination=${to}&key=${apiKey}`);
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                this.distance = route.legs[0].distance.value; // Distance en mètres
                this.duree = route.legs[0].duration.value / 60; // Durée en minutes
                this.itinerary = this.decodePolyline(route.overview_polyline.points);
                this.calculateArrivalTime();
            } else {
                throw new Error('Aucun itinéraire trouvé');
            }
        } catch (error) {
            console.error('Erreur lors du calcul de l\'itinéraire:', error);
        }
    }

    async convertAddressToCoordinates(address, apiKey) {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return `${location.lat},${location.lng}`;
        } else {
            throw new Error('Adresse non trouvée');
        }
    }

    decodePolyline(polyline) {
        let points = polyline.split('').map(char => char.charCodeAt(0));
        let lat = 0;
        let lng = 0;
        let coordinates = [];
        let shift = 0;
        let result = 0;
        let byte = null;
        let latitude_change;
        let longitude_change;
        let factor = 1e5;

        for (let i = 0; i < points.length;) {
            shift = 0;
            result = 0;
            do {
                byte = points[i++] - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += latitude_change;

            shift = 0;
            result = 0;
            do {
                byte = points[i++] - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += longitude_change;

            coordinates.push([lat / factor, lng / factor]);
        }
        return coordinates;
    }

    addPassager(nom, places, address) {
        if (this.places >= places) {
            this.covoitureurs.push({nom, places, address});
            this.places -= places;
        } else {
            throw new Error('Pas assez de places disponibles');
        }
    }

    toString() {
        return `Pilote: ${this.pilote}, De ${this.depart} à ${this.destination}, Places disponibles: ${this.places}, Distance: ${(this.distance / 1000).toFixed(2)} km, Durée: ${this.formatTime(this.duree)}, Heure de départ: ${this.departureTime}, Heure d'arrivée: ${this.arrivalTime}`;
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

    isAddressOnRoute(lat, lng) {
        return this.itinerary.some(([routeLat, routeLng]) => {
            const distance = this.haversineDistance(lat, lng, routeLat, routeLng);
            return distance < 0.5; // Consider within 500 meters of the route
        });
    }

    haversineDistance(lat1, lng1, lat2, lng2) {
        const toRad = x => x * Math.PI / 180;
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async convertAddress(address) {
        const apiKey = 'AIzaSyDSoRrEQNnt4MOMLLYUEa-wLykNnjz70to';
        const coordinates = await this.convertAddressToCoordinates(address, apiKey);
        return coordinates;
    }
}

const trajets = [];

function showSection(sectionId) {
    const sections = ['registration', 'pilotForm', 'covoitureurView', 'trajetListSection', 'inscritsSection'];
    sections.forEach(id => {
        document.getElementById(id).style.display = id === sectionId ? 'block' : 'none';
    });
}

function register(role) {
    showSection(role === 'pilote' ? 'pilotForm' : 'covoitureurView');
    if (role === 'covoitureur') {
        updateTrajetSelect();
    }
}

function goBack() {
    showSection('registration');
}

async function addTrajet() {
    const pilote = document.getElementById('usernamePilot').value;
    const depart = document.getElementById('depart').value;
    const destination = document.getElementById('destination').value;
    const places = parseInt(document.getElementById('places').value);
    const departureDate = document.getElementById('departureDate').value;
    const departureTime = document.getElementById('departureTime').value;

    const trajet = new Trajet(pilote, depart, destination, places, departureDate, departureTime);

    if (trajet.valid) {
        try {
            await trajet.calculateRoute();
            trajets.push(trajet);
            alert('Trajet ajouté avec succès');
            document.getElementById('addTrajetForm').reset();
            goBack();
            updateTrajetSelect();
            updateTrajetList();
            updateTrajetSelectForInscrits();
        } catch (err) {
            alert(`Erreur lors du calcul de l'itinéraire: ${err.message}`);
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
    trajetSelect.addEventListener('change', showTrajetDetails);
    showTrajetDetails();
}

function updateTrajetSelectForInscrits() {
    const trajetSelectForInscrits = document.getElementById('selectTrajetForInscrits');
    trajetSelectForInscrits.innerHTML = '';
    trajets.forEach((trajet, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${index + 1}. De ${trajet.depart} à ${trajet.destination}`;
        trajetSelectForInscrits.appendChild(option);
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

async function registerUserAndReserve() {
    const username = document.getElementById('usernameCopilot').value;
    const trajetIndex = parseInt(document.getElementById('trajetSelect').value);
    const seats = parseInt(document.getElementById('seats').value);
    const adresseReservation = document.getElementById('adresseReservation').value;

    if (username && trajets[trajetIndex]) {
        try {
            const coord = await trajets[trajetIndex].convertAddress(adresseReservation);
            const [lat, lng] = coord.split(',').map(Number);

            if (trajets[trajetIndex].isAddressOnRoute(lat, lng)) {
                trajets[trajetIndex].addPassager(username, seats, adresseReservation);
                alert(`Réservation confirmée pour ${username}`);
                document.getElementById('registerForm').reset();
                showTrajetDetails(); // Update details after reservation
                updateTrajetList();
            } else {
                alert("L'adresse de réservation n'est pas sur l'itinéraire du trajet sélectionné");
            }
        } catch (error) {
            alert(`Erreur lors de la vérification de l'adresse: ${error.message}`);
        }
    } else {
        alert('Veuillez vérifier le trajet sélectionné et votre nom d\'utilisateur');
    }
}

function showInscrits() {
    const trajetIndex = parseInt(document.getElementById('selectTrajetForInscrits').value);
    const trajet = trajets[trajetIndex];
    const inscritsList = document.getElementById('inscritsList');

    inscritsList.innerHTML = `<h3>Inscrits pour le trajet de ${trajet.depart} à ${trajet.destination}</h3>`;
    if (trajet) {
        const ul = document.createElement('ul');
        trajet.covoitureurs.forEach(covoitureur => {
            const li = document.createElement('li');
            li.textContent = `${covoitureur.nom} (${covoitureur.places} places), Adresse de montée: ${covoitureur.address}`;
            ul.appendChild(li);
        });
        inscritsList.appendChild(ul);
    } else {
        alert('Veuillez sélectionner un trajet valide.');
    }
    showSection('inscritsSection');
}

function showTrajetDetails() {
    const trajetIndex = parseInt(document.getElementById('trajetSelect').value);
    const trajetDetails = document.getElementById('trajetDetails');
    trajetDetails.innerHTML = ''; // Clear previous details

    if (!isNaN(trajetIndex) && trajets[trajetIndex]) {
        const trajet = trajets[trajetIndex];
        trajetDetails.innerHTML = `
            <p><strong>De :</strong> ${trajet.depart}</p>
            <p><strong>À :</strong> ${trajet.destination}</p>
            <p><strong>Pilote :</strong> ${trajet.pilote}</p>
            <p><strong>Distance :</strong> ${(trajet.distance / 1000).toFixed(2)} km</p>
            <p><strong>Durée :</strong> ${trajet.formatTime(trajet.duree)}</p>
            <p><strong>Heure de départ :</strong> ${trajet.departureTime}</p>
            <p><strong>Heure d'arrivée :</strong> ${trajet.arrivalTime}</p>
            <p><strong>Places disponibles :</strong> ${trajet.places}</p>
        `;
        showRouteDetails(trajetIndex);
    } else {
        trajetDetails.innerHTML = '<p>Sélectionnez un trajet pour voir les détails</p>';
    }
}

async function showRouteDetails(trajetIndex) {
    const trajetDetails = document.getElementById('trajetDetails');
    if (!isNaN(trajetIndex) && trajets[trajetIndex]) {
        const trajet = trajets[trajetIndex];
        const routesList = [];
        for (const point of trajet.itinerary) {
            const [lat, lng] = point;
            const name = await reverseGeocode(lat, lng);
            routesList.push(`<li>${name}</li>`);
        }
        trajetDetails.innerHTML += `<h3>Routes empruntées :</h3><ul>${routesList.join('')}</ul>`;
    } else {
        trajetDetails.innerHTML = '<p>Sélectionnez un trajet pour voir les détails</p>';
    }
}

async function reverseGeocode(lat, lng) {
    const apiKey = 'AIzaSyDSoRrEQNnt4MOMLLYUEa-wLykNnjz70to';
    const response = await fetch(`https://graphhopper.com/api/1/geocode?point=${lat},${lng}&locale=fr&key=${apiKey}`);
    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
        return data.hits[0].name;
    } else {
        return 'Lieu inconnu';
    }
}

// Initial call to populate select elements
updateTrajetSelectForInscrits();

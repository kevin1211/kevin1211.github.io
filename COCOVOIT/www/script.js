const map = L.map('map').setView([51.505, -0.09], 13);
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
        await this.calculateRouteInternal(this.depart, this.destination);
    }

    async calculateRouteWithStop(stopAddress) {
        const stop = await this.convertAddress(stopAddress);
        await this.calculateRouteInternal(this.depart, stop, this.destination);
    }

    async convertAddress(address) {
        const apiKey = 'cac71ff8-8896-4b85-a956-5f92f9d8d344';
        console.log(`Conversion de l'adresse: ${address}`);
        const response = await fetch(`https://graphhopper.com/api/1/geocode?q=${address}&locale=fr&limit=1&key=${apiKey}`);
        const data = await response.json();
        if (data.hits && data.hits.length > 0) {
            const point = data.hits[0].point;
            return `${point.lat},${point.lng}`;
        } else {
            console.error('Réponse de l\'API:', data);
            throw new Error('Adresse non trouvée');
        }
    }

    async calculateRouteInternal(...points) {
        const apiKey = 'cac71ff8-8896-4b85-a956-5f92f9d8d344';
        console.log('Points à convertir:', points);
        const locations = await Promise.all(points.map(point => this.convertAddress(point)));
        console.log('Emplacements convertis:', locations);
        const queryParams = locations.map(location => `point=${location}`).join('&');
        const response = await fetch(`https://graphhopper.com/api/1/route?${queryParams}&profile=car&points_encoded=false&locale=fr&calc_points=true&key=${apiKey}`);
        const data = await response.json();
        if (data.paths && data.paths.length > 0) {
            const path = data.paths[0];
            this.distance = path.distance;
            this.duree = path.time / 60000; // Convert duration to minutes
            this.itinerary = path.points.coordinates;
            this.calculateArrivalTime();
            this.drawRouteOnMap(this.itinerary);
        } else {
            console.error('Réponse de l\'API:', data);
            throw new Error('Aucun trajet trouvé');
        }
    }

    // async registerUserAndReserve(userDetails, trajetDetails) {
    //     try {
    //         await this.registerUser(userDetails);
    //         await this.addPassagerWithStop(trajetDetails);
    //     } catch (error) {
    //         console.error('Erreur lors de l\'enregistrement et de la réservation:', error);
    //         throw new Error('Une erreur est survenue lors de l\'enregistrement et de la réservation');
    //     }
    // }

    drawRouteOnMap(itinerary) {
        const route = itinerary.map(point => [point[1], point[0]]); // Inverser lat/lng pour Leaflet
        if (this.routeLayer) {
            this.routeLayer.remove(); // Supprimer l'itinéraire précédent si nécessaire
        }
        this.routeLayer = L.polyline(route, {color: 'blue'}).addTo(map);
        map.fitBounds(this.routeLayer.getBounds()); // Adapter la vue à l'itinéraire
    }

    addPassager(nom, places, address) {
        if (this.places >= places) {
            this.covoitureurs.push({nom, places, address});
            this.places -= places;
        } else {
            throw new Error('Pas assez de places disponibles');
        }
    }

    async addPassagerWithStop(nom, places, address, stopAddress) {
        if (this.places >= places) {
            if (stopAddress) {
                await this.calculateRouteWithStop(stopAddress);
            }
            this.covoitureurs.push({nom, places, address});
            this.places -= places;
        } else {
            throw new Error('Pas assez de places disponibles');
        }
    }

    toString() {
        return `Pilote: ${this.pilote}, De ${this.depart} à ${this.destination}, Places disponibles: ${this.places}, Distance: ${(this.distance / 1000).toFixed(2)} km, Durée: ${Math.floor(this.duree)} minutes`;
    }

    calculateArrivalTime() {
        const departureDateTime = new Date(`${this.departureDate}T${this.departureTime}`);
        const arrivalDateTime = new Date(departureDateTime.getTime() + this.duree * 60000);
        this.arrivalTime = arrivalDateTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    }
}

const trajets = [];

function addTrajet() {
    const pilote = document.getElementById('usernamePilot').value;
    const depart = document.getElementById('depart').value;
    const destination = document.getElementById('destination').value;
    const places = parseInt(document.getElementById('places').value);
    const departureDate = document.getElementById('departureDate').value;
    const departureTime = document.getElementById('departureTime').value;

    const trajet = new Trajet(pilote, depart, destination, places, departureDate, departureTime);
    if (trajet.valid) {
        trajet.calculateRoute()
            .then(() => {
                trajets.push(trajet);
                alert('Trajet ajouté avec succès!');
                document.getElementById('addTrajetForm').reset();
            })
            .catch(error => {
                console.error(error);
                alert('Erreur lors du calcul du trajet');
            });
    } else {
        alert('Veuillez remplir tous les champs correctement');
    }
}

function register(role) {
    if (role === 'pilote') {
        showSection('pilotForm');
    } else if (role === 'covoitureur') {
        showSection('covoitureurView');
        loadTrajetOptions();
        initializeMap();
    }
}

function loadTrajetOptions() {
    const trajetSelect = document.getElementById('trajetSelect');
    trajetSelect.innerHTML = ''; // Clear previous options
    trajets.forEach((trajet, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = trajet.toString();
        trajetSelect.appendChild(option);
    });
    trajetSelect.addEventListener('change', showTrajetDetails);
}

function showTrajetDetails() {
    const index = document.getElementById('trajetSelect').value;
    const trajet = trajets[index];
    if (trajet) {
        const details = `Trajet de ${trajet.depart} à ${trajet.destination}, départ à ${trajet.departureTime} (${trajet.departureDate}), distance : ${(trajet.distance / 1000).toFixed(2)} km, durée : ${Math.floor(trajet.duree)} minutes, places disponibles : ${trajet.places}`;
        document.getElementById('trajetDetails').innerText = details;
    }
}

function registerUserAndReserve() {
    const usernameCopilot = document.getElementById('usernameCopilot').value;
    const trajetIndex = document.getElementById('trajetSelect').value;
    const seats = parseInt(document.getElementById('seats').value);
    const adresseReservation = document.getElementById('adresseReservation').value;
    const adresseArret = document.getElementById('adresseArret').value;

    const trajet = trajets[trajetIndex];
    if (trajet) {
        trajet.addPassagerWithStop(usernameCopilot, seats, adresseReservation, adresseArret)
            .then(() => {
                alert('Réservation effectuée avec succès!');
                document.getElementById('registerForm').reset();
                loadTrajetOptions(); // Update options
            })
            .catch(error => {
                console.error(error);
                alert('Erreur lors de la réservation');
            });
    } else {
        alert('Veuillez sélectionner un trajet');
    }
}

function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

function goBack() {
    showSection('registration');
}

function showInscrits() {
    const trajetIndex = document.getElementById('selectTrajetForInscrits').value;
    const trajet = trajets[trajetIndex];
    const inscritsList = document.getElementById('inscritsList');
    inscritsList.innerHTML = ''; // Clear previous list
    if (trajet) {
        const inscrits = trajet.covoitureurs.map(inscrit => `${inscrit.nom}, ${inscrit.places} places, Adresse : ${inscrit.address}`).join('<br>');
        inscritsList.innerHTML = inscrits || 'Aucun inscrit';
    }
}

function initializeMap() {
    const map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.marker([51.5, -0.09]).addTo(map)
        .bindPopup('A pretty CSS popup.<br> Easily customizable.')
        .openPopup();
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

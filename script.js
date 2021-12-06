'use strict';

// prettier-ignore
// const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const toronto = {
  coords: {
    latitude: 43.6500418,
    longitude: -79.3916043,
  }
}

const sidebar = document.querySelector('.sidebar');
const map = document.querySelector('#map');
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const totalsTitles = document.querySelectorAll('.total__title');
const totalsTitlesContainer = document.querySelector('.total__titles');
const totalsHighlight = document.querySelector('.totalsHighlight');
const totalsDetails = document.querySelectorAll('.totals__details');

const runningTotalDistanceHTML = document.querySelector('.running__total_distance');
const runningTotalDurationHTML = document.querySelector('.running__total_duration');
const runningTotalAvgPaceHTML = document.querySelector('.running__totalavg__pace');
const runningTotalAvgCadenceHTML = document.querySelector('.running__totalavg__cadence');

const cyclingTotalDistanceHTML = document.querySelector('.cycling__total_distance');
const cyclingTotalDurationHTML = document.querySelector('.cycling__total_duration');
const cyclingTotalAvgSpeedHTML = document.querySelector('.cycling__totalavg__speed');
const cyclingTotalElevationHTML = document.querySelector('.cycling__total__elevation');

const infoModalButton = document.querySelector('.info-modal-button');
const infoModal = document.querySelector('.info-modal');
const closeInfoModalButton = document.querySelector('.close-info-modal-button');
const modalOverlay = document.querySelector('.modal-overlay');

class Workout {
	date = new Date();
	// Creating an ID should be done with a library for safety. In this case we're simply creating a new date and taking the last 10 digits
	id = (Date.now() + '').slice(-10);
	constructor(distance, duration, coords) {
		this.distance = distance;
		this.duration = duration;
		this.coords = coords;
	}
	setName() {
		// prettier-ignore
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		this.name = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
	}
}

class Running extends Workout {
	type = 'running';
	constructor(distance, duration, coords, cadence) {
		super(distance, duration, coords);
		this.cadence = cadence;
		this.calcPace();
		this.setName();
	}
	calcPace() {
		this.pace = Math.round((this.duration / this.distance) * 10) / 10;
		return this.pace;
	}
}

class Cycling extends Workout {
	type = 'cycling';
	constructor(distance, duration, coords, elevationGain) {
		super(distance, duration, coords);
		this.elevationGain = elevationGain;
		this.calcSpeed();
		this.setName();
	}
	calcSpeed() {
		this.speed = Math.round((this.distance / (this.duration / 60)) * 10) / 10;
		return this.speed;
	}
}

//////////////////////////////////////////////////
// Application architecture
class App {
	#map;
	#mapZoomLebel = 13;
	#mapEvent;
	#latLng;
	// Getting the data from local storage, checking to see if it's empty or not
	#workouts = JSON.parse(localStorage.getItem('workouts')) || [];
	#markers = [];
	constructor() {
		// The constructor is executed as soon as the page loads
		this._getPosition();
		this._initializeForm();
		this._handleOverlay();

		// We need to use .bind(this) because in an event handler, this points to the element it is called on (form in this case)
		form.addEventListener('submit', this._newWorkout.bind(this));
		inputType.addEventListener('change', this._toggleElevationField);
		containerWorkouts.addEventListener('click', this._goToMarker.bind(this));
		containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
		// totalsTitles.forEach(totalTitle =>
		//   totalTitle.addEventListener('click', this._selectTotalType)
		// );
		this._renderTotalsHighlight();
		totalsTitles.forEach(totalTitle => totalTitle.addEventListener('click', this._renderTotalsHighlight));
		this._calculateTotals();
		this._renderLocalStorage(this.#workouts);
		infoModalButton.addEventListener('click', this._openModal);
		closeInfoModalButton.addEventListener('click', this._closeModal);
		modalOverlay.addEventListener('click', this._closeModal);
		document.addEventListener('keydown', this._handleEscape.bind(this));
	}

	_getPosition() {
		if (navigator.geolocation)
			// getCurrentPosition is treated as a regular function call, not a method call, so the this keyword is not set by default. In _loadMap, 'this' will return undefined. We need to bind it so 'this' can return the current object
			navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
				alert('You need to enable your location to use this app');
				// this._loadMap(toronto).bind(this);
			});
	}

	_loadMap(position) {
		// Use this toronto coords to be able to use in Firefox
		const { latitude, longitude } = toronto.coords;

		// To use the actual geolocation, use position
		// const { latitude, longitude } = position.coords;
		this.#latLng = [latitude, longitude];

		// Binding this to _loadMap makes this return the current object
		// console.log(this);
		this.#map = L.map('map').setView(this.#latLng, this.#mapZoomLebel);

		L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this.#map);

		// Rendering the markers only when the map has finished loading
		this.#workouts.forEach(workout => {
			this._renderWorkoutMarker(workout);
		});

		this.#map.on('click', this._showForm.bind(this));
	}

	_handleOverlay() {
		setTimeout(() => {
			modalOverlay.style.opacity = 0;
			setTimeout(() => {
				modalOverlay.classList.add('hidden');
				modalOverlay.style.opacity = 0.9;
			}, 1000);
		}, 800);
	}

	_initializeForm() {
		inputType.value = 'running';
	}

	_addLocalStorage() {
		localStorage.setItem('workouts', JSON.stringify(this.#workouts));
	}

	_renderLocalStorage(workouts) {
		// List rendered here, markers rendered when map has loaded
		workouts.forEach(workout => {
			this._renderWorkoutList(workout);
		});
	}

	_showForm(mapE) {
		this.#mapEvent = mapE;
		form.classList.remove('hidden');
		inputDistance.focus();
	}

	_handleEscape(e) {
		if (e.key === 'Escape' && infoModal.classList.contains('hidden') && !form.classList.contains('hidden')) this._hideForm();
		if (e.key === 'Escape' && !infoModal.classList.contains('hidden')) this._closeModal();
	}

	_hideForm() {
		form.classList.add('hidden');
	}

	_toggleElevationField() {
		inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
		inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
	}

	_newWorkout(e) {
		e.preventDefault();

		const workoutType = inputType.value;
		const distance = +inputDistance.value;
		const duration = +inputDuration.value;
		const cadence = +inputCadence.value;
		const elevationGain = +inputElevation.value;
		const { lat, lng } = this.#mapEvent.latlng;
		let workout;

		// Check if data is valid
		if (!(distance > 0 && duration > 0 && (cadence > 0 || elevationGain > 0))) {
			alert('Inputs have to be positive numbers!');
			return;
		}

		// Create running workout if workout is running
		if (workoutType == 'running') {
			workout = new Running(distance, duration, [lat, lng], cadence);
		}

		// Create cycling workout if workout is cycling
		if (workoutType == 'cycling') {
			workout = new Cycling(distance, duration, [lat, lng], elevationGain);
		}

		// Add workout to workouts array
		this.#workouts.push(workout);

		// Render workout list
		this._renderWorkoutList(workout);

		// console.log(this.#workouts);

		// Create workout marker on the map
		this._renderWorkoutMarker(workout);

		// Hide form + clear input fields
		this._hideForm();

		// Go to marker when clicking on list
		// this._goToMarker();

		// Storing all workouts to local storage
		this._addLocalStorage();

		this._calculateTotals();
	}

	_renderWorkoutList(workout) {
		const html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.name}</h2>
      <div class="delete__button__container delete__button_${workout.type}">
      <button class="delete__button">Delete</button>
    </div>
      <div class="workout__details">
       <span class="workout__icon">${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
     </div>
      <div class="workout__details">
       <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.type == 'running' ? `${workout.pace}` : `${workout.speed}`}</span>
       <span class="workout__unit">${workout.type == 'running' ? `min/km` : `km/h`}</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${workout.type == 'running' ? `🦶🏼` : `⛰`}</span>
        <span class="workout__value">${workout.type == 'running' ? `${workout.cadence}` : `${workout.elevationGain}`}</span>
        <span class="workout__unit">${workout.type == 'running' ? `spm` : `m`}</span>
      </div>
    </li>`;
		form.insertAdjacentHTML('afterend', html);
	}

	_renderWorkoutMarker(workout) {
		const marker = L.marker(workout.coords)
			.addTo(this.#map)
			.bindPopup(
				L.popup({
					maxWidth: 250,
					minWidth: 100,
					autoClose: false,
					closeOnClick: false,
					className: `${workout.type}-popup`,
				})
			)
			.setPopupContent(`${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.name}`)
			.openPopup();

		this.#markers.push(marker);
		// console.log(this.#markers);
	}

	_removeWorkoutMarker(indexWorkout) {
		this.#map.removeLayer(this.#markers[indexWorkout]);
		this.#markers.splice(indexWorkout, 1);
	}

	_renderTotalsHighlight(e) {
		const title = e == undefined ? totalsTitles[0] : e.target;

		const type = title.dataset.type;
		totalsTitles.forEach(title => title.classList.remove('total__title__active'));
		title.classList.add('total__title__active');
		totalsDetails.forEach(totalsDetail => {
			totalsDetail.classList.add('hidden');
			if (totalsDetail.classList.contains(`totals__details__${type}`)) totalsDetail.classList.remove('hidden');
		});
		const titleCoords = {
			width: title.getBoundingClientRect().width,
			height: title.getBoundingClientRect().height,
			left: title.getBoundingClientRect().left,
			top: title.getBoundingClientRect().top,
		};

		totalsHighlight.style.width = `${titleCoords.width}px`;
		totalsHighlight.style.height = `${titleCoords.height}px`;
		totalsHighlight.style.transform = `translate(${titleCoords.left}px, ${titleCoords.top}px)`;
		totalsHighlight.style.backgroundColor = `${type == 'running' ? 'var(--color-brand--2)' : 'var(--color-brand--1)'}`;
	}

	_calculateTotals() {
		// Running totals
		const runningWorkouts = this.#workouts.filter(workout => workout.type == 'running');
		const runningTotalDistance = runningWorkouts.reduce((acc, cur) => acc + cur.distance, 0);
		runningTotalDistanceHTML.innerHTML = runningTotalDistance;

		const runningTotalDuration = runningWorkouts.reduce((acc, cur) => acc + cur.duration, 0);
		runningTotalDurationHTML.innerHTML = runningTotalDuration;

		const runningTotalAvgPace = runningWorkouts.length == 0 ? '0' : Math.round((runningWorkouts.reduce((acc, cur) => acc + cur.pace, 0) / runningWorkouts.length) * 10) / 10;

		runningTotalAvgPaceHTML.innerHTML = runningTotalAvgPace;

		const runningTotalAvgCadence = runningWorkouts.length == 0 ? '0' : Math.round(runningWorkouts.reduce((acc, cur) => acc + cur.cadence, 0) / runningWorkouts.length);

		runningTotalAvgCadenceHTML.innerHTML = runningTotalAvgCadence;

		// Cycling totals
		const cyclingWorkouts = this.#workouts.filter(workout => workout.type == 'cycling');
		const cyclingTotalDistance = cyclingWorkouts.reduce((acc, cur) => acc + cur.distance, 0);
		cyclingTotalDistanceHTML.innerHTML = cyclingTotalDistance;

		const cyclingTotalDuration = cyclingWorkouts.reduce((acc, cur) => acc + cur.duration, 0);
		cyclingTotalDurationHTML.innerHTML = cyclingTotalDuration;

		const cyclingTotalAvgSpeed = cyclingWorkouts.length == 0 ? '0' : Math.round((cyclingWorkouts.reduce((acc, cur) => acc + cur.speed, 0) / cyclingWorkouts.length) * 10) / 10;

		cyclingTotalAvgSpeedHTML.innerHTML = cyclingTotalAvgSpeed;

		const cyclingTotalAvgElevation = cyclingWorkouts.length == 0 ? '0' : Math.round(cyclingWorkouts.reduce((acc, cur) => acc + cur.elevationGain, 0) / cyclingWorkouts.length);

		cyclingTotalElevationHTML.innerHTML = cyclingTotalAvgElevation;
	}

	_hideForm() {
		// prettier-ignore
		inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value = '';
		// Change display to none to avoid having the new workout slide up with the transitions on .hidden, after 1s set display back to grid
		form.style.display = 'none';
		form.classList.add('hidden');
		setTimeout(() => (form.style.display = 'grid'), 600);
	}

	_goToMarker(e) {
		const clickedEl = e.target.closest('.workout');
		if (!clickedEl) return;
		const clickedId = clickedEl.dataset.id;
		this.#workouts.forEach(workout => {
			if (workout.id == clickedId)
				this.#map.setView(workout.coords, this.#mapZoomLebel, {
					animate: true,
					duration: 0.5,
				});
		});
	}

	// _selectTotalType(e) {
	//   totalsTitles.forEach(title =>
	//     title.classList.remove('total__title__active')
	//   );
	//   e.target.classList.add('total__title__active');
	//   const type = e.target.dataset.type;
	//   totalsDetails.forEach(totalsDetail => {
	//     totalsDetail.classList.add('hidden');
	//     if (totalsDetail.classList.contains(`totals__details__${type}`))
	//       totalsDetail.classList.remove('hidden');
	//   });
	// }

	_deleteWorkout(e) {
		if (!e.target.classList.contains('delete__button')) return;
		const clickedEl = e.target.closest('.workout');
		const workout = this.#workouts.find(workout => workout.id == clickedEl.dataset.id);
		const indexWorkout = this.#workouts.indexOf(workout);
		this.#workouts.splice(indexWorkout, 1);

		clickedEl.remove();
		this._removeWorkoutMarker(indexWorkout);
		this._addLocalStorage();
		this._calculateTotals();
	}

	// Reset the page and delete everything
	reset() {
		localStorage.removeItem('workouts');
		location.reload();
	}

	_openModal() {
		infoModal.classList.remove('hidden');
		modalOverlay.classList.remove('hidden');
	}

	_closeModal() {
		infoModal.classList.add('hidden');
		modalOverlay.classList.add('hidden');
	}
}

const app = new App();
// No need to call the methods outside the object since the constructor is also executed when the page loads
// app._getPosition();

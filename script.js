// ===== CONFIG =====
// Using OpenWeatherMap free API
const API_KEY = ''; // User must add their own key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ===== DOM ELEMENTS =====
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const loading = document.getElementById('loading');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const welcome = document.getElementById('welcome');
const mainContent = document.getElementById('mainContent');
const weatherBg = document.getElementById('weatherBg');

// Current weather elements
const cityName = document.getElementById('cityName');
const dateTime = document.getElementById('dateTime');
const temperature = document.getElementById('temperature');
const weatherDesc = document.getElementById('weatherDesc');
const tempMax = document.getElementById('tempMax');
const tempMin = document.getElementById('tempMin');
const feelsLike = document.getElementById('feelsLike');
const weatherIconLarge = document.getElementById('weatherIconLarge');

// Detail elements
const wind = document.getElementById('wind');
const humidity = document.getElementById('humidity');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');

// Forecast
const forecastGrid = document.getElementById('forecastGrid');
const hourlyScroll = document.getElementById('hourlyScroll');

// ===== THEME =====
let isDark = localStorage.getItem('theme') !== 'light';
applyTheme();

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  applyTheme();
});

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
}

// ===== SEARCH =====
searchBtn.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (city) fetchWeather(city);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = searchInput.value.trim();
    if (city) fetchWeather(city);
  }
});

geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    () => showError('Location access denied. Please search manually.')
  );
});

// ===== API CALLS =====
async function fetchWeather(city) {
  showLoading();
  try {
    // Check if API key is set
    if (!API_KEY) {
      // Use demo data for showcase
      showDemoData(city);
      return;
    }

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`),
      fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`)
    ]);

    if (!currentRes.ok) throw new Error('City not found');

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    displayWeather(current, forecast);
  } catch (err) {
    showError(err.message || 'Something went wrong. Try again.');
  }
}

async function fetchWeatherByCoords(lat, lon) {
  showLoading();
  try {
    if (!API_KEY) {
      showDemoData('Your Location');
      return;
    }

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
    ]);

    if (!currentRes.ok) throw new Error('Could not fetch weather data');

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    displayWeather(current, forecast);
  } catch (err) {
    showError(err.message || 'Something went wrong. Try again.');
  }
}

// ===== DISPLAY =====
function displayWeather(current, forecast) {
  // City & Date
  cityName.textContent = `${current.name}, ${current.sys.country}`;
  dateTime.textContent = formatDateTime(current.dt, current.timezone);

  // Temperature
  temperature.textContent = Math.round(current.main.temp);
  tempMax.textContent = Math.round(current.main.temp_max);
  tempMin.textContent = Math.round(current.main.temp_min);
  feelsLike.textContent = Math.round(current.main.feels_like);
  weatherDesc.textContent = current.weather[0].description;

  // Icon
  setWeatherIcon(weatherIconLarge, current.weather[0].id, current.weather[0].icon);

  // Background theme
  setWeatherBg(current.weather[0].id, current.weather[0].icon);

  // Details
  wind.textContent = `${current.wind.speed} m/s`;
  humidity.textContent = `${current.main.humidity}%`;
  visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
  pressure.textContent = `${current.main.pressure} hPa`;
  sunrise.textContent = formatTime(current.sys.sunrise, current.timezone);
  sunset.textContent = formatTime(current.sys.sunset, current.timezone);

  // 5-Day Forecast
  displayForecast(forecast);

  // Hourly
  displayHourly(forecast);

  // Show content
  hideAll();
  mainContent.style.display = 'block';
}

function displayForecast(forecast) {
  const daily = {};
  forecast.list.forEach(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString('en', { weekday: 'short' });
    if (!daily[date]) {
      daily[date] = { ...item, temps: [] };
    }
    daily[date].temps.push(item.main.temp);
  });

  const days = Object.entries(daily).slice(0, 5);

  forecastGrid.innerHTML = days.map(([day, data]) => {
    const maxT = Math.round(Math.max(...data.temps));
    const minT = Math.round(Math.min(...data.temps));
    const iconClass = getWeatherIconClass(data.weather[0].id, data.weather[0].icon);
    const colorClass = getWeatherColorClass(data.weather[0].id);

    return `
      <div class="forecast-card">
        <div class="forecast-day">${day}</div>
        <div class="forecast-icon ${colorClass}">${iconClass}</div>
        <div class="forecast-temp">${maxT}&deg;</div>
        <div class="forecast-temp-min">${minT}&deg;</div>
        <div class="forecast-desc">${data.weather[0].description}</div>
      </div>
    `;
  }).join('');
}

function displayHourly(forecast) {
  const hours = forecast.list.slice(0, 12);

  hourlyScroll.innerHTML = hours.map(item => {
    const time = new Date(item.dt * 1000).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    const iconClass = getWeatherIconClass(item.weather[0].id, item.weather[0].icon);
    const colorClass = getWeatherColorClass(item.weather[0].id);

    return `
      <div class="hourly-card">
        <div class="hourly-time">${time}</div>
        <div class="hourly-icon ${colorClass}">${iconClass}</div>
        <div class="hourly-temp">${Math.round(item.main.temp)}&deg;</div>
      </div>
    `;
  }).join('');
}

// ===== WEATHER ICONS =====
function getWeatherIconClass(id, icon) {
  const isNight = icon.includes('n');
  if (id >= 200 && id < 300) return '<i class="fas fa-bolt"></i>';
  if (id >= 300 && id < 400) return '<i class="fas fa-cloud-rain"></i>';
  if (id >= 500 && id < 600) return '<i class="fas fa-cloud-showers-heavy"></i>';
  if (id >= 600 && id < 700) return '<i class="fas fa-snowflake"></i>';
  if (id >= 700 && id < 800) return '<i class="fas fa-smog"></i>';
  if (id === 800) return isNight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  if (id === 801) return isNight ? '<i class="fas fa-cloud-moon"></i>' : '<i class="fas fa-cloud-sun"></i>';
  if (id > 801) return '<i class="fas fa-cloud"></i>';
  return '<i class="fas fa-cloud-sun"></i>';
}

function getWeatherColorClass(id) {
  if (id >= 200 && id < 300) return 'stormy';
  if (id >= 300 && id < 600) return 'rainy';
  if (id >= 600 && id < 700) return 'snowy';
  if (id >= 700 && id < 800) return 'misty';
  if (id === 800) return 'sunny';
  return 'cloudy';
}

function setWeatherIcon(el, id, icon) {
  const isNight = icon.includes('n');
  let iconHtml = '';
  let colorClass = '';

  if (id >= 200 && id < 300) { iconHtml = '<i class="fas fa-cloud-bolt"></i>'; colorClass = 'stormy'; }
  else if (id >= 300 && id < 400) { iconHtml = '<i class="fas fa-cloud-rain"></i>'; colorClass = 'rainy'; }
  else if (id >= 500 && id < 600) { iconHtml = '<i class="fas fa-cloud-showers-heavy"></i>'; colorClass = 'rainy'; }
  else if (id >= 600 && id < 700) { iconHtml = '<i class="fas fa-snowflake"></i>'; colorClass = 'snowy'; }
  else if (id >= 700 && id < 800) { iconHtml = '<i class="fas fa-smog"></i>'; colorClass = 'misty'; }
  else if (id === 800) { iconHtml = isNight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>'; colorClass = 'sunny'; }
  else if (id === 801) { iconHtml = isNight ? '<i class="fas fa-cloud-moon"></i>' : '<i class="fas fa-cloud-sun"></i>'; colorClass = 'cloudy'; }
  else { iconHtml = '<i class="fas fa-cloud"></i>'; colorClass = 'cloudy'; }

  el.innerHTML = iconHtml;
  el.className = 'weather-icon-large ' + colorClass;
}

function setWeatherBg(id, icon) {
  const isNight = icon.includes('n');
  weatherBg.className = 'weather-bg';

  if (isNight) { weatherBg.classList.add('night'); return; }
  if (id >= 200 && id < 300) weatherBg.classList.add('stormy');
  else if (id >= 300 && id < 600) weatherBg.classList.add('rainy');
  else if (id >= 600 && id < 700) weatherBg.classList.add('snowy');
  else if (id >= 700 && id < 800) weatherBg.classList.add('cloudy');
  else if (id === 800) weatherBg.classList.add('sunny');
  else weatherBg.classList.add('cloudy');
}

// ===== HELPERS =====
function formatDateTime(ts, tz) {
  const d = new Date((ts + tz) * 1000);
  return d.toUTCString().replace('GMT', '').trim();
}

function formatTime(ts, tz) {
  const d = new Date((ts + tz) * 1000);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function showLoading() {
  hideAll();
  loading.style.display = 'block';
}

function showError(msg) {
  hideAll();
  errorMessage.textContent = msg;
  errorState.style.display = 'block';
}

function hideAll() {
  welcome.style.display = 'none';
  loading.style.display = 'none';
  errorState.style.display = 'none';
  mainContent.style.display = 'none';
}

// ===== DEMO DATA (when no API key) =====
function showDemoData(cityQuery) {
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
  const now = new Date();

  const demoWeather = {
    name: capitalize(cityQuery),
    sys: {
      country: 'WW',
      sunrise: Math.floor(now.getTime() / 1000) - 21600,
      sunset: Math.floor(now.getTime() / 1000) + 21600,
    },
    dt: Math.floor(now.getTime() / 1000),
    timezone: 0,
    main: {
      temp: 22,
      temp_max: 25,
      temp_min: 18,
      feels_like: 21,
      humidity: 65,
      pressure: 1013,
    },
    weather: [{ id: 801, description: 'partly cloudy', icon: '02d' }],
    wind: { speed: 3.6 },
    visibility: 10000,
  };

  const demoForecast = {
    list: Array.from({ length: 40 }, (_, i) => {
      const conditions = [
        { id: 800, desc: 'clear sky', icon: '01d' },
        { id: 801, desc: 'few clouds', icon: '02d' },
        { id: 802, desc: 'scattered clouds', icon: '03d' },
        { id: 500, desc: 'light rain', icon: '10d' },
        { id: 800, desc: 'clear sky', icon: '01d' },
      ];
      const cond = conditions[i % conditions.length];
      return {
        dt: Math.floor(now.getTime() / 1000) + i * 10800,
        main: {
          temp: 18 + Math.sin(i * 0.5) * 6,
          temp_max: 24 + Math.sin(i * 0.3) * 3,
          temp_min: 15 + Math.sin(i * 0.4) * 2,
        },
        weather: [{ id: cond.id, description: cond.desc, icon: cond.icon }],
      };
    }),
  };

  displayWeather(demoWeather, demoForecast);
}

// ===== INIT =====
// Check for saved city
const lastCity = localStorage.getItem('lastCity');
if (lastCity) {
  searchInput.value = lastCity;
  fetchWeather(lastCity);
}

// Save city on search
const originalFetch = fetchWeather;
fetchWeather = function(city) {
  localStorage.setItem('lastCity', city);
  return originalFetch(city);
};

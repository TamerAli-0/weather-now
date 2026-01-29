// ===== CONFIG =====
// Using Open-Meteo (free, no API key) + OpenStreetMap Geocoding
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

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

const cityName = document.getElementById('cityName');
const dateTime = document.getElementById('dateTime');
const temperature = document.getElementById('temperature');
const weatherDesc = document.getElementById('weatherDesc');
const tempMax = document.getElementById('tempMax');
const tempMin = document.getElementById('tempMin');
const feelsLike = document.getElementById('feelsLike');
const weatherIconLarge = document.getElementById('weatherIconLarge');

const wind = document.getElementById('wind');
const humidity = document.getElementById('humidity');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');

const forecastGrid = document.getElementById('forecastGrid');
const hourlyScroll = document.getElementById('hourlyScroll');

// ===== WMO WEATHER CODE MAPPING =====
const wmoDescriptions = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
};

function wmoToOwmId(code) {
  if (code >= 95) return 200; // thunderstorm
  if (code >= 80 && code < 90) return 500; // rain showers
  if (code >= 71 && code < 80) return 600; // snow
  if (code >= 61 && code < 70) return 501; // rain
  if (code >= 51 && code < 60) return 300; // drizzle
  if (code >= 45 && code < 50) return 741; // fog
  if (code === 3) return 804; // overcast
  if (code === 2) return 802; // partly cloudy
  if (code === 1) return 801; // mainly clear
  return 800; // clear
}

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
    (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, 'Your Location'),
    () => showError('Location access denied. Please search manually.')
  );
});

// ===== API CALLS =====
async function fetchWeather(city) {
  showLoading();
  try {
    // Geocode city name to coordinates
    const geoRes = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found. Try a different search.');
    }

    const loc = geoData.results[0];
    const displayName = `${loc.name}, ${loc.country_code || loc.country || ''}`;

    await fetchWeatherByCoords(loc.latitude, loc.longitude, displayName);
  } catch (err) {
    showError(err.message || 'Something went wrong. Try again.');
  }
}

async function fetchWeatherByCoords(lat, lon, displayName) {
  showLoading();
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,is_day',
      hourly: 'temperature_2m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'auto',
      forecast_days: '7'
    });

    const res = await fetch(`${WEATHER_URL}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch weather data');
    const data = await res.json();

    displayWeather(data, displayName);
    localStorage.setItem('lastCity', displayName.split(',')[0].trim());
  } catch (err) {
    showError(err.message || 'Something went wrong. Try again.');
  }
}

// ===== DISPLAY =====
function displayWeather(data, displayName) {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;

  // City & Date
  cityName.textContent = displayName;
  const now = new Date();
  dateTime.textContent = now.toLocaleDateString('en', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Temperature
  temperature.textContent = Math.round(current.temperature_2m);
  tempMax.textContent = Math.round(daily.temperature_2m_max[0]);
  tempMin.textContent = Math.round(daily.temperature_2m_min[0]);
  feelsLike.textContent = Math.round(current.apparent_temperature);

  const wmoCode = current.weather_code;
  const owmId = wmoToOwmId(wmoCode);
  const isDay = current.is_day === 1;
  const iconCode = isDay ? '01d' : '01n';

  weatherDesc.textContent = wmoDescriptions[wmoCode] || 'Unknown';

  // Icon
  setWeatherIcon(weatherIconLarge, owmId, iconCode);

  // Background theme
  setWeatherBg(owmId, iconCode);

  // Details
  wind.textContent = `${current.wind_speed_10m} km/h`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  visibility.textContent = '10+ km';
  pressure.textContent = `${Math.round(current.surface_pressure)} hPa`;

  // Sunrise / Sunset
  if (daily.sunrise && daily.sunrise[0]) {
    const sr = new Date(daily.sunrise[0]);
    sunrise.textContent = sr.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  }
  if (daily.sunset && daily.sunset[0]) {
    const ss = new Date(daily.sunset[0]);
    sunset.textContent = ss.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  }

  // 5-Day Forecast
  displayForecast(daily);

  // Hourly
  displayHourly(hourly, isDay);

  hideAll();
  mainContent.style.display = 'block';
}

function displayForecast(daily) {
  const days = [];
  for (let i = 1; i < Math.min(6, daily.time.length); i++) {
    days.push({
      day: new Date(daily.time[i]).toLocaleDateString('en', { weekday: 'short' }),
      max: Math.round(daily.temperature_2m_max[i]),
      min: Math.round(daily.temperature_2m_min[i]),
      code: daily.weather_code[i]
    });
  }

  forecastGrid.innerHTML = days.map(d => {
    const owmId = wmoToOwmId(d.code);
    const iconClass = getWeatherIconClass(owmId, '01d');
    const colorClass = getWeatherColorClass(owmId);

    return `
      <div class="forecast-card">
        <div class="forecast-day">${d.day}</div>
        <div class="forecast-icon ${colorClass}">${iconClass}</div>
        <div class="forecast-temp">${d.max}&deg;</div>
        <div class="forecast-temp-min">${d.min}&deg;</div>
        <div class="forecast-desc">${wmoDescriptions[d.code] || '—'}</div>
      </div>
    `;
  }).join('');
}

function displayHourly(hourly, isDay) {
  const nowHour = new Date().getHours();
  const startIdx = hourly.time.findIndex(t => new Date(t).getHours() >= nowHour);
  const start = Math.max(0, startIdx);
  const hours = [];

  for (let i = start; i < Math.min(start + 12, hourly.time.length); i++) {
    hours.push({
      time: new Date(hourly.time[i]).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(hourly.temperature_2m[i]),
      code: hourly.weather_code[i]
    });
  }

  hourlyScroll.innerHTML = hours.map(h => {
    const owmId = wmoToOwmId(h.code);
    const iconClass = getWeatherIconClass(owmId, isDay ? '01d' : '01n');
    const colorClass = getWeatherColorClass(owmId);

    return `
      <div class="hourly-card">
        <div class="hourly-time">${h.time}</div>
        <div class="hourly-icon ${colorClass}">${iconClass}</div>
        <div class="hourly-temp">${h.temp}&deg;</div>
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

// ===== INIT =====
const lastCity = localStorage.getItem('lastCity');
if (lastCity) {
  searchInput.value = lastCity;
  fetchWeather(lastCity);
}

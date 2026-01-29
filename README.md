# WeatherNow — Live Weather Dashboard

A sleek, animated weather dashboard with city search, 5-day forecast, hourly breakdown, and dynamic themes that change based on weather conditions.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![OpenWeatherMap](https://img.shields.io/badge/OpenWeatherMap-API-orange?style=flat)

## Features

- **City Search** — Look up any city worldwide with instant results
- **Geolocation** — One-click weather for your current location
- **Current Conditions** — Temperature, description, feels-like, high/low
- **6 Detail Cards** — Wind, humidity, visibility, pressure, sunrise, sunset
- **5-Day Forecast** — Daily breakdown with icons and temperature range
- **Hourly Forecast** — Scrollable 12-hour outlook
- **Dynamic Backgrounds** — Animated orbs shift color based on weather (sunny, rainy, cloudy, snowy, stormy, night)
- **Dark / Light Theme** — Toggle with preference saved to local storage
- **Responsive** — Mobile, tablet, and desktop layouts
- **Demo Mode** — Works without API key using realistic sample data

## Getting Started

```bash
git clone https://github.com/TamerAli-0/weather-now.git
cd weather-now
# Open index.html in your browser
```

### Adding Your API Key

1. Get a free key at [openweathermap.org/api](https://openweathermap.org/api)
2. Open `script.js` and set your key:
   ```js
   const API_KEY = 'your_api_key_here';
   ```
3. Refresh the page — live data will load

Without a key, the app runs in **demo mode** with sample data so you can still see the full UI.

## Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, grid, glassmorphism, backdrop-filter, keyframe animations
- **JavaScript** — Fetch API, Geolocation API, Intersection Observer, localStorage
- **OpenWeatherMap API** — Current weather + 5-day/3-hour forecast

## Author

Built by [Tamer Altaweel](https://github.com/TamerAli-0)

import { translations } from './translations.js';
import * as api from './api.js';
import * as ui from './ui.js';
import { initChat } from './chat.js';

// State
let currentLang = localStorage.getItem('weather_lang') || 'en';
let currentUnit = localStorage.getItem('weather_unit') || 'c';
let lastWeatherData = null;
let lastAQIData = null;
let lastCityName = '';
let debounceTimer;

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsDropdown = document.getElementById('settings-dropdown');
const languageSelect = document.getElementById('language-select');
const unitSelect = document.getElementById('unit-select');
const suggestionsList = document.getElementById('suggestions');

// Init
function init() {
    languageSelect.value = currentLang;
    unitSelect.value = currentUnit;
    updateStaticText();
    updateTimeTheme();

    // Auto Location
    initAutoLocation();

    // Chat
    initChat();
}

function updateStaticText() {
    const t = translations[currentLang];
    cityInput.placeholder = t.searchPlaceholder;
    document.querySelector('#error-message p').textContent = t.error;
    document.getElementById('unit-label').textContent = t.unit;
    languageSelect.previousElementSibling.textContent = t.lang;

    // Grid Labels
    document.querySelector('#uv-index').previousElementSibling.textContent = t.uv;
    document.querySelector('#wind-speed-detail').previousElementSibling.textContent = t.wind;
    document.querySelector('#humidity').previousElementSibling.textContent = t.humidity;
    document.querySelector('#pressure').previousElementSibling.textContent = t.pressure;
    document.querySelector('#aqi').previousElementSibling.textContent = t.aqi;
    document.querySelector('#moon-phase').previousElementSibling.textContent = t.moonPhase;

    const dewLabel = document.getElementById('dew-point-label');
    if (dewLabel) dewLabel.textContent = t.dewPoint;

    const astroLabels = document.querySelectorAll('.astro-item span:nth-of-type(1)');
    astroLabels[0].textContent = t.sunrise;
    astroLabels[1].textContent = t.sunset;
    astroLabels[2].textContent = t.moonset;

    document.getElementById('news-title').textContent = t.newsTitle;
}

function updateTimeTheme() {
    const hour = new Date().getHours();
    const body = document.body;
    body.classList.remove('theme-morning', 'theme-noon', 'theme-afternoon', 'theme-night', 'theme-midnight');

    if (hour >= 5 && hour < 11) body.classList.add('theme-morning');
    else if (hour >= 11 && hour < 16) body.classList.add('theme-noon');
    else if (hour >= 16 && hour < 20) body.classList.add('theme-afternoon');
    else if (hour >= 20 || hour < 5) {
        if (hour >= 23 || hour < 3) body.classList.add('theme-midnight');
        else body.classList.add('theme-night');
    }
}

// Logic
async function handleWeatherFetch(lat, lon, name, countryCode) {
    ui.showLoading();
    try {
        const weatherData = await api.fetchWeatherData(lat, lon);
        const aqiData = await api.fetchAQIData(lat, lon);

        lastWeatherData = weatherData;
        lastAQIData = aqiData;
        lastCityName = name;

        ui.updateUI(weatherData, aqiData, name, currentLang, currentUnit);

        // News
        loadNews(countryCode);

    } catch (e) {
        console.error(e);
        ui.showError(e.message, currentLang);
    }
}

async function loadNews(countryCode) {
    const t = translations[currentLang];
    document.getElementById('news-container').innerHTML = `<p>${t.loadingNews}</p>`;
    try {
        const data = await api.fetchRSSNews(countryCode);
        ui.renderNews(data, t);
    } catch (e) {
        document.getElementById('news-container').innerHTML = `<p>${t.networkError}</p>`;
    }
}

async function initAutoLocation() {
    try {
        if (!navigator.geolocation) throw new Error('No support');

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                // Reverse Geo
                const geo = await api.fetchReverseGeo(latitude, longitude);
                const city = geo ? geo.name : 'Unknown';
                const country = geo ? geo.country_code : '';

                // Lang set
                if (country === 'RS') currentLang = 'sr';
                else if (country === 'DE') currentLang = 'de';
                localStorage.setItem('weather_lang', currentLang);
                languageSelect.value = currentLang;
                updateStaticText();

                cityInput.value = city;
                handleWeatherFetch(latitude, longitude, city, country);
            },
            (err) => {
                fallbackToIP();
            }
        );
    } catch (e) {
        fallbackToIP();
    }
}

async function fallbackToIP() {
    try {
        // Try GeoJS
        const data = await api.fetchIPLocation();
        const { city, country_code, latitude, longitude } = data;

        if (country_code === 'RS') currentLang = 'sr';
        else if (country_code === 'DE') currentLang = 'de';
        localStorage.setItem('weather_lang', currentLang);
        languageSelect.value = currentLang;
        updateStaticText();

        cityInput.value = city;
        handleWeatherFetch(latitude, longitude, city, country_code);
    } catch (e) {
        // Default
        const defaultCity = 'Belgrade';
        const geo = await api.fetchGeoData(defaultCity);
        handleWeatherFetch(geo.latitude, geo.longitude, geo.name, geo.country_code);
    }
}

// Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        suggestionsList.classList.add('hidden');
        api.fetchGeoData(city).then(geo => {
            handleWeatherFetch(geo.latitude, geo.longitude, geo.name, geo.country_code)
        }).catch(e => ui.showError(null, currentLang));
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            suggestionsList.classList.add('hidden');
            api.fetchGeoData(city).then(geo => {
                handleWeatherFetch(geo.latitude, geo.longitude, geo.name, geo.country_code)
            }).catch(e => ui.showError(null, currentLang));
        }
    }
});

cityInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);
    if (query.length < 2) {
        suggestionsList.classList.add('hidden');
        return;
    }
    debounceTimer = setTimeout(() => {
        api.fetchSuggestions(query).then(results => {
            if (results.length > 0) {
                ui.renderSuggestions(results, (lat, lon, name, code) => {
                    handleWeatherFetch(lat, lon, name, code);
                });
            } else {
                suggestionsList.classList.add('hidden');
            }
        });
    }, 300);
});

document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.classList.add('hidden');
    }
    if (!settingsDropdown.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)) {
        settingsDropdown.classList.add('hidden');
    }
});

settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('hidden');
});

languageSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('weather_lang', currentLang);
    updateStaticText();
    if (lastWeatherData && lastCityName) {
        // Just refresh text or refetch? Refetch for translated descriptions
        api.fetchGeoData(lastCityName).then(geo => {
            handleWeatherFetch(geo.latitude, geo.longitude, geo.name, geo.country_code);
        });
    }
});

unitSelect.addEventListener('change', (e) => {
    currentUnit = e.target.value;
    localStorage.setItem('weather_unit', currentUnit);
    if (lastWeatherData) {
        ui.updateUI(lastWeatherData, lastAQIData, lastCityName, currentLang, currentUnit);
    }
});

// Run
init();

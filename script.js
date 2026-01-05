
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherDisplay = document.getElementById('weather-display');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const warningsContainer = document.getElementById('warnings-container');

// Elements to update
const tempElement = document.getElementById('temperature');
const tempMaxElement = document.getElementById('temp-max');
const tempMinElement = document.getElementById('temp-min');
const descElement = document.getElementById('description');
const cityDisplayElement = document.getElementById('city-display');
const iconElement = document.getElementById('weather-icon');

// Details
const windSpeedElement = document.getElementById('wind-speed-detail');
const windDirText = document.getElementById('wind-dir-text');
const windCompass = document.getElementById('wind-compass');
const humidityElement = document.getElementById('humidity');
const pressureElement = document.getElementById('pressure');
const uvElement = document.getElementById('uv-index');
const uvTextElement = document.getElementById('uv-text');
const aqiElement = document.getElementById('aqi');
const aqiTextElement = document.getElementById('aqi-text');
const moonPhaseElement = document.getElementById('moon-phase');
const moonIllumElement = document.getElementById('moon-illumination');
const moonIconWrapper = document.getElementById('moon-icon-wrapper');

// Astro
const sunriseElement = document.getElementById('sunrise-time');
const sunsetElement = document.getElementById('sunset-time');
const moonsetElement = document.getElementById('moonset-time');

const forecastContainer = document.getElementById('forecast-container');

const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_API = "https://air-quality-api.open-meteo.com/v1/air-quality";

// WMO Weather interpretation codes (WW)
const weatherCodes = {
    0: { desc: 'Clear sky', icon: 'Sun' },
    1: { desc: 'Mainly clear', icon: 'CloudSun' },
    2: { desc: 'Partly cloudy', icon: 'CloudSun' },
    3: { desc: 'Overcast', icon: 'Cloud' },
    45: { desc: 'Fog', icon: 'Fog' },
    48: { desc: 'Depositing rime fog', icon: 'Fog' },
    51: { desc: 'Light drizzle', icon: 'CloudRain' },
    53: { desc: 'Moderate drizzle', icon: 'CloudRain' },
    55: { desc: 'Dense drizzle', icon: 'CloudRain' },
    61: { desc: 'Slight rain', icon: 'CloudRain' },
    63: { desc: 'Moderate rain', icon: 'CloudRain' },
    65: { desc: 'Heavy rain', icon: 'CloudRain' },
    71: { desc: 'Slight snow', icon: 'CloudSnow' },
    73: { desc: 'Moderate snow', icon: 'CloudSnow' },
    75: { desc: 'Heavy snow', icon: 'CloudSnow' },
    77: { desc: 'Snow grains', icon: 'CloudSnow' },
    80: { desc: 'Slight rain showers', icon: 'CloudRain' },
    81: { desc: 'Moderate rain showers', icon: 'CloudRain' },
    82: { desc: 'Violent rain showers', icon: 'CloudRain' },
    85: { desc: 'Slight snow showers', icon: 'CloudSnow' },
    86: { desc: 'Heavy snow showers', icon: 'CloudSnow' },
    95: { desc: 'Thunderstorm', icon: 'CloudLightning' },
    96: { desc: 'Thunderstorm with hail', icon: 'CloudLightning' },
    99: { desc: 'Thunderstorm with heavy hail', icon: 'CloudLightning' },
};

// Map custom icons to URL or local assets
// For this demo, we can use free icon URLs or FontAwesome classes if we had them mapped
// I will use a reliable CDN for weather icons or simple conditional logic
function getIconUrl(code) {
    // Simply using OpenWeatherMap icons as a fallback/proxy since they are standard
    // Or I can use a different set. Let's use a public domain icon set or similar.
    // Actually, let's use a nice set from a CDN for '3d' look if possible, or just standard ones.
    // For now, I'll use a placeholder logic or a reliable icon set.
    // Let's use: https://bmcdn.nl/assets/weather-icons/v3.0/fill/svg/{icon}.svg if available.
    // Let's stick to a safe simple set. 'openweathermap' icons are easiest to map roughly.

    // Mapping WMO to OpenWeatherMap icon codes (approximate)
    // 0 -> 01d
    // 1-3 -> 02d, 03d, 04d
    // 45,48 -> 50d
    // 51-67 -> 09d, 10d
    // 71-77 -> 13d
    // 80-82 -> 09d
    // 95-99 -> 11d

    let iconCode = '01d';
    if (code === 0) iconCode = '01d';
    else if (code <= 3) iconCode = '02d';
    else if (code <= 48) iconCode = '50d';
    else if (code <= 67) iconCode = '10d';
    else if (code <= 77) iconCode = '13d';
    else if (code <= 82) iconCode = '09d';
    else if (code <= 86) iconCode = '13d';
    else if (code <= 99) iconCode = '11d';

    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
}

// Improved Icon Logic with Night Mode
function getIconUrlV2(code, isDay) {
    // OpenWeatherMap mapping: d = day, n = night
    const suffix = isDay ? 'd' : 'n';

    let iconCode = '01';
    if (code === 0) iconCode = '01'; // Clear
    else if (code <= 3) iconCode = '02'; // Cloudy
    else if (code === 45 || code === 48) iconCode = '50'; // Fog
    else if (code >= 51 && code <= 67) iconCode = '10'; // Rain
    else if (code >= 71 && code <= 77) iconCode = '13'; // Snow
    else if (code >= 80 && code <= 82) iconCode = '09'; // Showers
    else if (code >= 95 && code <= 99) iconCode = '11'; // Thunderstorm

    return `https://openweathermap.org/img/wn/${iconCode}${suffix}@4x.png`;
}

const suggestionsList = document.getElementById('suggestions');
const settingsBtn = document.getElementById('settings-btn');
const settingsDropdown = document.getElementById('settings-dropdown');
const languageSelect = document.getElementById('language-select');

let debounceTimer;

// State
let currentLang = localStorage.getItem('weather_lang') || 'en';
// Theme is now permanently dark (default), so we can ignore theme loading or force it if needed.
// let currentTheme = 'dark'; // functionality removed
let currentUnit = localStorage.getItem('weather_unit') || 'c';

// Cache for weather data
let lastWeatherData = null;
let lastAQIData = null;
let lastCityName = '';

// ... (Rest of variables)

// Event Listeners
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!settingsDropdown.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)) {
        settingsDropdown.classList.add('hidden');
    }
});

// Translations
const translations = {
    en: {
        searchPlaceholder: "Search city...",
        uv: "UV Index",
        wind: "Wind",
        humidity: "Humidity",
        dewPoint: "Dew Point",
        pressure: "Pressure",
        aqi: "Air Quality",
        moonPhase: "Moon Phase",
        dewPoint: "Dew Point",
        illum: "Illum",
        sunrise: "Sunrise",
        sunset: "Sunset",
        moonset: "Moonset",
        unit: "Unit",
        lang: "Language",
        theme: "Theme",
        notFound: "City not found",
        error: "City not found. Please try again.",
        uvText: { low: 'Low', mod: 'Moderate', high: 'High', vhigh: 'Very High', ext: 'Extreme' },
        aqiText: { good: 'Good', mod: 'Moderate', sens: 'Unhealthy for Sensitive', un: 'Unhealthy', vun: 'Very Unhealthy', haz: 'Hazardous' },
        warnings: { icy: 'Warning: Potential Icy Roads', storm: 'Severe Weather: Thunderstorm Warning', uv: 'High UV Alert: Use Sunscreen', wind: 'High Wind Gusts' },
        newsTitle: "Local News",
        globalNewsTitle: "Global News",
        loadingNews: "Loading news...",
        errorNews: "Error loading news.",
        networkError: "Network problem.",
        readMore: "Read More",
        moonPhases: {
            0: 'New Moon', 1: 'Waxing Crescent', 2: 'First Quarter', 3: 'Waxing Gibbous',
            4: 'Full Moon', 5: 'Waning Gibbous', 6: 'Last Quarter', 7: 'Waning Crescent'
        },
        weatherDesc: {
            0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
            61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 71: 'Slight snow',
            73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Slight rain showers',
            81: 'Moderate rain showers', 82: 'Violent rain showers', 85: 'Slight snow showers',
            86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
        }
    },
    de: {
        searchPlaceholder: "Stadt suchen...",
        uv: "UV-Index",
        wind: "Wind",
        humidity: "Feuchtigkeit",
        dewPoint: "Taupunkt",
        pressure: "Druck",
        aqi: "Luftqualität",
        moonPhase: "Mondphase",
        dewPoint: "Taupunkt",
        illum: "Illum",
        sunrise: "Sonnenaufgang",
        sunset: "Sonnenuntergang",
        moonset: "Monduntergang",
        unit: "Einheit",
        lang: "Sprache",
        theme: "Design",
        notFound: "Stadt nicht gefunden",
        error: "Stadt nicht gefunden. Bitte versuchen Sie es erneut.",
        uvText: { low: 'Niedrig', mod: 'Mäßig', high: 'Hoch', vhigh: 'Sehr Hoch', ext: 'Extrem' },
        aqiText: { good: 'Gut', mod: 'Mäßig', sens: 'Ungesund für Empfindliche', un: 'Ungesund', vun: 'Sehr Ungesund', haz: 'Gefährlich' },
        warnings: { icy: 'Warnung: Mögliche Eisglätte', storm: 'Unwetter: Gewitterwarnung', uv: 'Hoher UV-Index: Sonnenschutz verwenden', wind: 'Starke Windböen' },
        newsTitle: "Lokale Nachrichten",
        globalNewsTitle: "Weltnachrichten",
        loadingNews: "Nachrichten werden geladen...",
        errorNews: "Fehler beim Laden der Nachrichten.",
        networkError: "Netzwerkproblem.",
        readMore: "Mehr lesen",
        moonPhases: {
            0: 'Neumond', 1: 'Zunehmendes Sichelmond', 2: 'Erstes Viertel', 3: 'Zunehmender Dreiviertelmond',
            4: 'Vollmond', 5: 'Abnehmender Dreiviertelmond', 6: 'Letztes Viertel', 7: 'Abnehmender Sichelmond'
        },
        weatherDesc: {
            0: 'Klarer Himmel', 1: 'Überwiegend klar', 2: 'Teilweise bewölkt', 3: 'Bedeckt',
            45: 'Nebel', 48: 'Nebel', 51: 'Leichter Nieselregen', 53: 'Mäßiger Nieselregen', 55: 'Dichter Nieselregen',
            61: 'Leichter Regen', 63: 'Mäßiger Regen', 65: 'Starker Regen', 71: 'Leichter Schneefall',
            73: 'Mäßiger Schneefall', 75: 'Starker Schneefall', 77: 'Schnee-Griesel', 80: 'Leichte Regenschauer',
            81: 'Mäßige Regenschauer', 82: 'Starke Regenschauer', 85: 'Leichte Schneeschauer',
            86: 'Starke Schneeschauer', 95: 'Gewitter', 96: 'Gewitter mit Hagel', 99: 'Gewitter mit starkem Hagel'
        }
    },
    sr: {
        searchPlaceholder: "Pretraži grad...",
        uv: "UV Indeks",
        wind: "Vetar",
        humidity: "Vlažnost",
        dewPoint: "Tačka rose",
        pressure: "Pritisak",
        aqi: "Kvalitet vazduha",
        moonPhase: "Mesečeva faza",
        dewPoint: "Tačka rose",
        illum: "Osvet.",
        sunrise: "Izlazak sunca",
        sunset: "Zalazak sunca",
        moonset: "Zalazak meseca",
        unit: "Jedinica",
        lang: "Jezik",
        theme: "Tema",
        notFound: "Grad nije pronađen",
        error: "Grad nije pronađen. Molimo pokušajte ponovo.",
        uvText: { low: 'Nizak', mod: 'Umeren', high: 'Visok', vhigh: 'Veoma Visok', ext: 'Ekstremno' },
        aqiText: { good: 'Dobar', mod: 'Umeren', sens: 'Nezdrav za osetljive', un: 'Nezdrav', vun: 'Veoma nezdrav', haz: 'Opasno' },
        warnings: { icy: 'Upozorenje: Moguća poledica', storm: 'Nepogoda: Upozorenje na oluju', uv: 'Visok UV: Koristite zaštitu', wind: 'Jaki udari vetra' },
        newsTitle: "Lokalne Vesti",
        globalNewsTitle: "Globalne Vesti",
        loadingNews: "Učitavam vesti...",
        errorNews: "Greška pri učitavanju vesti.",
        networkError: "Problem sa mrežom.",
        readMore: "Pročitaj više",
        moonPhases: {
            0: 'Mlad mesec', 1: 'Rastući srp', 2: 'Prva četvrt', 3: 'Rastući mesec',
            4: 'Pun mesec', 5: 'Opadajući mesec', 6: 'Poslednja četvrt', 7: 'Opadajući srp'
        },
        weatherDesc: {
            0: 'Vedro nebo', 1: 'Pretežno vedro', 2: 'Delimično oblačno', 3: 'Oblačno',
            45: 'Magla', 48: 'Magla', 51: 'Slabija sipeća kiša', 53: 'Umerena sipeća kiša', 55: 'Intenzivna sipeća kiša',
            61: 'Slaba kiša', 63: 'Umerena kiša', 65: 'Jaka kiša', 71: 'Slab sneg',
            73: 'Umeren sneg', 75: 'Jak sneg', 77: 'Zrna snega', 80: 'Slabi pljuskovi',
            81: 'Umereni pljuskovi', 82: 'Jaki pljuskovi', 85: 'Slabi pljuskovi snega',
            86: 'Jaki pljuskovi snega', 95: 'Grmljavina', 96: 'Grmljavina sa gradom', 99: 'Jaka grmljavina sa gradom'
        }
    }
};
const unitSelect = document.getElementById('unit-select');

languageSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('weather_lang', currentLang);
    updateStaticText();
    // Re-fetch current city to get localized descriptions from API
    const currentCity = cityInput.value.trim();
    if (currentCity && !weatherDisplay.classList.contains('hidden')) {
        getWeather(currentCity);
    }
    settingsDropdown.classList.add('hidden');
});

unitSelect.addEventListener('change', (e) => {
    currentUnit = e.target.value;
    localStorage.setItem('weather_unit', currentUnit);
    if (lastWeatherData) {
        updateUI(lastWeatherData, lastAQIData, lastCityName);
        updateForecast(lastWeatherData.hourly);
    }
});

function updateStaticText() {
    const t = translations[currentLang];
    cityInput.placeholder = t.searchPlaceholder;
    errorMessage.querySelector('p').textContent = t.error;

    // Update labels and static texts
    document.getElementById('unit-label').textContent = t.unit;
    languageSelect.previousElementSibling.textContent = t.lang;

    // Update labels in the grid
    document.querySelector('#uv-index').previousElementSibling.textContent = t.uv;
    document.querySelector('#wind-speed-detail').previousElementSibling.textContent = t.wind;
    document.querySelector('#humidity').previousElementSibling.textContent = t.humidity;
    document.querySelector('#pressure').previousElementSibling.textContent = t.pressure;
    document.querySelector('#aqi').previousElementSibling.textContent = t.aqi;
    document.querySelector('#moon-phase').previousElementSibling.textContent = t.moonPhase;

    const dewLabel = document.getElementById('dew-point-label');
    if (dewLabel) dewLabel.textContent = t.dewPoint;

    // Astro
    const astroLabels = document.querySelectorAll('.astro-item span:nth-of-type(1)');
    astroLabels[0].textContent = t.sunrise;
    astroLabels[1].textContent = t.sunset;
    astroLabels[2].textContent = t.moonset;

    // News
    document.getElementById('news-title').textContent = t.newsTitle;
}

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city); // Fallback to old behavior if typed manually
        suggestionsList.classList.add('hidden');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeather(city);
            suggestionsList.classList.add('hidden');
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
        fetchSuggestions(query);
    }, 300);
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.classList.add('hidden');
    }
});

async function fetchSuggestions(query) {
    try {
        const res = await fetch(`${GEOCODING_API}?name=${query}&count=6&language=en&format=json`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            renderSuggestions(data.results);
        } else {
            suggestionsList.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

function renderSuggestions(locations) {
    suggestionsList.innerHTML = '';

    locations.forEach(location => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';

        // Country flag (emoji logic based on country code if available, simplest fallback is just text)
        // Or Open-Meteo returns country_code e.g. "US"
        const country = location.country || '';
        const region = location.admin1 || '';
        const name = location.name;

        item.innerHTML = `
            <div>
                <span class="name">${name}</span>
                <span class="country">${region ? region + ', ' : ''}${country}</span>
            </div>
            ${location.country_code ? `<span class="flag"><img src="https://flagcdn.com/24x18/${location.country_code.toLowerCase()}.png" alt="${location.country_code}"></span>` : ''}
        `;

        item.addEventListener('click', () => {
            cityInput.value = name; // Update input
            suggestionsList.classList.add('hidden');
            fetchWeatherData(location.latitude, location.longitude, name, location.country_code);
        });

        suggestionsList.appendChild(item);
    });

    suggestionsList.classList.remove('hidden');
}

async function getWeather(city) {
    showLoading();
    try {
        // 1. Geocoding
        const geoRes = await fetch(`${GEOCODING_API}?name=${city}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results) {
            throw new Error('City not found');
        }

        const { latitude, longitude, name, country_code } = geoData.results[0];
        fetchWeatherData(latitude, longitude, name, country_code);

    } catch (error) {
        console.error(error);
        showError();
    }
}

async function fetchWeatherData(latitude, longitude, name, countryCode) {
    showLoading();
    try {
        // 2. Weather Data (10 Days, Daily & Hourly Details)
        // Re-added dewpoint_2m which was missing
        const weatherUrl = `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode,windgusts_10m,relativehumidity_2m,dewpoint_2m,surface_pressure,winddirection_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=9`;
        console.log('Fetching Weather:', weatherUrl);

        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error(`Weather API Error: ${weatherRes.status}`);
        const weatherData = await weatherRes.json();

        // 3. Air Quality Data
        const aqiUrl = `${AIR_QUALITY_API}?latitude=${latitude}&longitude=${longitude}&current=us_aqi&timezone=auto`;
        const aqiRes = await fetch(aqiUrl);
        const aqiData = await aqiRes.json();

        // Save to cache
        lastWeatherData = weatherData;
        lastAQIData = aqiData;
        lastCityName = name;

        updateUI(weatherData, aqiData, name);
        updateForecast(weatherData.hourly);
        loadNews(countryCode);
        triggerWeatherAnimation(weatherData.current_weather.weathercode);
    } catch (error) {
        console.error('Fetch Weather Failed:', error);
        showError(`Error: ${error.message}`);
    }
}

function updateUI(weatherData, aqiData, cityName) {
    loading.classList.add('hidden');
    errorMessage.classList.add('hidden');
    weatherDisplay.classList.remove('hidden');

    const current = weatherData.current_weather;
    const daily = weatherData.daily;
    const hourly = weatherData.hourly;

    // --- Current Weather Main ---
    const unitSymbol = currentUnit === 'f' ? '°F' : (currentUnit === 'k' ? 'K' : '°C');
    document.querySelectorAll('.unit').forEach(el => el.textContent = unitSymbol);

    tempElement.textContent = convertTemp(current.temperature);
    tempMaxElement.textContent = convertTemp(daily.temperature_2m_max[0]);
    tempMinElement.textContent = convertTemp(daily.temperature_2m_min[0]);

    const code = current.weathercode;
    const isDay = current.is_day !== 0; // 1 is day, 0 is night
    descElement.textContent = translations[currentLang].weatherDesc[code] || 'Unknown';
    if (cityDisplayElement) cityDisplayElement.textContent = cityName;
    // Use Font Awesome Class
    iconElement.className = getWeatherIconClass(code, isDay);
    iconElement.removeAttribute('src'); // Ensure no broken image icon

    // --- Details Grid ---

    // UV Index
    const uvIndex = daily.uv_index_max[0];
    uvElement.textContent = uvIndex;
    uvTextElement.textContent = getUVText(uvIndex);

    // Wind & Compass
    const windSpeed = current.windspeed;
    const windDir = current.winddirection;
    windSpeedElement.textContent = `${windSpeed} km/h`;
    windCompass.style.transform = `rotate(${windDir}deg)`;
    windDirText.textContent = getCardinalDirection(windDir);

    // Humidity & Pressure (Approximation from closest hour since current_weather lacks these)
    // Find current hour index
    const now = new Date();
    const currentHourISO = now.toISOString().slice(0, 13); // 'YYYY-MM-DDTHH'
    let hourIndex = hourly.time.findIndex(t => t.startsWith(currentHourISO));
    if (hourIndex === -1) hourIndex = 0; // Fallback

    humidityElement.textContent = `${hourly.relativehumidity_2m[hourIndex]}%`;
    // Update Dew Point
    const dewPointVal = hourly.dewpoint_2m ? hourly.dewpoint_2m[hourIndex] : 'N/A';
    const dewPointEl = document.getElementById('dew-point-value');
    if (dewPointEl) {
        dewPointEl.textContent = typeof dewPointVal === 'number' ? `${Math.round(dewPointVal)}°` : dewPointVal;
    }

    pressureElement.textContent = Math.round(hourly.surface_pressure[hourIndex]);

    // Air Quality
    const aqi = aqiData.current ? aqiData.current.us_aqi : 'N/A';
    aqiElement.textContent = aqi;
    aqiTextElement.textContent = getAQIText(aqi);

    // Moon Phase (Calculated)
    const moonData = getMoonPhaseData(now);
    moonPhaseElement.textContent = moonData.phase;
    moonIllumElement.textContent = `${moonData.illumination}% Illum`;
    moonIconWrapper.innerHTML = moonData.icon;

    // --- Astro Section ---
    sunriseElement.textContent = formatTime(daily.sunrise[0]);
    sunsetElement.textContent = formatTime(daily.sunset[0]);
    if (moonsetElement && daily.moonset) {
        moonsetElement.textContent = formatTime(daily.moonset[0]);
    }

    // --- Warnings ---
    const alerts = generateWarnings(current, daily, hourly, hourIndex);
    renderWarnings(alerts);
}

function updateForecast(hourlyData) {
    forecastContainer.innerHTML = '';

    // Extract hourly data (is_day removed for stability, will infer or custom logic)
    const { time, temperature_2m, weathercode, windgusts_10m } = hourlyData;

    // Group by day
    const days = {};

    time.forEach((t, index) => {
        const date = new Date(t);
        const dayKey = date.toLocaleDateString(currentLang === 'sr' ? 'sr-RS' : (currentLang === 'de' ? 'de-DE' : 'en-US'), { weekday: 'long', month: 'short', day: 'numeric' });

        if (!days[dayKey]) {
            days[dayKey] = [];
        }

        // Simple day/night inference based on hour (6am to 9pm is "day" roughly for icons)
        // A better way is using sunrise/sunset from daily, but that's complex to map to hourly index here quickly.
        // Let's use hour check:
        const h = date.getHours();
        const simplifiedIsDay = h >= 6 && h < 21;

        days[dayKey].push({
            time: date.toLocaleTimeString(currentLang === 'sr' ? 'sr-RS' : (currentLang === 'de' ? 'de-DE' : 'en-US'), { hour: 'numeric', hour12: currentLang === 'en' }),
            temp: temperature_2m[index],
            code: weathercode[index],
            gusts: windgusts_10m[index],
            isDay: simplifiedIsDay
        });
    });

    // Render groups
    Object.keys(days).forEach(dayName => {
        const dayData = days[dayName];

        const dayGroup = document.createElement('div');
        dayGroup.className = 'day-group';

        // Header for the day
        const dayTitle = document.createElement('div');
        dayTitle.className = 'day-title';
        dayTitle.textContent = dayName;
        dayGroup.appendChild(dayTitle);
        // Add Glassy Dark style explicitly if needed, but CSS handles it


        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'hourly-scroll';

        dayData.forEach(hour => {
            const card = document.createElement('div');
            card.className = 'forecast-card';

            // Use get WeatherIconClass for font awesome icons
            const iconClass = getWeatherIconClass(hour.code, hour.isDay);

            card.innerHTML = `
                <span class="forecast-time">${hour.time}</span>
                <i class="forecast-icon ${iconClass}" style="font-size: 1.5rem; margin: 5px 0;"></i>
                <span class="forecast-temp">${convertTemp(hour.temp)}°</span>
                <span class="forecast-gusts"><i class="fa-solid fa-wind"></i> ${Math.round(hour.gusts)}</span>
            `;

            scrollContainer.appendChild(card);
        });

        dayGroup.appendChild(scrollContainer);
        forecastContainer.appendChild(dayGroup);
    });
}


function showLoading() {
    loading.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function showError(msg) {
    loading.classList.add('hidden');
    weatherDisplay.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    // If msg provided, update text, otherwise default to translation
    const p = errorMessage.querySelector('p');
    if (msg) p.textContent = msg;
    else p.textContent = translations[currentLang].error;
}

async function loadNews(countryCode) {
    const container = document.getElementById('news-container');
    const title = document.getElementById('news-title');
    const t = translations[currentLang];
    container.innerHTML = `<p>${t.loadingNews}</p>`;

    let rssUrl = "";
    if (countryCode === 'RS') {
        rssUrl = "https://www.rts.rs/page/stories/sr/rss.html";
        title.textContent = t.newsTitle;
    } else if (countryCode === 'DE') {
        rssUrl = "https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml";
        title.textContent = t.newsTitle;
    } else {
        rssUrl = "http://feeds.bbci.co.uk/news/world/rss.xml";
        title.textContent = t.globalNewsTitle;
    }

    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        container.innerHTML = "";

        if (data.status === 'ok') {
            data.items.slice(0, 6).forEach(item => {
                const card = document.createElement('div');
                card.className = 'news-card';

                const shortDesc = item.description.replace(/<[^>]*>?/gm, '').substring(0, 120) + "...";

                card.innerHTML = `
                    <span class="source-label">${data.feed.title}</span>
                    <h3>${item.title}</h3>
                    <p>${shortDesc}</p>
                    <a href="${item.link}" target="_blank">${t.readMore} →</a>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p>${t.errorNews}</p>`;
        }
    } catch (err) {
        container.innerHTML = `<p>${t.networkError}</p>`;
        console.error(err);
    }
}

// --- Dynamic Themes & Animations ---

function updateTimeTheme() {
    const hour = new Date().getHours();
    const body = document.body;

    // Remove old themes
    body.classList.remove('theme-morning', 'theme-noon', 'theme-afternoon', 'theme-night', 'theme-midnight');

    if (hour >= 5 && hour < 11) body.classList.add('theme-morning');
    else if (hour >= 11 && hour < 16) body.classList.add('theme-noon');
    else if (hour >= 16 && hour < 20) body.classList.add('theme-afternoon');
    else if (hour >= 20 || hour < 5) {
        if (hour >= 23 || hour < 3) body.classList.add('theme-midnight');
        else body.classList.add('theme-night');
    }
}

function triggerWeatherAnimation(code) {
    const container = document.getElementById('weather-animations');
    container.innerHTML = ''; // Clear old animations

    // Weather grouping
    const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
    const isSnow = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
    const isHail = (code === 77 || code >= 96);
    const isThunder = (code >= 95);

    if (isRain) createParticles('rain-drop', 80);
    if (isSnow) createParticles('snowflake', 50);
    if (isHail) createParticles('hail-drop', 40);
    if (isThunder) startLightning();
}

function createParticles(className, count) {
    const container = document.getElementById('weather-animations');
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = className;
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        if (className === 'snowflake') {
            const size = Math.random() * 5 + 2 + 'px';
            particle.style.width = size;
            particle.style.height = size;
        }
        container.appendChild(particle);
    }
}

function startLightning() {
    const overlay = document.createElement('div');
    overlay.className = 'lightning-flash';
    document.body.appendChild(overlay);

    setInterval(() => {
        if (Math.random() > 0.95) {
            overlay.classList.add('flash-active');
            setTimeout(() => overlay.classList.remove('flash-active'), 500);
        }
    }, 1000);
}

// --- Helpers ---

function convertTemp(c) {
    if (currentUnit === 'f') return Math.round((c * 9 / 5) + 32);
    if (currentUnit === 'k') return Math.round(c + 273.15);
    return Math.round(c);
}

function formatTime(isoString) {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getUVText(uv) {
    const t = translations[currentLang].uvText;
    if (uv <= 2) return t.low;
    if (uv <= 5) return t.mod;
    if (uv <= 7) return t.high;
    if (uv <= 10) return t.vhigh;
    return t.ext;
}

function getAQIText(aqi) {
    const t = translations[currentLang].aqiText;
    if (aqi <= 50) return t.good;
    if (aqi <= 100) return t.mod;
    if (aqi <= 150) return t.sens;
    if (aqi <= 200) return t.un;
    if (aqi <= 300) return t.vun;
    return t.haz;
}

function getCardinalDirection(angle) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(angle / 45) % 8];
}

// Simple Moon Phase Calculation
function getMoonPhaseData(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 3) {
        year--;
        month += 12;
    }

    ++month;
    let c = 365.25 * year;
    let e = 30.6 * month;
    let jd = c + e + day - 694039.09; // jd is total days elapsed
    jd /= 29.5305882; // divide by the moon cycle
    let b = parseInt(jd); // int(jd) -> b, take integer part of jd
    jd -= b; // subtract integer part to leave fractional part of original jd
    b = Math.round(jd * 8); // scale fraction from 0-8 and round

    if (b >= 8) b = 0; // 0 and 8 are the same so turn 8 into 0

    // We keep phases in English for the icon logic, but could localize text if needed.
    // For now returning English phase name as key, and we could map it if we really wanted.
    // Let's simplified: just return the English name for display as per current logic.
    const phases = {
        0: { phase: translations[currentLang].moonPhases[0], icon: '<i class="fa-solid fa-circle" style="color:#444;"></i>', illumination: '0' },
        1: { phase: translations[currentLang].moonPhases[1], icon: '<i class="fa-solid fa-moon"></i>', illumination: '25' },
        2: { phase: translations[currentLang].moonPhases[2], icon: '<i class="fa-solid fa-circle-half-stroke"></i>', illumination: '50' },
        3: { phase: translations[currentLang].moonPhases[3], icon: '<i class="fa-solid fa-cloud-moon"></i>', illumination: '75' },
        4: { phase: translations[currentLang].moonPhases[4], icon: '<i class="fa-solid fa-circle" style="color:#eee;"></i>', illumination: '100' },
        5: { phase: translations[currentLang].moonPhases[5], icon: '<i class="fa-solid fa-cloud-moon"></i>', illumination: '75' },
        6: { phase: translations[currentLang].moonPhases[6], icon: '<i class="fa-solid fa-circle-half-stroke" style="transform:scaleX(-1);"></i>', illumination: '50' },
        7: { phase: translations[currentLang].moonPhases[7], icon: '<i class="fa-solid fa-moon" style="transform:scaleX(-1);"></i>', illumination: '25' }
    };
    return phases[b];
}

function generateWarnings(current, daily, hourly, hourIndex) {
    const alerts = [];
    const t = translations[currentLang].warnings;
    const temp = current.temperature;
    // const precipProb = hourly.precipitation_probability ? hourly.precipitation_probability[hourIndex] : 0; 
    // Actually precipitation is better inferred from weathercode: 51-67, 71-99 are wet
    const code = current.weathercode;
    const isWet = (code >= 51 && code <= 67) || (code >= 71 && code <= 99);

    // Icy Roads
    if (temp <= 2 && isWet) {
        alerts.push({ text: t.icy, icon: 'fa-snowflake', color: '#00d2ff' });
    }

    // Storms (Code 95+)
    if (code >= 95) {
        alerts.push({ text: t.storm, icon: 'fa-bolt', color: '#ff4757' });
    }

    // High UV
    if (daily.uv_index_max[0] >= 8) {
        alerts.push({ text: t.uv, icon: 'fa-sun', color: '#ffa502' });
    }

    // Wind Gusts (High)
    const gust = hourly.windgusts_10m[hourIndex];
    if (gust > 50) {
        alerts.push({ text: `${t.wind}: ${gust} km/h`, icon: 'fa-wind', color: '#fab1a0' });
    }

    return alerts;
}

function renderWarnings(alerts) {
    warningsContainer.innerHTML = '';
    if (alerts.length > 0) {
        warningsContainer.classList.remove('hidden');
        alerts.forEach(alert => {
            const div = document.createElement('div');
            div.className = 'warning-banner';
            // Override style for specific alert color if needed, or use default class
            div.style.borderColor = alert.color;
            div.style.background = `${alert.color}22`; // 22 is hex alpha

            div.innerHTML = `
                <i class="fa-solid ${alert.icon}" style="color: ${alert.color}"></i>
                <span>${alert.text}</span>
            `;
            warningsContainer.appendChild(div);
        });
    } else {
        warningsContainer.classList.add('hidden');
    }
}

// --- IP Geolocation ---
// Font Awesome Icon Map
function getWeatherIconClass(code, isDay) {
    // 0: Clear
    // 1,2,3: Clouds
    // 45,48: Fog
    // 51-67: Rain/Drizzle
    // 71-77, 85-86: Snow
    // 80-82: Showers
    // 95-99: Thunderstuff

    const timeMod = isDay ? 'fa-sun' : 'fa-moon';
    const cloudMod = isDay ? 'fa-cloud-sun' : 'fa-cloud-moon';
    const rainMod = isDay ? 'fa-cloud-sun-rain' : 'fa-cloud-moon-rain';

    if (code === 0) return `fa-solid ${timeMod}`;
    if (code === 1) return `fa-solid ${cloudMod}`;
    if (code === 2) return `fa-solid ${cloudMod}`;
    if (code === 3) return `fa-solid fa-cloud`;
    if (code === 45 || code === 48) return `fa-solid fa-smog`;
    if (code >= 51 && code <= 67) return `fa-solid fa-cloud-rain`; // Drizzle/Rain
    if (code >= 71 && code <= 77) return `fa-solid fa-snowflake`;
    if (code >= 80 && code <= 82) return `fa-solid fa-cloud-showers-heavy`;
    if (code >= 85 && code <= 86) return `fa-solid fa-snowflake`;
    if (code >= 95) return `fa-solid fa-bolt`;

    return `fa-solid ${timeMod}`; // Fallback
}

// --- Auto Location with Browser Geolocation API ---
async function initAutoLocation() {
    console.log('🌍 Starting auto-location...');

    // Try browser's native geolocation first (most accurate)
    if (navigator.geolocation) {
        console.log('📍 Trying browser geolocation...');

        navigator.geolocation.getCurrentPosition(
            // Success callback
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                console.log(`✅ Got coordinates: ${lat}, ${lon}`);

                // Reverse geocode to get city name
                try {
                    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
                    const response = await fetch(geoUrl);
                    const data = await response.json();

                    if (data.results && data.results[0]) {
                        const city = data.results[0].name;
                        const country = data.results[0].country_code;
                        console.log(`✅ Detected city: ${city}, ${country}`);

                        // Set language based on country
                        if (country === 'RS') currentLang = 'sr';
                        else if (country === 'DE') currentLang = 'de';

                        localStorage.setItem('weather_lang', currentLang);
                        languageSelect.value = currentLang;
                        updateStaticText();

                        cityInput.value = city;
                        console.log(`🌤️ Fetching weather for ${city}...`);
                        fetchWeatherData(lat, lon, city, country);
                    } else {
                        throw new Error('No city found from coordinates');
                    }
                } catch (error) {
                    console.error('❌ Reverse geocoding failed:', error);
                    fallbackToIPLocation();
                }
            },
            // Error callback
            (error) => {
                console.warn('⚠️ Browser geolocation denied or failed:', error.message);
                fallbackToIPLocation();
            },
            // Options
            { timeout: 10000, enableHighAccuracy: false }
        );
    } else {
        console.warn('⚠️ Browser geolocation not supported');
        fallbackToIPLocation();
    }
}

// Fallback to IP-based geolocation
async function fallbackToIPLocation() {
    console.log('🔄 Falling back to IP-based location...');

    const tryProvider = async (url) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
    };

    try {
        let city, country, lat, lon;

        try {
            console.log('📍 Trying geojs.io...');
            const data = await tryProvider('https://get.geojs.io/v1/ip/geo.json');
            console.log('✅ GeoJS Data:', data);
            city = data.city;
            country = data.country_code;
            lat = data.latitude;
            lon = data.longitude;

            if (!city) {
                throw new Error('No city from geojs');
            }
            console.log(`✅ City detected: ${city}, Country: ${country}`);

        } catch (e1) {
            console.warn('❌ geojs failed, trying ipapi...', e1);
            const data = await tryProvider('https://ipapi.co/json/');
            console.log('✅ IPAPI Data:', data);
            city = data.city;
            country = data.country_code;
            lat = data.latitude;
            lon = data.longitude;
        }

        if (city && lat && lon) {
            if (country === 'RS') currentLang = 'sr';
            else if (country === 'DE') currentLang = 'de';

            localStorage.setItem('weather_lang', currentLang);
            languageSelect.value = currentLang;
            updateStaticText();

            cityInput.value = city;
            console.log(`🌤️ Fetching weather for ${city}...`);
            fetchWeatherData(lat, lon, city, country);
        } else {
            throw new Error("No city found in any provider");
        }

    } catch (error) {
        console.error('❌ All location methods failed:', error);
        const defaultCity = 'Belgrade';
        console.log(`🔄 Loading default city: ${defaultCity}`);
        getWeather(defaultCity);
    }
}

// --- Initialization ---
function init() {
    // Theme is now static/time-based, so no toggle logic needed.

    languageSelect.value = currentLang;
    unitSelect.value = currentUnit;
    updateStaticText();
    updateTimeTheme(); // This handles the background gradients
    initAutoLocation();
}

init();

// --- Chat UI Logic ---
const chatFab = document.getElementById('chat-fab');
const chatWindow = document.getElementById('chat-window');
const closeChatBtn = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');

function toggleChat() {
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden')) {
        chatInput.focus();
    }
}

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user-message');
    chatInput.value = '';

    // Scroll to bottom
    scrollToBottom();
}

function addMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    msgDiv.innerHTML = `<div class="message-content">${text}</div>`;
    chatMessages.appendChild(msgDiv);
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatFab) {
    chatFab.addEventListener('click', toggleChat);
}

if (closeChatBtn) {
    closeChatBtn.addEventListener('click', toggleChat);
}

if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

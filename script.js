
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

const suggestionsList = document.getElementById('suggestions');
const settingsBtn = document.getElementById('settings-btn');
const settingsDropdown = document.getElementById('settings-dropdown');
const themeToggle = document.getElementById('theme-toggle');
const languageSelect = document.getElementById('language-select');

let debounceTimer;

// State
let currentLang = localStorage.getItem('weather_lang') || 'en';
let currentTheme = localStorage.getItem('weather_theme') || 'dark';
let currentUnit = localStorage.getItem('weather_unit') || 'c';

// Cached Data for instant unit conversion
let lastWeatherData = null;
let lastAQIData = null;
let lastCityName = "";

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

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    currentTheme = isLight ? 'light' : 'dark';
    localStorage.setItem('weather_theme', currentTheme);
    themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

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
    themeToggle.previousElementSibling.textContent = t.theme;

    // Update labels in the grid
    document.querySelector('#uv-index').previousElementSibling.textContent = t.uv;
    document.querySelector('#wind-speed-detail').previousElementSibling.textContent = t.wind;
    document.querySelector('#humidity').previousElementSibling.textContent = t.humidity;
    document.querySelector('#pressure').previousElementSibling.textContent = t.pressure;
    document.querySelector('#aqi').previousElementSibling.textContent = t.aqi;
    document.querySelector('#moon-phase').previousElementSibling.textContent = t.moonPhase;

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
        const weatherUrl = `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode,windgusts_10m,relativehumidity_2m,surface_pressure,winddirection_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=10&language=${currentLang}`;
        const weatherRes = await fetch(weatherUrl);
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
    } catch (error) {
        console.error(error);
        showError();
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
    const weatherInfo = weatherCodes[code] || { icon: 'Unknown' };
    descElement.textContent = translations[currentLang].weatherDesc[code] || 'Unknown';
    iconElement.src = getIconUrl(code);

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
    moonsetElement.textContent = daily.moonset && daily.moonset[0] ? formatTime(daily.moonset[0]) : '--:--';

    // --- Warnings ---
    const alerts = generateWarnings(current, daily, hourly, hourIndex);
    renderWarnings(alerts);
}

function updateForecast(hourlyData) {
    forecastContainer.innerHTML = '';

    const { time, temperature_2m, weathercode, windgusts_10m } = hourlyData;

    // Group by day
    const days = {};

    time.forEach((t, index) => {
        const date = new Date(t);
        const dayKey = date.toLocaleDateString(currentLang === 'sr' ? 'sr-RS' : (currentLang === 'de' ? 'de-DE' : 'en-US'), { weekday: 'long', month: 'short', day: 'numeric' });

        if (!days[dayKey]) {
            days[dayKey] = [];
        }

        days[dayKey].push({
            time: date.toLocaleTimeString(currentLang === 'sr' ? 'sr-RS' : (currentLang === 'de' ? 'de-DE' : 'en-US'), { hour: 'numeric', hour12: currentLang === 'en' }),
            temp: temperature_2m[index],
            code: weathercode[index],
            gusts: windgusts_10m[index]
        });
    });

    // Render groups
    Object.keys(days).forEach(dayName => {
        const dayData = days[dayName];

        const dayGroup = document.createElement('div');
        dayGroup.className = 'day-group';

        const title = document.createElement('h3');
        title.className = 'day-title';
        title.textContent = dayName;
        dayGroup.appendChild(title);

        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'hourly-scroll';

        dayData.forEach(hour => {
            const card = document.createElement('div');
            card.className = 'forecast-card';

            card.innerHTML = `
                <span class="forecast-time">${hour.time}</span>
                <img class="forecast-icon" src="${getIconUrl(hour.code)}" alt="Icon">
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

function showError() {
    loading.classList.add('hidden');
    weatherDisplay.classList.add('hidden');
    errorMessage.classList.remove('hidden');
}

// --- News ---
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
async function initAutoLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.city) {
            cityInput.value = data.city;
            fetchWeatherData(data.latitude, data.longitude, data.city, data.country_code);
        }
    } catch (error) {
        console.error('Auto-location failed:', error);
        // Default to a fallback city if needed, but here we just wait for user input
    }
}

// --- Initialization ---
function init() {
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    languageSelect.value = currentLang;
    unitSelect.value = currentUnit;
    updateStaticText();
    initAutoLocation();
}

init();

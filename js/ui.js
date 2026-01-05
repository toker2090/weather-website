import { translations } from './translations.js';
import * as helpers from './helpers.js';
import { triggerWeatherAnimation } from './animations.js';

export function updateUI(weatherData, aqiData, cityName, currentLang, currentUnit) {
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const weatherDisplay = document.getElementById('weather-display');
    const tempElement = document.getElementById('temperature');
    const tempMaxElement = document.getElementById('temp-max');
    const tempMinElement = document.getElementById('temp-min');
    const descElement = document.getElementById('description');
    const cityDisplayElement = document.getElementById('city-display');
    const iconElement = document.getElementById('weather-icon');

    // Update Visibility
    loading.classList.add('hidden');
    errorMessage.classList.add('hidden');
    weatherDisplay.classList.remove('hidden');

    const current = weatherData.current_weather;
    const daily = weatherData.daily;
    const hourly = weatherData.hourly;

    const t = translations[currentLang];

    // Units
    const unitSymbol = currentUnit === 'f' ? '°F' : (currentUnit === 'k' ? 'K' : '°C');
    document.querySelectorAll('.unit').forEach(el => el.textContent = unitSymbol);

    // Main
    tempElement.textContent = helpers.convertTemp(current.temperature, currentUnit);
    tempMaxElement.textContent = helpers.convertTemp(daily.temperature_2m_max[0], currentUnit);
    tempMinElement.textContent = helpers.convertTemp(daily.temperature_2m_min[0], currentUnit);
    descElement.textContent = t.weatherDesc[current.weathercode] || 'Unknown';
    if (cityDisplayElement) cityDisplayElement.textContent = cityName;

    const isDay = current.is_day !== 0;
    iconElement.className = helpers.getWeatherIconClass(current.weathercode, isDay);
    iconElement.removeAttribute('src');

    // Details
    document.getElementById('uv-index').textContent = daily.uv_index_max[0];
    document.getElementById('uv-text').textContent = helpers.getUVText(daily.uv_index_max[0], currentLang);

    const windSpeed = current.windspeed;
    const windDir = current.winddirection;
    document.getElementById('wind-speed-detail').textContent = `${windSpeed} km/h`;
    document.getElementById('wind-compass').style.transform = `rotate(${windDir}deg)`;
    document.getElementById('wind-dir-text').textContent = helpers.getCardinalDirection(windDir);

    // Hourly Index
    const now = new Date();
    const currentHourISO = now.toISOString().slice(0, 13);
    let hourIndex = hourly.time.findIndex(time => time.startsWith(currentHourISO));
    if (hourIndex === -1) hourIndex = 0;

    document.getElementById('humidity').textContent = `${hourly.relativehumidity_2m[hourIndex]}%`;
    document.getElementById('pressure').textContent = Math.round(hourly.surface_pressure[hourIndex]);

    const dewPointVal = hourly.dewpoint_2m ? hourly.dewpoint_2m[hourIndex] : 'N/A';
    const dewEl = document.getElementById('dew-point-value');
    if (dewEl) dewEl.textContent = typeof dewPointVal === 'number' ? `${Math.round(dewPointVal)}°` : dewPointVal;

    // AQI
    const aqi = aqiData.current ? aqiData.current.us_aqi : 'N/A';
    document.getElementById('aqi').textContent = aqi;
    document.getElementById('aqi-text').textContent = helpers.getAQIText(aqi, currentLang);

    // Moon
    const moonData = helpers.getMoonPhaseData(now, currentLang);
    document.getElementById('moon-phase').textContent = moonData.phase;
    document.getElementById('moon-illumination').textContent = `${moonData.illumination}% Illum`;
    document.getElementById('moon-icon-wrapper').innerHTML = moonData.icon;

    // Astro
    document.getElementById('sunrise-time').textContent = helpers.formatTime(daily.sunrise[0]);
    document.getElementById('sunset-time').textContent = helpers.formatTime(daily.sunset[0]);
    if (document.getElementById('moonset-time') && daily.moonset) {
        document.getElementById('moonset-time').textContent = helpers.formatTime(daily.moonset[0]);
    }

    renderWarnings(current, daily, hourly, hourIndex, t);
    updateForecast(hourly, currentLang, currentUnit);
    triggerWeatherAnimation(current.weathercode);
}

function renderWarnings(current, daily, hourly, hourIndex, t) {
    const container = document.getElementById('warnings-container');
    container.innerHTML = '';
    const alerts = [];

    const temp = current.temperature;
    const code = current.weathercode;
    const isWet = (code >= 51 && code <= 67) || (code >= 71 && code <= 99);

    if (temp <= 2 && isWet) alerts.push({ text: t.warnings.icy, icon: 'fa-snowflake', color: '#00d2ff' });
    if (code >= 95) alerts.push({ text: t.warnings.storm, icon: 'fa-bolt', color: '#ff4757' });
    if (daily.uv_index_max[0] >= 8) alerts.push({ text: t.warnings.uv, icon: 'fa-sun', color: '#ffa502' });

    const gust = hourly.windgusts_10m[hourIndex];
    if (gust > 50) alerts.push({ text: `${t.warnings.wind}: ${gust} km/h`, icon: 'fa-wind', color: '#fab1a0' });

    if (alerts.length > 0) {
        container.classList.remove('hidden');
        alerts.forEach(alert => {
            const div = document.createElement('div');
            div.className = 'warning-banner';
            div.style.borderColor = alert.color;
            div.style.background = `${alert.color}22`;
            div.innerHTML = `<i class="fa-solid ${alert.icon}" style="color: ${alert.color}"></i><span>${alert.text}</span>`;
            container.appendChild(div);
        });
    } else {
        container.classList.add('hidden');
    }
}

function updateForecast(hourlyData, currentLang, currentUnit) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';

    const { time, temperature_2m, weathercode, windgusts_10m } = hourlyData;
    const days = {};

    time.forEach((t, index) => {
        const date = new Date(t);
        const dayKey = date.toLocaleDateString(currentLang === 'sr' ? 'sr-RS' : (currentLang === 'de' ? 'de-DE' : 'en-US'), { weekday: 'long', month: 'short', day: 'numeric' });
        if (!days[dayKey]) days[dayKey] = [];

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

    Object.keys(days).forEach(dayName => {
        const dayData = days[dayName];
        const dayGroup = document.createElement('div');
        dayGroup.className = 'day-group';

        const dayTitle = document.createElement('div');
        dayTitle.className = 'day-title';
        dayTitle.textContent = dayName;
        dayGroup.appendChild(dayTitle);

        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'hourly-scroll';

        dayData.forEach(hour => {
            const card = document.createElement('div');
            card.className = 'forecast-card';
            const iconClass = helpers.getWeatherIconClass(hour.code, hour.isDay);

            card.innerHTML = `
                <span class="forecast-time">${hour.time}</span>
                <i class="forecast-icon ${iconClass}" style="font-size: 1.5rem; margin: 5px 0;"></i>
                <span class="forecast-temp">${helpers.convertTemp(hour.temp, currentUnit)}°</span>
                <span class="forecast-gusts"><i class="fa-solid fa-wind"></i> ${Math.round(hour.gusts)}</span>
            `;
            scrollContainer.appendChild(card);
        });

        dayGroup.appendChild(scrollContainer);
        container.appendChild(dayGroup);
    });
}

export function renderSuggestions(locations, onSelect) {
    const list = document.getElementById('suggestions');
    list.innerHTML = '';
    const cityInput = document.getElementById('city-input');

    locations.forEach(location => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
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
            cityInput.value = name;
            list.classList.add('hidden');
            onSelect(location.latitude, location.longitude, name, location.country_code);
        });
        list.appendChild(item);
    });
    list.classList.remove('hidden');
}

export function renderNews(data, t) {
    const container = document.getElementById('news-container');
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
}

export function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('weather-display').classList.add('hidden');
    document.getElementById('error-message').classList.add('hidden');
}

export function showError(msg, currentLang) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('weather-display').classList.add('hidden');
    const el = document.getElementById('error-message');
    el.classList.remove('hidden');
    const p = el.querySelector('p');
    if (msg) p.textContent = msg;
    else if (currentLang && translations[currentLang]) p.textContent = translations[currentLang].error;
}

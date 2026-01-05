import { GEOCODING_API, WEATHER_API, AIR_QUALITY_API } from './config.js';

export async function fetchSuggestions(query) {
    const res = await fetch(`${GEOCODING_API}?name=${query}&count=6&language=en&format=json`);
    const data = await res.json();
    return data.results || [];
}

export async function fetchGeoData(city) {
    const geoRes = await fetch(`${GEOCODING_API}?name=${city}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();
    if (!geoData.results) {
        throw new Error('City not found');
    }
    return geoData.results[0];
}

export async function fetchWeatherData(latitude, longitude) {
    // 10 Days, Daily & Hourly Details
    const weatherUrl = `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode,windgusts_10m,relativehumidity_2m,dewpoint_2m,surface_pressure,winddirection_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,moonset,uv_index_max&timezone=auto&forecast_days=9`;

    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error(`Weather API Error: ${weatherRes.status}`);
    return await weatherRes.json();
}

export async function fetchAQIData(latitude, longitude) {
    const aqiUrl = `${AIR_QUALITY_API}?latitude=${latitude}&longitude=${longitude}&current=us_aqi&timezone=auto`;
    const aqiRes = await fetch(aqiUrl);
    return await aqiRes.json();
}

export async function fetchRSSNews(countryCode) {
    let rssUrl = "";
    if (countryCode === 'RS') {
        rssUrl = "https://www.rts.rs/page/stories/sr/rss.html";
    } else if (countryCode === 'DE') {
        rssUrl = "https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml";
    } else {
        rssUrl = "http://feeds.bbci.co.uk/news/world/rss.xml";
    }

    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const response = await fetch(apiUrl);
    return await response.json();
}

export async function fetchReverseGeo(lat, lon) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    return data.results ? data.results[0] : null;
}

export async function fetchIPLocation() {
    // Try geojs.io
    const r = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
}

export async function fetchIPAPI() {
    // Fallback
    const r = await fetch('https://ipapi.co/json/');
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
}

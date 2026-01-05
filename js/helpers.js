import { translations } from './translations.js';

export function convertTemp(c, currentUnit) {
    if (currentUnit === 'f') return Math.round((c * 9 / 5) + 32);
    if (currentUnit === 'k') return Math.round(c + 273.15);
    return Math.round(c);
}

export function formatTime(isoString) {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getUVText(uv, currentLang) {
    const t = translations[currentLang].uvText;
    if (uv <= 2) return t.low;
    if (uv <= 5) return t.mod;
    if (uv <= 7) return t.high;
    if (uv <= 10) return t.vhigh;
    return t.ext;
}

export function getAQIText(aqi, currentLang) {
    const t = translations[currentLang].aqiText;
    if (aqi <= 50) return t.good;
    if (aqi <= 100) return t.mod;
    if (aqi <= 150) return t.sens;
    if (aqi <= 200) return t.un;
    if (aqi <= 300) return t.vun;
    return t.haz;
}

export function getCardinalDirection(angle) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(angle / 45) % 8];
}

export function getMoonPhaseData(date, currentLang) {
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
    let b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);

    if (b >= 8) b = 0;

    // Translations for moon phases need to be accessed
    const t = translations[currentLang].moonPhases;

    const phases = {
        0: { phase: t[0], icon: '<i class="fa-solid fa-circle" style="color:#444;"></i>', illumination: '0' },
        1: { phase: t[1], icon: '<i class="fa-solid fa-moon"></i>', illumination: '25' },
        2: { phase: t[2], icon: '<i class="fa-solid fa-circle-half-stroke"></i>', illumination: '50' },
        3: { phase: t[3], icon: '<i class="fa-solid fa-cloud-moon"></i>', illumination: '75' },
        4: { phase: t[4], icon: '<i class="fa-solid fa-circle" style="color:#eee;"></i>', illumination: '100' },
        5: { phase: t[5], icon: '<i class="fa-solid fa-cloud-moon"></i>', illumination: '75' },
        6: { phase: t[6], icon: '<i class="fa-solid fa-circle-half-stroke" style="transform:scaleX(-1);"></i>', illumination: '50' },
        7: { phase: t[7], icon: '<i class="fa-solid fa-moon" style="transform:scaleX(-1);"></i>', illumination: '25' }
    };
    return phases[b];
}

export function getWeatherIconClass(code, isDay) {
    const timeMod = isDay ? 'fa-sun' : 'fa-moon';
    const cloudMod = isDay ? 'fa-cloud-sun' : 'fa-cloud-moon';

    if (code === 0) return `fa-solid ${timeMod}`;
    if (code === 1) return `fa-solid ${cloudMod}`;
    if (code === 2) return `fa-solid ${cloudMod}`;
    if (code === 3) return `fa-solid fa-cloud`;
    if (code === 45 || code === 48) return `fa-solid fa-smog`;
    if (code >= 51 && code <= 67) return `fa-solid fa-cloud-rain`;
    if (code >= 71 && code <= 77) return `fa-solid fa-snowflake`;
    if (code >= 80 && code <= 82) return `fa-solid fa-cloud-showers-heavy`;
    if (code >= 85 && code <= 86) return `fa-solid fa-snowflake`;
    if (code >= 95) return `fa-solid fa-bolt`;

    return `fa-solid ${timeMod}`;
}

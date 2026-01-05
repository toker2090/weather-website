export const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
export const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
export const AIR_QUALITY_API = "https://air-quality-api.open-meteo.com/v1/air-quality";

// WMO Weather interpretation codes (WW)
export const weatherCodes = {
    0: { desc: 'Clear sky', icon: 'Sun' },
    1: { desc: 'Mainly clear', icon: 'CloudSun' },
    2: { desc: 'Partly cloudy', icon: 'CloudSun' },
    3: { desc: 'Overcast', icon: 'Cloud' },
    45: { desc: 'Fog', icon: 'Fog' },
    48: { desc: 'Depositing rime fog', icon: 'Fog' },
    51: { desc: 'Light drizzle', icon: 'CloudRain' },
    53: { desc: 'Moderate drizzle', icon: 'CloudRain' },
    52: { desc: 'Dense drizzle', icon: 'CloudRain' },
    55: { desc: 'Dense drizzle', icon: 'CloudRain' },
    61: { desc: 'Slight rain', icon: 'CloudRain' },
    63: { desc: 'Moderate rain', icon: 'CloudRain' },
    65: { desc: 'Heavy rain', icon: 'CloudRain' },
    56: { desc: 'Light freezing drizzle', icon: 'CloudRain' }, // Added missing 56/57 if implied
    57: { desc: 'Dense freezing drizzle', icon: 'CloudRain' },
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

import { Injectable, Logger } from '@nestjs/common';
import type { WeatherDay } from '@workarmy/types';

/** WMO weather code → emoji + short summary (Open-Meteo daily `weathercode`). */
function describe(code: number): { emoji: string; summary: string } {
  if (code === 0) return { emoji: '☀️', summary: 'Clear' };
  if (code <= 2) return { emoji: '🌤️', summary: 'Mostly sunny' };
  if (code === 3) return { emoji: '☁️', summary: 'Overcast' };
  if (code <= 48) return { emoji: '🌫️', summary: 'Fog' };
  if (code <= 57) return { emoji: '🌦️', summary: 'Drizzle' };
  if (code <= 67) return { emoji: '🌧️', summary: 'Rain' };
  if (code <= 77) return { emoji: '🌨️', summary: 'Snow' };
  if (code <= 82) return { emoji: '🌦️', summary: 'Showers' };
  if (code <= 86) return { emoji: '🌨️', summary: 'Snow showers' };
  return { emoji: '⛈️', summary: 'Thunderstorm' };
}

interface CacheEntry {
  at: number;
  data: WeatherDay[];
}

/**
 * Best-effort weather via Open-Meteo (keyless, free). Geocodes the org's site
 * suburb then fetches a daily forecast. Never throws into the request path;
 * returns [] on any failure. Cached in-memory for an hour per (place, weekStart).
 */
@Injectable()
export class WeatherService {
  private readonly logger = new Logger('Weather');
  private readonly cache = new Map<string, CacheEntry>();
  private readonly TTL = 60 * 60 * 1000;

  async forecast(suburb: string, state: string | null, weekStart: string): Promise<WeatherDay[]> {
    const key = `${suburb.toLowerCase()}|${state ?? ''}|${weekStart}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.TTL) return hit.data;
    try {
      const data = await this.fetchForecast(suburb, state, weekStart);
      this.cache.set(key, { at: Date.now(), data });
      return data;
    } catch (error) {
      this.logger.warn(`weather lookup failed for ${suburb}: ${String(error)}`);
      return [];
    }
  }

  private async fetchForecast(suburb: string, state: string | null, weekStart: string): Promise<WeatherDay[]> {
    const geo = await this.json(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(suburb)}&count=1&country=AU&language=en&format=json`,
    );
    const place = (geo?.results as Array<{ latitude: number; longitude: number }> | undefined)?.[0];
    if (!place) return [];
    const end = new Date(`${weekStart}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 6);
    const endDate = end.toISOString().slice(0, 10);
    const fc = await this.json(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Australia%2FSydney&start_date=${weekStart}&end_date=${endDate}`,
    );
    const daily = fc?.daily as
      | { time: string[]; weathercode: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] }
      | undefined;
    if (!daily?.time) return [];
    return daily.time.map((date, i) => {
      const { emoji, summary } = describe(daily.weathercode[i] ?? 0);
      return {
        date,
        emoji,
        tempMax: daily.temperature_2m_max[i] ?? null,
        tempMin: daily.temperature_2m_min[i] ?? null,
        summary,
      };
    });
  }

  private async json(url: string): Promise<Record<string, unknown> | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      return (await res.json()) as Record<string, unknown>;
    } finally {
      clearTimeout(timer);
    }
  }
}

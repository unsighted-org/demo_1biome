import fs from 'fs/promises';
import path from 'path';

import type { NextApiRequest, NextApiResponse } from 'next';

interface City {
  name: string;
  population: number;
  latitude: number;
  longitude: number;
  country: string;
  iso2: string;
  iso3: string;
  adminName: string;
  capital: string;
  populationProper: number;
  cityId: number;
  countryCode: string;
  populationDensity: number;
  capitalPopulation: number;
  elevation: number;
  timezone: string;
  modificationDate: string;
  createdDate: string;
  city: string;
  cityAscii: string;
  adminNameAscii: string;
  countryCodeIso: string;
  populationRank: number;
  timezoneId: string;
  timezoneGmt: string;
  timezoneDst: string;
  geonameId: number;
  id: number;
  adminCode: string;
  adminCodeAscii: string;
  adminId2: number;
  adminId3: number;
  adminId4: number;
  adminId5: number;
  adminId6: number;
  adminId7: number;
  adminId8: number;
  adminId9: number;
  adminId10: number;
  adminId11: number;
  adminId12: number;
  adminId13: number;
  adminId14: number;
  adminId15: number;
  adminId16: number;
  adminId17: number;
  adminId18: number;
  adminId19: number;
  adminId20: number;
  adminId21: number;
  adminId22: number;
  adminId23: number;
  adminId24: number;
  adminId25: number;
  adminId26: number;
  adminId27: number;
  adminId28: number;
  adminId29: number;
  adminId30: number;
  adminId31: number;
  adminId32: number;
  adminId33: number;
  adminId34: number;
  adminId35: number;
  adminId36: number;
  adminId37: number;
  adminId38: number;
  adminId39: number;
  adminId40: number;
  adminId41: number;
  adminId42: number;
  adminId43: number;
  adminId44: number;
  adminId45: number;
  adminId46: number;
}

let citiesCache: City[] | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let lastFetchTime = 0;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const currentTime = Date.now();
    if (citiesCache && currentTime - lastFetchTime < CACHE_DURATION) {
      return res.status(200).json(citiesCache);
    }

    const filePath = path.join(process.cwd(), 'public', 'data', 'ne_110m_populated_places.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    citiesCache = data;
    lastFetchTime = currentTime;
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading cities data:', error);
    res.status(500).json({ error: 'Failed to load data', details: (error as Error).message });
  }
}
import fs from 'fs/promises';
import path from 'path';

import type { NextApiRequest, NextApiResponse } from 'next';

let countriesCache: Record<string, unknown> | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let lastFetchTime = 0;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const currentTime = Date.now();
    if (countriesCache && currentTime - lastFetchTime < CACHE_DURATION) {
      return res.status(200).json(countriesCache);
    }

    const filePath = path.join(process.cwd(), 'public', 'data', 'ne_110m_admin_0_countries.geojson');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    countriesCache = data;
    lastFetchTime = currentTime;
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading countries data:', error);
    res.status(500).json({ error: 'Failed to load countries data' });
  }
}
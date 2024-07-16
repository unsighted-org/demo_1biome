import { Color } from 'three';

const matteColors = {
  red: '#E57373',
  green: '#81C784',
  blue: '#64B5F6',
  yellow: '#FFF176',
  orange: '#FFB74D',
  purple: '#BA68C8',
  teal: '#4DB6AC',
  pink: '#F06292'
};

const colorGradients: { [key: string]: string[] } = {
  cardioHealthScore: [matteColors.red, matteColors.orange, matteColors.green],
  respiratoryHealthScore: [matteColors.blue, matteColors.purple, matteColors.green],
  physicalActivityScore: [matteColors.yellow, matteColors.teal, matteColors.green],
  environmentalImpactScore: [matteColors.pink, matteColors.yellow, matteColors.green],
};

const getGradientColor = (colors: string[], value: number): string => {
  const normalizedValue = (value - 0) / (100 - 0);
  const lowColor = new Color(colors[0]);
  const midColor = new Color(colors[1]);
  const highColor = new Color(colors[2]);
  
  let resultColor: Color;
  if (normalizedValue < 0.5) {
    resultColor = lowColor.lerp(midColor, normalizedValue * 2);
  } else {
    resultColor = midColor.lerp(highColor, (normalizedValue - 0.5) * 2);
  }
  
  return `#${resultColor.getHexString()}`;
};

export const getColorForMetric = (metric: string, value: number): string => {
  const gradientColors = colorGradients[metric] || [matteColors.red, matteColors.yellow, matteColors.green];
  return getGradientColor(gradientColors, value);
};

export const getMetricColor = (metric: string): string => {
  const colorMap: { [key: string]: string } = {
    cardioHealthScore: matteColors.red,
    respiratoryHealthScore: matteColors.green,
    physicalActivityScore: matteColors.blue,
    environmentalImpactScore: matteColors.yellow,
  };
  
  return colorMap[metric] || '#CCCCCC'; // Default color if metric is not found
};

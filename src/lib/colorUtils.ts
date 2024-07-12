import { Color } from 'three';

const pastelColors = {
  red: '#FFB3BA',
  green: '#BAFFC9',
  blue: '#BAE1FF',
  yellow: '#FFFFBA',
};

export const getColorForMetric = (metric: string, value: number): string => {
  const normalizedValue = (value - 0) / (100 - 0);
  const lowColor = new Color(pastelColors.red);
  const midColor = new Color(pastelColors.yellow);
  const highColor = new Color(pastelColors.green);
  
  let resultColor: Color;
  if (normalizedValue < 0.5) {
    resultColor = lowColor.lerp(midColor, normalizedValue * 2);
  } else {
    resultColor = midColor.lerp(highColor, (normalizedValue - 0.5) * 2);
  }
  
  return `#${resultColor.getHexString()}`;
};

export const getMetricColor = (metric: string): string => {
  const colorMap: { [key: string]: string } = {
    cardioHealthScore: pastelColors.red,
    respiratoryHealthScore: pastelColors.green,
    physicalActivityScore: pastelColors.blue,
    environmentalImpactScore: pastelColors.yellow,
  };
  
  return colorMap[metric] || '#CCCCCC'; // Default color if metric is not found
};
export type AirQualitySeverity =
  | 'aq-good'
  | 'aq-moderate'
  | 'aq-unhealthy-sensitive'
  | 'aq-unhealthy'
  | 'aq-very-unhealthy';

export type AirQualityStatusKey =
  | 'good'
  | 'moderate'
  | 'unhealthySensitive'
  | 'unhealthy'
  | 'veryUnhealthy';

export function getPm25Severity(pm25 = 0): AirQualitySeverity {
  if (pm25 <= 12) return 'aq-good';
  if (pm25 <= 35.4) return 'aq-moderate';
  if (pm25 <= 55.4) return 'aq-unhealthy-sensitive';
  if (pm25 <= 150.4) return 'aq-unhealthy';
  return 'aq-very-unhealthy';
}

export function getPm25StatusKey(pm25 = 0): AirQualityStatusKey {
  if (pm25 <= 12) return 'good';
  if (pm25 <= 35.4) return 'moderate';
  if (pm25 <= 55.4) return 'unhealthySensitive';
  if (pm25 <= 150.4) return 'unhealthy';
  return 'veryUnhealthy';
}

export function getPm25Level(pm25 = 0): number {
  if (pm25 <= 12) return 1;
  if (pm25 <= 35.4) return 2;
  if (pm25 <= 55.4) return 3;
  if (pm25 <= 150.4) return 4;
  return 5;
}

export function getPm10StatusKey(pm10 = 0): AirQualityStatusKey {
  if (pm10 <= 50) return 'good';
  if (pm10 <= 100) return 'moderate';
  if (pm10 <= 200) return 'unhealthy';
  return 'veryUnhealthy';
}

export function getO3StatusKey(o3 = 0): AirQualityStatusKey {
  if (o3 <= 100) return 'good';
  if (o3 <= 168) return 'moderate';
  if (o3 <= 375) return 'unhealthySensitive';
  if (o3 <= 785) return 'unhealthy';
  return 'veryUnhealthy';
}

const SEVERITY_COLORS: Record<AirQualitySeverity, string> = {
  'aq-good': '#6BCB77',
  'aq-moderate': 'var(--score-fair, #FFAB00)',
  'aq-unhealthy-sensitive': 'var(--color-warning, #F29F03)',
  'aq-unhealthy': 'var(--color-critical, #E8735A)',
  'aq-very-unhealthy': '#C41E0D',
};

export function getAirQualityColor(pm25 = 0): string {
  return SEVERITY_COLORS[getPm25Severity(pm25)];
}

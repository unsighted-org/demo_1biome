export const routes = {
  dashboard: '/dashboard',
  profile: '/profile',
  settings: '/settings',
  globescreen: '/globescreen',
  login: '/login'
} as const;

export type RouteKeys = keyof typeof routes;

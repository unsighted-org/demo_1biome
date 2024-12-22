export const routes = {
  home: '/',
  main: '/main',
  dashboard: '/dashboard',
  stats: '/stats',
  profile: '/profile',
  settings: '/settings',
  login: '/login',
  signup: '/signup',
  splashPage: '/splashPage',
  changePassword: '/change-password',
  deleteAccount: '/delete-account',
  globescreen: '/globescreen',
  forms: '/forms',
  DashboardWithErrorBoundary: '/DashboardWithErrorBoundary'
} as const;

export type RouteKeys = keyof typeof routes;

export const isValidRoute = (route: string): route is RouteKeys => {
  return Object.values(routes).includes(route as any);
};

export const getCurrentRoute = (pathname: string): RouteKeys | undefined => {
  const routeEntry = Object.entries(routes).find(([_, path]) => path === pathname);
  return routeEntry ? (routeEntry[0] as RouteKeys) : undefined;
};

export const createHref = (route: RouteKeys, params?: Record<string, string>): string => {
  let href = routes[route];
  if (params) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    href += `?${queryString}`;
  }
  return href;
};

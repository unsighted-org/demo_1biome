import type { AppRoutes } from '@/types';

export const routes: AppRoutes = {
  home: '/',
  main: '/main',
  stats: '/stats',
  profile: '/profile',
  settings: '/settings',
  login: '/login',
  signup: '/signup',
  splashPage: '/splashPage',
  changePassword: '/change-password',
  deleteAccount: '/delete-account',
  globescreen: '/globescreen',
};

export const createHref = (route: keyof AppRoutes, params?: Record<string, string>): string => {
  let href = routes[route];
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      href = href.replace(`:${key}`, value);
    });
  }
  return href;
};

export const isValidRoute = (route: keyof AppRoutes | string): route is keyof AppRoutes => {
  return Object.keys(routes).includes(route.toString());
};

export const getCurrentRoute = (pathname: string): keyof AppRoutes | undefined => {
  const entry = Object.entries(routes).find(([, value]) => value === pathname);
  return entry ? (entry[0] as keyof AppRoutes) : undefined;
};

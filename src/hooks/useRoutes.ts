// src/hooks/useRoutes.ts
import { useRouter } from 'next/router';

import { routes, isValidRoute, getCurrentRoute, createHref } from '@/routes';

import type { AppRoutes } from '@/types';

interface UseRoutesReturn {
  routes: AppRoutes;
  isValidRoute: (route: keyof AppRoutes) => route is keyof AppRoutes;
  getCurrentRoute: (pathname: string) => keyof AppRoutes | undefined;
  createHref: (route: keyof AppRoutes, params?: Record<string, string>) => string;
  navigate: (route: keyof AppRoutes, params?: Record<string, string>) => void;
  currentRoute: keyof AppRoutes | undefined;
}

export const useRoutes = (): UseRoutesReturn => {
  const router = useRouter();

  const navigate = (route: keyof AppRoutes, params?: Record<string, string>): void => {
    const href = createHref(route, params);
    router.push(href);
  };

  const currentRoute = getCurrentRoute(router.pathname);

  return {
    routes,
    isValidRoute,
    getCurrentRoute,
    createHref,
    navigate,
    currentRoute,
  };
};

// src/hooks/useRoutes.ts
import { useRouter } from 'next/router';

import { routes, isValidRoute, getCurrentRoute, createHref } from '@/routes';
import type { RouteKeys } from '@/routes';

interface UseRoutesReturn {
  routes: typeof routes;
  isValidRoute: (route: string) => route is RouteKeys;
  getCurrentRoute: (pathname: string) => RouteKeys | undefined;
  createHref: (route: RouteKeys, params?: Record<string, string>) => string;
  navigate: (route: RouteKeys, params?: Record<string, string>) => void;
  currentRoute: RouteKeys | undefined;
}

export const useRoutes = (): UseRoutesReturn => {
  const router = useRouter();

  const navigate = (route: RouteKeys, params?: Record<string, string>): void => {
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

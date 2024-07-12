import createCache from '@emotion/cache';

const createEmotionCache = (): ReturnType<typeof createCache> => {
  return createCache({ key: 'css', prepend: true });
};

export default createEmotionCache;

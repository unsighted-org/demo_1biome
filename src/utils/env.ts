// Environment variable validation
const requiredEnvVars = {
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
} as const;

type EnvVarKey = keyof typeof requiredEnvVars;

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

export function validateEnv() {
  const missingVars: EnvVarKey[] = [];

  (Object.keys(requiredEnvVars) as EnvVarKey[]).forEach((key) => {
    if (!requiredEnvVars[key]) {
      missingVars.push(key);
    }
  });

  if (missingVars.length > 0) {
    throw new EnvironmentError(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and make sure all required variables are set.'
    );
  }
}

export function getEnvVar(key: EnvVarKey): string {
  const value = requiredEnvVars[key];
  if (!value) {
    throw new EnvironmentError(`Environment variable ${key} is not set`);
  }
  return value;
}

// Validate environment variables on module load
validateEnv();

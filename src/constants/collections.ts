export const COLLECTIONS = {
    USERS: 'User',
  TENANTS: 'Tenant',
    PROVIDERS: 'providers',
    AUDIT_TRAILS: 'auditTrails',
    POSTS: 'posts',
    INVOICES: 'invoices',
    PAYMENTS: 'payments',
    SUBSCRIPTIONS: 'TenantSubscriptionData',
    DASHBOARDS: 'dashboards',
    WIDGETS: 'widgets',
    NOTIFICATIONS: 'notifications',
    SETTINGS: 'settings',
    FEATURE_FLAGS: 'featureFlags',
    STRIPE_CUSTOMERS: 'stripeCustomers',
    SESSIONS: "sessions", // Added SESSIONS property
    LOGS: 'log',
    MOODBOARD: 'moodboard',
    MOODENTRY: 'moodEntry',
    TOKEN_BLACKLIST: 'tokenBlacklist',
    REACTIONS: 'reactions',
    COMMENTS: 'comments',
    MOOD_HISTORY: 'moodHistory',
    DRAFTS: 'drafts',
    DRAFT_HISTORY: 'draftHistory',
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
    SOCIAL_CONNECTIONS: 'socialConnections',
    TENANT_INVITATIONS: 'tenantInvitations',
    USER_PREFERENCES: 'userPreferences',
    RESOURCES: 'resources',
  KEY_VAULT: 'keyVault',
  FAQS: 'faqs',


    STATES : 'states',

  // PLAN_CONFIGS: 'planConfigs',
  // PLAN_SUBSCRIPTIONS: 'planSubscriptions',
  // PLAN_USAGE: 'planUsage',
  // PLAN_METRICS: 'planMetrics',
  // SUBSCRIPTION_SESSIONS: 'subscriptionSessions',

  PLAN_CONFIGS: 'planConfigs',
  PLAN_SUBSCRIPTIONS: 'planSubscriptions',
  PLAN_USAGE: 'planUsage',
  PLAN_METRICS: 'planMetrics',
  SUBSCRIPTION_SESSIONS: 'subscriptionSessions',

  
  API_USAGE: 'apiUsage',

  // OAuth2 collections
  TOKEN_MAPPINGS: 'token_mappings',
  OAUTH_APPLICATIONS: 'oauth_applications', // Make sure this matches
  USER_APPLICATIONS: 'user_applications',  // Add this for aggregation


  OAUTH_SESSIONS: 'oauth_sessions',
  OAUTH_CONSENTS: 'oauth_consents'    // Store user consent

} as const;



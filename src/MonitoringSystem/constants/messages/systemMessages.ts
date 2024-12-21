// src/MonitoringSystem/constants/messages/systemMessages.ts
import { warn } from "console";
import { SystemError } from "../errors/systemErrors";

export const SystemMessages = {

  // < !-- -- - Socket & Connection Messages -- -- - >
  [SystemError.SOCKET_CONNECTION_FAILED]: {
    error: 'Socket connection failed',
    warn: 'Socket connection issues detected',
    info: 'Socket connection attempt initiated'
  },

  [SystemError.SOCKET_AUTH_FAILED]: {
    error: 'Socket authentication failed',
    warn: 'Socket authentication issues detected',
    info: 'Socket authentication attempted'
  },

  [SystemError.HEALTH_CHECK_FAILED]: {
    error: 'Health check failed',
    warn: 'Health check issues detected',
    info: 'Health check initiated'
  },
  [SystemError.NO_AVAILABLE_NODES]: {
    error: 'No available nodes',
    warn: 'Node availability issues detected',
    info: 'Node availability checked'
  },
  [SystemError.CONNECTION_HANDLING_FAILED]: {
    error: 'Connection handling failed',
    warn: 'Connection handling issues detected',
    info: 'Connection handling attempted'
  },
  [SystemError.REBALANCING_FAILED]: {
    error: 'Rebalancing failed',
    warn: 'Rebalancing issues detected',
    info: 'Rebalancing attempted'
  },
  [SystemError.NODE_HEALTH_CHECK_FAILED]: {
    error: 'Node health check failed',
    warn: 'Node health check issues detected',
    info: 'Node health check initiated'
  },
  [SystemError.NO_HEALTHY_NODES]: {
    error: 'No healthy nodes available',
    warn: 'Node health issues detected',
    info: 'Node health status checked'
  },
  [SystemError.NODE_MIGRATION_FAILED]: {
    error: 'Node migration failed',
    warn: 'Node migration issues detected',
    info: 'Node migration attempted'
  },
  [SystemError.CONNECTION_MIGRATION_FAILED]: {
    error: 'Connection migration failed',
    warn: 'Connection migration issues detected',
    info: 'Connection migration attempted'
  },
  // < !-- -- - Storage Messages -- -- - >


  [SystemError.STORAGE_CONNECTION_FAILED]: {
    error: 'Failed to connect to storage',
    warn: 'Storage connection attempt unsuccessful',
    info: 'Storage connection attempt initiated'
  },

  [SystemError.STORAGE_OPERATION_FAILED]: {
    error: 'Storage operation failed',
    warn: 'Storage operation performance degraded',
    info: 'Storage operation monitored'
  },

  [SystemError.STORAGE_UPLOAD_FAILED]: {
    error: 'Failed to upload file',
    warn: 'File upload issues detected',
    info: 'File upload attempted'
  },

  [SystemError.INVALID_ENVIRONMENT]: {
    error: 'Invalid environment',
    warn: 'Environment configuration error',
    info: 'Environment configuration checked'
  },

  [SystemError.STORAGE_DELETE_FAILED]: {
    error: 'Failed to delete file',
    warn: 'File deletion issues detected',
    info: 'File deletion attempted'
  },

  [SystemError.STORAGE_LIST_FAILED]: {
    error: 'Failed to list files',
    warn: 'File listing issues detected',
    info: 'File listing attempted'
  },

  [SystemError.LEASE_REQUIRED]: {
    error: 'Lease required for operation',
    warn: 'Lease not acquired',
    info: 'Lease acquisition attempted'
  },

  [SystemError.INITIALIZATION_FAILED]: {
    error: 'Initialization failed',
    warn: 'Initialization issues detected',
    info: 'Initialization attempted'
  },

  [SystemError.UPLOAD_CONTROL_FAILED]: {
    error: 'Failed to control upload',
    warn: 'Upload control issues detected',
    info: 'Upload control attempted'
  },

  [SystemError.CHUNK_UPLOAD_FAILED]: {
    error: 'Failed to upload chunk',
    warn: 'Chunk upload issues detected',
    info: 'Chunk upload attempted'
  },

  [SystemError.CHUNK_CLEANUP_FAILED]: {
    error: 'Failed to cleanup chunk',
    warn: 'Chunk cleanup issues detected',
    info: 'Chunk cleanup attempted'
  },

  [SystemError.VALIDATION_FAILED]: {
    error: 'Validation failed',
    warn: 'Validation issues detected',
    info: 'Validation attempted'
  },


  // <-------  Database Messages -------->
  
  [SystemError.DATABASE_CLEANUP_FAILED]: {
    error: 'Database cleanup failed',
    warn: 'Database cleanup issues detected',
    info: 'Database cleanup attempted'
  },

  [SystemError.DATABASE_CONNECTION]: {
    error: 'Database connection failed',
    warn: 'Database connection unstable',
    info: 'Database connected successfully'
  },
  [SystemError.DATABASE_QUERY]: {
    error: 'Database query execution failed',
    warn: 'Query performance degraded',
    info: 'Query executed successfully'
  },
  [SystemError.DATABASE_CONNECTION_FAILED]: {
    error: 'Failed to establish database connection',
    warn: 'Database connection attempt unsuccessful',
    info: 'Database connection attempt initiated'
  },
  [SystemError.DATABASE_QUERY_FAILED]: {
    error: 'Database query operation failed',
    warn: 'Query execution encountered issues',
    info: 'Query execution monitored'
  },
  [SystemError.DATABASE_INTEGRITY_ERROR]: {
    error: 'Database integrity constraint violation',
    warn: 'Potential data integrity issue detected',
    info: 'Data integrity check performed'
    },

  // <-------  Redis Messages -------->

  [SystemError.REDIS_CONNECTION]: {
    error: 'Redis connection error',
    warn: 'Redis connection experiencing issues',
    info: 'Redis connection status checked'
  },
  [SystemError.REDIS_CONNECTION_FAILED]: {
    error: 'Failed to connect to Redis',
    warn: 'Redis connection attempt unsuccessful',
    info: 'Redis connection attempt initiated'
  },
  [SystemError.REDIS_OPERATION_FAILED]: {
    error: 'Redis operation failed',
    warn: 'Redis operation performance degraded',
    info: 'Redis operation monitored'
  },
  [SystemError.REDIS_INVALID_DATA]: {
    error: 'Invalid data format in Redis',
    warn: 'Data validation issues in Redis',
    info: 'Redis data validation performed'
    },

  // <-------  General System Messages -------->

  [SystemError.GENERAL]: {
    error: 'System encountered an error',
    warn: 'System experiencing issues',
    info: 'System status checked'
  },
  [SystemError.UNAVAILABLE]: {
    error: 'System currently unavailable',
    warn: 'System availability degraded',
    info: 'System availability checked'
    },
  
  // <-------  Processing Messages -------->

  [SystemError.PARSING_ERROR]: {
    error: 'Failed to parse data',
    warn: 'Data parsing issues detected',
    info: 'Data parsing attempted'
  },

  [SystemError.PROCESSING_CHUNK_FAILED]: {
    error: 'Failed to process data chunk',
    warn: 'Chunk processing encountered issues',
    info: 'Chunk processing attempted'
  },
  [SystemError.PROCESSING_CHUNK_VALIDATION_FAILED]: {
    error: 'Chunk validation failed',
    warn: 'Chunk validation issues detected',
    info: 'Chunk validation performed'
  },
  [SystemError.PROCESSING_CHUNK_SIZE_EXCEEDED]: {
    error: 'Chunk size limit exceeded',
    warn: 'Chunk size approaching limit',
    info: 'Chunk size verified'
  },
  
  [SystemError.DATA_PROCESSING_FAILED]: {
    error: 'Failed to process data',
    warn: 'Data processing issues detected',
    info: 'Data processing attempted'
  },

  // <-------  Server Messages -------->

  [SystemError.SERVER_UNHEALTHY]: {
    error: 'Server health check failed',
    warn: 'Server health degrading',
    info: 'Server health monitored'
  },
  [SystemError.SERVER_UNAVAILABLE]: {
    error: 'Server is unavailable',
    warn: 'Server availability issues detected',
    info: 'Server availability checked'
  },
  [SystemError.SERVER_TIMEOUT]: {
    error: 'Server request timed out',
    warn: 'Server response time degraded',
    info: 'Server response time monitored'
  },
  [SystemError.SERVER_OVERLOAD]: {
    error: 'Server is overloaded',
    warn: 'High server load detected',
    info: 'Server load monitored'
  },
  [SystemError.SERVER_TOO_MANY_REQUESTS]: {
    error: 'Rate limit exceeded',
    warn: 'Approaching rate limit threshold',
    info: 'Rate limit checked'
  },
  [SystemError.SERVER_INTERNAL_ERROR]: {
    error: 'Internal server error occurred',
    warn: 'Server experiencing internal issues',
    info: 'Server internal status checked'
  },

  [SystemError.RATE_LIMIT_EXCEEDED]: {
    error: 'Rate limit exceeded',
    warn: 'Rate limit threshold reached',
    info: 'Rate limit checked'
  },

  // <-------  Performance Messages -------->

  [SystemError.PERFORMANCE_HIGH_LATENCY]: {
    error: 'Critical latency detected',
    warn: 'High latency observed',
    info: 'Latency monitored'
  },
  [SystemError.PERFORMANCE_HIGH_CPU]: {
    error: 'Critical CPU usage detected',
    warn: 'High CPU usage observed',
    info: 'CPU usage monitored'
  },
  [SystemError.PERFORMANCE_HIGH_MEMORY]: {
    error: 'Critical memory usage detected',
    warn: 'High memory usage observed',
    info: 'Memory usage monitored'
    },

  // <-------  Metrics Messages -------->

  [SystemError.METRICS_API_ERROR]: {
  error: 'Error processing metrics API request',
  warn: 'Issues detected in metrics API processing',
  info: 'Metrics API request processed'
},
  [SystemError.METRICS_PROCESSING_FAILED]: {
    error: 'Failed to process metrics',
    warn: 'Metrics processing issues detected',
    info: 'Metrics processing attempted'
  },
  [SystemError.METRICS_PERSISTENCE_FAILED]: {
    error: 'Failed to persist metrics',
    warn: 'Metrics persistence issues detected',
    info: 'Metrics persistence attempted'
  },
  [SystemError.METRICS_AGGREGATION_FAILED]: {
    error: 'Failed to aggregate metrics',
    warn: 'Metrics aggregation issues detected',
    info: 'Metrics aggregation attempted'
  },
  [SystemError.METRICS_VALIDATION_FAILED]: {
    error: 'Invalid metric data',
    warn: 'Metric validation issues detected',
    info: 'Metric validation attempted'
  },
  [SystemError.METRICS_BATCH_FAILED]: {
    error: 'Failed to process metric batch',
    warn: 'Metric batch issues detected',
    info: 'Metric batch processing attempted'
  },
  [SystemError.METRICS_QUEUE_FULL]: {
    error: 'Metrics queue is full',
    warn: 'Metrics queue approaching capacity',
    info: 'Metrics queue status checked'
  },


  [SystemError.METRICS_COLLECTION_FAILED]: {
    error: 'Failed to collect metrics',
    warn: 'Metrics collection issues detected',
    info: 'Metrics collection attempted'
  },

// <-------  Logging Messages -------->

  [SystemError.LOGS_API_ERROR]: {
  error: 'Error processing logs API request',
  warn: 'Issues detected in logs API processing',
  info: 'Logs API request processed'
  },
  [SystemError.LOG_QUEUE_FULL]: {
    error: 'Log queue is full',
    warn: 'Log queue approaching capacity',
    info: 'Log queue status checked'
  },
   [SystemError.LOG_PROCESSING_FAILED]: {
    error: 'Failed to process log entry',
    warn: 'Log processing issues detected',
    info: 'Log processing attempted'
  },
  [SystemError.LOG_PERSISTENCE_FAILED]: {
    error: 'Failed to persist logs',
    warn: 'Log persistence issues detected',
    info: 'Log persistence attempted'
  },
  [SystemError.LOG_AGGREGATION_FAILED]: {
    error: 'Failed to aggregate logs',
    warn: 'Log aggregation issues detected',
    info: 'Log aggregation attempted'
  },
  [SystemError.LOG_FLUSH_FAILED]: {
    error: 'Failed to flush log queue',
    warn: 'Log flush issues detected',
    info: 'Log flush attempted'
  },
  [SystemError.LOG_INVALID_FORMAT]: {
    error: 'Invalid log format',
    warn: 'Log format validation failed',
    info: 'Log format validation performed'
  },
  [SystemError.LOG_BATCH_FAILED]: {
    error: 'Failed to process log batch',
    warn: 'Log batch issues detected',
    info: 'Log batch processing attempted'
  },
  [SystemError.LOG_RETRIEVAL_FAILED]: {
    error: 'Failed to retrieve logs',
    warn: 'Log retrieval issues detected',
    info: 'Log retrieval attempted'
  },

  // <-------  Service Queue Messages -------->

  [SystemError.SERVICE_QUEUE_CAPACITY_EXCEEDED]: {
    error: 'Service queue capacity exceeded',
    warn: 'Service queue approaching capacity',
    info: 'Service queue status checked'
  },
  [SystemError.SERVICE_QUEUE_FULL]: {
    error: 'Service queue is full',
    warn: 'Service queue approaching capacity',
    info: 'Service queue status checked'
  },
  [SystemError.SERVICE_QUEUE_PROCESSING_FAILED]: {
    error: 'Failed to process service queue',
    warn: 'Service queue processing issues detected',
    info: 'Service queue processing attempted'
  },
  [SystemError.QUEUE_VIDEO_FAILED]: {
    error: 'Failed to queue video',
    warn: 'Video processing queue issues detected',
    info: 'Video processing queue attempted'
  },

  // < !-- -- - Payment Messages-- -- - >
    
  [SystemError.PAYMENT_SESSION_FAILED]: {
    error: 'Failed to create payment session',
    warn: 'Payment session creation issues detected',
    info: 'Payment session creation attempted'
},
  [SystemError.RECURRING_BILLING_FAILED]: {
    error: 'Recurring billing failed',
    warn: 'Recurring billing issues detected',
    info: 'Recurring billing attempted'
},

  [SystemError.SUBSCRIPTION_UPGRADE_FAILED]: {
    error: 'Subscription upgrade failed',
    warn: 'Subscription upgrade issues detected',
    info: 'Subscription upgrade attempted'
  },

  [SystemError.PAYMENT_RETRY_FAILED]: {
    error: 'Payment retry failed',
    warn: 'Payment retry issues detected',
    info: 'Payment retry attempted'
  },
  [SystemError.PAYMENT_FAILED]: {
    error: 'Payment failed',
    warn: 'Payment issues detected',
    info: 'Payment attempted'
  },
  [SystemError.SUBSCRIPTION_STATUS_CHECK_FAILED]: {
    error: 'Failed to check subscription status',
    warn: 'Subscription status check issues detected',
    info: 'Subscription status check attempted'
  },

  // < !-- -- - Load Disctribution Messages-- -- - >
    
  [SystemError.AUTO_SCALING_FAILED]: {
    error: 'Auto-scaling failed',
    warn: 'Auto-scaling issues detected',
    info: 'Auto-scaling attempted'
  },
  [SystemError.FRONT_DOOR_ERROR]: {
    error: 'Front door error',
    warn: 'Front door issues detected',
    info: 'Front door status checked'
  },

  [SystemError.FAILOVER_ERROR]: {
    error: 'Failover error',
    warn: 'Failover issues detected',
    info: 'Failover status checked'
  },

  [SystemError.GLOBAL_STRESS_TEST_FAILED]: {
    error: 'Global stress test failed',
    warn: 'Global stress test issues detected',
    info: 'Global stress test attempted'
  },

  [SystemError.CLEANUP_FAILED]: {
    error: 'Cleanup failed',
    warn: 'Cleanup issues detected',
    info: 'Cleanup attempted'
  },

  // < !-- -- - OAuth Messages-- -- - >

  [SystemError.OAUTH_INITIATION_FAILED]: {
    error: 'OAuth initiation failed',
    warn: 'OAuth initiation issues detected',
    info: 'OAuth initiation attempted'
  },
  

} as const;
import axios from 'axios';
import https from 'https';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Disable SSL verification warnings in development
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Shared interface for request configuration
interface MonitoringRequestConfig extends InternalAxiosRequestConfig {
    metadata?: {
        startTime: number;
        [key: string]: any;
    };
}

// Shared configuration for both clients
const createHttpClient = (clientName: string): AxiosInstance => {
    const client = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:3000',
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
        // For extra safety, also add the HTTPS agent
        httpsAgent: process.env.NODE_ENV === 'development' 
            ? new https.Agent({
                    rejectUnauthorized: false,
                    requestCert: false,
                    secureOptions: require('constants').SSL_OP_NO_TLSv1_2
                })
            : undefined
    });

    // Request interceptor
    client.interceptors.request.use(
        (config: MonitoringRequestConfig) => {
            config.metadata = {
                startTime: Date.now(),
                clientType: clientName
            };
            return config;
        },
        (error) => {
            console.error(`${clientName} HTTP Client Request Error:`, {
                message: error.message,
                url: error.config?.url,
                code: error.code,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
            return Promise.reject(error);
        }
    );

    // Response interceptor
    client.interceptors.response.use(
        (response) => {
            const config = response.config as MonitoringRequestConfig;
            const duration = Date.now() - (config.metadata?.startTime || Date.now());
            
            if (process.env.NODE_ENV === 'development') {
                console.debug(`${clientName} request completed:`, {
                    url: config.url,
                    method: config.method,
                    duration: `${duration}ms`,
                    status: response.status
                });
            }
            
            return response;
        },
        (error) => {
            const errorInfo = {
                status: error.response?.status,
                message: error.message,
                url: error.config?.url,
                code: error.code,
                data: error.response?.data,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };

            console.error(`${clientName} HTTP Client Error:`, errorInfo);
            return Promise.reject(error);
        }
    );

    return client;
};

// Create instances
const loggerHttpClient = createHttpClient('Logger');
const metricsHttpClient = createHttpClient('Metrics');

export { loggerHttpClient, metricsHttpClient };
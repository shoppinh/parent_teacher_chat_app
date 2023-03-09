declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      DEBUG_MODE: string;
      MIGRATION_MODE: string;
      PORT: string;
      APP_TIME_OUT: string;
      JWT_PRIVATE_KEY: string;
      JWT_EXPIRED_TIME: string;
      POSTGRES_HOST: string;
      POSTGRES_PORT: string;
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_DATABASE: string;
      TWM_POSTGRES_HOST: string;
      TWM_POSTGRES_PORT: string;
      TWM_POSTGRES_USER: string;
      TWM_POSTGRES_PASSWORD: string;
      TWM_POSTGRES_DATABASE: string;
      TWM_POSTGRES_CERT_PATH: string;
      TWM_REDIS_HOST: string;
      TWM_REDIS_PORT: string;
      TWM_REDIS_PASSWORD: string;
      TWM_REDIS_TTL: string;
      UMENU_API_BASE_URL: string;
      UMENU_API_ADMIN_USER: string;
      UMENU_API_ADMIN_PASSWORD: string;
      TWILIO_ACCOUNT_SID: string;
      TWILIO_AUTH_TOKEN: string;
      TWILIO_PHONE_NUMBER: string;
      IMAGE_SERVER: string;
      IMAGE_SERVER_TYPE: string;
      ORDER_CONSUMER_URL: string;
      ORDER_HCS_CONSUMER_URL: string;
      OPEN_APP_LINK: string;
      CONSUMER_BASE_URL: string;
      BASE_URL: string;
      PN_PROJECT_ID: string;
      PN_PRIVATE_KEY: string;
      PN_CLIENT_EMAIL: string;
      EPAY_CHECKOUT_BASE_URL: string;
      NETGO_END_POINT: string;
      NETGO_BRAND: string;
      NETGO_USERNAME: string;
      CACHE_MODE: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;
      REDIS_TTL: string;
      REACT_APP_API_CONVERSATION_URL: string;
      LANDING_VIDEO_PATH: string;
      GOOGLE_PLAY_LINK: string;
      APPLE_STORE_LINK: string;
      IOS_IS_FORCE_UPDATE: boolean;
      IOS_VERSION_NAME: string;
      IOS_VERSION_CODE: number;
      IOS_LINK: string;
      ANDROID_VERSION_NAME: string;
      ANDROID_VERSION_CODE: number;
      ANDROID_LINK: string;
    }
  }
}

export {};

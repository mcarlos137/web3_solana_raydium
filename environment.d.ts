declare global {
    namespace NodeJS {
        interface ProcessEnv {
            RPC_URL: string;
            WALLET_PUBLIC_KEY: string;
            WALLET_PRIVATE_KEY: string;
            NODE_ENV: 'development' | 'production';
            PORT: number;
      }
    }
}
  
export {}
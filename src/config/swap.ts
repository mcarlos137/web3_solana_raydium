export const swapConfig = {
    liquidityFile: 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json',
    maxLamports: 1500000, // Micro lamports for priority fee
    direction: 'in' as 'in' | 'out', // Swap direction: 'in' or 'out'
    maxRetries: 20,
    useVersionedTransaction: true,
    'SOL-USDC': {
        executeSwap: true, // Send tx when true, simulate tx when false
        tokenAAddress: 'So11111111111111111111111111111111111111112', // Token to swap for the other, SOL in this case
        tokenBAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC address
    },
    'DAMEX-USDT': {
        executeSwap: true, // Send tx when true, simulate tx when false
        tokenAAddress: 'H3cb6GkPPnT7USCebarN8KtHRTa6Ea3ynF3XfUMeVnVh', // Token to swap for the other, DAMEX in this case
        tokenBAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT address        
    }
};
import { 
    Connection, 
    PublicKey, 
    Keypair, 
    Transaction, 
    VersionedTransaction, 
    TransactionMessage 
} from '@solana/web3.js'
import { 
    Liquidity, 
    LiquidityPoolKeys,
    LiquidityPoolJsonInfo,
    jsonInfo2PoolKeys,
    Token,
    TokenAmount,
    TOKEN_PROGRAM_ID,
    Percent,
    SPL_ACCOUNT_LAYOUT,
} from '@raydium-io/raydium-sdk';
import { Wallet } from '@coral-xyz/anchor'
import bs58 from 'bs58'
import fetch from 'cross-fetch';  

export class RaydiumSwap {

    allPoolKeysJson!: LiquidityPoolJsonInfo[];
    connection: Connection
    publicKey: PublicKey

    constructor(RPC_URL: string, WALLET_PUBLIC_KEY: string) {
        this.connection = new Connection(RPC_URL, { commitment: 'confirmed' })
        this.publicKey = new PublicKey(WALLET_PUBLIC_KEY)
    }

    async loadPoolKeys(liquidityFile: string) {
        const liquidityJsonResp = await fetch(liquidityFile);
        console.log('1')
        if (!liquidityJsonResp.ok) return
        console.log('2')
        const liquidityJson = (await liquidityJsonResp.json()) as { official: any; unOfficial: any }
        console.log('3')
        const allPoolKeysJson = [...(liquidityJson?.official ?? []), ...(liquidityJson?.unOfficial ?? [])]
        console.log('4')
        this.allPoolKeysJson = allPoolKeysJson
        console.log('5')
        return allPoolKeysJson
    }

    findPoolInfoForTokens(mintA: string, mintB: string) {
        const poolData = this.allPoolKeysJson.find(
          (i) => (i.baseMint === mintA && i.quoteMint === mintB) || (i.baseMint === mintB && i.quoteMint === mintA)
        )
        if (!poolData) return null
        return jsonInfo2PoolKeys(poolData) as LiquidityPoolKeys
    }
    
    async getSwapTransaction(
        toToken: string,
        amount: number,
        poolKeys: LiquidityPoolKeys,
        maxLamports: number = 100000,
        useVersionedTransaction = true,
        fixedSide: 'in' | 'out' = 'in'
      ): Promise<Transaction | VersionedTransaction> {
        const directionIn = poolKeys.quoteMint.toString() == toToken
        const { minAmountOut, amountIn } = await this.calcAmountOut(poolKeys, amount, directionIn)
        console.log({ minAmountOut, amountIn });
        const userTokenAccounts = await this.getOwnerTokenAccounts()
        const swapTransaction = await Liquidity.makeSwapInstructionSimple({
          connection: this.connection,
          makeTxVersion: useVersionedTransaction ? 0 : 1,
          poolKeys: {
            ...poolKeys,
          },
          userKeys: {
            tokenAccounts: userTokenAccounts,
            owner: this.publicKey,
          },
          amountIn: amountIn,
          amountOut: minAmountOut,
          fixedSide: fixedSide,
          config: {
            bypassAssociatedCheck: false,
          },
          computeBudgetConfig: {
            microLamports: maxLamports,
          },
        })
    
        const recentBlockhashForSwap = await this.connection.getLatestBlockhash()
        const instructions = swapTransaction.innerTransactions[0].instructions.filter(Boolean)
    
        if (useVersionedTransaction) {
          const versionedTransaction = new VersionedTransaction(
            new TransactionMessage({
              payerKey: this.publicKey,
              recentBlockhash: recentBlockhashForSwap.blockhash,
              instructions: instructions,
            }).compileToV0Message()
          )
          
          var walletPrivateKey: string = String(process.env.WALLET_PRIVATE_KEY)
          if (walletPrivateKey !== 'NO'){
            var wallet: Wallet = new Wallet(Keypair.fromSecretKey(Uint8Array.from(bs58.decode(String(process.env.WALLET_PRIVATE_KEY)))))
            versionedTransaction.sign([wallet.payer])
          }
          
          return versionedTransaction
        }
    
        const legacyTransaction = new Transaction({
          blockhash: recentBlockhashForSwap.blockhash,
          lastValidBlockHeight: recentBlockhashForSwap.lastValidBlockHeight,
          feePayer: this.publicKey,
        })
    
        legacyTransaction.add(...instructions)
    
        return legacyTransaction
    }

    async sendVersionedTransaction(tx: VersionedTransaction, maxRetries?: number) {
        const txid = await this.connection.sendTransaction(tx, {
          skipPreflight: true,
          maxRetries: maxRetries,
        })
    
        return txid
    }

    async sendLegacyTransaction(_tx: Transaction, _maxRetries?: number) {
        /*const txid = await this.connection.sendTransaction(tx, [this.wallet.payer], {
          skipPreflight: true,
          maxRetries: maxRetries,
        })*/
        const txid = ''
        return txid
    }

    async simulateVersionedTransaction(tx: VersionedTransaction) {
        const txid = await this.connection.simulateTransaction(tx)
        return txid
    }

    async simulateLegacyTransaction(_tx: Transaction) {
        //const txid = await this.connection.simulateTransaction(tx, [this.wallet.payer])
        const txid = ''
        return txid
    }

    async calcAmountOut(poolKeys: LiquidityPoolKeys, rawAmountIn: number, swapInDirection: boolean) {
        const poolInfo = await Liquidity.fetchInfo({ connection: this.connection, poolKeys })
    
        let currencyInMint = poolKeys.baseMint
        let currencyInDecimals = poolInfo.baseDecimals
        let currencyOutMint = poolKeys.quoteMint
        let currencyOutDecimals = poolInfo.quoteDecimals
    
        if (!swapInDirection) {
          currencyInMint = poolKeys.quoteMint
          currencyInDecimals = poolInfo.quoteDecimals
          currencyOutMint = poolKeys.baseMint
          currencyOutDecimals = poolInfo.baseDecimals
        }
    
        const currencyIn = new Token(TOKEN_PROGRAM_ID, currencyInMint, currencyInDecimals)
        const amountIn = new TokenAmount(currencyIn, rawAmountIn, false)
        const currencyOut = new Token(TOKEN_PROGRAM_ID, currencyOutMint, currencyOutDecimals)
        const slippage = new Percent(5, 100) // 5% slippage
    
        const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = Liquidity.computeAmountOut({
          poolKeys,
          poolInfo,
          amountIn,
          currencyOut,
          slippage,
        })
    
        return {
          amountIn,
          amountOut,
          minAmountOut,
          currentPrice,
          executionPrice,
          priceImpact,
          fee,
        }
    }

    async getOwnerTokenAccounts() {
        const walletTokenAccount = await this.connection.getTokenAccountsByOwner(this.publicKey, {
          programId: TOKEN_PROGRAM_ID,
        })
    
        return walletTokenAccount.value.map((i) => ({
          pubkey: i.pubkey,
          programId: i.account.owner,
          accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
        }))
    }
    
}

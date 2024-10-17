import express, { Request } from 'express';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { RaydiumSwap } from '../tools/raydium'
import { swapConfig } from '../config/swap';

var router = express.Router();

const raydiumSwap = new RaydiumSwap(String(process.env.RPC_URL), String(process.env.WALLET_PUBLIC_KEY));

router.get('/findPoolInfoForTokens', (req: Request<{ pair: string }>, res) => {   
  const findPoolInfoForTokens = async () => {
    return await getLiquitidyPoolInfo(String(req.query.pair))
  }
  findPoolInfoForTokens().then(response => {
    res.end(JSON.stringify(response));  
  }).catch(error => {
    res.status(400)
    res.end(String(error))
  })
});


router.get('/fetchPrices', (req: Request<{ pair: string, tradeSide: 'BUY' | 'SELL', amount: number }>, res) => {
  const fetchPrices = async () => {
    const liquitidyPoolInfo = await getLiquitidyPoolInfo(String(req.query.pair))
    const directionIn = req.query.tradeSide == 'SELL'
    const { currentPrice, executionPrice } = await raydiumSwap.calcAmountOut(liquitidyPoolInfo, Number(req.query.amount), directionIn)
    if (executionPrice == null){
      throw new Error('execution price does not exist for current params')
    }
    //SELL 
    if (req.query.tradeSide == 'BUY') {
      return { 
        currentPrice: (currentPrice.denominator * 1e3) / (currentPrice.numerator),
        executionPrice: (executionPrice.denominator * 1e3) / (executionPrice.numerator),
      }
    } else {
      return { 
        currentPrice: (currentPrice.numerator * 1e3) / (currentPrice.denominator),
        executionPrice: (executionPrice.numerator * 1e3) / (executionPrice.denominator),
      }
    }
  }
  fetchPrices().then(response => {
    res.end(JSON.stringify(response));  
  }).catch(error => {
    res.status(400)
    res.end(String(error))
  })
})

router.post('/sendTransaction', (req: Request<{ pair: string, tradeSide: 'BUY' | 'SELL', amount: number, executionType: string }>, res) => {
  const sendTransaction = async () => {
    const tx = await getTransaction(String(req.body.pair), req.body.tradeSide as 'BUY' | 'SELL', Number(req.body.amount))
    if (req.body.executionType == 'SEND') {
      const txid = swapConfig.useVersionedTransaction
        ? await raydiumSwap.sendVersionedTransaction(tx as VersionedTransaction, swapConfig.maxRetries)
        : await raydiumSwap.sendLegacyTransaction(tx as Transaction, swapConfig.maxRetries);
  
      console.log(`https://solscan.io/tx/${txid}`);
      return {  
        txid: txid
      }
    } else {
      const simRes = swapConfig.useVersionedTransaction
        ? await raydiumSwap.simulateVersionedTransaction(tx as VersionedTransaction)
        : await raydiumSwap.simulateLegacyTransaction(tx as Transaction);
  
      return {  
        sim: simRes
      }
    }
  }
  sendTransaction().then(response => {
    res.end(JSON.stringify(response));  
  }).catch(error => {
    res.status(400)
    res.end(String(error))
  })
})

router.get('/getTransaction', (req: Request<{ pair: string, tradeSide: 'BUY' | 'SELL', amount: number }> , res) => {  
  const get_transaction = async () => {
   return await getTransaction(String(req.query.pair), req.query.tradeSide as 'BUY' | 'SELL', Number(req.query.amount))
  }
  get_transaction().then(response => {
    res.end(JSON.stringify(response));  
  }).catch(error => {
    res.status(400)
    res.end(String(error))
  })
});

const getLiquitidyPoolInfo = async (pair: string) => {
  if (raydiumSwap.allPoolKeysJson === undefined){
    await raydiumSwap.loadPoolKeys(swapConfig.liquidityFile)
  }
  if (!(pair in swapConfig)) {  
    throw new Error('Liquidity pool does not exist in configuration')
  }
  const liquidityPool = swapConfig[pair as 'DAMEX-USDT' | 'SOL-USDC']
  const poolInfoForTokens = raydiumSwap.findPoolInfoForTokens(String(liquidityPool.tokenAAddress), String(liquidityPool.tokenBAddress))
  if (poolInfoForTokens === null) {  
    throw new Error('Liquidity pool does not exist on raydium')
  }
  return poolInfoForTokens
}

const getTransaction = async (pair: string, tradeSide: 'BUY' | 'SELL', amount: number) => {
  const liquitidyPoolInfo = await getLiquitidyPoolInfo(pair)
  var targetTokenAddress = null
    switch (tradeSide){
      case 'SELL':
        targetTokenAddress = liquitidyPoolInfo.quoteMint.toString()
        break
      case 'BUY':
        targetTokenAddress = liquitidyPoolInfo.baseMint.toString()
        break
      default:
        throw new Error('trade side does not exist')
    }
  const tx = await raydiumSwap.getSwapTransaction(
    targetTokenAddress,
    amount,
    liquitidyPoolInfo,
    swapConfig.maxLamports, 
    Boolean(swapConfig.useVersionedTransaction),
    'in'
  );
  return tx
}


export default router

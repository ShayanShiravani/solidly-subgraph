import { Pair, Token } from '../generated/schema'
import { BigDecimal, Address, log } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, ADDRESS_ZERO, FACTORY_ADDRESS, WHITELIST_TOKENS, WHITELIST_PAIRS, ONE_BD, USDC_ADDRESS, ONE_BI } from './constants'
import { Factory as FactoryContract } from '../generated/templates/Pair/Factory'

const USDC_WFTM_PAIR = '0xbad7d3df8e1614d985c3d9ba9f6ecd32ae7dc20a'
export const enum PairOrder {
  BaseToTarget,
  TargetToBase
}

export function getFtmPriceInUSD(): BigDecimal {
  let usdcPair = Pair.load(USDC_WFTM_PAIR) // usdc is token0
  if (usdcPair !== null){
    return usdcPair.token0Price
  }
  return ZERO_BD
}

export function getWhiteListTokenPriceInUSD(token: Token): BigDecimal {
  if(WHITELIST_TOKENS.includes(token.id))
  {
    if(token.id == USDC_ADDRESS)
    {
      return ONE_BD
    }
    let tokenInfo = WHITELIST_PAIRS.get(token.id)
    let pair = Pair.load(tokenInfo[1])
    if (pair !== null){
      let value: BigDecimal
      if(tokenInfo[0] == 'token0price')
      {
        value = pair.token0Price
      } else {
        value = pair.token1Price
      }
      if(value)
      {
        return value
      }
    }
  }
  return ZERO_BD
}

export function fetchTokenPriceInUSD(token: Token): BigDecimal {
  if(WHITELIST_TOKENS.includes(token.id))
  {
    return getWhiteListTokenPriceInUSD(token)
  }
  let sumPrice = ZERO_BD
  let matchedCount = 0
  let avgPrice = ZERO_BD
  //Find whitelist pair for token
  for (var _i = 0; _i < WHITELIST_TOKENS.length; _i++) {
    let key = WHITELIST_TOKENS[_i];
    let baseToken = Token.load(key)
    if(!baseToken)
    {
      continue
    }
    let tokenPrice1 = ZERO_BD
    let tokenReserve1 = ZERO_BD
    let tokenPrice2 = ZERO_BD
    let tokenReserve2 = ZERO_BD
    let tokenInfo1 = getTokenPriceInUsdcBasedOnAnother(
      baseToken, token, PairOrder.BaseToTarget)
    if(tokenInfo1)
    {
      tokenPrice1 = tokenInfo1[0]
      tokenReserve1 = tokenInfo1[1]
    }
    let tokenInfo2 = getTokenPriceInUsdcBasedOnAnother(
      baseToken, token, PairOrder.TargetToBase)
    if(tokenInfo2)
    {
      tokenPrice2 = tokenInfo2[0]
      tokenReserve2 = tokenInfo2[1]
    }
    if(tokenReserve1 > tokenReserve2)
    {
      sumPrice.plus(tokenPrice1)
      matchedCount += 1
    } else if(tokenReserve2 > tokenReserve1)
    {
      sumPrice.plus(tokenPrice2)
      matchedCount += 1
    } else if (tokenReserve1 !== ZERO_BD && tokenReserve2 !== ZERO_BD)
    {
      sumPrice.plus(tokenPrice1)
      matchedCount += 1
    }
  }
  if(matchedCount > 0)
  {
    avgPrice = sumPrice.div(BigDecimal.fromString(matchedCount.toString()))
  }
  return avgPrice
}

export function getTokenPriceInPair(token: Token, pair: Pair): BigDecimal{
  if(pair)
  {
    if (pair.token0 == token.id) {
      return pair.token1Price
    }
    if (pair.token1 == token.id) {
      return pair.token0Price
    }
  }
  return ZERO_BD
}

export function getTokenReserveInPair(token: Token, pair: Pair): BigDecimal{
  if(pair)
  {
    if (pair.token0 == token.id) {
      return pair.reserve0
    }
    if (pair.token1 == token.id) {
      return pair.reserve1
    }
  }
  return ZERO_BD
}

export function getTokenPriceInUsdcBasedOnAnother(baseToken: Token, 
  targetToken: Token, pairOrder: PairOrder): BigDecimal[]|null {
  let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))
  let isMatched = false
  let pairAddress1: Address
  let pairAddress2: Address
  let pair1Price = ZERO_BD
  let pair1Reserve = ZERO_BD
  let pair2Price = ZERO_BD
  let pair2Reserve = ZERO_BD
  if(pairOrder == PairOrder.BaseToTarget)
  {
    pairAddress1 = factoryContract.getPair(
      Address.fromString(baseToken.id), Address.fromString(targetToken.id), false)
  }else
  {
    pairAddress1 = factoryContract.getPair(
      Address.fromString(targetToken.id), Address.fromString(baseToken.id), false)
  }
  if (pairAddress1.toHexString() != ADDRESS_ZERO) {
    let pair = Pair.load(pairAddress1.toHexString())
    if(pair)
    {
      pair1Price = getTokenPriceInPair(targetToken, pair)
      pair1Reserve = getTokenReserveInPair(targetToken, pair)
      isMatched = true
    }
  }
  if(pairOrder == PairOrder.BaseToTarget)
  {
    pairAddress2 = factoryContract.getPair(
      Address.fromString(baseToken.id), Address.fromString(targetToken.id), true)
  }else{
    pairAddress2 = factoryContract.getPair(
      Address.fromString(targetToken.id), Address.fromString(baseToken.id), true)
  }
  if (pairAddress2.toHexString() != ADDRESS_ZERO) {
    let pair = Pair.load(pairAddress2.toHexString())
    if(pair)
    {
      pair2Price = getTokenPriceInPair(targetToken, pair)
      pair2Reserve = getTokenReserveInPair(targetToken, pair)
      isMatched = true
    }
  }
  log.info("Get token {} price based on token {} with pair order {}: addr1: {}, addr2: {}", 
  [targetToken.symbol, baseToken.symbol, pairOrder.toString(), pairAddress1.toHexString(), pairAddress2.toHexString()])
  if(isMatched)
  {
    let targetTokenPerBaseToken = ZERO_BD
    //Consider that pair price which has max token reserve as token price
    if(pair1Reserve > pair2Reserve)
    {
      targetTokenPerBaseToken = pair1Price
    }else{
      targetTokenPerBaseToken = pair2Price
    }
    log.info("Token {} info based on {}: {}", 
    [targetToken.symbol, baseToken.symbol, targetTokenPerBaseToken.toString()])
    //calculate token price in USDC
    let baseTokenPrice = getWhiteListTokenPriceInUSD(baseToken)
    let tokenPrice = targetTokenPerBaseToken.times(baseTokenPrice)
    return [tokenPrice, pair1Reserve>pair2Reserve?pair1Reserve:pair2Reserve]
  }
  return null
}

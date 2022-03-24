import { BigInt, log } from "@graphprotocol/graph-ts"
import { PairCreated } from "../generated/Factory/Factory"
import { Pair, SolidlyFactory, Swap as SwapEvent, Token, Transaction } from "../generated/schema"
import { ADDRESS_ZERO, FACTORY_ADDRESS, ZERO_BD } from "./constants"
import { convertTokenToDecimal, fetchTokenDecimals, fetchTokenName, fetchTokenSymbol, fetchTokenTotalSupply } from "./helpers"
import { Pair as PairTemplate } from '../generated/templates'
import { Swap, Sync } from "../generated/templates/Pair/Pair"

export function handlePairCreated(event: PairCreated): void {
  log.info("PairCreated event", [])
  // load factory (create if first exchange)
  let factory = SolidlyFactory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new SolidlyFactory(FACTORY_ADDRESS)
    factory.pairCount = 0
  }
  factory.pairCount = factory.pairCount + 1
  factory.save()

  // create the tokens
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    let totalSupply0 = fetchTokenTotalSupply(event.params.token0)
    if(totalSupply0)
    {
      token0.totalSupply = totalSupply0
    }else
    {
      token0.totalSupply = BigInt.fromI32(0)
    }
    let decimals = fetchTokenDecimals(event.params.token0)

    // fail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('The decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
    token0.totalLiquidity = ZERO_BD
  }

  // fetch info if null
  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    let totalSupply1 = fetchTokenTotalSupply(event.params.token1)
    if(totalSupply1)
    {
      token1.totalSupply = totalSupply1
    }else
    {
      token1.totalSupply = BigInt.fromI32(0)
    }
    let decimals = fetchTokenDecimals(event.params.token1)

    // fail if we couldn't figure out the decimals
    if (decimals === null) {
      return
    }
    token1.decimals = decimals
    token1.totalLiquidity = ZERO_BD
  }

  let pair = new Pair(event.params.pair.toHexString()) as Pair
  pair.token0 = token0.id
  pair.token1 = token1.id
  pair.createdAtTimestamp = event.block.timestamp
  pair.createdAtBlockNumber = event.block.number
  pair.reserve0 = ZERO_BD
  pair.reserve1 = ZERO_BD
  pair.totalSupply = ZERO_BD
  pair.volumeToken0 = ZERO_BD
  pair.volumeToken1 = ZERO_BD
  pair.token0Price = ZERO_BD
  pair.token1Price = ZERO_BD

  // create the tracked contract based on the template
  PairTemplate.create(event.params.pair)

  // save updated values
  token0.save()
  token1.save()
  pair.save()
}

export function handleSync(event: Sync): void {
  log.info("Sync event", [])
  let pair = Pair.load(event.address.toHex())
  if(pair)
  {
    let token0 = Token.load(pair.token0)
    let token1 = Token.load(pair.token1)
    if(token0 && token1)
    {
      pair.reserve0 = convertTokenToDecimal(event.params.reserve0, token0.decimals)
      pair.reserve1 = convertTokenToDecimal(event.params.reserve1, token1.decimals)

      if (pair.reserve1.notEqual(ZERO_BD)) pair.token0Price = pair.reserve0.div(pair.reserve1)
      else pair.token0Price = ZERO_BD
      if (pair.reserve0.notEqual(ZERO_BD)) pair.token1Price = pair.reserve1.div(pair.reserve0)
      else pair.token1Price = ZERO_BD

      pair.save()
    }
  }
}

export function handleSwap(event: Swap): void {
  log.info("Swap event", [])
  let pair = Pair.load(event.address.toHexString())
  let amount0In = ZERO_BD
  var amount1In = ZERO_BD
  var amount0Out = ZERO_BD
  var amount1Out = ZERO_BD
  if(pair)
  {
    let token0 = Token.load(pair.token0)
    let token1 = Token.load(pair.token1)
    if(token0 && token1)
    {
      amount0In = convertTokenToDecimal(event.params.amount0In, token0.decimals)
      amount1In = convertTokenToDecimal(event.params.amount1In, token1.decimals)
      amount0Out = convertTokenToDecimal(event.params.amount0Out, token0.decimals)
      amount1Out = convertTokenToDecimal(event.params.amount1Out, token1.decimals)

      // totals for volume updates
      let amount0Total = amount0Out.plus(amount0In)
      let amount1Total = amount1Out.plus(amount1In)

      // update pair volume data, use tracked amount if we have it as its probably more accurate
      pair.volumeToken0 = pair.volumeToken0.plus(amount0Total)
      pair.volumeToken1 = pair.volumeToken1.plus(amount1Total)
      pair.save()

      // save entities
      pair.save()
    }
    let transaction = Transaction.load(event.transaction.hash.toHexString())
    if (transaction === null) {
      transaction = new Transaction(event.transaction.hash.toHexString())
      transaction.blockNumber = event.block.number
      transaction.timestamp = event.block.timestamp
    }
    transaction.save()

    let swap = new SwapEvent(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toString())
    )

    // update swap event
    swap.transaction = transaction.id
    swap.pair = pair?pair.id:ADDRESS_ZERO
    swap.timestamp = transaction.timestamp
    swap.transaction = transaction.id
    swap.sender = event.params.sender
    swap.amount0In = amount0In
    swap.amount1In = amount1In
    swap.amount0Out = amount0Out
    swap.amount1Out = amount1Out
    swap.to = event.params.to
    swap.from = event.transaction.from
    swap.logIndex = event.logIndex
    swap.reserve0 = pair.reserve0
    swap.reserve1 = pair.reserve1
    swap.token0Price = pair.token0Price
    swap.token1Price = pair.token1Price
    swap.save()
  }
}

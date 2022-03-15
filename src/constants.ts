import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

export const FACTORY_ADDRESS = '0x3fAaB499b519fdC5819e3D7ed0C26111904cbc28'
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export const USDC_ADDRESS = '0x04068da6c83afcfa0e13ba15a6696662335d5b75'

export let WHITELIST_TOKENS = [
  '0x04068da6c83afcfa0e13ba15a6696662335d5b75',//USDC
  '0x82f0b8b456c1a451378467398982d4834b6829c1',//MIM
  '0xde12c7959e1a72bbe8a5f7a1dc8f8eef9ab011b3',//DEI
  '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',//WFTM
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',//DAI
  '0xe55e19fb4f2d85af758950957714292dac1e25b2',//SYN
  '0xdc301622e621166bd8e82f2ca0a26c13ad0be355',//FRAX
  '0x911da02c1232a3c3e1418b834a311921143b04d7',//WEVE
  '0xc165d941481e68696f43ee6e99bfb2b23e0e3114',//OXD
]
let WHITELIST_PAIRS = new Map<string, string[]>()
WHITELIST_PAIRS.set(
  '0x82f0b8b456c1a451378467398982d4834b6829c1',
  [
    'token0price',
    '0xbcab7d083cf6a01e0dda9ed7f8a02b47d125e682'//USDC/MIM
  ]
)
WHITELIST_PAIRS.set(
  '0xde12c7959e1a72bbe8a5f7a1dc8f8eef9ab011b3',
  [
    'token0price',
    '0x5821573d8f04947952e76d94f3abc6d7b43bf8d0'//USDC/DEI
  ],
)
WHITELIST_PAIRS.set(
  '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  [
    'token0price',
    '0xbad7d3df8e1614d985c3d9ba9f6ecd32ae7dc20a'//USDC/WFTM
  ],
)
WHITELIST_PAIRS.set(
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  [
    'token0price',
    '0xc0240ee4405f11efb87a00b432a8be7b7afc97cc'//USDC/DAI
  ],
)
WHITELIST_PAIRS.set(
  '0xe55e19fb4f2d85af758950957714292dac1e25b2',
  [
    'token0price',
    '0xb1b3b96cf35435b2518093acd50e02fe03a0131f'//USDC/SYN
  ],
)
WHITELIST_PAIRS.set(
  '0xdc301622e621166bd8e82f2ca0a26c13ad0be355',
  [
    'token0price',
    '0x154ea0e896695824c87985a52230674c2be7731b'//USDC/FRAX
  ],
)
WHITELIST_PAIRS.set(
  '0x911da02c1232a3c3e1418b834a311921143b04d7',
  [
    'token0price',
    '0xd9a4108cbb40a12de16dffdc54ae5065878816d7'//USDC/WEVE
  ],
)
WHITELIST_PAIRS.set(
  '0xc165d941481e68696f43ee6e99bfb2b23e0e3114',
  [
    'token0price',
    '0xeafb5ae6eea34954ee5e5a27b068b8705ce926a6'//USDC/OXD
  ],
)
export {WHITELIST_PAIRS}
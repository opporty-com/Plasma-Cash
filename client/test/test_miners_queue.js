
import { minersQueue, setMinersCandidate, validateKeyForMining } from 'consensus'
import chai from 'chai';
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect;

const george_address = '0xcDd97e8350e93eeD3224A217A42d28cF0276b67b',
  peter_address = '0xbc01Cd4A866c557623F83db195C64b0785F62d01',
  salem_address = '0x4CCa94A907A979f105bf9E1e0FB713ED3A478F86',
  sofiya_address = '0x3d90A916Af5163cAC1A0e2c822D47eF224E85711',
  rosetta_address = '0x2AdC318Ac93A7289f83Aa7F26513bC0d15f0Ab3e',
  miners = []

let first_miner = {}, twice_miner = {}, miner_keys = []

describe('MinersQueue and rightsHandler', async () => {

  it('should set miners', async () => {
    miner_keys = [george_address, peter_address, salem_address]
    for (let i = 0; i < miner_keys.length; i++) {
      miners.unshift(await setMinersCandidate(miner_keys[i]))
    }

    let minersArray = await minersQueue.getAllMiners()
    for (let i = 0; i < minersArray.length; i++) {
      expect(miner_keys.indexOf(minersArray[i].address) != -1).to.be.true
    }
  })

  it('should validate miners', async () => {

    for (let i = 0; i < miners.length; i++) {
      expect(await validateKeyForMining(miners[i])).to.be.true
    }

    expect(await validateKeyForMining({ miner_key: sofiya_address, address: sofiya_address })).to.be.false

  })

  it('should reset miners from redis', async () => {

    await minersQueue.resetMinersQueue()

    for (let i = 0; i < miners.length; i++) {
      expect(await validateKeyForMining(miners[i])).to.be.true
    }

    expect(await validateKeyForMining({ miner_key: sofiya_address, address: sofiya_address })).to.be.false
  })

  it('should correct iterate miners', async () => {

    first_miner = await minersQueue.getCurrentMiner();

    miners.should.include.something.that.deep.equals(first_miner);

    await minersQueue.setNextMiner()

    twice_miner = await minersQueue.getCurrentMiner()

    miners.should.include.something.that.deep.equals(twice_miner)
    
    expect(first_miner).to.not.equal(twice_miner)

    for (let i = 0; i < miners.length; i++) {
      minersQueue.setNextMiner()
    }

    let again_twice_miner = await minersQueue.getCurrentMiner()
    expect(twice_miner).to.equal(again_twice_miner)

  })

  it('should delete miner from queue', async () => {

    expect(await validateKeyForMining(first_miner)).to.be.true

    let allMiners = await minersQueue.getAllMiners()

    allMiners.should.include.something.that.deep.equals(first_miner)

    await minersQueue.delMiner(first_miner)
    expect(await validateKeyForMining(first_miner)).to.be.false

    allMiners = await minersQueue.getAllMiners()

    allMiners.should.not.include.something.that.deep.equals(first_miner)

    for (let i = 0; i < miners.length; i++) {
      if (miners[i].miner_key === first_miner.miner_key) {
        miners.splice(i, 1)
      }
    }

    for (let i = 0; i < miners.length; i++) {
      expect(await validateKeyForMining(miners[i])).to.be.true
    }

    for (let i = 0; i < miners.length; i++) {
      minersQueue.setNextMiner()
    }

    let again_twice_miner = await minersQueue.getCurrentMiner()
    expect(twice_miner).to.equal(again_twice_miner) 

  })

  it('should add one miner', async () => {

    miners.push(await setMinersCandidate(rosetta_address))
    let allMiners = await minersQueue.getAllMiners()
    allMiners.should.include.something.that.deep.equals(miners[miners.length-1])

    for (let i = 0; i < miners.length; i++) {
      minersQueue.setNextMiner()
    }

    let again_twice_miner = await minersQueue.getCurrentMiner()
    expect(twice_miner).to.equal(again_twice_miner)

  })

  it('should delete all miners', async () => {

    minersQueue.delAllMiners()

    for (let i = 0; i < miners.length; i++) {
      expect(await validateKeyForMining(miners[i])).to.be.false
    }
    
    expect(minersQueue.getAllMiners()).to.be.empty

  })

  after(() => {
    process.exit()
  })
})

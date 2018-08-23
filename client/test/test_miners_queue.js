
import { minersQueue, setMinersCandidate, validateKeyForMining } from 'consensus'
import chai from 'chai';
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect;

const george_key = '74be59be09530c69415bbaa2903acf392e1bd4391f4d28d0bf7981792bd3b0fc',
  peter_key = 'cde1dab74e2de36c9efe4100984aa20495254a77f155f3903bf71ae36a5ed327',
  salem_key = '10322edd87862cf05815ebdb79462aaec85144ae0483045f01a7f15dcbb924e5',
  sofiya_key = '73f879a096452e5c35cb36eac480a1cfa9e8e85e2bff2435ee3987bd9675b954',
  rosetta_key = 'a0ba5cb231fcc35e35b8bec5c0ac4fd874a6109fea9dfdbf54d893ed7cb9fcef'

const miners = []

const miner_keys = []

describe('MinersQueue and rightsHandler', async () => {

  it('should set miners', async () => {
    let miner_keys = [george_key, peter_key, salem_key]
    for (let i = 0; i < miner_keys.length; i++) {
      miners.unshift(await setMinersCandidate(miner_keys[i]))
    }
    let minersArray = await minersQueue.getAllMiners()
    for (let i = 0; i < minersArray.length; i++) {
      expect(miner_keys.indexOf(minersArray[i].private_key) != -1).to.be.true
    }
  })

  it('should validate miners', async () => {

    for (let i = 0; i < miners.length; i++) {
      expect(await validateKeyForMining(miners[i])).to.be.true
    }

    expect(await validateKeyForMining({ miner_key: sofiya_key, private_key: sofiya_key })).to.be.false

  })

  it('should reset miners from redis', async () => {

    await minersQueue.resetMinersQueue()

    for (let i = 0; i < miners.length; i++) {
      expect(await validateKeyForMining(miners[i])).to.be.true
    }

    expect(await validateKeyForMining({ miner_key: sofiya_key, private_key: sofiya_key })).to.be.false
  })

  it('should correct iterate miners', async () => {

    let first_miner = await minersQueue.getCurrentMiner();

    console.log('first miner', first_miner);
    
    miners.should.include.something.that.deep.equals(first_miner);
    minersQueue.setNextMiner()
    let twice_miner = await minersQueue.getCurrentMiner()

    expect(twice_miner).should.include.something.that.deep.equals(first_miner)

    expect(first_miner != twice_miner).to.be.true

    for (let i = 0; i < miner.length; i++) {
      minersQueue.setNextMiner()
    }

    let again_twice_miner = await minersQueue.getCurrentMiner()
    expect(twice_miner).to.equal(again_twice_miner)

    it('should delete miner from queue', async () => {

      expect(await validateKeyForMining(miners[0])).to.be.true
      expect(await minersQueue.getAllMiners()).should.include.something.that.deep.equals(first_miner)

      minersQueue.delMiner(miners[0])

      expect(await validateKeyForMining(miners[0])).to.be.false
      expect(await minersQueue.getAllMiners()).to.not.include(first_miner)

      miners.shift()

      for (let i = 0; i < miners.length; i++) {
        expect(await validateKeyForMining(miners[i])).to.be.true
      }
    })

    for (let i = 0; i < miner.length; i++) {
      minersQueue.nextMiner()
    }

    again_twice_miner = await minersQueue.getCurrentMiner()

    expect(twice_miner).to.equal(again_twice_miner)

    it('should add one miner', async () => {

      miners.push(await setMinersCandidate(rosetta_key))

      expect(await minersQueue.getAllMiners()).should.include.something.that.deep.equals(miners[miners.lenght])

    })

    for (let i = 0; i < miner.length; i++) {
      minersQueue.nextMiner()
    }

    again_twice_miner = await minersQueue.getCurrentMiner()

    expect(twice_miner).to.equal(again_twice_miner)

  })

  it('should delete all miners', async () => {

    minersQueue.delAllMiners()

    for (let i = 0; i < miners.length; i++) {
      expect(await validateKeyForMining(miners[i])).to.be.false
    }
    expect(minersQueue.getAllMiners()).to.be.empty

  })

  // after(()=>{
  //   done()
  // })
})

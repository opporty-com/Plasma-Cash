
import { minersQueue, setMinersCandidate, validateKeyForMining } from 'consensus'

const george_key = '74be59be09530c69415bbaa2903acf392e1bd4391f4d28d0bf7981792bd3b0fc',
      peter_key = 'cde1dab74e2de36c9efe4100984aa20495254a77f155f3903bf71ae36a5ed327',
      salem_key = '10322edd87862cf05815ebdb79462aaec85144ae0483045f01a7f15dcbb924e5',
      sofiya_key = '73f879a096452e5c35cb36eac480a1cfa9e8e85e2bff2435ee3987bd9675b954',
      rosetta_key = 'a0ba5cb231fcc35e35b8bec5c0ac4fd874a6109fea9dfdbf54d893ed7cb9fcef'

const miners = []



describe('MinersQueue and rightsHandler', () => {
  
  it('should set miners', () => {
    
    [george_key, peter_key, salem_key].forEach((value)=>{
      miners.push(setMinersCandidate(value))
    })
    
    console.log('minersQueue ', minersQueue);

    minersQueue.getAllMiners().then((array)=>{
      array.forEach((value)=>{
        expect(miners).to.include(value)
      })
    })
  })

	// it('should validate miners', () => {

  //   miners.forEach((miner)=>{
  //     expect(validateKeyForMining(miner.miner_key)).to.be.true
  //   })

  //   expect(validateKeyForMining(sofiya_key)).to.be.false   
  // })

  // it('should reset miners from redis', async () => {

  //   await minersQueue.resetMinersQueue()

  //   miners.forEach((miner)=>{
  //     expect(validateKeyForMining(miner.miner_key)).to.be.true
  //   })

  //   expect(validateKeyForMining(sofiya_key)).to.be.false   
  // })

  // it('should correct iterate miners', ()=>{

  //   let first_miner = minersQueue.getCurrentMiner()
  //   expect(miners).to.include(first_miner)
  //   minersQueue.nextMiner()
  //   let twice_miner = minersQueue.getCurrentMiner()
  //   expect(twice_miner).to.include(first_miner)
  //   expect(first_miner != twice_miner).to.be.true
    
  //   for(let i = 0; i<miner.length; i++){
  //     minersQueue.nextMiner()
  //   }

  //   let again_twice_miner = minersQueue.getCurrentMiner()
  //   expect(twice_miner === again_twice_miner).to.be.true

  //   it('should delete miner from queue', ()=>{

  //     expect(validateKeyForMining(miners[0].miner_key)).to.be.true   
  //     expect(minersQueue.getAllMiners()).to.include(first_miner)

  //     minersQueue.delMiner(miners[0])

  //     expect(validateKeyForMining(miners[0].miner_key)).to.be.false   
  //     expect(minersQueue.getAllMiners()).to.not.include(first_miner)
  
  //     miners.shift()
  
  //     miners.forEach((miner)=>{
  //       expect(validateKeyForMining(miner.miner_key)).to.be.true
  //     })
  //   })

  //   for(let i = 0; i<miner.length; i++){
  //     minersQueue.nextMiner()
  //   }

  //   again_twice_miner = minersQueue.getCurrentMiner()

  //   expect(twice_miner === again_twice_miner).to.be.true

  //   it('should add one miner', ()=>{

  //     miners.push(setMinersCandidate(rosetta_key))

  //     expect(minersQueue.getAllMiners()).to.include(miners[miners.lenght])

  //   })

  //   for(let i = 0; i<miner.length; i++){
  //     minersQueue.nextMiner()
  //   }

  //   again_twice_miner = minersQueue.getCurrentMiner()

  //   expect(twice_miner === again_twice_miner).to.be.true
    
  // })

	// it('should delete all miners', async () => {

  //   await minersQueue.delAll()

  //   miners.forEach((miner)=>{
  //     expect(validateKeyForMining(miner.miner_key)).to.be.false
  //   })

  //   expect(minersQueue.getAllMiners).to.be.empty
  // })
  
  // after(()=>{
  //   done()
  // })
})

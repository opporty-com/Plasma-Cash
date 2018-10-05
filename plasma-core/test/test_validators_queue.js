
import {validatorsQueue, RightsHandler} from 'consensus'
import chai from 'chai'
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect

const aliceAddress = '0xcDd97e8350e93eeD3224A217A42d28cF0276b67b'
const peterAddress = '0xbc01Cd4A866c557623F83db195C64b0785F62d01'
const salemAddress = '0x4CCa94A907A979f105bf9E1e0FB713ED3A478F86'
const sofiyaAddress = '0x3d90A916Af5163cAC1A0e2c822D47eF224E85711'
const rosettaAddress = '0x2AdC318Ac93A7289f83Aa7F26513bC0d15f0Ab3e'
let validators = []

let firstValidator = {}
let twiceValidator = {}
let validatorKeys = []

describe('validatorsQueue and rightsHandler', async () => {

  it('should set validators', async () => {

    validatorKeys = [aliceAddress, peterAddress, salemAddress]

    for (let i = 0; i < validatorKeys.length; i++) {
      validators.unshift(await RightsHandler.setValidatorsCandidate(validatorKeys[i]))
    }
  
    let validatorsArray = await validatorsQueue.getAllValidators()
    for (let i = 0; i < validatorsArray.length; i++) {
      expect(validatorKeys.indexOf(validatorsArray[i].address) != -1).to.be.true
    }
  })

  it('should validate validators', async () => {
    for (let i = 0; i < validators.length; i++) {
      expect(await RightsHandler.validateAddressForValidating(validators[i].address)).to.be.true
    }
    expect(await RightsHandler.validateAddressForValidating(sofiyaAddress)).to.be.false

  })

  it('should reset validators from redis', async () => {
    await validatorsQueue.resetValidatorsQueue()

    for (let i = 0; i < validators.length; i++) {
      expect(await RightsHandler.validateAddressForValidating(validators[i].address)).to.be.true
    }

    expect(await RightsHandler.validateAddressForValidating(sofiyaAddress)).to.be.false
  })

  it('should correct iterate validators', async () => {

    firstValidator = await validatorsQueue.getCurrentValidator()

    validators.should.include.something.that.deep.equals(first_validator)

    await validatorsQueue.setNextValidator()

    twiceValidator = await validatorsQueue.getCurrentValidator()

    validators.should.include.something.that.deep.equals(twiceValidator)
    
    expect(firstValidator).to.not.equal(twiceValidator)

    for (let i = 0; i < validators.length; i++) {
      validatorsQueue.setNextValidator()
    }

    let againTwiceValidator = await validatorsQueue.getCurrentValidator()
    expect(twiceValidator).to.equal(againTwiceValidator)

  })

  it('should delete validator from queue', async () => {
    expect(await RightsHandler.validateAddressForValidating(firstValidator.address)).to.be.true

    let allValidators = await validatorsQueue.getAllValidators()
    allValidators.should.include.something.that.deep.equals(firstValidator)
    await validatorsQueue.delValidator(firstValidator)
    expect(await RightsHandler.validateAddressForValidating(
      firstValidator.address
    )).to.be.false

    allValidators = await validatorsQueue.getAllValidators()

    allValidators.should.not.include.something.that.deep.equals(firstValidator)

    for (let i = 0; i < validators.length; i++) {
      if (validators[i].validator_key === firstValidator.validator_key) {
        validators.splice(i, 1)
      }
    }

    for (let i = 0; i < validators.length; i++) {
      expect(
        await RightsHandler.validateAddressForValidating(validators[i].address)
      ).to.be.true
    }

    for (let i = 0; i < validators.length; i++) {
      validatorsQueue.setNextValidator()
    }

    let againTwiceValidator = await validatorsQueue.getCurrentValidator()
    expect(twiceValidator).to.equal(againTwiceValidator)
  })

  it('should add one validator', async () => {
    validators.push(await RightsHandler.setValidatorsCandidate(rosettaAddress))
    let allValidators = await validatorsQueue.getAllValidators()
    allValidators.should.include.something.that.deep.equals(
      validators[validators.length-1]
    )

    for (let i = 0; i < validators.length; i++) {
      validatorsQueue.setNextValidator()
    }

    let againTwiceValidator = await validatorsQueue.getCurrentValidator()
    expect(twiceValidator).to.equal(againTwiceValidator)
  })

  it('should delete all validators', async () => {
    validatorsQueue.delAllValidators()
    for (let i = 0; i < validators.length; i++) {
      expect(
        await RightsHandler.validateAddressForValidating(validators[i].address)
      ).to.be.false
    }
    expect(validatorsQueue.getAllValidators()).to.be.empty
  })

  after(() => {
    process.exit()
  })
})

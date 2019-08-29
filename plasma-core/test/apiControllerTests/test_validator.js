import { getCandidates, getValidators, getCurrent } from "../../src/api/controllers/Validator";
import chai from 'chai';
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect

describe("Validators", () => {

  it('Should get Candidates', async () => {
      const validator = await getCandidates(),
        { error } = validator;

    if (error) throw new Error(error)

    expect( Boolean(validator) ).to.be.true
  });

  it('Should get Validators', async () => {
    const validator = await getValidators(),
      { error } = validator;

    if (error) throw new Error(error)

    expect( Boolean(validator) ).to.be.true
  });

  it('Should get Current', async () => {
    const validator = await getCurrent(),
      { error } = validator;

    if (error) throw new Error(error)

    expect( Boolean(validator) ).to.be.true
  });

})

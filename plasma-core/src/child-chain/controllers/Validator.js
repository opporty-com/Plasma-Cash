/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import validators from '../lib/validators';

async function getCandidates() {
  const  validatorsArr = validators.getCandidates()
  if ( !validatorsArr ) throw new Error("Candidates not found")
  return validatorsArr.map(v => v);
}

async function getValidators() {
  const  validatorsArr = validators.getValidators()
  if ( !validatorsArr ) throw new Error("Validators not found")
  return validatorsArr.map(v => v);
}

async function getCurrent() {
  const current = validators.getCurrent();
  if (!current) throw new Error( "Current not found!" )
  return current;
}



export {
  getCandidates,
  getValidators,
  getCurrent
}

import { argv } from 'yargs'
import { validateBlock } from 'validator/validateBlock';

import {
  createDeposit,
  proposeCandidate,
  createTransaction,
  getCandidates,
  wantToComputeCandidates,
  toLowerStake,
  addStake,
  removeCandidate
} from './requests'


(async () => {
  switch (argv.action) {

    case 'deposit': {
      let response = await createDeposit(argv.address, argv.amount)
      console.log('Response: ', response)
      break;
    }

    case 'propose candidate': {
      let response = await proposeCandidate(argv.address)
      console.log('Response: ', response)
      break;
    }

    case 'create transaction': {
      let response = await createTransaction(argv.to, argv.address, argv.tokenId)
      console.log('Response: ', response)
      break;
    }

    case 'get candidates': {
      let response = await getCandidates()
      console.log('Response: ', response)
      break;
    }

    case 'lower stake': {
      let response = await toLowerStake(argv.address, argv.candidate, argv.value)
      console.log('Response: ', response)
      break;
    }

    case 'add stake': {
      let response = await addStake(argv.address, argv.candidate, argv.value)
      console.log('Response: ', response)
      break;
    }

    case 'remove candidate': {
      let response = await removeCandidate(argv.address)
      console.log('Response: ', response)
      break;
    }

    case 'validate': {
      let response = await validateBlock(argv.address)
      console.log('Response: ', response)
    }
  }
})()

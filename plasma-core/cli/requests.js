import axios from 'axios'


//follow requests for users 
const createDeposit = async (address, amount) => {
  return (await axios.post('http://localhost:443/Tx/deposit', JSON.stringify({ address, amount }))).data
}

const createTransaction = async (addressTo, addressFrom, tokenId) => {
  return (await axios.post('http://localhost:443/Tx/createTransaction', { addressTo, addressFrom, tokenId })).data
}


//follow requests for validators
const getAllTxFromPool = async () => {
  return (await axios.get('http://localhost:443/getRawMempool')).data
}

const getUtxoForAddresses = async (addresses) => {
  return (await axios.post('http://localhost:443/utxo', { addresses })).data
}

const submitBlock = async (address, block, rejectTransactions) => {
  return (await axios.post('http://localhost:443/Block/submitBlock', { address, block, rejectTransactions })).data
}

const signBlock = async (address, blockHash) => {
  return (await axios.post('http://localhost:443/Block/sign', { address, blockHash })).data
}

const signTxVerify = async (data, signature) => {
  return (await axios.post('http://localhost:443/Tx/signVerify', { data, signature })).data
}


//follow requests for voters and candidates
const getCandidates = async () => {
  return (await axios.get('http://localhost:443/Validators/getCandidates')).data
}

const toLowerStake = async (stake) => {
  return (await axios.post('http://localhost:443/Validators/toLowerStake', { stake })).data
}

const addStake = async (voter, candidate, value) => {
  return (await axios.post('http://localhost:443/Validators/addStake', { voter, candidate, value })).data
}

const removeCandidate = async (address) => {
  return (await axios.post('http://localhost:443/Validators/removeCandidate', { address })).data
}

const proposeCandidate = async (address) => {
  return (await axios.post('http://localhost:443/Validators/proposeCandidate', { address })).data
}


export {
  signTxVerify,
  getAllTxFromPool,
  getUtxoForAddresses,
  submitBlock,
  signBlock,
  createDeposit,
  proposeCandidate,
  createTransaction,
  getCandidates,
  toLowerStake,
  addStake,
  removeCandidate
}

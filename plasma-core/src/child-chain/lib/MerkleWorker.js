const {workerData, parentPort} = require('worker_threads');

const ethUtil = require('ethereumjs-util');
const BN = require('bn.js');

function buildNode(childNodes, key = '', level = 0) {
  let node = {key}

  if (childNodes.length === 1) {
    let nodeKey = level === 0 ?
      childNodes[0].key :
      childNodes[0].key.slice(level - 1);
    node.key = nodeKey;

    let nodeHashes = Buffer.concat([Buffer.from(ethUtil.keccak256(nodeKey)),
      childNodes[0].hash]);
    node.hash = ethUtil.keccak256(nodeHashes)
    return node
  }

  let leftChilds = [];
  let rightChilds = [];

  childNodes.forEach((node) => {
    if (node.key[level] === '1') {
      rightChilds.push(node)
    } else {
      leftChilds.push(node)
    }
  })

  if (leftChilds.length && rightChilds.length) {
    node.leftChild = buildNode(leftChilds, '0', level + 1);
    node.rightChild = buildNode(rightChilds, '1', level + 1);
    let nodeHashes = Buffer.concat([Buffer.from(ethUtil.keccak256(node.key)),
      node.leftChild.hash,
      node.rightChild.hash])
    node.hash = ethUtil.keccak256(nodeHashes)
  } else if (leftChilds.length && !rightChilds.length) {
    node = buildNode(leftChilds, key + '0', level + 1)
  } else if (!leftChilds.length && rightChilds.length) {
    node = buildNode(rightChilds, key + '1', level + 1)
  } else if (!leftChilds.length && !rightChilds.length) {
    throw new Error('invalid tree')
  }

  return node
}


const node = buildNode(workerData);

parentPort.postMessage(node);

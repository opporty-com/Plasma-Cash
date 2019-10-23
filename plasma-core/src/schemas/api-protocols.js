import BD from 'binary-data';
import * as MODEL_PROTOCOLS from "./model-protocols";

const PROTOCOLS = {
  baseProtocol: {
    type: BD.types.uint8,
    messageId: BD.types.uint24le,
    error: BD.types.uint8,
    length: BD.types.uint24le,
    payload: BD.types.buffer(({node}) => node.length)
  },
  getBlock: {
    type: 1,
    request: {
      number: BD.types.uint24le
    },
    response: MODEL_PROTOCOLS.Block
  },
  getLastBlock: {
    type: 2,
    request: {},
    response: MODEL_PROTOCOLS.Block
  },
  getProof: {
    type: 3,
    request: {
      tokenId: BD.types.string(null),
      blockNumber: BD.types.uint24le
    },
    response: {
      hash: BD.types.buffer(32)
    }
  },
  checkProof: {
    type: 4,
    request: {
      hash: BD.types.buffer(32),
      blockNumber: BD.types.uint24le,
      proof: BD.types.string(null)
    },
    response: {
      result: BD.types.buffer(1),
    }
  },
  getToken: {
    type: 5,
    request: {
      tokenId: BD.types.string(null)
    },
    response: MODEL_PROTOCOLS.Token
  },
  getTokenByAddress: {
    type: 6,
    request: {
      address: BD.types.buffer(20)
    },
    response: {
      count: BD.types.uint24le,
      tokens: BD.types.array(MODEL_PROTOCOLS.Token, ({current}) => current.count)
    }
  },
  getLastTransactionByTokenId: {
    type: 7,
    request: {
      tokenId: BD.types.string(null)
    },
    response: MODEL_PROTOCOLS.Transaction
  },
  getTransactionsByTokenId: {
    type: 8,
    request: {
      tokenId: BD.types.string(null)
    },
    response: {
      count: BD.types.uint24le,
      transactions: BD.types.array(MODEL_PROTOCOLS.Transaction, ({current}) => current.count)
    }
  },
  sendTransaction: {
    type: 9,
    request: MODEL_PROTOCOLS.Transaction,
    response: MODEL_PROTOCOLS.Transaction
  },
  getPool: {
    type: 10,
    request: {},
    response: {
      count: BD.types.uint24le,
      transactions: BD.types.array(MODEL_PROTOCOLS.Transaction, ({current}) => current.count)
    }
  },
  getTransactionByHash: {
    type: 11,
    request: {
      hash: BD.types.buffer(32),
    },
    response: MODEL_PROTOCOLS.Transaction
  },
  getTransactionsByAddress: {
    type: 12,
    request: {
      address: BD.types.string(null)
    },
    response: {
      count: BD.types.uint24le,
      transactions: BD.types.array(MODEL_PROTOCOLS.Transaction, ({current}) => current.count)
    }
  },
  getValidators: {
    type: 13,
    request: {},
    response: {
      count: BD.types.uint24le,
      validators: BD.types.array(BD.types.string(null), ({current}) => current.count)
    }
  },
  getCandidates: {
    type: 14,
    request: {},
    response: {
      count: BD.types.uint24le,
      candidates: BD.types.array({
        address: BD.types.string(null),
        countStakes: BD.types.uint24le,
        stakes: BD.types.array({
          voter: BD.types.string(null),
          candidate: BD.types.string(null),
          value: BD.types.uint24le
        }, ({current}) => current.countStakes),
        weight: BD.types.uint24le
      }, ({current}) => current.count)
    }
  },
  getCurrent: {
    type: 15,
    request: {},
    response: {
      address: BD.types.buffer(42)
    }
  },
  error: {
    type: 16,
    response: {
      message: BD.types.string(null)
    }
  }
};

export { PROTOCOLS }

pragma solidity ^0.4.24;

import "./RLP.sol";
import "./HeapLib.sol";
import "./ArrayOp.sol";
import "./ByteUtils.sol";
import "./ECRecovery.sol";

/*
 * Main Root chain Plasma Cash 
 * Smart contract
 */
contract Root {
    /*
     * MinHeap structure
     * specialized tree-based data structure that satisfies the heap property: 
     * if P is a parent node of C, then the key (the value) of P is less than or equal to the key of C. 
     */
    using HeapLib for HeapLib.Heap;

    /* 
     * RLP encoded structure in bytes
     */
    using RLP for bytes;
    using RLP for RLP.RLPItem;
    using RLP for RLP.Iterator;

    /*
     * Operations for removing and finding elements in an array
     */
    using ArrayOp for uint256[];

    /*
     * Events section
     */

    event BlockSubmitted(address operator, bytes32 merkleRoot, uint blockNumber);
    event DepositAdded(address depositor, uint amount, uint tokenId, uint blockNumber);
    event StakeAdded(address voter, address candidate, uint value, uint tokenId);
    event StakeLowered(address voter, address candidate, uint value, uint tokenId);
    event ExitAdded(address exitor, uint priority, uint exitId);
    event ExitChallengedEvent(uint exitId);
    event ChallengedInvalidHistory(uint exitId, uint tokenId);
    event ExitRespondedEvent(uint exitId);
    event ExitCompleteEvent(uint blockNumber, uint exitBlockNumber, uint exitTokenId, uint exitDenom);
    event Log(string log);
    event Log(bytes log);
    event Log(bytes32 log);
    event Log(bool log);
    event Log(uint log);
    event Log(address log);

    /*
     * Operators that are able to publish blocks
     * in the main chain
     */
    mapping(address => bool) public operators;

    /* Datetime constants */
    uint constant week = 7 days;
    uint constant twoWeeks = 2 weeks;

    // array of challenged exits for invalid history challenge */
    mapping (uint => uint) public challenged;

    mapping(address => mapping(uint => address)) stakes;

    /*
     *  Modifiers
     *  check if sender address is creator of the contract
     */
    modifier isAuthority() {
        require(msg.sender == authority);
        _;
    }

    /* owner of the contract */
    address public authority;

    /*
     * Block structure (represents one block in a chain)
     */
    struct Block {
        uint block_num;
        bytes32 merkle_root;
        uint time;
    }

    /*
     * Transaction structure (decoded from RLP form)
     */
    struct Transaction {
        bytes32 prevhash;
        uint prev_block;
        uint token_id;
        address new_owner;
    }

    /*
     * Exit record
     */
    struct Exit {
        uint block_num;
        uint prev_block;
        uint token_id;
        address new_owner;
        uint priority;
    }

    uint public current_blk;
    uint public deposit_blk;

    /*
     * Blockchain
     */
    mapping(uint => Block) public childChain;
    mapping(uint => uint) public tokens;
    // mapping(address => Weight) candidatesWithStakes;

    /*
     * Heap for exits
     */
    HeapLib.Heap exits;

    /*
     * Exit records (can be challenged)
     */ 
    mapping(uint => uint[]) public exit_ids;
    mapping(uint => Exit) public exitRecords;

    /*
     * Smart contract constructor (initial blocknum and depositnum values)
     */ 
    function Root() public {
        authority = msg.sender;
        current_blk = 0;
        deposit_blk = 1;
    }

    /*
     * Posibility to add new Plasma operator
     */
    function setOperator(address operator, bool status) public returns (bool success)
    {
        require(msg.sender == authority);
        operators[operator] = status;
        return true;
    }
    /*
     * RLP decoding from bytes to Transaction object fields
     */ 
    function getTransactionFromRLP(bytes rlp) public pure returns (
        bytes32 prevhash,
        uint prev_block,
        uint token_id,
        address new_owner) {
        // list of rlp decoded items
        RLP.RLPItem[] memory txList = rlp.toRLPItem().toList();
        //emit Log(txList.length);
        require(txList.length == 5);
        return (
            txList[0].toBytes32(),
            txList[1].toUint(),
            txList[2].toUint(),
            txList[3].toAddress()
        );
    }

    /* 
     * Submission of the block to the rootchild by Plasma operator
     * merkleRoot - merkle root of the block
     * block_num - current block number
     */
    function submitBlock(bytes32 merkleRoot, uint block_num) public {
        // only operators and creator of the contract are able to submit block
        require(operators[msg.sender] || msg.sender == authority);
        require(uint8(block_num) == current_blk + 1);
        // let's create new block in the chain
        Block memory newBlock = Block({
            block_num: current_blk,
            merkle_root: merkleRoot,
            time: block.timestamp
        });
        childChain[block_num] = newBlock;

        current_blk = block_num;
        emit BlockSubmitted(msg.sender, merkleRoot, block_num);
    }

    /*
     * Deposit eth 
     * Every single deposit corresponds to a unique coin ID; 
     * tokens are indivisible and cannot be merged.
     */
    function deposit() public payable {
        uint token_id = uint(keccak256(msg.sender, msg.value, deposit_blk));
        // token.index = deposit_blk;
        tokens[token_id] = msg.value;
        deposit_blk += 1;
        emit DepositAdded(msg.sender, msg.value, token_id, current_blk);
    }

    /*
     * Check if current message sender is transaction signer
     */
    function checkSig(bytes32 tx_hash, bytes sig) internal view returns (bool) {
        return msg.sender == ECRecovery.recover(tx_hash, sig);
    }

    /*
     * Start coin exit by providing the last two transactions in the coin’s ownership history 
     * (ie. the coin they are exiting C and its parent P(C)).
     */
    function startExit(uint block_num, bytes tx1, bytes tx0, bytes proof1, bytes proof0) public returns (uint exit_id) {
        require(checkPatriciaProof(keccak256(tx1), childChain[block_num].merkle_root, proof1));

        bytes32 prev_hash;
        uint prev_blk;
        uint token_id;
        address new_owner;
        (prev_hash, prev_blk, token_id, new_owner,) = getTransactionFromRLP(tx1);
    
        require(msg.sender == new_owner);
        
        require(tokens[token_id] > 0);
        bytes32 hashPrevTx = keccak256(tx0);
        require(checkPatriciaProof(hashPrevTx, childChain[prev_blk].merkle_root, proof0));
        require(prev_hash == hashPrevTx);

        Exit storage record = exitRecords[token_id];
        require(record.block_num == 0);

        record.block_num = block_num;
        record.new_owner = msg.sender;
        record.prev_block = prev_blk;

        if (childChain[block_num].time > block.timestamp - week)
            record.priority = childChain[block_num].time;
        else
            record.priority = block.timestamp - week;

        exits.add(record.priority);
        exit_ids[record.priority].push(token_id);

        emit ExitAdded(msg.sender, record.priority, token_id);
        return token_id;
    }
    /*
     * Challenge exit by providing
     * a proof of a transaction spending C
     */
    function challengeSpent(uint exit_id, uint blk_num, bytes tx1, bytes proof) public { 
        require(checkPatriciaProof(keccak256(tx1), childChain[blk_num].merkle_root, proof));

        Exit memory record = exitRecords[exit_id];
        require(record.block_num > 0);

        uint prev_block;
        uint token_id;
        (, prev_block , token_id, ) = getTransactionFromRLP(tx1);

        require(tokens[token_id] > 0);
        require(prev_block == record.block_num && record.block_num < blk_num);
        require(token_id == exit_id);

        exit_ids[record.priority].remove(exit_id);
        delete exitRecords[exit_id];
        emit ExitChallengedEvent(exit_id);
    }

    /*
     * Challenge exit by providing
     * a proof of a transaction spending P(C) that appears before C
     */
    function challengeDoubleSpend(uint exit_id, uint blk_num, bytes tx1, bytes proof) public { 
        require(checkPatriciaProof(keccak256(tx1), childChain[blk_num].merkle_root, proof));

        Exit memory record = exitRecords[exit_id];
        require(record.block_num > 0);

       // bytes32 prev_hash; 
        uint prev_block;
        uint token_id; 
        (, prev_block , token_id, ) = getTransactionFromRLP(tx1);
        require(tokens[token_id] > 0);

        // check if token double spent
        require(prev_block == record.prev_block && blk_num < record.block_num);
       // require(token_id == exit_id);
        exit_ids[record.priority].remove(exit_id);
        delete exitRecords[exit_id];
        emit ExitChallengedEvent(exit_id);
    }

    // /*
    //  * Challenge exit by providing
    //  * a transaction C* in the coin’s history before P(C)
    //  */
    function challengeInvalidHistory(uint exit_id, uint blk_num, bytes tx0, bytes proof) public { 
        // check if proof is valid
        require(checkPatriciaProof(keccak256(tx0), childChain[blk_num].merkle_root, proof));
        
        Exit memory record = exitRecords[exit_id];
        require(record.block_num > 0);

        bytes32 prev_hash; 
        uint token_id; 
        (prev_hash, , token_id, ) = getTransactionFromRLP(tx0);

        //require(exit_id == token_id);
        require(tokens[token_id] > 0);

        // transaction should be before exit tx in history
        require(blk_num < record.block_num - 1);

        challenged[exit_id] = blk_num;
        emit ChallengedInvalidHistory(exit_id, token_id);
    }

    /*
     * Respond to invalid history challenge by providing
     * the direct child of C*, which must be either equal to or before P( C )
     */
    function respondChallenge(uint exit_id, uint blk_num, bytes childtx, bytes proof) public {
        require(challenged[exit_id] > 0);
        Exit memory record = exitRecords[exit_id];
        require(record.block_num > 0);

        require(checkPatriciaProof(keccak256(childtx), childChain[blk_num].merkle_root, proof));
        // get transaction from rlpencoded form
        bytes32 prev_hash; 
        uint prev_block;
        uint token_id; 
        (prev_hash, prev_block, token_id, ) = getTransactionFromRLP(childtx);
        // if direct child
        if (prev_block == challenged[exit_id] ) {
            if (blk_num <= record.prev_block && token_id == exit_id ) {
                delete challenged[exit_id];
                emit ExitRespondedEvent(exit_id);
            } else {
                exit_ids[record.priority].remove(exit_id);
                delete exitRecords[exit_id];
                emit ExitChallengedEvent(exit_id);
            }
        }
    }

    function finalizeExits() public returns (bool success) {
        // get all exits by priority
        while (exits.data.length != 0 && block.timestamp > exits.peek() + twoWeeks) {
            uint priority = exits.pop();
            for (uint i = 0; i < exit_ids[priority].length; i++) {
                uint index = exit_ids[priority][i];
                Exit memory record = exitRecords[index];
                // finalize exits
                record.new_owner.transfer(tokens[index]);

                emit ExitCompleteEvent(current_blk, record.block_num, record.token_id, tokens[record.token_id]);
                delete exitRecords[index];
                delete tokens[index];
            }
            delete exit_ids[priority];
            
        }
        return true;
    }
    // check if merkle proof is valid
    function checkProof(bytes32 merkle, bytes32 root, bytes proof) pure internal returns (bool valid)
    {
        bytes32 hash = merkle;
        for (uint i = 32; i < proof.length; i += 33) {
            bytes1 flag;
            bytes32 sibling;
            assembly {
                flag := mload(add(proof, i))
                sibling := mload(add(add(proof, i), 1))
            }
            if (flag == 0) {
                hash = keccak256(sibling, hash);
            } else if (flag == 1) {
                hash = keccak256(hash, sibling);
            }
        }
        return hash == root;
    }
    
    // check if merkle proof is valid
    function checkPatriciaProof(bytes32 merkle, bytes32 root, bytes proof) pure public returns (bool valid)
    {
        bytes32 hash = merkle;
        bytes1 flag;
        bytes32 nodeKey;
        bytes32 sibling;

        assembly {
            nodeKey := mload(add(proof, 32))
        }
        hash = keccak256(nodeKey, hash);

        for (uint i = 64; i < proof.length; i += 65) {
            assembly {
                flag := mload(add(proof, i))
                nodeKey := mload(add(add(proof, i), 1))
                sibling := mload(add(add(proof, i), 33))
            }
            if (flag == 0) {
                hash = keccak256(nodeKey, sibling, hash);
            } else if (flag == 1) {
                hash = keccak256(nodeKey, hash, sibling);
            }
        }
        return hash == root;
    }
    
    // get current block number
    function getCurrentBlock() public view returns(uint) {
        return current_blk;
    }

    // get deposit number
    function getDepositBlock() public view returns(uint) {
        return deposit_blk;
    }

    // get exit by identifier
    function getExit(uint token_id) public view returns (address, uint, uint, uint)
    {
        Exit memory er = exitRecords[token_id];
        if (er.priority > 0)
            return ( er.new_owner, token_id, tokens[token_id], er.priority );
    }

    // get blockchain entry
    function getChain(uint blknum) public view returns (bytes32, uint)
    {
        return (childChain[blknum].merkle_root, childChain[blknum].time);
    }

    // get token by identifier
    function getToken(uint token_id) public view returns (uint) {
        return tokens[token_id];
    }

    // get balance of specific address
    function getBalance(address addr) public view returns(uint) {
        return addr.balance;
    } 
}
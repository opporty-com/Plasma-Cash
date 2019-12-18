import * as actions from "./actions";

const COMMANDS = {
  "auth": {
    description: `Authentication to the system. Use "-a" and "-p" options to login. If you will use some command that requires address or password, this information may not be indicated and will be taken from current session.
    Supported only next sets of options (commands examples, use with "-i" or without, if it not only option):
    1. Log in: "auth -a 0x5f37d668c180584c99eeb3181f2548e66524663b -p 123456 -t 1500", where "-t" is optional;
    2. Log out: "auth -e";
    3. Log info: "auth -i".`,
    flags: [
      {option: '-a, --address <address>', description: 'Address of account, use to login.'},
      {option: '-p, --password <password>', description: 'Account password, use to login.'},
      {option: '-t, --time <time>', description: 'Time, during which the session will be valid (in minutes, default value is 60).'},
      {option: '-i, --info', description: 'Info about current session. This option is compatible with any other and displays the latest system status.'},
      {option: '-e, --exit', description: 'Use to logout.'}
    ],
    action: env => actions.auth(env)
  },
  "deposit": {
    description: `Create deposit.
    Supported only next sets of options (commands examples, "-w" is optional):
    1. If you logged in: "deposit -c 0.000002 -w";
    2. If you not logged in: "deposit -a 0x5f37d668c180584c99eeb3181f2548e66524663b -p 123456 -c 0.000002 -w".`,
    flags: [
      {option: '-c, --amount <amount>', description: 'Amount of deposit in ETH, required.'},
      {option: '-a, --address <address>', description: 'Address of account, required if you not logged in.'},
      {option: '-p, --password <password>', description: 'Account password, required if you not logged in.'},
      {option: '-w, --wait', description: 'If this option determined, script will wait, until token will be available in plasma.'}
    ],
    action: env => actions.deposit(env)
  },
  "block": {
    description: `Get some block or its proof. Also you can check some proof. If you define both "-i" and "-l" to search block, option "-l" will be ignored.
    Supported only next sets of options (commands examples):
    1. Get block by ID: "block -i 494";
    2. Get last block: "block -l";
    3. Get proof: "block -p -i 494 -t 79827695199084364476839214583165568793572519178196630034092062614780447908184";
    4. Check proof: "block -c -p 0xe537f0d3f6b17f9b725febe83aed34043884ee1175b4abf444a969bf0d86edf0 -i 494 -h 0x50243ea0be3545f005b7fb6c20ab78da576469507e829940cd9c516e715aeea2".`,
    flags: [
      {option: '-i, --identifier <id>', description: 'Identifier (number) of block.'},
      {option: '-l, --last', description: 'Use to get last block.'},
      {option: '-t, --token <tokenId>', description: 'Identifier of token.'},
      {option: '-p, --proof [proof]', description: 'Get proof. Use with "-i" and "-t" options. In case of proof verification you can pass parameter to this option.'},
      {option: '-h, --hash <hash>', description: 'Some hash. Use for check proof.'},
      {option: '-c, --check', description: 'Check proof. Use with "-p", "-h" and "-i" options.'},
    ],
    action: env => actions.block(env)
  },
  "token": {
    description: `Get token or transactions by token. It is required to determine one of: "-i" or "-a". If both are specified with values, will be used "-i" and ignored "-a".
    Supported only next sets of options (commands examples):
    1. Get token by ID: "token -i 79827695199084364476839214583165568793572519178196630034092062614780447908184";
    2. Get tokens by address: "token -a 0xe537f0d3f6b17f9b725febe83aed34043884ee1175b4abf444a969bf0d86edf0";
    3. Get transactions by token ID: "token -t -i 79827695199084364476839214583165568793572519178196630034092062614780447908184";
    4. Get last transaction by token ID: "token -tl -i 79827695199084364476839214583165568793572519178196630034092062614780447908184".`,
    flags: [
      {option: '-i, --identifier <id>', description: 'Identifier of token.'},
      {option: '-a, --address <address>', description: 'Address of token owner.'},
      {option: '-t, --transaction', description: 'Means that need to get transactions by token identifier. Use with "-i" option.'},
      {option: '-l, --last', description: 'Use with "-t" option to get last transaction by token identifier.'}
    ],
    action: env => actions.token(env)
  },
  "transaction": {
    description: `By this command you can send transaction ("-s"), get transaction by hash ("-h") or address ("-a") or get pool ("-l"). If you specify an incorrect combination of parameters or a combination that cannot be performed at the same time, some options will be ignored.
    Supported only next sets of options (commands examples):
    1. Send new transaction: "transaction -s -a 0xa1E8e10AC00964CC2658E7dc3E1A017f0BB3D417 -i 79827695199084364476839214583165568793572519178196630034092062614780447908184 -t 1 -w", ("-w" is optional);
    2. Get pool: "transaction -p";
    3. Get transaction by hash: "transaction -h 0x50243ea0be3545f005b7fb6c20ab78da576469507e829940cd9c516e715aeea2";
    4. Get transactions by address: "transaction -a 0x50243ea0be3545f005b7fb6c20ab78da576469507e829940cd9c516e715aeea2".`,
    flags: [
      {option: '-s, --send', description: 'Send transaction. You must be logged in. Such options are required to use with: "-a", "-i", "-t".'},
      {option: '-h, --hash <hash>', description: 'Hash of transaction to get.'},
      {option: '-a, --address <address>', description: 'Address of account which refers to NEW owner of token in transaction.'},
      {option: '-p, --pool', description: 'Get pool.'},
      {option: '-i, --token-id <tokenId>', description: 'Identifier of token.'},
      {option: '-t, --type <type>', description: 'Type of transaction (number): 1 - pay, 2 - vote, 3 - unVote, 4 - candidate, 5 - resignation, 6 - private.'},
      {option: '-w, --wait', description: 'If this option determined, script will wait, until transaction, that was sent, will be available in plasma.'}
    ],
    action: env => actions.transaction(env)
  },
  "validator": {
    description: `Get candidates, validators or current. Execution priority: "-c", then "-v", then "-r". If an option with a higher priority is defined, options with a lower priority will be ignored.
    Supported only next sets of options (commands examples):
    1. Get candidates: "validator -c";
    2. Get validators: "validator -v";
    3. Get current: "validator -r".`,
    flags: [
      {option: '-c, --candidates', description: 'Get candidates.'},
      {option: '-v, --validators', description: 'Get validators.'},
      {option: '-r, --current', description: 'Get current.'},
    ],
    action: env => actions.validator(env)
  }
};

module.exports = COMMANDS;

import * as actions from "./actions";

const COMMANDS = {
  "auth": {
    description: 'Authentication to the system. Use "-a" and "-p" options to login. If you will use some command that requires address or password, this information may not be indicated and will be taken from current session. Run "auth --help" for more information.',
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
    description: 'Create deposit and get token ID. Run "deposit --help" for more information.',
    flags: [
      {option: '-c, --amount <amount>', description: 'Amount of deposit, required.'},
      {option: '-a, --address <address>', description: 'Address of account, required.'},
      {option: '-p, --password <password>', description: 'Account password, required.'},
      {option: '-w, --wait', description: 'If this option determined, script will wait, until token will be available in plasma.'}
    ],
    action: env => actions.deposit(env)
  },
  "block": {
    description: 'Get some block or its proof. Also you can check some proof. If you define both "-i" and "-l" to search block, option "-l" will be ignored. Run "deposit --help" for more information.',
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
    description: 'Get token or transactions by token. It is required to determine one of: "-i" or "-a". If both are specified with values, will be used "-i" and ignored "-a". Run "token --help" for more information.',
    flags: [
      {option: '-i, --identifier <id>', description: 'Identifier of token.'},
      {option: '-a, --address <address>', description: 'Address of token owner.'},
      {option: '-t, --transaction', description: 'Means that need to get transactions by token identifier. Use with "-i" option.'},
      {option: '-l, --last', description: 'Use with "-t" option to get last transaction by token identifier.'}
    ],
    action: env => actions.token(env)
  },
  "transaction": {
    description: 'By this command you can send transaction ("-s"), get transaction by hash ("-h") or address ("-a") or get pool ("-l"). If you specify an incorrect combination of parameters or a combination that cannot be performed at the same time, some options will be ignored.',
    flags: [
      {option: '-s, --send', description: 'Send transaction. You must be logged in. Such options are required to use with: "-a", "-p", "-i", "-t".'},
      {option: '-h, --hash <hash>', description: 'Hash of transaction to get.'},
      {option: '-a, --address <address>', description: 'Address of account which refers to NEW owner of token in transaction.'},
      {option: '-l, --pool', description: 'Get pool.'},
      {option: '-i, --token-id <tokenId>', description: 'Identifier of token.'},
      {option: '-p, --password <password>', description: 'Account password of current token owner.'},
      {option: '-t, --type <type>', description: 'Type of transaction.'}
    ],
    action: env => actions.transaction(env)
  },
  "validator": {
    description: 'Get candidates, validators or current. Execution priority: "-c", then "-v", then "-r". If an option with a higher priority is defpined, options with a lower priority will be ignored.',
    flags: [
      {option: '-c, --candidates', description: 'Get candidates.'},
      {option: '-v, --validators', description: 'Get validators.'},
      {option: '-r, --current', description: 'Get current.'},
    ],
    action: env => actions.validator(env)
  }
};

module.exports = COMMANDS;

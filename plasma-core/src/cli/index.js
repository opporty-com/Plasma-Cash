import program from 'commander'
import { getByAddress as getBalance } from "./controllers/Token";
import { deposit } from "./controllers/Deposit";
import { createTransaction } from "./controllers/Transaction";
//import keys from "./controllers/keys";
import config from "./config"

const COMMANDS = [{
    name: "deposit",
    flags: [{ option: "-c, --amount <amount>", descr: "Enter amount for deposit" }],
    description: "Create deposit and get idToken. Run \"deposit --help\" for more information. . Includes next flags: -c --amount",
    action: env => deposit( env )
  },{
    name: "balance",
    flags: [{ option: "-a, --address <your address>", descr: "Enter your address" }],
    description: "Get your balance. Run \"balance --help\" for more information. . Includes next flags: -a --address",
    action: env => getBalance( env )
  },{
    name: "createTransaction",
    flags: [
      { option: "-b, --prevBlock <prev block>", descr: "Enter prev block number" },
      { option: "-t, --to <to address>", descr: "Enter address for transaction" },
      { option: "-u, --tokenId <token id>", descr: "Enter token id"  },
    ],
    description: "Create new transaction. Run \"create --help\" for more information. Includes next flags: -b --prevBlock, -t --to, -u --tokenId",
    action: env => createTransaction( env )
},
/*{
    name: "keys",
    flags: [{ option: "-g, --generate", descr: "Generate Keys" }],
    description: "Create new keys. Run \"keys --help\" for more information.",
    action: env => keys( env )
}*/
];


const checkAuthAndRun = ( func, env ) => {

  if ( config.password && config.privateKey ) return func(env)

  console.log('Authentication has not been done. Add your private key and password to config.js file.')
  process.exit(1)
}

COMMANDS.forEach( ({ name, flags=[], action, description, auth }) => {
  const actionCallback = auth ? ( env ) => checkAuthAndRun(action, env) : action

  let allOptionsToString = ""
  flags.forEach( ({ option, descr }) =>  allOptionsToString += `.option('${ option }', '${ descr }' )` );

  const runCommand = new Function( 'program', 'callback', `program.command('${name}')${allOptionsToString}.description('${description}').action(callback)`)
  runCommand( program, actionCallback )
})

program.parse(process.argv);

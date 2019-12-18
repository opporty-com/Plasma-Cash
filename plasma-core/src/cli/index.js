import program from 'commander';
import COMMANDS from './lib/commands';

Object.keys(COMMANDS).forEach(key => {
  if (!COMMANDS.hasOwnProperty(key)) return true;
  const cmd = COMMANDS[key];
  const pCmd = program.command(key);

  cmd.flags.forEach(({option, description}) => pCmd.option(option, description));
  return pCmd.description(cmd.description).action(cmd.action);
});

program.parse(process.argv);

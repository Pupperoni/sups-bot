import 'dotenv/config';
import { ALL_COMMANDS } from './commands.js';
import { InstallGlobalCommands } from './utils.js';

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);

import 'dotenv/config';
import express from 'express';
import { VerifyDiscordRequestMiddleware } from './utils.js';
import { COMMAND_NAMES, INTERACTION_TYPE, INTERACTION_RESPONSE_TYPE } from './constants.js';
import RemindCommandHandler from './command-handlers/remind.command-handler.js';

const app = express();
const PORT = process.env.PORT || 3000;
if (+process.env.PRODUCTION) {
    // Parse request body and verifies incoming requests using discord-interactions package
    app.use(express.json({ verify: VerifyDiscordRequestMiddleware(process.env.PUBLIC_KEY) }));
} else {
    console.log('in development env');
    app.use(express.json());
}

app.get('/hi', (req, res) => {
    res.send('hello');
});

app.get('/', (req, res) => {
    res.send(`Hello, World!, ${process.env.APP_ID}`);
});

app.post('/interactions', async function (req, res) {
    let result = {
        type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `Invalid interaction. Please try again.` }
    };

    const interaction = req.body;
    if (!interaction || !interaction.type) {
        console.error('Error: Missing interaction info');
        return res.send(result);
    }
    const { type } = interaction;

    if (type === INTERACTION_TYPE.PING) {
        result = { type: INTERACTION_RESPONSE_TYPE.PONG };
    }

    if (type === INTERACTION_TYPE.APPLICATION_COMMAND) {
        if (!interaction.data || !interaction.data.name || !interaction.member?.user || !interaction.channel_id) {
            console.error('Error: Missing data', interaction);
            return res.send(result);
        }

        const { user } = interaction.member;
        const { data } = interaction;
        const { name } = data;
        if (!data.options) {
            data.options = [];
        }

        //#region REMIND COMMANDS
        if (name === COMMAND_NAMES.REMINDAT) {
            result = RemindCommandHandler.remindAt(data, user, interaction.channel_id);
        }

        if (name === COMMAND_NAMES.REMINDIN) {
            result = RemindCommandHandler.remindIn(data, user, interaction.channel_id);
        }
        //#endregion
    }

    if (type === INTERACTION_TYPE.MESSAGE_COMPONENT) {

    }

    return res.send(result);
});

app.listen(PORT, () => {
    console.log('Listening on port', PORT);
});

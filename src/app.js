import 'dotenv/config';
import { DiscordRequest, createScheduledJob, enumerateStrings, verifyDiscordRequest } from './utils.js';
import { COMMAND_NAMES, INTERACTION_TYPE, INTERACTION_RESPONSE_TYPE } from './constants.js';
import { Router } from 'itty-router';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// todo: move to env or make configurable
const tz = 'Asia/Manila';
dayjs.extend(utc);
dayjs.extend(timezone);
// dayjs.tz.setDefault(tz);

class JsonResponse extends Response {
    constructor(body, init) {
        const jsonBody = JSON.stringify(body);
        init = init || {
            headers: {
                'content-type': 'application/json;charset=UTF-8',
            },
        };
        super(jsonBody, init);
    }
}
const router = Router();

router.get('/', (req, env) => {
    return new Response(`👋 ${env.APP_ID}`);
});

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
router.post('/interactions', async (req, env) => {
    const { isValid, interaction } = await verifyDiscordRequest(req, env.PUBLIC_KEY);
    if (!isValid || !interaction) {
        return new Response('Bad request signature.', { status: 401 });
    }
    // Interaction type and data
    const { type, id, data } = interaction;

    /**
     * Handle verification requests
     */
    if (type === INTERACTION_TYPE.PING) {
        return new JsonResponse({ type: INTERACTION_RESPONSE_TYPE.PONG });
    }

    if (type === INTERACTION_TYPE.APPLICATION_COMMAND) {
        const { name } = data;
        const user = interaction.member.user;
        const userId = user.id;

        if (name === COMMAND_NAMES.REMINDAT) {
            const eventName = data.options.find(opt => opt.name === 'event').value;

            if (!eventName) {
                console.error(`Error: REMINDAT: Created a reminder without a name: ${user.username} ${userId}`, data);
                return new JsonResponse({
                    type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `Sorry, <@${userId}>, but you didn't put a name for the event. Try again.`
                    }
                });
            }

            const now = dayjs();
            // this feels messy; find a better way to do this
            const year = +(data.options.find(opt => opt.name === 'year')?.value) || now.year();
            const month = +(data.options.find(opt => opt.name === 'month')?.value) || now.month();
            const date = +(data.options.find(opt => opt.name === 'day')?.value) || now.date();

            // if empty, send reminder at the start of the day
            const hour = +(data.options.find(opt => opt.name === 'hour')?.value) || 0;
            const minute = +(data.options.find(opt => opt.name === 'minute')?.value) || 0;

            const eventDate = dayjs.tz(`${year}-${month + 1}-${date} ${hour}:${minute}`, tz);
            console.log('eventDate', eventDate.format('MM:DD:YYYY hh:mm A'));
            console.log('eventDate ISO', eventDate.toISOString());
            console.log('eventDate.hour()', eventDate.hour());
            console.log('eventDate.minute()', eventDate.minute());
            if (eventDate.isBefore(now)) {
                console.error(`Error: REMINDAT: Created a reminder for the past: ${user.username} ${userId}`, data);
                return new JsonResponse({
                    type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `Sorry, <@${userId}>, but you can't make a reminder for the past. Try again.`
                    }
                });
            }

            console.log(`cron ${eventDate.minute()} ${eventDate.hour()} ${eventDate.date()} ${eventDate.month() + 1} *`);
            const job = createScheduledJob(`${eventDate.minute()} ${eventDate.hour()} ${eventDate.date()} ${eventDate.month() + 1} *`,
                async function() {
                    console.log(`I am sending a reminder to ${user.username} ${userId} ${eventName} ${eventDate.toISOString()}`);
                    const endpoint = `channels/${interaction.channel_id}/messages`;
                    // send a message to discord
                    await DiscordRequest(endpoint, { method: 'POST',
                        body: {
                            content: `<@${userId}>, here is your reminder for \`${eventName}\` happening on \`${eventDate.format('MM/DD/YYYY')}\`.`
                        }
                    });
                    job.stop();
                    
                }
            );

            console.log(`Successfully created a scheduled job for ${user.username} ${userId} ${eventName} ${eventDate.toISOString()}`);

            try {
                return new JsonResponse({
                    type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `<@${userId}> has set an event: \`${eventName}\` on \`${eventDate.format('MM/DD/YYYY')}\`. I will remind you at \`${eventDate.format('hh:mm A')}\`.`
                    }
                });
            } catch (error) {
                console.error('Error sending message: REMINDAT:', error);
            }
        }

        if (name === COMMAND_NAMES.REMINDIN) {
            const now = dayjs();
            const eventName = data.options.find(opt => opt.name === 'event').value;

            if (!eventName) {
                console.error(`Error: REMINDIN: Created a reminder without a name: ${user.username} ${userId}`, data);
                return new JsonResponse({
                    type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `Sorry, <@${userId}>, but you didn't put a name for the event. Try again.`
                    }
                });
            }
            const minutes = +(data.options.find(opt => opt.name === 'minutes')?.value) || 0;
            const hours = +(data.options.find(opt => opt.name === 'hours')?.value) || 0;
            const days = +(data.options.find(opt => opt.name === 'days')?.value) || 0;

            if (!minutes && !hours && !days) {
                console.error(`Error: REMINDIN: Created a reminder without a time: ${user.username} ${userId}`, data);
                return new JsonResponse({
                    type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `Sorry, <@${userId}>, but you need to add a time for the reminder. Try again.`
                    }
                });
            }

            const eventDate = dayjs().add(days, 'days').add(hours, 'hours').add(minutes, 'minutes');
            const job = createScheduledJob(`${eventDate.minute()} ${eventDate.hour()} ${eventDate.date()} ${eventDate.month() + 1} *`,
                async function() {
                    console.log(`I am sending a reminder to ${user.username} ${userId} ${eventName} ${eventDate.toISOString()}`);
                    const endpoint = `channels/${interaction.channel_id}/messages`;
                    // send a message to discord
                    await DiscordRequest(endpoint, { method: 'POST',
                        body: {
                            content: `<@${userId}>, here is your reminder for \`${eventName}\` happening at \`${eventDate.format('MM/DD/YYYY hh:mm A')}\`.`
                        }
                    });
                    job.stop();
                }
            );

            console.log(`Successfully created a scheduled job for ${user.username} ${userId} ${eventName} ${eventDate.toISOString()}`);

            try {
                return new JsonResponse({
                    type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                    content: `<@${userId}> has set an event: \`${eventName}\` in \`${enumerateStrings(
                        [
                            { amount: days, string: 'day' },
                            { amount: hours, string: 'hour' },
                            { amount: minutes, string: 'minute' },
                        ]
                    )}\`. I will remind you at \`${eventDate.format('MM/DD/YYYY hh:mm A')}\`.`
                    }
                });
            } catch (error) {
                console.error('Error sending message: REMINDAT:', err);
            }
        }
    }

    if (type === INTERACTION_TYPE.MESSAGE_COMPONENT) {

    }
});

export default {
    fetch: (req, env) => router.handle(req, env)
}

import 'dotenv/config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { INTERACTION_RESPONSE_TYPE } from '../constants.js';
import { DiscordRequest, createScheduledJob, enumerateStrings } from '../utils.js';

const tz = process.env.TZ || 'Asia/Manila';
dayjs.extend(utc);
dayjs.extend(timezone);

const RemindController = {
    /**
     * @param {Object} data the interaction data
     * @param {User} user the user that sent the interaction
     * @param {String} channelId the channel id where the interaction was sent
     * @returns content to be replied 
     */
    remindAt: (data, user, channelId) => {
        const eventName = data.options.find(opt => opt.name === 'event')?.value;
        if (!eventName) {
            console.error(`Error: REMINDAT: Created a reminder without a name: ${user.username} ${user.id}`, data);
            return {
                type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content:  `Sorry, <@${user.id}>, but you didn't put a name for the event. Try again.` }
            }
        }
    
        const year = +(data.options.find(opt => opt.name === 'year')?.value);
        const month = +(data.options.find(opt => opt.name === 'month')?.value);
        const date = +(data.options.find(opt => opt.name === 'date')?.value);
        if (!year || (!month && month !== 0) || !date || isNaN(year) || isNaN(month) || isNaN(date)) {
            console.error(`Error: REMINDAT: Created a reminder without a valid date: ${user.username} ${user.id}`, data);
            return {
                type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `Sorry, <@${user.id}>, but you need to add a date for the reminder. Try again.` }
            };
        }
    
        // if empty, send reminder at the start of the day
        const hour = +(data.options.find(opt => opt.name === 'hour')?.value) || 0;
        const minute = +(data.options.find(opt => opt.name === 'minute')?.value) || 0;

        const now = dayjs();
        const eventDate = dayjs(`${year}-${month + 1}-${date} ${hour}:${minute}`).tz(tz);
        if (eventDate.isBefore(now)) {
            console.error(`Error: REMINDAT: Created a reminder for the past: ${user.username} ${user.id}`, data);
            return {
                type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `Sorry, <@${user.id}>, but you can't make a reminder for the past. Try again.` }
            };
        }
    
        const job = createScheduledJob(`${minute} ${hour} ${eventDate.date()} ${eventDate.month() + 1} *`, async function() {
            console.log(`I am sending a reminder to ${user.username} ${user.id} ${eventName} ${eventDate.toISOString()}`);
            const endpoint = `channels/${channelId}/messages`;
            await DiscordRequest(endpoint, { method: 'POST',
                body: { content: `<@${user.id}>, here is your reminder for \`${eventName}\` happening on \`${eventDate.format('MM/DD/YYYY')}\`.` }
            });
            job.stop();
        }, tz);

        console.log(`Successfully created a cron job for ${user.username} ${user.id} ${eventName} ${eventDate.toISOString()}`);
        try {
            return {
                type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `<@${user.id}> has set an event: \`${eventName}\` on \`${eventDate.format('MM/DD/YYYY')}\`. I will remind you at \`${eventDate.format('hh:mm A')}\`.` }
            };
        } catch (error) {
            console.error('Error sending message: REMINDAT:', error);
            return {
                type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `Sorry, <@${user.id}>. An error occurred. Please try again later.` }
            };
        }
    },

    /**
     * 
     * @param {Object} data the interaction data
     * @param {User} user the user that sent the interaction
     * @param {String} channelId the channel id where the interaction was sent
     * @returns content to be replied 
     */
    remindIn: (data, user, channelId) => {
        const eventName = data.options.find(opt => opt.name === 'event')?.value;
        if (!eventName) {
            console.error(`Error: REMINDIN: Created a reminder without a name: ${user.username} ${user.id}`, data);
            return {
                type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `Sorry, <@${user.id}>, but you didn't put a name for the event. Try again.` }
            };
        }
        const minutes = +(data.options.find(opt => opt.name === 'minutes')?.value) || 0;
        const hours = +(data.options.find(opt => opt.name === 'hours')?.value) || 0;
        const days = +(data.options.find(opt => opt.name === 'days')?.value) || 0;

        if (!minutes && !hours && !days) {
            console.error(`Error: REMINDIN: Created a reminder without a time: ${user.username} ${user.id}`, data);
            return {
                type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `Sorry, <@${user.id}>, but you need to add a time for the reminder. Try again.` }
            };
        }

        const eventDate = dayjs().add(days, 'days').add(hours, 'hours').add(minutes, 'minutes').tz(tz);
        const job = createScheduledJob(`${eventDate.minute()} ${eventDate.hour()} ${eventDate.date()} ${eventDate.month() + 1} *`, async function() {
            console.log(`I am sending a reminder to ${user.username} ${user.id} ${eventName} ${eventDate.toISOString()}`);
            const endpoint = `channels/${channelId}/messages`;
            await DiscordRequest(endpoint, { method: 'POST',
                body: { content: `<@${user.id}>, here is your reminder for \`${eventName}\` happening at \`${eventDate.format('MM/DD/YYYY hh:mm A')}\`.` }
            });
            job.stop();
        }, tz);

        console.log(`Successfully created a cron job for ${user.username} ${user.id} ${eventName} ${eventDate.toISOString()}`);
        try {
            return {
                type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `<@${user.id}> has set an event: \`${eventName}\` in \`${enumerateStrings(
                        [
                            { amount: days, string: 'day' },
                            { amount: hours, string: 'hour' },
                            { amount: minutes, string: 'minute' },
                        ]
                    )}\`. I will remind you at \`${eventDate.format('MM/DD/YYYY hh:mm A')}\`.`
                }
            };
        } catch (error) {
            console.error('Error sending message: REMINDAT:', err);
            return {
                type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `Sorry, <@${user.id}>. An error occurred. Please try again later.` }
            };
        }
    }
}

export default RemindController;
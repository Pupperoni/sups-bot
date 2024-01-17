import 'dotenv/config';
import express from 'express';
import { VerifyDiscordRequest, DiscordRequest, createScheduledJob, enumerateStrings } from './utils.js';
import { COMMAND_NAMES, INTERACTION_TYPE, INTERACTION_RESPONSE_TYPE } from './constants.js';
import dayjs from 'dayjs';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === INTERACTION_TYPE.PING) {
    return res.send({ type: INTERACTION_RESPONSE_TYPE.PONG });
  }

  if (type === INTERACTION_TYPE.APPLICATION_COMMAND) {
    const { name } = data;
    const user = req.body.member.user;
    const userId = user.id;

    if (name === COMMAND_NAMES.REMINDAT) {
      const eventName = data.options.find(opt => opt.name === 'event').value;

      if (!eventName) {
        console.error(`Error: REMINDAT: Created a reminder without a name: ${user.username} ${userId}`, data);
        return res.send({
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

      const eventDate = dayjs(`${year}-${month + 1}-${date} ${hour}:${minute}`);
      if (eventDate.isBefore(dayjs())) {
        console.error(`Error: REMINDAT: Created a reminder for the past: ${user.username} ${userId}`, data);
        return res.send({
          type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Sorry, <@${userId}>, but you can't make a reminder for the past. Try again.`
          }
        });
      }

      const job = createScheduledJob(`${minute} ${hour} ${eventDate.date()} ${eventDate.month() + 1} *`,
        async function() {
          console.log(`I am sending a reminder to ${user.username} ${userId} ${eventName} ${eventDate.toISOString()}`);
          const endpoint = `channels/${req.body.channel_id}/messages`;
          // send a message to discord
          await DiscordRequest(endpoint, { method: 'POST',
            body: {
              content: `<@${userId}>, here is your reminder for \`${eventName}\` happening on \`${eventDate.format('MM/DD/YYYY')}\`.`
            }
          });
          job.stop();
        },
        function() {
          console.log(`I have sent the reminder ${user.username} ${userId} ${eventName} ${eventDate.toISOString()}`);
        },
        false
      );

      job.start();
      console.log(`Successfully created a cron job for ${user.username} ${userId} ${eventName} ${eventDate.toISOString()}`);

      try {
        return res.send({
          type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `<@${userId}> has set an event: \`${eventName}\` on \`${eventDate.format('MM/DD/YYYY')}\`. I will remind you at \`${eventDate.format('HH:mm A')}\`.`
          }
        });
      } catch (error) {
        console.error('Error sending message: REMINDAT:', error);
      }
    }

    if (name === COMMAND_NAMES.REMINDIN) {
      const eventName = data.options.find(opt => opt.name === 'event').value;

      if (!eventName) {
        console.error(`Error: REMINDIN: Created a reminder without a name: ${user.username} ${userId}`, data);
        return res.send({
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
        return res.send({
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
          const endpoint = `channels/${req.body.channel_id}/messages`;
          // send a message to discord
          await DiscordRequest(endpoint, { method: 'POST',
            body: {
              content: `<@${userId}>, here is your reminder for \`${eventName}\` happening at \`${eventDate.format('MM/DD/YYYY HH:mm A')}\`.`
            }
          });
          job.stop();
        },
        function() {
          console.log(`I have sent the reminder ${user.username} ${userId} ${eventName} ${eventDate.toISOString()}`);
        },
        false
      );

      job.start();
      console.log(`Successfully created a cron job for ${user.username} ${userId} ${eventName} ${eventDate.toISOString()}`);

      try {
        return res.send({
          type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `<@${userId}> has set an event: \`${eventName}\` in \`${enumerateStrings(
              [
                { amount: days, string: 'day' },
                { amount: hours, string: 'hour' },
                { amount: minutes, string: 'minute' },
              ]
            )}\`. I will remind you at \`${eventDate.format('MM/DD/YYYY HH:mm A')}\`.`
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

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});

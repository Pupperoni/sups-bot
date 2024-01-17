import 'dotenv/config';
import { verifyKey } from 'discord-interactions';
import { CronJob } from 'cron';

export function VerifyDiscordRequestMiddleware(clientKey) {
  return function (req, res, buf, encoding) {
    const signature = req.get('X-Signature-Ed25519');
    const timestamp = req.get('X-Signature-Timestamp');

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send('Bad request signature');
      throw new Error('Bad request signature');
    }
  };
}

export async function verifyDiscordRequest(request, clientKey) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest =
    signature &&
    timestamp &&
    verifyKey(body, signature, timestamp, clientKey);
  if (!isValidRequest) {
    return { isValid: false };
  }

  return { interaction: JSON.parse(body), isValid: true };
}

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'Sups Bot (Discord Bot)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function createScheduledJob(date, task, tz) {
  return new CronJob(date, task, null, true, tz);
}

export function amountAndPluralizedString(amount, string) {
  if (amount === 0) {
    return '';
  }

  if (amount === 1) {
    return `${amount} ${string}`;
  }

  else if (string[string.length - 1] === 's') {
    return `${amount} ${string}es`;
  }

  else {
    return `${amount} ${string}s`;
  }
}

export function enumerateStrings(amountAndStrings) {
  let generatedString = '';
  amountAndStrings.forEach((item) => {
    if (item.amount > 0) {
      generatedString += ', ' + amountAndPluralizedString(item.amount, item.string);
    }
  });

  return generatedString.slice(2, generatedString.length);
}
import { COMMAND_NAMES, APPLICATION_COMMAND_TYPE, APPLICATION_COMMAND_OPTION_TYPE } from './constants.js';

const getMonthChoices = function() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const commandChoices = [];
  for (let i = 0; i < 12; i++) {
    commandChoices.push({
      name: monthNames[i],
      value: i
    });
  }

  return commandChoices;
}

const REMINDAT_COMMAND = {
  type: APPLICATION_COMMAND_TYPE.CHAT_INPUT,
  name: COMMAND_NAMES.REMINDAT,
  description: 'Create a reminder for a specific date and time',
  options: [
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.STRING,
      name: 'event',
      description: 'Name of the event (upto 30 characters)',
      required: true,
      max_length: 30
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.INTEGER,
      name: 'year',
      description: 'Year of the event (YYYY)',
      required: true
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.INTEGER,
      name: 'month',
      description: 'Month of the event (MM)',
      min_value: 0,
      max_value: 11,
      choices: getMonthChoices(),
      required: true
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.INTEGER,
      name: 'date',
      description: 'Date of the event (DD)',
      min_value: 1,
      max_value: 31,
      required: true
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.INTEGER,
      name: 'hour',
      description: 'Hour of the event (HH) (military time format please, which is 0-23)',
      min_value: 0,
      max_value: 23,
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.INTEGER,
      name: 'minute',
      description: 'Minute of the event (mm)',
      min_value: 0,
      max_value: 59,
    },
    // TODO: timezone?
  ]
}

const REMINDIN_COMMAND = {
  type: APPLICATION_COMMAND_TYPE.CHAT_INPUT,
  name: COMMAND_NAMES.REMINDIN,
  description: 'Create a reminder for a later time',
  options: [
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.STRING,
      name: 'event',
      description: 'Name of the event (upto 30 characters)',
      required: true,
      max_length: 30
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.INTEGER,
      name: 'minutes',
      description: 'Amount of minutes to wait for the reminder',
      required: true,
      min_value: 0,
      max_value: 59,
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.INTEGER,
      name: 'hours',
      description: 'Amount of hours to wait for the reminder',
      min_value: 0,
      max_value: 23,
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPE.INTEGER,
      name: 'days',
      description: 'Amount of days to wait for the reminder',
      min_value: 0
    },
  ]
}

export const ALL_COMMANDS = [REMINDAT_COMMAND, REMINDIN_COMMAND];

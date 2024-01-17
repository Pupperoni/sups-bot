# Sups Bot
Personal Discord bot made with Express and discord-interactions

## Available commands

### `/remindat`
#### Create a reminder for a specific date and time

Options:
- `event`: Name of the event (*required*)
- `year`: Year of the event (*required*)
- `month`: Month of the event (*required*)
- `date`: Date of the event (*required*)
- `hour`: Hour of the event in military time format
- `minute`: Minute of the event

   
### `/remindin`
#### Create a reminder for a later time

Options:
- `event`: Name of the event (*required*)
- `minutes`: Amount of minutes to wait for the reminder (*required*)
- `hours`: Amount of minutes to hours for the reminder
- `days`: Amount of minutes to days for the reminder

const config = require('config.json')

const Discord = require('discord.js');

const client = new Discord.Client();
const queue = new Map()


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', msg => {
    if (msg.content === 'ping') {
        msg.channel.send('pong');
    }
});

client.on('message', msg => {
    if (!isCommand(msg)) {
        return undefined;
    }

    const args = msg.content.split(" ");
    handleCommand(args);



})

// param: msg: a message object from discord.js
function isCommand(msg) {
    if (msg.content.startsWith(config.prefix) && !msg.author.bot) {
        return true;
    } else {
        return false;
    }
}

// param: args: a list representing the command and params
// param: msg: the message object
function handleCommand(args, msg) {
    let command = args[0];
    command = command.slice(config.prefix.length);

    if (command === 'play') {
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) {
            return msg.channel.send('You need to be in a voice channel.');
        }
    } else if (command === 'skip') {
        // TODO
    } else if (command === 'stop') {
        // TODO
    } else if (command === 'volume') {
        // TODO
    } else if (command === 'np') {
        // TODO
    } else if (command === 'queue') {
        // TODO
    } else if (command === 'pause') {

    } else if (command === 'resume') {

    }

    return undefined
}

function play(guild, song) {
    // TODO
}

client.login(config.token)

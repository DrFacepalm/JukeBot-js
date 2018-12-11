// Heavily drafted off Dev-Yukine's Music-bot
// This work is mainly an attempt of learning
const Util = require('util');
const config = require('./config.json');
const Discord = require('discord.js');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const client = new Discord.Client();
const youtube = new YouTube(config.youtubeAPI)
const queue = new Map()


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', msg => {
    if (!isCommand(msg)) {
        return undefined;
    }

    const args = msg.content.split(" ");
    handleCommand(args, msg);
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
async function handleCommand(args, msg) {
    let command = args[0];
    command = command.slice(config.prefix.length);

    const url = args[1]

    if (command === 'play') {
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) {
            return msg.channel.send('You need to be in a voice channel.');
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT')) {
            return msg.channel.send("Cannot connect to vc");
        }
        if (!permissions.has('SPEAK')) {
            return msg.channel.send("cannot speak in vc");
        }
        if (0) { // Playlist
            // TODO: Handle Playlist URLS
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {

                try {
                    console.log("did not recognise url, searching for results");
                    var videoInfo = await youtube.searchVideos(args[1], 1)[0];
                    video = await youtube.getVideoByID(videoInfo.id)
                } catch (err) {
                    console.error(err);
                    return msg.channel.send("No results")
                }
            }
            return handleVideo(video, msg, voiceChannel)
        }
    } else if (command === 'skip') {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel');
        if (!queue.get(msg.guild.id)) return msg.channel.send("Nothing to skip");
        queue.get(msg.guild.id).connection.dispatcher.end("Song skip.");
        return undefined;
    } else if (command === 'disconnect') {
        if (!msg.member.voiceChannel) return msg.channel.send("You are not in a voice channel");
        if (!queue.get(msg.guild.id)) return msg.channel.send("I am not connected to a vc");
        serverQueue.connection.disconnect();
        return undefined;
    } else if (command === 'volume') {
        if (!msg.member.voiceChannel) return msg.channel.send("You are not in a voice channel");
        if (!queue.get(msg.guild.id)) return msg.channel.send("I'm not connected");
        if (!queue.get(msg.guild.id).playing) return msg.channel.send("It's paused, cant change volume. ask for this to be changed");
        if (!args[1]) return msg.channel.send("Current volume is whatever.. fix this");
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send(`Volume set to ${args[1]}`);
    } else if (command === 'np') {
        if (!serverQueue) return msg.channel.send("Nothing is playing");
        return msg.channel.send(`Now Playing: ${queue.get(msg.guild.id).songs[0].title}`);
    } else if (command === 'pause') {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel');
        if (!queue.get(msg.guild.id)) return msg.channel.send("Bot it not connected to anything");
        if (!queue.get(msg.guild.id).playing) return msg.channel.send("Bot is not playing right now");
        queue.get(msg.guild.id).connection.dispatcher.pause();
        queue.get(msg.guild.id).playing = false;
    } else if (command === 'resume') {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel');
        if (!queue.get(msg.guild.id)) return msg.channel.send("Nothing to skip");
        if (queue.get(msg.guild.id).playing) return msg.channel.send("Bot already playing");
        queue.get(msg.guild.id).connection.dispatcher.resume();
        queue.get(msg.guild.id).playing = true;
    } else if (command === 'ping'){
        msg.channel.send("pong");
    }

    return undefined
}

// Logic to handle gathering information for the video and sending it to the
// play function
async function handleVideo(video, msg, voiceChannel) {
    // serverQueue refers to a song queue within each server. a 'player'
    const serverQueue = queue.get(msg.guild.id);
    //console.log(video);
    const song = {
        id: video.id,
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    console.log(song.title)

    // if the guild has not already set up a queue, add a queue.
    if(!serverQueue) {

        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try {
            queueConstruct.connection = await voiceChannel.join();
            queueConstruct.connection.on('disconnect', () => {
                    queue.delete(guild.id);
                })
            play(msg.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`I could not join the voice channel: ${error}`);
            queue.delete(msg.guild.id);
            return msg.channel.send(`I could not join the voice channel: ${error}`);
        }
    // If guild already has a queue setup
    } else {
        // add song to queue
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return msg.channel.send(`${song.title} has been added to queue`);
    }
    return undefined;

}

// Stream the song in the voice channel
function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        console.log("out of songs... probably");
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', reason => {
            if (reason === 'Stream is not generating quickly enough.') {
                console.log('Song Ended');
            } else {
                console.log(reason);
            }
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`Start Playing: ${song.title}`);
}

client.login(config.token)

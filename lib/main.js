'use strict';
/**
 * @module Hackmud-ChatApi
 */

const EventEmitter = require("events"),
https = require("https"),
{request: hRequest} = require("@fayti1703/async-utils");

let cfg = {
	HACKMUD_ADDRESS: "www.hackmud.com",
	REQUIRE_TLS_SECURE: true
};



class User extends EventEmitter {
	constructor(account, username) {
		this.account = account;
		this.username = username;
		this.account.on('message', (user, chat) => {
			if(user === this.username)
				this.emit('message', chat)
		})
//		Object.freeze(this);
	}

	getHistory(before=null) {
		return this.account.getHistory(this.username, before)
	}

	send(channel, message) {
		return this.account.send(this.username, channel, message)
	}

	tell(to, message) {
		return this.account.tell(this.username, to, message)
	}
}


async function request(agent, endpoint, data={}) {
	let reply = await hRequest(
		{
			method: "POST",
			host: cfg.HACKMUD_ADDRESS,
			agent: agent,
			headers: {
				"Content-Type": "application/json"
			},
			path: `/mobile/${endpoint}.json`,
			rejectUnauthorized: cfg.REQUIRE_TLS_SECURE
		},
		JSON.stringify(data));
	if(reply.code >= 300) {
		let err =  new Error(reply.message);
		err.name = "ChatError";
		err.code = reply.code;
		err.data = reply.data;
		throw err;
	}
	return reply;
}


class Account extends EventEmitter {

	constructor(token, tick_rate=1000) {
		super();
		this.token = token;
		this.agent = new https.Agent({keepAlive: true});
		this.tick_rate = tick_rate;
		this.last_tick = Date.now();
		this.users = [];
		this.userData = {};
		if(this.tick_rate < Infinity)
			this.tickTimeout = setTimeout(() => this.tick(), 1);
//		Object.freeze(this);
	}

	async request(endpoint, data={}) {
		return JSON.parse((await request(this.agent, endpoint, Object.assign(data, {chat_token: this.token}))).data);
	}

	destroy() {
		this.agent.destroy();
		clearTimeout(this.tickTimeout);
		this.tick_rate = Infinity;
	}

	getUser(username) {
		if(!this.users.contains(username)) return null;
		return new User(this, username)
	}

	async fetchUsers() {
		let reply = await this.request("account_data");
		if(!reply.ok) {
			let err = new Error("Could not get account data.");
			err.name = "ChatError";
			err.code = "AccountNotOk";
			throw err;
		}
		delete reply.ok;
		this.userData = reply.users;
		this.users = [];
		for(const name in reply.users) {
			this.users.push(name);
		}
		return this.users;
	}


	async tick() {
		try {
			if(this.tickTimeout)
				clearTimeout(this.tickTimeout);
			await (async () => {
				let reply;
				try {
					reply = await this.request("chats", {usernames: this.users, after: this.last_tick / 1000});
				} catch(e) {
					if(e.code === 403)
						this.fetchUsers()
					else
						console.error(e)
					return
				}
				this.last_tick = Date.now();
				for(const name in reply.chats) {
					for(const chat of reply.chats[name]) {
						this.emit("message", name, new Message(this, chat))
					}
				}
			})()
			if(this.tick_rate < Infinity) {
				this.tickTimeout = setTimeout(() => this.tick(), this.tick_rate);
			}
		} catch(e) {
			this.emit(e);
		}
	}

	getHistory(usernames=null, before=null) {
		if(typeof usernames === "string") usernames = [usernames]
		else if(!usernames) usernames = this.users

		if(!before) before=Date.now();

		return this.request("chats", {usernames: this.users, before: before / 1000});
	}

	async send(sender, channel, message) {
		return (await this.request("create_chat", {username: sender, channel: channel, msg: message})).ok;
	}

	async tell(sender, to, message) {
		return (await this.request("create_chat", {username: sender, tell: to, msg: message})).ok;
	}

}

Account.getToken = async function getToken(pass) {
	return JSON.parse((await request(null, "get_token", {pass: pass})).data)
}

class Message {
	constructor(account, data) {
		console.log(data);
		if(data.to_user) {
			this.to = data.to_user
			this.channel = null;
		} else {
			this.to = null;
			this.channel = data.channel
		}
		this.time = Math.floor(data.t * 1000);
		this.sender = data.from_user;
		this.content = data.msg;
		this.from_me = account.users.includes(data.sender);
		this.type = data.is_join ? "join" : data.is_leave ? "leave" : null;
	}
}

module.exports = {
	cfg,
	Account
}

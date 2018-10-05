'use strict';

const EventEmitter = require("events"),
https = require("https"),
{request: hRequest} = require("@fayti1703/async-utils");

let cfg;

module.exports = cfg = {
	HACKMUD_ADDRESS: "165.227.249.235", // change to "www.hackmud.com" on release
	REQUIRE_TLS_SECURE: false // change to true on release
}

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
			this.tickTimeout = setTimeout(() => this.tick(), 1)
//		Object.freeze(this);
	}
	async request(endpoint, data={}) {
		return JSON.parse((await request(this.agent, endpoint, Object.assign(data, {chat_token: this.token}))).data);
	}

	destroy() {
		this.agent.destroy();
		clearTimeout(this.tickTimeout);
	}

	getUser(username) {
		if(!this.users.contains(username)) return null;
		return new APIUser(this, username)
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
		for(const name in reply.users) {
			this.users.push(name);
		}
		return this.users;
	}


	async tick() {
		await (async () => {
			let reply;
			try {
				reply = await this.request("chats", {usernames: this.users, after: this.last_tick / 1000 - 1});
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
				this.emit("message", name, chat)
				}
			}
		})()
		if(this.tick_rate < Infinity)
			setTimeout(() => this.tick(), this.tick_rate);

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

module.exports.Account = Account;

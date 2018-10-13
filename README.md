# Hackmud-ChatAPI

### Class: Account

##### new Account(token, [tick_rate])
* `token` [<string\>][string]
* `tick_rate` [<integer\>][number] **Default**: `1000`

Creates a new account associated with the token specified `token`. For more information about `tick_rate`, see [`account.tick_rate`](#accounttick_rate)

#### Account.getToken(pass)
* `pass` [<string\>][string] The password, as returned from `chat_pass` ingame.
* Returns: [<Promise][Promise][<string\>][string][\>][Promise]

Fetches a new chat token from the specified pass.

##### Event: 'message'
* `user` [<string\>][string] The user on which received this message
* `message` [<Message\>](#class-message) The message itself

Fired whenever a message is received on this account.

#### account.destroy()

Destroys this account. This calls `destroy` on the [`agent`][https.Agent] and stops the tick mechanism.<br>
**You must call this function before exiting**. Otherwise, the tick mechanism will always keep the event loop busy, and the node process will never exit.

#### account.fetchUsers()
* Returns: [<Promise][Promise][<string[]\>][string][\>][Promise]

Fetch the userdata for this account. The data will be stored in [`account.userData`](#accountuserdata), the usernames in [`account.users`](#accountusers). The Promise resolves to the new value of `account.users`.

#### account.getHistory([usernames][, before])
* `usernames` [<string[]\>][string] The usernames to return history for. **Default**: [`account.users`](#accountusers)
* `before` [<Date\>][Date] The latest point in time for which a message may be returned. **Default**: [`Date.now()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now)
* Returns: [<Promise][Promise][<Object[]\>][Object][\>][Promise]

Get the chat history of this account.

#### account.getUser(username)
* `username` [<string\>][string] The name of the user to return
* Returns: [<User\>](#class-user) | [<null\>][null]

Get a specific user. If the user does not exist on this account, this method returns `null`.<br>
*Note*: This function performs no update checks and works solely off of the value of [`account.users`](#accountusers). It is thus recommended to call [`account.fetchUsers()`](#accountfetchusers-) before calling this method.

#### account.request(endpoint[, data])
* `endpoint` [<string\>][string] The server endpoint to send the request to.
* `data` [<Object\>][Object] The data to include in the request. **Default**: `{}`
* Returns: [<Promise][Promise][<Object\>][Object][\>][Promise]

Send a request on behalf of this account. The account's agent and token will be automatically used/added for/to the request. The Promise returned resolves with the body of the reply.

#### account.send(sender, channel, message)
* `sender` [<string\>][string] The user to send the message from
* `channel` [<string\>][string] The channel to send the message to
* `message` [<string\>][string] The message content
* Returns: [<Promise][Promise][<boolean\>][bool][\>][Promise] The value of `ok` in the reply

Send a message to a channel. Acts like `chats.send` ingame. The message may be looped back in a [`message`] event(#eventmessage).

#### account.tell(sender, to, message)
* `sender` [<string\>][string] The user to send the tell from
* `to` [<string\>][string] the user to send the tell to.
* `message` [<string\>][string] The message content
* Returns: [<Promise][Promise][<boolean\>][bool][\>][Promise] The value of `ok` in the reply

Send a tell to a user. Acts like `chats.tell` ingame. The message may be looped back in a [`message` event](#eventmessage).

#### account.tick()
Perform a tick for this account. User code should rarely, if ever, call this function.<br>
The new tick is scheduled *after* this method completes.


#### account.agent
* [<https.Agent\>][https.Agent]

The agent this account uses for outgoing requests. This agent is created with `{keepAlive: true}`.

#### account.last_tick
* [<integer\>][number]

The last time a tick completed, but before the respective events are fired.

#### account.tickTimeout
* [<Timeout\>](https://nodejs.org/api/timers.html#timers_class_timeout) | [<null\>][null]

The timeout of the next tick. May be stale (used up) or `null` if [`tick_rate`](#accounttick_rate) is `Infinity`.

#### account.tick_rate
* [<integer\>][number]

The amount of milliseconds delay between ticks. Should be above 800 and never below 700 (unless you enjoy getting errors about polling too fast). Takes effect on the next tick.

#### account.token
* [<string\>][string]

The token for this account.

#### account.userData
* [<Object[]\>][Object]

The user data for this account. Filled by [`account.fetchUsers`](#accountfetchusers).

#### account.users
* [<string[]\>][string]

The usernames for this account. Filled by [`account.fetchUsers`](#accountfetchusers).


### Class: User

##### Event: 'message'
* `message` [<Message\>](#class-message) The message itself

Fired whenever a message is received for this user.

#### user.getHistory([before])
* `before` [<Date\>][Date] The latest point in time for which a message may be returned. **Default**: [`Date.now()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now)
* Returns: [<Promise][Promise][<Object[]\>][Object][\>][Promise]

Get the chat history of this user.

#### user.send(channel, message)
* `channel` [<string\>][string] The channel to send the message to
* `message` [<string\>][string] The message content
* Returns: [<Promise][Promise][<boolean\>][bool][\>][Promise] The value of `ok` in the reply

Send a message to a channel. Acts like `chats.send` ingame. The message may be looped back in a [`message`](#event-message)  event.

#### user.tell(to, message)
* `to` [<string\>][string] the user to send the tell to.
* `message` [<string\>][string] The message content
* Returns: [<Promise][Promise][<boolean\>][bool][\>][Promise] The value of `ok` in the reply

Send a tell to a user. Acts like `chats.tell` ingame. The message may be looped back in a [`message`](#event-message) event.

#### user.account
* [<Account\>](#class-account)

The account this user is associated with.

#### user.username
* [<string\>][string]

The name of this user.

### Class: Message
Represents a message received from the server.

#### message.channel
* [<string\>][string] | [<null\>][null]

If this message was received from a channel, the channel name. Otherwise, `null`.

#### message.content
* [<string\>][string]

The content of this message.

#### message.from_me
* [<boolean\>][bool]

Whether this message was sent from a user associated with this account. This indicates a possible loopback message or you sending messages ingame.

#### message.sender
* [<string\>][string]

The name of the user who sent this message.

#### message.to
* [<string\>][string] | [<null\>][null]

If this is a tell, the name of the user to which this tell was sent. Otherwise, `null`.

#### message.type
* [<string\>][string] | [<null\>][null]

The "special type" of this message, if any. Currently, there are only two types: `"join"` for channel join messages and `"leave"` for channel leave messages.

### cfg
* [<Object\>][Object]

An object used for various configuration.
Contains the following properties:

#### cfg.HACKMUD_ADDRESS
* [<string\>][string] **Default**: `"www.hackmud.com"`

The address of the server this wrapper talks to. Only change if you know what you are doing.

#### cfg.REQUIRE_TLS_SECURE
* [<boolean\>][bool] **Default**: `true`

Whether to require a secure TLS connection while talking to the server. Only set to `false` if you know what you are doing.

[null]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Null_type
[bool]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[Date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[https.Agent]: https://nodejs.org/api/https.html#https_class_https_agent

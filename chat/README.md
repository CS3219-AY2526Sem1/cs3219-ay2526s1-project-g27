
# Introduction and  Attribution
- Simple backend for yjs, referenced from the [y-websocket github repo](https://github.com/yjs/y-websocket).


## Websocket Messaging

**YJS Events**

Default YJS event are retained and can be referenced from the [y-websocket github repo](https://github.com/yjs/y-websocket).

**Custom Message Schema**

All chat data is synchronized through a Yjs shared array called messages.
Each message in that array follows the structure below.

Schema Definition
```ts
interface ChatMessage {
  userId: string;       // Unique identifier of the sender
  displayName: string;  // Display name shown in the chat bubble
  text: string;         // Message content
}
```

Example Payload
```json
{
  "userId": "b912df",
  "displayName": "Alice",
  "text": "Hey, ready to start?"
}
```

## License

[The MIT License](./LICENSE) © Kevin Jahns

### AI disclosure
AI was used to generate the messaging documentation above. 
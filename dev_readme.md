
Pinecone is used here as the project memory layer. It stores vector embeddings of companion knowledge so chats can fetch semantically relevant context instead of relying only on the latest messages.

How it is used in this project:
- Upstash keeps recent chat history.
- OpenAI creates embeddings.
- Pinecone stores and searches those embeddings.
- On each chat request, the app pulls similar context from Pinecone and sends it with the recent history to the model.

With the modern Pinecone SDK in this project, `PINECONE_HOST` should contain your index HOST URL,
for example `https://your-index-xxxx.svc.your-project-id.pinecone.io`.


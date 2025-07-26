import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const url = new URL(request.url);
  const lastMessageId = parseInt(url.searchParams.get("lastId") || "0");

  try {
    // Clean up old messages (keep only last 100)
    await sql`
      DELETE FROM chat_messages 
      WHERE id NOT IN (
        SELECT id FROM chat_messages 
        ORDER BY created_at DESC 
        LIMIT 100
      )
    `;

    // Clean up inactive users (not seen in last 30 seconds)
    await sql`
      DELETE FROM chat_users 
      WHERE last_seen < NOW() - INTERVAL '30 seconds'
    `;

    // Get new messages after lastMessageId
    const newMessages = await sql`
      SELECT message_id, type, nickname, message, file_url, file_name, file_type, 
             EXTRACT(EPOCH FROM timestamp) * 1000 as timestamp
      FROM chat_messages 
      WHERE message_id > ${lastMessageId}
      ORDER BY created_at ASC
    `;

    // Get active user count
    const userCountResult = await sql`
      SELECT COUNT(*) as count FROM chat_users
    `;

    const userCount = parseInt(userCountResult[0].count);

    // Transform messages to match frontend format
    const messages = newMessages.map((msg) => ({
      id: msg.message_id,
      type: msg.type,
      nickname: msg.nickname,
      message: msg.message,
      fileUrl: msg.file_url,
      fileName: msg.file_name,
      fileType: msg.file_type,
      timestamp: new Date(msg.timestamp).toISOString(),
    }));

    return Response.json({
      messages,
      userCount,
    });
  } catch (error) {
    console.error("Error in GET /api/chat:", error);
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, nickname, message, fileUrl, fileName, fileType } = body;

    if (type === "join") {
      // Add/update user as active
      await sql`
        INSERT INTO chat_users (nickname, last_seen) 
        VALUES (${nickname}, NOW())
        ON CONFLICT (nickname) 
        DO UPDATE SET last_seen = NOW()
      `;

      // Add join message
      const messageId = Date.now() + Math.random();
      await sql`
        INSERT INTO chat_messages (message_id, type, message, timestamp)
        VALUES (${messageId}, 'system', ${`${nickname} joined the chat`}, NOW())
      `;

      return Response.json({ success: true });
    }

    if (type === "leave") {
      // Remove user
      await sql`
        DELETE FROM chat_users WHERE nickname = ${nickname}
      `;

      // Add leave message
      const messageId = Date.now() + Math.random();
      await sql`
        INSERT INTO chat_messages (message_id, type, message, timestamp)
        VALUES (${messageId}, 'system', ${`${nickname} left the chat`}, NOW())
      `;

      return Response.json({ success: true });
    }

    if (type === "message") {
      // Update user activity
      await sql`
        INSERT INTO chat_users (nickname, last_seen) 
        VALUES (${nickname}, NOW())
        ON CONFLICT (nickname) 
        DO UPDATE SET last_seen = NOW()
      `;

      // Add user message
      const messageId = Date.now() + Math.random();
      await sql`
        INSERT INTO chat_messages (message_id, type, nickname, message, file_url, file_name, file_type, timestamp)
        VALUES (${messageId}, 'user', ${nickname}, ${message || null}, ${fileUrl || null}, ${fileName || null}, ${fileType || null}, NOW())
      `;

      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

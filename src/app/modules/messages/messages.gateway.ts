import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({ namespace: '/messages', cors: { origin: true, credentials: true } })
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  constructor(private readonly service: MessagesService) {}
  async handleConnection(client: Socket) { try { const token = String(client.handshake.auth?.token || ''); const user = this.service.verifySocketToken(token); client.data.userId = user.id; client.join(`user:${user.id}`); const conversations = await this.service.list(user); await Promise.all(conversations.map((conversation) => client.join(`conversation:${conversation.id}`))); } catch { client.disconnect(true); } }
  @SubscribeMessage('conversation:join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: string }) { try { await this.service.canAccess(payload.conversationId, client.data.userId); await client.join(`conversation:${payload.conversationId}`); return { ok: true }; } catch { throw new WsException('Conversation access denied'); } }
  @SubscribeMessage('message:send')
  async send(@ConnectedSocket() client: Socket, @MessageBody() payload: SendMessageDto & { conversationId: string }) { try { const message = await this.service.send(payload.conversationId, payload, client.data.userId); const event = { conversationId: payload.conversationId, message }; this.server.to(`conversation:${payload.conversationId}`).emit('message:new', event); for (const userId of await this.service.participantUserIds(payload.conversationId)) this.server.to(`user:${userId}`).emit('message:new', event); return message; } catch (error) { throw new WsException(error instanceof Error ? error.message : 'Unable to send message'); } }
}

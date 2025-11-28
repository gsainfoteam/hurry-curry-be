import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GatewayResponseDto } from './dto/gateway-response.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // frontend URL
  },
  namespace: 'orders',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const userPayload = await this.authenticateSocket(client);

      const roomName = `user-${userPayload.uuid}`;
      await client.join(roomName);

      client.data.user = userPayload;

      this.logger.log(
        `Client connected: ${client.id} | User: ${userPayload.email} | Room: ${roomName}`,
      );
    } catch (error) {
      this.handleConnectionError(client, error);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  notifyUser(userId: string, event: string, payload: GatewayResponseDto) {
    const roomName = `user-${userId}`;

    this.server.to(roomName).emit(event, payload);

    this.logger.log(
      `Notification sent to ${roomName} | Event: ${event} | Order: ${payload.orderId}`,
    );
  }

  private async authenticateSocket(
    client: Socket,
  ): Promise<{ uuid: string; email: string }> {
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('No authentication token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      return payload;
    } catch (error) {
      throw new WsException('Invalid or expired token');
    }
  }

  private extractToken(client: Socket): string | undefined {
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }

    return undefined;
  }

  private handleConnectionError(client: Socket, error: Error): void {
    this.logger.warn(`Connection rejected for ${client.id}: ${error.message}`);
    client.emit('exception', { status: 'error', message: error.message });
    client.disconnect();
  }
}

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
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new WsException('JWT_SECRET is not configured');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
      });

      if (!payload.uuid || !payload.email) {
        throw new WsException('Token payload missing required fields');
      }

      return payload;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException('Invalid or expired token');
    }
  }

  private extractToken(client: Socket): string | undefined {
    if (
      client.handshake.auth?.token &&
      typeof client.handshake.auth.token === 'string'
    ) {
      return client.handshake.auth.token;
    }

    const authHeader = client.handshake.headers.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    return undefined;
  }

  private handleConnectionError(client: Socket, error: Error): void {
    this.logger.warn(`Connection rejected for ${client.id}: ${error.message}`);
    client.emit('exception', { status: 'error', message: error.message });
    client.disconnect();
  }
}

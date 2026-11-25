// src/services/socket.service.ts
import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { tokenService } from './token.service';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { IUser } from '../models/User';
import logger from '../utils/logger';
import { env } from '../config/env';

interface SocketWithUser extends Socket {
  user?: IUser;
  conversationId?: string; // Track which conversation the socket is in
}

export class SocketService {
  private io: SocketServer;
  private connectedSockets: Map<string, { userId: string, email: string, conversationId?: string }> = new Map();

  constructor(server: HttpServer) {
    console.log('🔧 =========================================');
    console.log('🔧 Initializing Socket.IO service...');
    console.log('🔧 =========================================');
    
    this.io = new SocketServer(server, {
      cors: {
        origin: env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('✅ Socket.IO service initialized successfully');
    console.log(`📡 CORS origins: ${env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:8080'}`);
    console.log('🔧 =========================================\n');
    logger.info('Socket.IO service initialized');
  }

  private async authenticateSocket(socket: SocketWithUser, next: (err?: Error) => void): Promise<void> {
    console.log(`\n🔐 =========================================`);
    console.log(`🔐 Authenticating socket connection: ${socket.id}`);
    console.log(`🔐 =========================================`);
    
    try {
      // Log all available authentication sources
      console.log(`📋 Authentication sources available:`);
      console.log(`   - auth.token: ${socket.handshake.auth?.token ? '✅ Present' : '❌ Missing'}`);
      console.log(`   - Authorization header: ${socket.handshake.headers.authorization ? '✅ Present' : '❌ Missing'}`);
      console.log(`   - query.token: ${socket.handshake.query?.token ? '✅ Present' : '❌ Missing'}`);
      console.log(`   - cookie header: ${socket.handshake.headers.cookie ? '✅ Present' : '❌ Missing'}`);
      
      // Get the raw cookie header
      const cookieHeader = socket.handshake.headers.cookie;
      console.log(`🍪 Cookie header: ${cookieHeader ? cookieHeader.substring(0, 50) + '...' : 'None'}`);
      
      let token: string | undefined = undefined;
      let tokenSource = '';

      // 1. Try to get token from auth object (recommended)
      if (socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
        tokenSource = 'auth object';
        console.log(`✅ Token found in auth object`);
      }
      
      // 2. Try to get token from authorization header
      if (!token && socket.handshake.headers.authorization) {
        token = socket.handshake.headers.authorization.replace('Bearer ', '');
        tokenSource = 'authorization header';
        console.log(`✅ Token found in authorization header`);
      }
      
      // 3. Try to get token from query parameter
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token as string;
        tokenSource = 'query parameter';
        console.log(`✅ Token found in query parameter`);
      }
      
      // 4. Try to get token from cookies
      if (!token && cookieHeader) {
        console.log(`🍪 Attempting to extract token from cookies...`);
        token = this.extractTokenFromCookie(cookieHeader);
        if (token) {
          tokenSource = 'cookie';
          console.log(`✅ Token extracted from cookie successfully`);
        } else {
          console.log(`⚠️ No auth_token found in cookies`);
        }
      }

      console.log(`\n📝 Token status: ${token ? '✅ Received' : '❌ Not Received'}`);
      if (token) {
        console.log(`   Source: ${tokenSource}`);
        console.log(`   Length: ${token.length} characters`);
        console.log(`   Preview: ${token.substring(0, 20)}...`);
      }

      if (!token) {
        console.log(`\n❌ No token provided in socket handshake`);
        console.log(`🔧 Please ensure the frontend sends the token in one of these ways:`);
        console.log(`   1. auth: { token: 'YOUR_JWT_TOKEN' }`);
        console.log(`   2. headers: { Authorization: 'Bearer YOUR_JWT_TOKEN' }`);
        console.log(`   3. query: { token: 'YOUR_JWT_TOKEN' }`);
        console.log(`   4. Cookie: auth_token=YOUR_JWT_TOKEN`);
        console.log(`🔐 =========================================\n`);
        return next(new Error('Authentication required'));
      }

      console.log(`\n🔑 Verifying token...`);
      const decoded = tokenService.verifyToken(token);
      
      if (!decoded) {
        console.log(`❌ Invalid or expired token`);
        console.log(`🔐 =========================================\n`);
        return next(new Error('Invalid or expired token'));
      }
      
      console.log(`✅ Token decoded successfully`);
      console.log(`   User ID: ${decoded.id}`);
      console.log(`   Email: ${decoded.email}`);
      console.log(`   Role: ${decoded.role}`);

      console.log(`\n👤 Looking for user in database: ${decoded.id}`);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log(`❌ User not found in database: ${decoded.id}`);
        console.log(`🔐 =========================================\n`);
        return next(new Error('User not found'));
      }

      console.log(`✅ User found and authenticated`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user._id}`);
      
      socket.user = user;
      
      // Store in connected sockets map
      this.connectedSockets.set(socket.id, {
        userId: user._id.toString(),
        email: user.email,
      });
      
      console.log(`📊 Total connected sockets: ${this.connectedSockets.size}`);
      console.log(`🔐 =========================================\n`);
      next();
    } catch (error) {
      console.error(`\n❌ Socket authentication error:`, error);
      console.log(`🔐 =========================================\n`);
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Extract token from cookie header
   */
  private extractTokenFromCookie(cookieHeader: string): string | undefined {
    try {
      console.log(`🍪 Parsing cookies...`);
      // Parse cookies from the header string
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);

      console.log(`🍪 Parsed cookie keys:`, Object.keys(cookies));

      // Try to get auth_token
      let token = cookies['auth_token'];
      
      if (token) {
        console.log(`✅ Found auth_token in cookies`);
        return token;
      }
      
      console.log(`⚠️ No auth_token found in cookies`);
      return undefined;
    } catch (error) {
      console.error('❌ Error extracting token from cookie:', error);
      return undefined;
    }
  }

  private handleConnection(socket: SocketWithUser): void {
    console.log(`\n🔌 =========================================`);
    console.log(`🔌 New socket connection established: ${socket.id}`);
    console.log(`🔌 =========================================`);
    
    const userInfo = socket.user ? `${socket.user.email} (${socket.user._id})` : 'Unknown';
    console.log(`👤 User connected: ${userInfo}`);
    console.log(`📡 Transport: ${socket.conn.transport.name}`);
    console.log(`📡 Address: ${socket.handshake.address}`);
    console.log(`📊 Total connected clients: ${this.connectedSockets.size}`);
    
    logger.info(`User connected: ${socket.user?._id}`);

    // Log connection details for debugging
    console.log(`\n📡 Connection details:`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Connected: ${socket.connected}`);
    console.log(`   Transport: ${socket.conn.transport.name}`);
    console.log(`   Address: ${socket.handshake.address}`);
    console.log(`   Headers:`, socket.handshake.headers);
    console.log(`   Query:`, socket.handshake.query);
    console.log(`   Auth present: ${!!socket.handshake.auth}`);
    console.log(`   Cookies present: ${!!socket.handshake.headers.cookie}`);

    // Update socket with conversation tracking
    socket.conversationId = undefined;

    // Connection event listeners
    socket.on('conversation:join', async (data: { conversationId: string }) => {
      console.log(`\n📥 =========================================`);
      console.log(`📥 Received conversation:join event`);
      console.log(`📥 =========================================`);
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   User: ${socket.user?.email || 'Unknown'}`);
      console.log(`   Data:`, data);
      await this.handleJoinConversation(socket, data.conversationId);
    });

    socket.on('message:send', async (data: { conversationId: string; message: string }) => {
      console.log(`\n📥 =========================================`);
      console.log(`📥 Received message:send event`);
      console.log(`📥 =========================================`);
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   User: ${socket.user?.email || 'Unknown'}`);
      console.log(`   Data:`, data);
      await this.handleSendMessage(socket, data);
    });

    socket.on('disconnect', (reason) => {
      console.log(`\n🔌 =========================================`);
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      console.log(`🔌 =========================================`);
      console.log(`   User: ${socket.user?.email || 'Unknown'}`);
      console.log(`   Reason: ${reason}`);
      console.log(`   Previously in conversation: ${socket.conversationId || 'None'}`);
      
      // Remove from connected sockets map
      this.connectedSockets.delete(socket.id);
      console.log(`📊 Total connected clients: ${this.connectedSockets.size}`);
      
      logger.info(`User disconnected: ${socket.user?._id}`);
    });

    socket.on('error', (error) => {
      console.error(`\n❌ Socket error for ${socket.id}:`, error);
      console.log(`   User: ${socket.user?.email || 'Unknown'}`);
      console.log(`   Conversation: ${socket.conversationId || 'None'}`);
    });

    socket.on('connect_error', (error) => {
      console.error(`\n❌ Connection error for ${socket.id}:`, error);
      console.log(`   User: ${socket.user?.email || 'Unknown'}`);
    });

    // Emit connection success
    console.log(`\n📤 Emitting connection:success to ${socket.id}`);
    socket.emit('connection:success', {
      message: 'Connected successfully',
      userId: socket.user?._id,
      email: socket.user?.email,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Connection handler completed for ${socket.id}`);
    console.log(`🔌 =========================================\n`);
  }

  private async handleJoinConversation(socket: SocketWithUser, conversationId: string): Promise<void> {
    console.log(`\n🏠 =========================================`);
    console.log(`🏠 Handling join conversation request`);
    console.log(`🏠 =========================================`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   User: ${socket.user?.email || 'Unknown'} (${socket.user?._id || 'Unknown'})`);
    console.log(`   Conversation ID: ${conversationId}`);

    try {
      if (!socket.user) {
        console.log(`❌ No user found on socket`);
        socket.emit('error', { message: 'Authentication required' });
        console.log(`🏠 =========================================\n`);
        return;
      }

      console.log(`🔍 Finding conversation in database: ${conversationId}`);
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        console.log(`❌ Conversation not found: ${conversationId}`);
        socket.emit('error', { message: 'Conversation not found' });
        console.log(`🏠 =========================================\n`);
        return;
      }

      console.log(`✅ Conversation found:`);
      console.log(`   ID: ${conversation._id}`);
      console.log(`   Type: ${conversation.type}`);
      console.log(`   Participants: ${conversation.participants.length}`);
      console.log(`   Participants IDs:`, conversation.participants);

      // Check if user is a participant or admin
      const isParticipant = conversation.participants.some(
        (p) => p.toString() === socket.user!._id.toString()
      );
      const isAdmin = socket.user.role === 'admin';

      console.log(`\n🔐 Access check:`);
      console.log(`   Is Participant: ${isParticipant}`);
      console.log(`   Is Admin: ${isAdmin}`);

      if (!isParticipant && !isAdmin) {
        console.log(`❌ User ${socket.user.email} does not have access to conversation ${conversationId}`);
        socket.emit('error', { message: 'You do not have access to this conversation' });
        console.log(`🏠 =========================================\n`);
        return;
      }

      // Leave all previous rooms
      const rooms = Array.from(socket.rooms);
      console.log(`\n🏠 Current rooms before leaving:`, rooms);
      
      rooms.forEach((room) => {
        if (room !== socket.id) {
          console.log(`   Leaving room: ${room}`);
          socket.leave(room);
        }
      });

      // Join the conversation room
      console.log(`\n🚪 Joining room: ${conversationId}`);
      socket.join(conversationId);
      socket.conversationId = conversationId;
      
      // Update connected sockets map
      const socketInfo = this.connectedSockets.get(socket.id);
      if (socketInfo) {
        socketInfo.conversationId = conversationId;
        this.connectedSockets.set(socket.id, socketInfo);
      }

      // Confirm joined
      console.log(`\n✅ User ${socket.user.email} joined conversation ${conversationId}`);
      console.log(`   Room members: ${this.io.sockets.adapter.rooms.get(conversationId)?.size || 0}`);
      
      socket.emit('conversation:joined', { 
        conversationId,
        message: 'Successfully joined conversation',
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${socket.user._id} joined conversation ${conversationId}`);
      console.log(`🏠 =========================================\n`);
    } catch (error) {
      console.error(`❌ Error joining conversation ${conversationId}:`, error);
      logger.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
      console.log(`🏠 =========================================\n`);
    }
  }

  private async handleSendMessage(
    socket: SocketWithUser,
    data: { conversationId: string; message: string }
  ): Promise<void> {
    console.log(`\n💬 =========================================`);
    console.log(`💬 Handling send message request`);
    console.log(`💬 =========================================`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   User: ${socket.user?.email || 'Unknown'} (${socket.user?._id || 'Unknown'})`);
    console.log(`   Conversation: ${data.conversationId}`);
    console.log(`   Message: "${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}"`);
    console.log(`   Message length: ${data.message.length} characters`);

    try {
      if (!socket.user) {
        console.log(`❌ No user found on socket`);
        socket.emit('error', { message: 'Authentication required' });
        console.log(`💬 =========================================\n`);
        return;
      }

      const { conversationId, message } = data;

      if (!message || message.trim().length === 0) {
        console.log(`❌ Empty message received`);
        socket.emit('error', { message: 'Message cannot be empty' });
        console.log(`💬 =========================================\n`);
        return;
      }

      console.log(`🔍 Finding conversation: ${conversationId}`);
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        console.log(`❌ Conversation not found: ${conversationId}`);
        socket.emit('error', { message: 'Conversation not found' });
        console.log(`💬 =========================================\n`);
        return;
      }

      // Check if user is a participant or admin
      const isParticipant = conversation.participants.some(
        (p) => p.toString() === socket.user!._id.toString()
      );
      const isAdmin = socket.user.role === 'admin';

      console.log(`\n🔐 Access check:`);
      console.log(`   Is Participant: ${isParticipant}`);
      console.log(`   Is Admin: ${isAdmin}`);

      if (!isParticipant && !isAdmin) {
        console.log(`❌ User ${socket.user.email} does not have access to conversation ${conversationId}`);
        socket.emit('error', { message: 'You do not have access to this conversation' });
        console.log(`💬 =========================================\n`);
        return;
      }

      // Save message to database
      console.log(`\n💾 Saving message to database...`);
      const newMessage = await Message.create({
        conversation: conversationId,
        sender: socket.user._id,
        message: message.trim(),
      });

      console.log(`✅ Message saved to database`);
      console.log(`   Message ID: ${newMessage._id}`);
      console.log(`   Sender: ${socket.user.email}`);
      console.log(`   Timestamp: ${newMessage.createdAt}`);

      // Populate sender info
      await newMessage.populate('sender', 'name email');
      console.log(`👤 Sender info populated:`, newMessage.sender);

      // Get room size before emitting
      const roomSize = this.io.sockets.adapter.rooms.get(conversationId)?.size || 0;
      console.log(`\n📊 Room status before emitting:`);
      console.log(`   Room: ${conversationId}`);
      console.log(`   Members in room: ${roomSize}`);
      console.log(`   Total connected sockets: ${this.connectedSockets.size}`);

      // Log who is in the room
      if (roomSize > 0) {
        const roomSockets = this.io.sockets.adapter.rooms.get(conversationId);
        const socketIds = roomSockets ? Array.from(roomSockets) : [];
        console.log(`   Socket IDs in room:`, socketIds);
        
        // Log users in the room
        const usersInRoom: string[] = [];
        for (const socketId of socketIds) {
          const info = this.connectedSockets.get(socketId);
          if (info) {
            usersInRoom.push(`${info.email} (${info.userId})`);
          }
        }
        console.log(`   Users in room:`, usersInRoom);
      }

      // Emit to all users in the room (including sender)
      console.log(`\n📤 Emitting message:new to room ${conversationId}`);
      const emitData = {
        conversationId,
        message: newMessage,
      };
      
      this.io.to(conversationId).emit('message:new', emitData);
      console.log(`✅ Message emitted to room ${conversationId}`);
      console.log(`   Emit data:`, {
        conversationId,
        messageId: newMessage._id,
        messagePreview: newMessage.message.substring(0, 30) + '...',
      });

      // Also emit back to sender specifically (confirmation)
      console.log(`\n📤 Emitting message:sent confirmation to sender ${socket.id}`);
      socket.emit('message:sent', {
        success: true,
        messageId: newMessage._id,
        message: newMessage,
        timestamp: new Date().toISOString(),
      });
      console.log(`✅ Message sent confirmation emitted`);

      logger.info(`Message sent in conversation ${conversationId} by user ${socket.user._id}`);
      console.log(`\n✅ Message handling completed successfully`);
      console.log(`💬 =========================================\n`);
    } catch (error) {
      console.error(`\n❌ Error sending message:`, error);
      console.log(`   Error details:`, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
      console.log(`💬 =========================================\n`);
    }
  }

  // Helper method to emit system messages
  emitSystemMessage(conversationId: string, message: string): void {
    console.log(`\n📤 =========================================`);
    console.log(`📤 Emitting system message`);
    console.log(`📤 =========================================`);
    console.log(`   Conversation: ${conversationId}`);
    console.log(`   Message: ${message}`);
    
    const roomSize = this.io.sockets.adapter.rooms.get(conversationId)?.size || 0;
    console.log(`   Room members: ${roomSize}`);
    
    this.io.to(conversationId).emit('message:new', {
      conversationId,
      message: {
        _id: `system_${Date.now()}`,
        sender: null,
        message: message,
        createdAt: new Date(),
        isSystem: true,
      },
    });
    
    console.log(`✅ System message emitted to ${roomSize} recipients`);
    console.log(`📤 =========================================\n`);
  }

  getIO(): SocketServer {
    return this.io;
  }

  // Helper method to get connection stats
  getConnectionStats(): any {
    return {
      totalConnections: this.connectedSockets.size,
      connections: Array.from(this.connectedSockets.entries()).map(([id, info]) => ({
        socketId: id,
        userId: info.userId,
        email: info.email,
        conversationId: info.conversationId || 'None',
      })),
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
    };
  }
}
import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/interfaces/auth.interface';
import { MeetingResponseDto } from './dto/meeting-response.dto';
import { MeetingGateway } from '../socket/meeting.gateway';

@Controller('meeting')
export class MeetingController {
  constructor(
    private meetingService: MeetingService,
    private meetingGateway: MeetingGateway,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: Request): Promise<MeetingResponseDto> {
    const user = req.user as JwtPayload;
    return this.meetingService.create(user.id);
  }
  @Get(':roomId')
  @UseGuards(JwtAuthGuard)
  getMeeting(
    @Param('roomId') roomId: string,
  ): Promise<MeetingResponseDto | null> {
    return this.meetingService.findByRoomId(roomId);
  }

  @Post(':roomId/join')
  @UseGuards(JwtAuthGuard)
  joinMeeting(
    @Param('roomId') roomId: string,
    @Req() req: Request,
  ): Promise<MeetingResponseDto> {
    const user = req.user as JwtPayload;
    return this.meetingService.joinMeeting(roomId, user);
  }

  @Post(':roomId/leave')
  @UseGuards(JwtAuthGuard)
  async leaveMeeting(@Param('roomId') roomId: string, @Req() req: Request) {
    const user = req.user as JwtPayload;
    const result = await this.meetingService.leaveMeeting(roomId, user.id);
    if (result.isMeetingEnded) {
      this.meetingGateway.server.to(roomId).emit('meeting-ended');
    }
    return result;
  }
}

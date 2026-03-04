import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService,
        private configService: ConfigService,
        @InjectRepository(User)
        private userRepo: Repository<User>) { }

    async googleLogin(googleUser: any) {
        if (!googleUser) {
            return { message: 'No user from Google' };
        }

        let user = await this.userRepo.findOne({
            where: { email: googleUser.email },
        });

        if (!user) {
            user = this.userRepo.create({
                email: googleUser.email,
                firstName: googleUser.firstName,
                lastName: googleUser.lastName,
                picture: googleUser.picture,
            });
            await this.userRepo.save(user);
        }
        const payload = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        };

        return {
            message: 'Login successful',
            user: payload,
            accessToken: this.jwtService.sign(payload),
            refreshToken: this.jwtService.sign(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET', ''),
                expiresIn: '30m',
            }),
        };

    }
    refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET', ''),
            })
            const newPayload = {
                email: payload.email,
                firstName: payload.firstName,
                lastName: payload.lastName,
            }
            return {
                accessToken: this.jwtService.sign(newPayload),
            }
        } catch (error) {
            throw new UnauthorizedException('The refresh token is invalid or has expired.');
        }
    }
}

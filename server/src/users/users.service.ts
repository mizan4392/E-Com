import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findByClerkUserId(userId: string) {
    return this.usersRepo.findOne({ where: { userId: userId } });
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email: email } });
  }

  async createOrUpdateFromClerk(userId: string, payload: Partial<User>) {
    let user = await this.findByClerkUserId(userId);
    if (!user) {
      user = this.usersRepo.create({ userId, ...payload });
    } else {
      Object.assign(user, payload);
    }
    return this.usersRepo.save(user);
  }
}

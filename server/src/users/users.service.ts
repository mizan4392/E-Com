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

  async findByClerkId(clerkId: string) {
    return this.usersRepo.findOne({ where: { clerkId } });
  }

  async createOrUpdateFromClerk(clerkId: string, payload: Partial<User>) {
    let user = await this.findByClerkId(clerkId);
    if (!user) {
      user = this.usersRepo.create({ clerkId, ...payload });
    } else {
      Object.assign(user, payload);
    }
    return this.usersRepo.save(user);
  }
}

import { Injectable } from '@nestjs/common';
import { Category } from '../admin/category.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}
  getAllCategories() {
    return this.categoriesRepo.find({ order: { createdAt: 'DESC' } });
  }
}

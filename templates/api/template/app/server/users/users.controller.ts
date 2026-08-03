import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { type CreateUser, UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  create(@Body() input: CreateUser) {
    return this.users.create(input);
  }
}

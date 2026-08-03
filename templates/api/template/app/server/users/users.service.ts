import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  name: string;
  email: string;
}

export type CreateUser = Omit<User, 'id'>;

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    { id: '1', name: 'Ada Lovelace', email: 'ada@example.com' },
  ];

  findAll() {
    return this.users;
  }

  findOne(id: string) {
    return this.users.find(user => user.id === id) ?? null;
  }

  create(input: CreateUser) {
    const user = { id: String(this.users.length + 1), ...input };
    this.users.push(user);
    return user;
  }
}

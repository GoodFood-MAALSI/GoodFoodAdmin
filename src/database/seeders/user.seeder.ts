import {
  User,
  UserRole,
  UserStatus,
} from '../../domain/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class UserSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repo = dataSource.getRepository(User);

    const users = [
      {
        id: 1,
        email: 'super-admin@goodfood-maalsi.com',
        password: '8w7yd25MEC6ycC',
        status: UserStatus.Active,
        first_name: 'Super-Admin',
        last_name: 'Goodfood',
        role: UserRole.SuperAdmin,
      },
      {
        id: 2,
        email: 'admin@goodfood-maalsi.com',
        password: 'ELwiygCv84D839',
        status: UserStatus.Active,
        first_name: 'Admin',
        last_name: 'Goodfood',
        role: UserRole.Admin,
      },
    ];

    for (const userData of users) {
      const user = new User();
      user.id = userData.id;
      user.email = userData.email;
      user.password = userData.password;
      user.status = userData.status;
      user.first_name = userData.first_name;
      user.last_name = userData.last_name;
      user.role = userData.role;

      await repo.save(user, { data: { id: userData.id } });
    }

    console.log('All users inserted or updated successfully!');
  }
}

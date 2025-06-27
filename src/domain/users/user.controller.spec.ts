import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { UserRole } from './entities/user.entity';

// Mock du service
const mockUsersService = {
  findOneUser: jest.fn((options: { id: number }) => {
    if (options.id === 1) {
      return { id: 1, first_name: 'John', last_name: 'Doe' };
    }
    return null;
  }),
  updateUser: jest.fn((id: number, dto: UpdateUserDto) => {
    if (id === 1) {
      return { id: 1, ...dto, updated_at: new Date() };
    }
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }),
  deleteUser: jest.fn((id: number) => {
    if (id === 1) {
      return Promise.resolve({ message: 'Utilisateur supprimé avec succès' });
    }
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  })
};

// Mock du guard d'authentification
class AuthGuardMock {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}

// Helper pour générer un JwtPayloadType valide
function createMockJwtPayload(id: number): JwtPayloadType {
  return {
    id,
    sessionId: 123,
    iat: Math.floor(Date.now() / 1000) - 1000,
    exp: Math.floor(Date.now() / 1000) + 3600,
    role:UserRole.Admin, 
  };
}

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const currentUser = createMockJwtPayload(1);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(AuthGuardMock)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should find a user by ID', async () => {
      const result = await controller.findOne('1', currentUser);
      expect(service.findOneUser).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual({ id: 1, first_name: 'John', last_name: 'Doe' });
    });

    it('should throw HttpException if user not found', async () => {
      await expect(controller.findOne('2', createMockJwtPayload(2))).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw Forbidden if currentUser.id !== requested id', async () => {
      await expect(controller.findOne('2', currentUser)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw Unauthorized if no currentUser', async () => {
      await expect(controller.findOne('1', null)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      first_name: 'Updated John',
      last_name: 'Doe',
    };

    it('should update a user', async () => {
      const result = await controller.update('1', updateDto, currentUser);
      expect(service.updateUser).toHaveBeenCalledWith(1, updateDto);
      expect(result).toMatchObject({
        id: 1,
        first_name: 'Updated John',
        last_name: 'Doe',
      });
    });

    it('should throw HttpException if user not found', async () => {
      await expect(
        controller.update('2', updateDto, createMockJwtPayload(2)),
      ).rejects.toThrow(HttpException);
    });

    it('should throw Forbidden if currentUser.id !== requested id', async () => {
      await expect(
        controller.update('2', updateDto, currentUser),
      ).rejects.toThrow(HttpException);
    });

    it('should throw Unauthorized if no currentUser', async () => {
      await expect(controller.update('1', updateDto, null)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const result = await controller.remove('1', currentUser);
      expect(service.deleteUser).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Utilisateur supprimé avec succès' });
    });

    it('should throw HttpException if user not found', async () => {
      await expect(controller.remove('2', createMockJwtPayload(2))).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw Forbidden if currentUser.id !== requested id', async () => {
      await expect(controller.remove('2', currentUser)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw Unauthorized if no currentUser', async () => {
      await expect(controller.remove('1', null)).rejects.toThrow(HttpException);
    });
  });
});

# 📐 BACKEND CODING STANDARD — NestJS

> Dành cho AI assistant khi sinh code backend trong công ty.
> Đọc kỹ, tuân thủ **toàn bộ**, không được bỏ qua bất kỳ mục nào.

---

## 1. TRIẾT LÝ CỐT LÕI

| Nguyên tắc | Mô tả |
|---|---|
| **Module nhỏ** | Mỗi module chỉ làm một nghiệp vụ duy nhất |
| **Dễ đọc** | Code tự giải thích, tên hàm/biến rõ nghĩa, không viết tắt lạ |
| **Dễ bảo trì** | Logic nghiệp vụ nằm trong Service, không rải rác |
| **Type-safe** | Dùng `interface` / `type`, **cấm dùng `any`** |
| **Phân quyền rõ ràng** | Guard + Decorator tập trung, không check quyền trong Service |
| **Không hardcode** | Dùng `.env` + `ConfigModule`, không hardcode secret/connection string |
| **Logging chuẩn** | Dùng `Logger` của NestJS, không dùng `console.log` |

---

## 2. CẤU TRÚC THƯ MỤC

```
src/
├── common/                        # Dùng chung toàn app
│   ├── decorators/
│   │   ├── roles.decorator.ts     # @Roles(...)
│   │   ├── public.decorator.ts    # @Public()
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   ├── interfaces/
│   │   ├── jwt-payload.interface.ts
│   │   └── api-response.interface.ts
│   ├── enums/
│   │   └── role.enum.ts
│   └── dto/
│       └── pagination-query.dto.ts
│
├── config/                        # Cấu hình môi trường
│   └── app.config.ts
│
├── database/                      # Kết nối DB
│   └── database.module.ts
│
├── modules/                       # Các module nghiệp vụ
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── interfaces/
│   │   │   └── user.interface.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   └── [feature]/                 # Mỗi tính năng = 1 folder như trên
│
└── app.module.ts
```

> **Quy tắc thư mục:**
> - Mỗi module = 1 folder riêng trong `modules/`
> - Không để file nghiệp vụ ngoài folder module của nó
> - `common/` chỉ chứa code dùng lại, không chứa logic nghiệp vụ

---

## 3. QUY TẮC ĐẶT TÊN

```
# File
users.controller.ts       ✅
usersController.ts        ❌

# Class
export class UsersService  ✅
export class usersService  ❌

# Interface — bắt đầu bằng chữ I
interface IUser            ✅
interface User             ❌ (dễ nhầm với Entity)

# DTO — kết thúc bằng Dto
CreateUserDto              ✅
CreateUser                 ❌

# Enum — PascalCase
enum UserRole              ✅
enum userRole              ❌

# Test files
users.service.spec.ts      ✅
users.controller.spec.ts   ✅
```

---

## 4. INTERFACE & TYPE — CẤM DÙNG `any`

### 4.1 Định nghĩa interface chuẩn

```typescript
// common/interfaces/jwt-payload.interface.ts
export interface IJwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// common/interfaces/api-response.interface.ts
export interface IApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 4.2 Không dùng `any` — dùng `unknown` hoặc generic

```typescript
// ❌ SAI
function processData(data: any): any { ... }

// ✅ ĐÚNG
function processData<T>(data: T): IApiResponse<T> { ... }

// ❌ SAI
catch (error: any) { throw error.message }

// ✅ ĐÚNG
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new InternalServerErrorException(message);
}
```

---

## 5. PHÂN QUYỀN (AUTHORIZATION)

> Đây là phần **quan trọng nhất**. Tuân thủ chặt chẽ.

### 5.1 Định nghĩa Role

```typescript
// common/enums/role.enum.ts
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN       = 'admin',
  MANAGER     = 'manager',
  STAFF       = 'staff',
  USER        = 'user',
}
```

### 5.2 Decorator `@Roles`

```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### 5.3 Decorator `@Public`

```typescript
// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### 5.4 Decorator `@CurrentUser`

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IJwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: IJwtPayload }>();
    return request.user;
  },
);
```

### 5.5 JWT Guard (có hỗ trợ `@Public()`)

```typescript
// common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

### 5.6 Roles Guard

```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/role.enum';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Không yêu cầu role cụ thể → chỉ cần đăng nhập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: IJwtPayload }>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }

    return true;
  }
}
```

### 5.7 Cách dùng trong Controller

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)   // ← Đặt ở class level để bảo vệ toàn bộ controller
export class UsersController {

  // Chỉ ADMIN và SUPER_ADMIN mới xem được danh sách
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll(): Promise<IApiResponse<IUser[]>> { ... }

  // Mọi user đã đăng nhập đều xem được profile của mình
  @Get('me')
  getProfile(@CurrentUser() user: IJwtPayload): Promise<IApiResponse<IUser>> { ... }

  // Chỉ SUPER_ADMIN mới xóa được
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string): Promise<IApiResponse<null>> { ... }
}
```

### 5.8 Đăng ký Guard toàn cục trong AppModule

```typescript
// app.module.ts
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

> Khi đăng ký toàn cục, dùng `@Public()` cho những route không cần auth:

```typescript
// Dùng trong controller
@Post('login')
@Public()
login(@Body() dto: LoginDto) { ... }
```

---

## 6. CONTROLLER

```typescript
// modules/users/users.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/role.enum';
import { IJwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { IApiResponse } from '../../common/interfaces/api-response.interface';
import { IUser } from './interfaces/user.interface';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tạo user mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  create(@Body() createUserDto: CreateUserDto): Promise<IApiResponse<IUser>> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách user' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll(@Query() query: PaginationQueryDto): Promise<IApiResponse<IUser[]>> {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin bản thân' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  getProfile(@CurrentUser() user: IJwtPayload): Promise<IApiResponse<IUser>> {
    return this.usersService.findOne(user.sub);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cập nhật user' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<IApiResponse<IUser>> {
    return this.usersService.update(Number(id), updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Xóa user' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  remove(@Param('id') id: string): Promise<IApiResponse<null>> {
    return this.usersService.remove(Number(id));
  }
}
```

> **Quy tắc Controller:**
> - Chỉ xử lý HTTP: nhận request, trả response
> - **Không** chứa logic nghiệp vụ
> - **Không** gọi trực tiếp repository
> - Luôn có `@ApiOperation` và `@ApiResponse` để Swagger rõ ràng

---

## 7. SERVICE

```typescript
// modules/users/users.service.ts
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IApiResponse } from '../../common/interfaces/api-response.interface';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateUserDto): Promise<IApiResponse<IUser>> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(`Email ${dto.email} đã được sử dụng`);
    }

    const user = this.userRepository.create(dto);
    const saved = await this.userRepository.save(user);
    this.logger.log(`Tạo user mới: ${saved.email}`);

    return this.buildResponse('Tạo user thành công', this.toUserInterface(saved));
  }

  async findAll(): Promise<IApiResponse<IUser[]>> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return this.buildResponse('Lấy danh sách thành công', users.map(this.toUserInterface));
  }

  async findOne(id: number): Promise<IApiResponse<IUser>> {
    const user = await this.findUserByIdOrThrow(id);
    return this.buildResponse('Lấy user thành công', this.toUserInterface(user));
  }

  async update(id: number, dto: UpdateUserDto): Promise<IApiResponse<IUser>> {
    const user = await this.findUserByIdOrThrow(id);
    const updated = await this.userRepository.save({ ...user, ...dto });
    this.logger.log(`Cập nhật user id=${id}`);

    return this.buildResponse('Cập nhật thành công', this.toUserInterface(updated));
  }

  async remove(id: number): Promise<IApiResponse<null>> {
    const user = await this.findUserByIdOrThrow(id);
    await this.userRepository.softDelete(user.id);
    this.logger.warn(`Xóa user id=${id}`);

    return this.buildResponse('Xóa thành công', null);
  }

  // ─── Private helpers ───────────────────────────────────────────

  private async findUserByIdOrThrow(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với id ${id}`);
    }
    return user;
  }

  private toUserInterface(entity: UserEntity): IUser {
    return {
      id:        entity.id,
      email:     entity.email,
      fullName:  entity.fullName,
      role:      entity.role,
      isActive:  entity.isActive,
      createdAt: entity.createdAt,
    };
  }

  private buildResponse<T>(message: string, data: T): IApiResponse<T> {
    return {
      statusCode: 200,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
```

> **Quy tắc Service:**
> - Chứa **toàn bộ logic nghiệp vụ**
> - Mỗi hàm public có một trách nhiệm duy nhất
> - Dùng private helper để tránh lặp code
> - Luôn throw exception có message tiếng Việt rõ nghĩa
> - **Không** trả trực tiếp Entity ra ngoài — dùng `toUserInterface()` để tách biệt
> - Dùng `Logger` của NestJS, **không dùng `console.log`**

---

## 8. DTO — VALIDATION

### 8.1 Create DTO

```typescript
// modules/users/dto/create-user.dto.ts
import { IsEmail, IsString, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  fullName: string;

  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole, { message: 'Role không hợp lệ' })
  @IsOptional()
  role?: UserRole = UserRole.USER;
}
```

### 8.2 Update DTO

```typescript
// modules/users/dto/update-user.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Kế thừa CreateUserDto, bỏ password, tất cả field là optional
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {}
```

### 8.3 Pagination Query DTO

```typescript
// common/dto/pagination-query.dto.ts
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page phải là số nguyên' })
  @Min(1, { message: 'Page tối thiểu là 1' })
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit tối thiểu là 1' })
  @Max(100, { message: 'Limit tối đa là 100' })
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm' })
  @IsOptional()
  @IsString()
  search?: string;
}
```

---

## 9. ENTITY (TypeORM)

```typescript
// modules/users/entities/user.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/role.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column({ select: false })   // Không trả password trong query thông thường
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()           // Soft delete
  deletedAt: Date | null;
}
```

---

## 10. INTERFACE CỦA MODULE

```typescript
// modules/users/interfaces/user.interface.ts
import { UserRole } from '../../../common/enums/role.enum';

export interface IUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}
```

> Mỗi module có interface riêng mô tả dữ liệu **trả ra ngoài** (không bao giờ trả Entity trực tiếp).

---

## 11. RESPONSE INTERCEPTOR

```typescript
// common/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { IApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, IApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<IApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Nếu Service đã trả về IApiResponse thì giữ nguyên
        if (data && typeof data === 'object' && 'statusCode' in data && 'timestamp' in data) {
          return data as unknown as IApiResponse<T>;
        }
        return {
          statusCode: 200,
          message: 'Thành công',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
```

---

## 12. EXCEPTION FILTER

```typescript
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const status  = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Lỗi hệ thống, vui lòng thử lại sau';

    // Log lỗi server
    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url} - ${message}`, exception instanceof Error ? exception.stack : '');
    }

    response.status(status).json({
      statusCode: status,
      message,
      data:       null,
      timestamp:  new Date().toISOString(),
      path:       request.url,
    });
  }
}
```

---

## 13. CONFIG — CẤU HÌNH MÔI TRƯỜNG

```typescript
// config/app.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port:        parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  jwtSecret:   process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  database: {
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name:     process.env.DB_NAME,
  },
}));
```

> **Quy tắc Config:**
> - Luôn dùng `@nestjs/config` + `ConfigModule.forRoot()`
> - Không hardcode secret, connection string, port
> - Validate `.env` bằng `Joi` hoặc `class-validator` khi khởi động app
> - Tất cả biến môi trường phải có giá trị default hợp lý hoặc throw error nếu thiếu

---

## 14. TRANSACTION — THAO TÁC NHIỀU BẢNG

```typescript
// Khi cần thao tác nhiều bảng đồng thời, dùng transaction

import { DataSource } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(private readonly dataSource: DataSource) {}

  async createOrder(dto: CreateOrderDto): Promise<IApiResponse<IOrder>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = queryRunner.manager.create(OrderEntity, dto);
      const savedOrder = await queryRunner.manager.save(order);

      // Cập nhật số lượng sản phẩm
      await queryRunner.manager.decrement(
        ProductEntity,
        { id: dto.productId },
        'stock',
        dto.quantity,
      );

      await queryRunner.commitTransaction();
      return this.buildResponse('Tạo đơn hàng thành công', this.toOrderInterface(savedOrder));
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      const message = error instanceof Error ? error.message : 'Lỗi tạo đơn hàng';
      throw new InternalServerErrorException(message);
    } finally {
      await queryRunner.release();
    }
  }
}
```

> **Quy tắc Transaction:**
> - Dùng `QueryRunner` khi thao tác **nhiều bảng** cần tính nhất quán
> - Luôn có `try/catch/finally` với `rollback` và `release`
> - Không dùng transaction cho thao tác đơn bảng

---

## 15. LOGGING

```typescript
// Dùng Logger của NestJS — KHÔNG dùng console.log

import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async create(dto: CreateUserDto): Promise<IApiResponse<IUser>> {
    this.logger.log(`Tạo user mới: ${dto.email}`);        // Thông tin bình thường
    this.logger.warn(`User bị khóa: ${dto.email}`);        // Cảnh báo
    this.logger.error(`Lỗi khi tạo user`, error.stack);    // Lỗi nghiêm trọng
    this.logger.debug(`Debug data: ${JSON.stringify(dto)}`); // Chỉ hiện ở dev
  }
}
```

> **Quy tắc Logging:**
> - `log()` — thao tác thành công, sự kiện quan trọng
> - `warn()` — hành vi bất thường nhưng không lỗi (xóa data, khóa user)
> - `error()` — lỗi cần xử lý, luôn kèm `stack trace`
> - `debug()` — chỉ dùng khi debug, không để trong production
> - **KHÔNG BAO GIỜ** dùng `console.log`, `console.error`

---

## 16. MODULE TEMPLATE

```typescript
// modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],    // Export nếu module khác cần dùng
})
export class UsersModule {}
```

---

## 17. CHECKLIST TRƯỚC KHI SINH CODE

Trước khi viết bất kỳ đoạn code nào, AI phải tự hỏi:

- [ ] Có dùng `any` không? → **Xóa, thay bằng interface/generic**
- [ ] Controller có chứa logic không? → **Chuyển vào Service**
- [ ] Service có trả Entity trực tiếp không? → **Dùng interface mapper**
- [ ] Route cần auth không? → **Thêm `@UseGuards(JwtAuthGuard)`**
- [ ] Route cần role cụ thể không? → **Thêm `@Roles(...)`**
- [ ] Có public route không? → **Thêm `@Public()`**
- [ ] DTO có validate không? → **Dùng `class-validator`**
- [ ] Có Swagger `@ApiOperation` và `@ApiResponse` chưa? → **Thêm vào**
- [ ] Exception message có rõ ràng không? → **Tiếng Việt, đủ ngữ cảnh**
- [ ] Module có đúng folder structure không? → **Kiểm tra lại**
- [ ] Có dùng `console.log` không? → **Thay bằng `Logger`**
- [ ] Thao tác nhiều bảng có dùng Transaction không? → **Dùng QueryRunner**
- [ ] Config có hardcode không? → **Chuyển vào `.env`**

---

## 18. NHỮNG THỨ TUYỆT ĐỐI KHÔNG LÀM

```typescript
// ❌ Dùng any
const data: any = ...

// ❌ Logic trong Controller
@Get() async findAll() {
  const users = await this.repo.find();       // Gọi repo trong controller
  if (users.length === 0) throw new Error();  // Logic trong controller
}

// ❌ Trả Entity trực tiếp
async findAll(): Promise<UserEntity[]> { ... }

// ❌ Check quyền trong Service
async deleteUser(id: number, currentUser: IJwtPayload) {
  if (currentUser.role !== UserRole.ADMIN) throw ...  // Sai! Việc này Guard làm
}

// ❌ Catch lỗi im lặng
try { ... } catch { }  // Không bao giờ bắt lỗi rồi bỏ qua

// ❌ Magic number/string
if (user.role === 'admin') { ... }   // Dùng enum: UserRole.ADMIN

// ❌ Dùng console.log
console.log('user created');          // Dùng Logger: this.logger.log(...)

// ❌ Hardcode config
const port = 3000;                    // Dùng ConfigService
const secret = 'my-secret';          // Dùng process.env + ConfigModule
```

---

*Tài liệu này là chuẩn bắt buộc. Mọi code sinh ra phải tuân thủ 100%.*

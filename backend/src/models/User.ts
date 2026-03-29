import {
  Table, Column, Model, DataType,
  HasMany, BeforeCreate, BeforeUpdate,
  Unique, Default, PrimaryKey,
} from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { Order } from './Order';
import { Review } from './Review';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Table({ tableName: 'users', paranoid: true })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare firstName: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare lastName: string;

  @Unique
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare passwordHash: string | null;

  @Default(UserRole.CUSTOMER)
  @Column(DataType.ENUM(...Object.values(UserRole)))
  declare role: UserRole;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare phone: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare avatarUrl: string | null;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare refreshToken: string | null;

  // Azure AD B2C external identity
  @Column({ type: DataType.STRING(255), allowNull: true })
  declare b2cObjectId: string | null;

  @HasMany(() => Order)
  declare orders: Order[];

  @HasMany(() => Review)
  declare reviews: Review[];

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(user: User): Promise<void> {
    if (user.changed('passwordHash') && user.passwordHash) {
      user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
    }
  }

  async comparePassword(plainText: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(plainText, this.passwordHash);
  }

  toJSON(): object {
    const values = super.toJSON() as Record<string, unknown>;
    delete values.passwordHash;
    delete values.refreshToken;
    return values;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

import {
  Table, Column, Model, DataType,
  BelongsTo, ForeignKey, HasMany,
  Default, PrimaryKey,
} from 'sequelize-typescript';
import { User } from './User';
import { OrderItem } from './OrderItem';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Table({ tableName: 'orders', paranoid: true })
export class Order extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
  declare orderNumber: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Default(OrderStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(OrderStatus)))
  declare status: OrderStatus;

  @Default(PaymentStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(PaymentStatus)))
  declare paymentStatus: PaymentStatus;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare stripePaymentIntentId: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare subtotal: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  declare discountAmount: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  declare taxAmount: number;

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  declare shippingAmount: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare totalAmount: number;

  // Shipping address (denormalized JSON for immutability)
  @Column({ type: DataType.TEXT, allowNull: false })
  declare shippingAddress: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare billingAddress: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare trackingNumber: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare shippedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deliveredAt: Date | null;

  @HasMany(() => OrderItem)
  declare items: OrderItem[];
}

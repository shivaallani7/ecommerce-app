import {
  Table, Column, Model, DataType,
  BelongsTo, ForeignKey,
  Default, PrimaryKey, Min,
} from 'sequelize-typescript';
import { Order } from './Order';
import { Product } from './Product';

@Table({ tableName: 'order_items' })
export class OrderItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  declare orderId: string;

  @BelongsTo(() => Order)
  declare order: Order;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false })
  declare productId: string;

  @BelongsTo(() => Product)
  declare product: Product;

  // Snapshot of product at time of order
  @Column({ type: DataType.STRING(200), allowNull: false })
  declare productName: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare productImageUrl: string | null;

  @Min(1)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantity: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare unitPrice: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare totalPrice: number;
}

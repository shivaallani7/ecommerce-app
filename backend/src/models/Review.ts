import {
  Table, Column, Model, DataType,
  BelongsTo, ForeignKey,
  Default, PrimaryKey,
} from 'sequelize-typescript';
import { User } from './User';
import { Product } from './Product';

@Table({ tableName: 'reviews', paranoid: true })
export class Review extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false })
  declare productId: string;

  @BelongsTo(() => Product)
  declare product: Product;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare rating: number; // 1–5

  @Column({ type: DataType.STRING(200), allowNull: true })
  declare title: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare body: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isVerifiedPurchase: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isApproved: boolean;

  @Default(0)
  @Column(DataType.INTEGER)
  declare helpfulVotes: number;
}

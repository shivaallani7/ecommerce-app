import {
  Table, Column, Model, DataType,
  BelongsTo, ForeignKey, HasMany,
  Default, PrimaryKey, Min,
} from 'sequelize-typescript';
import { Category } from './Category';
import { OrderItem } from './OrderItem';
import { Review } from './Review';

@Table({ tableName: 'products', paranoid: true })
export class Product extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(220), allowNull: false, unique: true })
  declare slug: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare shortDescription: string | null;

  @Min(0)
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare salePrice: number | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare sku: string | null;

  @Default(0)
  @Min(0)
  @Column(DataType.INTEGER)
  declare stockQuantity: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isFeatured: boolean;

  // JSON array of image URLs (Azure CDN)
  @Default('[]')
  @Column(DataType.TEXT)
  declare images: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare brand: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare tags: string | null;

  @Default(0)
  @Column(DataType.FLOAT)
  declare averageRating: number;

  @Default(0)
  @Column(DataType.INTEGER)
  declare reviewCount: number;

  @Default(0)
  @Column(DataType.INTEGER)
  declare salesCount: number;

  // Physical dimensions (grams/cm)
  @Column({ type: DataType.FLOAT, allowNull: true })
  declare weight: number | null;

  @ForeignKey(() => Category)
  @Column({ type: DataType.UUID, allowNull: false })
  declare categoryId: string;

  @BelongsTo(() => Category)
  declare category: Category;

  @HasMany(() => OrderItem)
  declare orderItems: OrderItem[];

  @HasMany(() => Review)
  declare reviews: Review[];

  get imageList(): string[] {
    try {
      return JSON.parse(this.images) as string[];
    } catch {
      return [];
    }
  }

  get effectivePrice(): number {
    return this.salePrice ?? this.price;
  }
}

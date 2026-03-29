import {
  Table, Column, Model, DataType,
  HasMany, BelongsTo, ForeignKey,
  Default, PrimaryKey,
} from 'sequelize-typescript';
import { Product } from './Product';

@Table({ tableName: 'categories', paranoid: true })
export class Category extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(120), allowNull: false, unique: true })
  declare slug: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare imageUrl: string | null;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @Default(0)
  @Column(DataType.INTEGER)
  declare sortOrder: number;

  // Self-referential for sub-categories
  @ForeignKey(() => Category)
  @Column({ type: DataType.UUID, allowNull: true })
  declare parentId: string | null;

  @BelongsTo(() => Category, 'parentId')
  declare parent: Category | null;

  @HasMany(() => Category, 'parentId')
  declare children: Category[];

  @HasMany(() => Product)
  declare products: Product[];
}

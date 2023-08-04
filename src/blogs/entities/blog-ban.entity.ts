import { Blog } from './blog.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('blog_bans')
export class BlogBan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'is_banned', type: 'bool' })
  isBanned: boolean;

  @Column({
    name: 'ban_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  banDate: Date;

  @OneToOne(() => Blog, (blog) => blog.blogBan, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  blog: Blog;
}

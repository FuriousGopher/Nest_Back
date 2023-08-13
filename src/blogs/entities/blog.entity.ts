import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BlogBan } from './blog-ban.entity';
import { Post } from '../../posts/entities/post.entity';
import { UserBanByBlogger } from '../../auth/entities/user-ban-by-blogger.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', width: 15 })
  name: string;

  @Column({ type: 'varchar', width: 500 })
  description: string;

  @Column({ name: 'website_url', type: 'varchar' })
  websiteUrl: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ name: 'is_membership', type: 'boolean', default: false })
  isMembership: boolean;

  @OneToOne(() => BlogBan, (blogBan) => blogBan.blog)
  blogBan: BlogBan;

  @ManyToOne(() => User, (user) => user.blog)
  @JoinColumn()
  user: User;

  @OneToMany(() => Post, (post) => post.blog)
  post: Post[];

  @OneToMany(
    () => UserBanByBlogger,
    (userBanByBlogger) => userBanByBlogger.blog,
  )
  userBanByBlogger: UserBanByBlogger[];
}

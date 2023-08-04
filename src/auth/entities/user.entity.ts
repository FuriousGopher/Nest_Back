import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserBanByBlogger } from './user-ban-by-blogger.entity';
import { UserBanBySA } from './user-ban-by-sa.entity';
import { UserEmailConfirmation } from './user-email-confirmation.entity';
import { UserPasswordRecovery } from './user-password-recovery.entity';
import { Blog } from '../../blogs/entities/blog.entity';
import { CommentLike } from '../../comments/entities/comment-like.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Device } from '../../security/entities/device.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', width: 10, unique: true })
  login: string;

  @Column({ name: 'passwordHash', type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ name: 'isConfirmed', type: 'bool' })
  isConfirmed: boolean;

  @OneToOne(() => UserBanBySA, (userBanBySA) => userBanBySA.user)
  userBanBySA: UserBanBySA;

  @OneToOne(
    () => UserBanByBlogger,
    (userBanByBlogger) => userBanByBlogger.user,
    {
      nullable: true,
    },
  )
  userBanByBlogger?: UserBanByBlogger;

  @OneToOne(
    () => UserEmailConfirmation,
    (userEmailConfirmation) => userEmailConfirmation.user,
    { nullable: true },
  )
  userEmailConfirmation?: UserEmailConfirmation;

  @OneToOne(
    () => UserPasswordRecovery,
    (userPasswordRecovery) => userPasswordRecovery.user,
    { nullable: true },
  )
  userPasswordRecovery?: UserPasswordRecovery;

  @OneToMany(() => Device, (device) => device.user, { nullable: true })
  device: Device[];

  @OneToMany(() => Blog, (blog) => blog.user, { nullable: true })
  blog: Blog[];

  @OneToMany(() => Comment, (comment) => comment.user, { nullable: true })
  comment: Comment[];

  @OneToMany(() => CommentLike, (commentLike) => commentLike.user, {
    nullable: true,
  })
  commentLike?: CommentLike[];
}

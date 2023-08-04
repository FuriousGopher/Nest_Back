import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Comment } from './comment.entity';

@Entity('comment_likes')
export class CommentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'like_status', type: 'varchar' })
  likeStatus: string;

  @ManyToOne(() => Comment, (comment) => comment.commentLike, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  comment: Comment;

  @ManyToOne(() => User, (user) => user.commentLike, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}

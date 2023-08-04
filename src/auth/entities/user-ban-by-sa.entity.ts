import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_bans_by_sa')
export class UserBanBySA {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'is_banned', type: 'bool' })
  isBanned: boolean;

  @Column({
    name: 'ban_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  banDate: Date | null;

  @Column({ name: 'ban_reason', type: 'varchar', nullable: true })
  banReason: string | null;

  @OneToOne(() => User, (user) => user.userBanBySA, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  user: User;
}

import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_email_confirmations')
export class UserEmailConfirmation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'confirmation_code', nullable: true, type: 'uuid' })
  confirmationCode: string | null;

  @Column({
    name: 'expiration_date',
    nullable: true,
    type: 'timestamp with time zone',
  })
  expirationDate: Date | null;

  @OneToOne(() => User, (user) => user.userEmailConfirmation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}

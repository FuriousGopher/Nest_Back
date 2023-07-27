import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  id: string;

  @Prop(
    raw({
      login: { type: String },
      email: { type: String },
      passwordHash: { type: String },
      createdAt: { type: Date, default: new Date() },
      isMembership: { type: Boolean },
    }),
  )
  accountData: {
    login: string;
    email: string;
    passwordHash: string;
    createdAt: string;
    isMembership: boolean;
  };
  @Prop(
    raw({
      confirmationCode: { type: String || null },
      expirationDate: { type: String || null },
      isConfirmed: { type: Boolean },
    }),
  )
  emailConfirmation: {
    confirmationCode: string | null;
    expirationDate: string | null;
    isConfirmed: boolean;
  };
  @Prop(
    raw({
      isBanned: { type: Boolean },
      banDate: { type: String || null },
      banReason: { type: String || null },
    }),
  )
  banInfo: {
    isBanned: boolean;
    banDate: string | null;
    banReason: string | null;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<User>('save', function (next) {
  this.accountData.createdAt = new Date().toString();
  this.accountData.isMembership = false;
  this.banInfo.isBanned = false;
  this.banInfo.banDate = null;
  this.banInfo.banReason = null;
  next();
});

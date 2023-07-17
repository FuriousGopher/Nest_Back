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
    createdAt: Date;
    isMembership: boolean;
  };
  @Prop(
    raw({
      confirmationCode: { type: String || null },
      expirationDate: { type: Date || null },
      isConfirmed: { type: Boolean },
    }),
  )
  emailConfirmation: {
    confirmationCode: string | null;
    expirationDate: Date | null;
    isConfirmed: boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<User>('save', function (next) {
  this.accountData.createdAt = new Date();
  this.accountData.isMembership = false;
  next();
});

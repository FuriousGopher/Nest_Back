import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { add } from 'date-fns';
import { uuid } from 'uuidv4';

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
      createdAt: { type: String },
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
  this.accountData.createdAt = new Date().toISOString();
  this.emailConfirmation.confirmationCode = uuid();
  (this.emailConfirmation.expirationDate = add(new Date(), {
    hours: 1,
    minutes: 3,
  })),
    next();
});

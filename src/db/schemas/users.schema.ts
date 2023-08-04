import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserMongo>;

@Schema()
export class UserMongo {
  @Prop()
  id: string;

  @Prop(
    raw({
      login: { type: String },
      email: { type: String },
      passwordHash: { type: String },
      createdAt: { type: Date },
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
      banReason: { type: String },
    }),
  )
  banInfo: {
    isBanned: boolean;
    banDate: string | null;
    banReason: string | null;
  };
  @Prop()
  banForBlogsInfo: {
    isBanned: boolean;
    banDate: string | null;
    blogIds: any[];
    banReason: string | null;
  }[];
}

export const UserSchema = SchemaFactory.createForClass(UserMongo);

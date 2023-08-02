import { HydratedDocument } from 'mongoose';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';

export type BlogDocument = HydratedDocument<Blog>;

@Schema()
export class Blog {
  @Prop()
  id: string;
  @Prop()
  name: string;
  @Prop()
  description: string;
  @Prop()
  websiteUrl: string;
  @Prop()
  createdAt: string;
  @Prop(
    raw({
      userId: { type: String },
      userLogin: { type: String },
    }),
  )
  blogOwnerInfo: {
    userId: string;
    userLogin: string;
  };
  @Prop()
  isMembership: boolean;
  @Prop(
    raw({
      isBanned: { type: Boolean },
      banDate: { type: String || null },
    }),
  )
  banInfo: {
    isBanned: boolean;
    banDate: string | null;
  };
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.pre<Blog>('save', function (next) {
  this.createdAt = new Date().toISOString();
  this.isMembership = false;
  this.banInfo.isBanned = false;
  this.banInfo.banDate = null;
  next();
});

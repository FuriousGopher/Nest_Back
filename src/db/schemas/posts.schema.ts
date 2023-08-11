import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<PostMongo>;

export type Users = {
  addedAt: string;
  userId: string;
  userLogin: string;
  likeStatus: string;
};
@Schema()
export class PostMongo {
  @Prop() id: string;
  @Prop() title: string;
  @Prop() shortDescription: string;
  @Prop() content: string;
  @Prop() blogId: string;
  @Prop() blogName: string;
  @Prop() createdAt: string;
  @Prop(
    raw({
      likesCount: { type: Number },
      dislikesCount: { type: Number },
      myStatus: { type: String },
      users: { type: Array },
    }),
  )
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
    users: Users[];
  };
}

export const PostSchema = SchemaFactory.createForClass(PostMongo);

PostSchema.pre<PostMongo>('save', function (next) {
  this.createdAt = new Date().toISOString();
  this.extendedLikesInfo.likesCount = 0;
  this.extendedLikesInfo.dislikesCount = 0;
  this.extendedLikesInfo.myStatus = 'None';
  next();
});

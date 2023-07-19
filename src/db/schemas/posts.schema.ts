import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

export type Users = {
  addedAt: string;
  userId: string;
  userLogin: string;
  likeStatus: string;
};
@Schema()
export class Post {
  @Prop() id: string;
  @Prop() title: string;
  @Prop() shortDescription: string;
  @Prop() content: string;
  @Prop() blogId: string;
  @Prop() blogName: string;
  @Prop() createdAt: Date;
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

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.pre<Post>('save', function (next) {
  this.createdAt = new Date();
  this.extendedLikesInfo.likesCount = 0;
  this.extendedLikesInfo.dislikesCount = 0;
  this.extendedLikesInfo.myStatus = 'None';
  next();
});

import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

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
      users: {
        type: {
          addedAt: { type: String },
          userId: { type: String },
          userLogin: { type: String },
          likeStatus: { type: String },
        },
      },
    }),
  )
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    users: {
      addedAt: string;
      userId: string;
      userLogin: string;
      likeStatus: string;
    };
  };
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.pre<Post>('save', function (next) {
  this.createdAt = new Date();
  this.likesInfo.likesCount = 0;
  this.likesInfo.dislikesCount = 0;
  this.likesInfo.users = {
    addedAt: '',
    userId: '',
    userLogin: '',
    likeStatus: '',
  };
  next();
});

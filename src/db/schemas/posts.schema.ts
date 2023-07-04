import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema()
class UsersLikes {
  @Prop()
  addedAt: string;
  @Prop()
  userId: string;
  @Prop()
  userLogin: string;
  @Prop()
  likeStatus: string;
}

@Schema()
export class Post {
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
      users: { type: Array },
    }),
  )
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    users: UsersLikes[];
  };
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.pre<Post>('save', function (next) {
  this.createdAt = new Date().toISOString();
  next();
});

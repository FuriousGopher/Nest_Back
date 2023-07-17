import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema()
export class Comment {
  @Prop()
  id: string;

  @Prop()
  content: string;

  @Prop(
    raw({
      userId: { type: String },
      userLogin: { type: String },
    }),
  )
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };

  @Prop()
  postId: string;

  @Prop()
  createdAt: Date;

  @Prop(
    raw({
      likesCount: { type: Number },
      dislikesCount: { type: Number },
      myStatus: { type: String },
      users: { type: Array },
    }),
  )
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
    users: UserLikes[];
  };
}

type UserLikes = {
  userId: string;
  likeStatus: string;
};

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.pre<Comment>('save', function (next) {
  this.createdAt = new Date();
  next();
});

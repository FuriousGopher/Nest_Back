import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema()
export class Comment {
  @Prop()
  _id: string;

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

  @Prop(
    raw({
      likesCount: { type: Number },
      dislikesCount: { type: Number },
      users: { type: Array },
      myStatus: { type: String },
    }),
  )
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    users: UserLikes[];
    myStatus?: string;
  };
}

type UserLikes = {
  userId: string;
  likeStatus: string;
};

export const CommentSchema = SchemaFactory.createForClass(Comment);

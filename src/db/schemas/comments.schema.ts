import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<CommentMongo>;

@Schema()
export class CommentMongo {
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
  createdAt: string;

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

export type UserLikes = {
  userId: string;
  likeStatus: string;
};

export const CommentSchema = SchemaFactory.createForClass(CommentMongo);

CommentSchema.pre<CommentMongo>('save', function (next) {
  this.createdAt = new Date().toISOString();
  next();
});

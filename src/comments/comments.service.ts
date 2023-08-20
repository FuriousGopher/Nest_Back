import { Injectable } from '@nestjs/common';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentRepository } from './comment.repository';
import { LikesDto } from '../posts/dto/like-status.dto';

@Injectable()
export class CommentsService {
  constructor(protected commentRepository: CommentRepository) {}

  async updateLikeStatus(id: string, likesDto: LikesDto, userId: string) {
    const user = await this.commentRepository.findUserInLikesInfo(id, userId);

    const foundComment = await this.commentRepository.findByIdSQL(+id, +userId);
    if (!foundComment) return false;

    const like = likesDto.likeStatus;

    let likesCount = foundComment.likesInfo.likesCount;
    let dislikesCount = foundComment.likesInfo.dislikesCount;

    if (!user) {
      await this.commentRepository.addUserInLikesInfo(id, userId, like);

      if (like === 'Like') {
        likesCount++;
      }

      if (like === 'Dislike') {
        dislikesCount++;
      }
      return this.commentRepository.updateLikesCount(
        id,
        likesCount,
        dislikesCount,
      );
    }

    const checkLikeStatus = await this.commentRepository.findUserLikeStatus(
      id,
      userId,
    );

    switch (checkLikeStatus) {
      case 'None':
        if (like === 'Like') {
          likesCount++;
        }

        if (like === 'Dislike') {
          dislikesCount++;
        }

        break;

      case 'Like':
        if (like === 'None') {
          likesCount--;
        }

        if (like === 'Dislike') {
          likesCount--;
          dislikesCount++;
        }
        break;

      case 'Dislike':
        if (like === 'None') {
          dislikesCount--;
        }

        if (like === 'Like') {
          dislikesCount--;
          likesCount++;
        }
        break;
    }

    await this.commentRepository.updateLikesCount(
      id,
      likesCount,
      dislikesCount,
    );

    return this.commentRepository.updateLikesStatus(id, userId, like);
  }

  async update(id: string, updateCommentDto: UpdateCommentDto) {
    return await this.commentRepository.update(id, updateCommentDto.content);
  }

  async remove(id: string) {
    return await this.commentRepository.remove(id);
  }

  async findById(id: string) {
    return await this.commentRepository.findOne(id);
  }

  async findOne(id: number, userId: string) {
    return await this.commentRepository.findByIdSQL(+id, +userId);
  }

  async checkOwner(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne(commentId);
    if (!comment) return false;
    return comment.commentatorInfo.userId === userId;
  }
}

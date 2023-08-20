import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostMongo, PostDocument } from '../db/schemas/posts.schema';
import { Model, Types } from 'mongoose';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SaRepository } from '../sa/sa.repository';
import { BlogMongo, BlogDocument } from '../db/schemas/blogs.schema';
import { CommentMongo, CommentDocument } from '../db/schemas/comments.schema';
import { Paginator } from '../utils/paginator';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { DataSource, Repository } from 'typeorm';
import { PostLike } from './entities/post-like.entity';
import { LikeStatus } from '../enums/like-status.enum';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(PostMongo.name) private postModel: Model<PostDocument>,
    @InjectModel(BlogMongo.name) private blogModel: Model<BlogDocument>,
    @InjectModel(CommentMongo.name)
    private commentModel: Model<CommentDocument>,
    protected saRepository: SaRepository,
    @InjectRepository(Post) private postsRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikesRepository: Repository<PostLike>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async findAllPosts(queryParams: PostsQueryParamsDto, userId: string) {
    try {
      const {
        sortBy = 'createdAt',
        sortDirection = 'desc',
        pageNumber = 1,
        pageSize = 10,
      } = queryParams;

      const filter: any = {};

      const bannedBlogs = await this.blogModel
        .find({ 'banInfo.isBanned': true })
        .select('id')
        .exec();

      const bannedBlogIds = bannedBlogs.map((blog) => blog._id.toString());

      filter.blogId = { $nin: bannedBlogIds };

      const skipCount = (pageNumber - 1) * pageSize;

      const totalCount = await this.postModel.countDocuments(filter).exec();
      const totalPages = Math.ceil(totalCount / pageSize);

      const posts = await this.postModel
        .find(filter)
        .sort({ [sortBy]: sortDirection === 'desc' ? -1 : 1 })
        .skip(skipCount)
        .limit(pageSize)
        .exec();

      return {
        pagesCount: totalPages,
        page: +pageNumber,
        pageSize: +pageSize,
        totalCount: totalCount,
        items: await this.mapGetAllPosts(posts, userId),
      };
    } catch (e) {
      console.error('An error occurred while getting all posts', e);

      throw e;
    }
  }

  async dataSourceSave(entity: Post | PostLike) {
    return this.dataSource.manager.save(entity);
  }

  async mapGetAllPosts(array: PostDocument[], userId?: string) {
    return Promise.all(
      array.map(async (post) => {
        let status: string | undefined;

        const usersWithReaction = post.extendedLikesInfo.users;

        if (userId) {
          status = usersWithReaction.find(
            (u) => u.userId === userId,
          )?.likeStatus;
        }

        const usersIdsWithReaction = usersWithReaction.map(
          (u) => new Types.ObjectId(u.userId),
        );

        const bannedUsers =
          await this.saRepository.findBannedUsersFromArrayOfIds(
            usersIdsWithReaction,
          );

        const allowedUsers = usersWithReaction.filter(
          (u) => !bannedUsers.includes(u.userId),
        );

        const likesArray = allowedUsers.filter((u) => u.likeStatus === 'Like');

        const newestLikes = likesArray
          .sort((a, b) => -a.addedAt.localeCompare(b.addedAt))
          .map((like) => ({
            addedAt: like.addedAt.toString(),
            userId: like.userId,
            login: like.userLogin,
          }))
          .splice(0, 3);
        const likesCountCheck = likesArray.length;
        const dislikeCountCheck = allowedUsers.length - likesCountCheck;

        return {
          id: post._id.toString(),
          title: post.title,
          shortDescription: post.shortDescription,
          content: post.content,
          blogId: post.blogId,
          blogName: post.blogName,
          createdAt: post.createdAt,
          extendedLikesInfo: {
            likesCount: likesCountCheck,
            dislikesCount: dislikeCountCheck,
            myStatus: status || 'None',
            newestLikes,
          },
        };
      }),
    );
  }

  async save(newPost: PostDocument) {
    return await newPost.save();
  }

  async findOne(id: string) {
    return await this.postModel.findById({ _id: id }).exec();
  }

  async updateOne(id: string, updatePostDto: UpdatePostDto) {
    try {
      return await this.postModel
        .findByIdAndUpdate(
          { _id: id },
          {
            $set: updatePostDto,
          },
          { new: true },
        )
        .exec();
    } catch (e) {
      return false;
    }
  }

  async remove(id: string) {
    try {
      return await this.postModel.findByIdAndDelete(id).exec();
    } catch (e) {
      return false;
    }
  }

  async findUserInLikesInfo(postId: string, userId: string) {
    const result = await this.postModel.findOne({
      _id: postId,
      'extendedLikesInfo.users.userId': userId,
    });
    return !!result;
  }

  async addUserInLikesInfo(
    id: string,
    userId: string,
    userLogin: string,
    likeStatus: string,
  ) {
    const result = await this.postModel
      .findOneAndUpdate(
        {
          _id: id,
        },
        {
          $push: {
            'extendedLikesInfo.users': {
              addedAt: new Date().toISOString(),
              userId: userId,
              userLogin: userLogin,
              likeStatus: likeStatus,
            },
          },
        },
      )
      .exec();
    if (!result) return false;
    return result;
  }

  async updateLikesCount(id: string, likesCount: any, dislikesCount: any) {
    return this.postModel
      .findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            'extendedLikesInfo.likesCount': likesCount,
            'extendedLikesInfo.dislikesCount': dislikesCount,
          },
        },
      )
      .exec();
  }

  async findUserLikeStatus(id: string, userId: string) {
    const result = await this.postModel
      .findOne({
        _id: new Types.ObjectId(id),
      })
      .exec();

    if (
      !result ||
      !result.extendedLikesInfo ||
      !result.extendedLikesInfo.users
    ) {
      return 'None';
    }

    return result.extendedLikesInfo.users[0].likeStatus;
  }

  async updateLikesStatus(id: string, userId: string, likeStatus: string) {
    return this.postModel
      .findOneAndUpdate(
        {
          _id: id,
          'extendedLikesInfo.users.userId': userId,
        },
        {
          $set: {
            'extendedLikesInfo.users.$.likeStatus': likeStatus,
          },
        },
      )
      .exec();
  }

  async findOneWithMapping(postId: string, userId?: number) {
    try {
      const posts = await this.postsRepository
        .createQueryBuilder('p')
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(PostLike, 'pl')
              .leftJoin('pl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('pl.postId = p.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`pl.likeStatus = 'Like'`),
          'likes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(PostLike, 'pl')
              .leftJoin('pl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('pl.postId = p.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`pl.likeStatus = 'Dislike'`),
          'dislikes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select('pl.likeStatus')
              .from(PostLike, 'pl')
              .where('pl.postId = p.id')
              .andWhere('pl.userId = :userId', { userId: userId }),
          'like_status',
        )
        .addSelect(
          (qb) =>
            qb
              .select(
                `jsonb_agg(json_build_object('addedAt', to_char(
            agg.added_at::timestamp at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'userId', cast(agg.id as varchar), 'login', agg.login)
                 )`,
              )
              .from((qb) => {
                return qb
                  .select(`added_at, u.id, u.login`)
                  .from(PostLike, 'pl')
                  .leftJoin('pl.user', 'u')
                  .leftJoin('u.userBanBySA', 'ubsa')
                  .where('pl.postId = p.id')
                  .andWhere(`pl.like_status = 'Like'`)
                  .andWhere('ubsa.isBanned = false')
                  .orderBy('added_at', 'DESC')
                  .limit(3);
              }, 'agg'),

          'newest_likes',
        )
        .where(`p.id = :postId`, {
          postId: postId,
        })
        .andWhere(`bb.isBanned = false`)
        .andWhere(`ubsa.isBanned = false`)
        .leftJoinAndSelect('p.blog', 'b')
        .leftJoinAndSelect('b.blogBan', 'bb')
        .leftJoinAndSelect('b.user', 'u')
        .leftJoinAndSelect('u.userBanBySA', 'ubsa')
        .getRawMany();

      const mappedPosts = await this.postsMapping(posts);
      return mappedPosts[0];
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async findPostsForBlogSQL(
    query: PostsQueryParamsDto,
    blogId: string,
    userId: number,
  ) {
    try {
      const posts = await this.postsRepository
        .createQueryBuilder('p')
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(PostLike, 'pl')
              .leftJoin('pl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('pl.postId = p.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`pl.likeStatus = 'Like'`),
          'likes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(PostLike, 'pl')
              .leftJoin('pl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('pl.postId = p.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`pl.likeStatus = 'Dislike'`),
          'dislikes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select('pl.likeStatus')
              .from(PostLike, 'pl')
              .where('pl.postId = p.id')
              .andWhere('pl.userId = :userId', { userId: userId }),
          'like_status',
        )
        .addSelect(
          (qb) =>
            qb
              .select(
                `jsonb_agg(json_build_object('addedAt', to_char(
            agg.added_at::timestamp at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'userId', cast(agg.id as varchar), 'login', agg.login)
                 )`,
              )
              .from((qb) => {
                return qb
                  .select(`added_at, u.id, u.login`)
                  .from(PostLike, 'pl')
                  .leftJoin('pl.user', 'u')
                  .leftJoin('u.userBanBySA', 'ubsa')
                  .where('pl.postId = p.id')
                  .andWhere(`pl.like_status = 'Like'`)
                  .andWhere('ubsa.isBanned = false')
                  .orderBy('added_at', 'DESC')
                  .limit(3);
              }, 'agg'),

          'newest_likes',
        )
        .where(`b.id = :blogId`, {
          blogId: blogId,
        })
        .andWhere(`bb.isBanned = false`)
        .andWhere(`ubsa.isBanned = false`)
        .leftJoinAndSelect('p.blog', 'b')
        .leftJoinAndSelect('b.blogBan', 'bb')
        .leftJoinAndSelect('b.user', 'u')
        .leftJoinAndSelect('u.userBanBySA', 'ubsa')
        .orderBy(`p.${query.sortBy}`, query.sortDirection)
        .limit(query.pageSize)
        .offset((query.pageNumber - 1) * query.pageSize)
        .getRawMany();

      const totalCount = await this.postsRepository
        .createQueryBuilder('p')
        .where(`b.id = :blogId`, {
          blogId: blogId,
        })
        .andWhere(`bb.isBanned = false`)
        .andWhere(`ubsa.isBanned = false`)
        .leftJoinAndSelect('p.blog', 'b')
        .leftJoinAndSelect('b.blogBan', 'bb')
        .leftJoinAndSelect('b.user', 'u')
        .leftJoinAndSelect('u.userBanBySA', 'ubsa')
        .getCount();

      return Paginator.paginate({
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
        totalCount: totalCount,
        items: await this.postsMapping(posts),
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  private async postsMapping(posts: any[]) {
    return posts.map((p) => {
      return {
        id: p.p_id.toString(),
        title: p.p_title,
        shortDescription: p.p_short_description,
        content: p.p_content,
        blogId: p.p_blogId.toString(),
        blogName: p.b_name,
        createdAt: p.p_created_at,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: p.likeStatus || LikeStatus.None,
          newestLikes: p.newestLikes || [],
        },
      };
    });
  }

  async findPostSQL(postId: number): Promise<Post | null> {
    try {
      return await this.postsRepository
        .createQueryBuilder('p')
        .where(`p.id = :postId`, {
          postId: postId,
        })
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async deletePostSQL(postId: number): Promise<boolean> {
    const result = await this.postsRepository
      .createQueryBuilder('p')
      .delete()
      .from(Post)
      .where('id = :postId', { postId: postId })
      .execute();
    return result.affected === 1;
  }

  async findUserPostLikeRecord(
    postId: number,
    userId: number,
  ): Promise<PostLike | null> {
    return this.postLikesRepository
      .createQueryBuilder('pl')
      .where(`p.id = :postId`, {
        postId: postId,
      })
      .andWhere(`u.id = :userId`, {
        userId: userId,
      })
      .leftJoinAndSelect('pl.post', 'p')
      .leftJoinAndSelect('pl.user', 'u')
      .getOne();
  }
}

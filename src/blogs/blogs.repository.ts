import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../db/schemas/blogs.schema';
import { Model } from 'mongoose';
import { BlogsQueryParamsDto } from './dto/blogs-query-params.dto';
import { BlogsResponseDto } from './dto/blogsResponse.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  async findAllBlogs(
    queryParams: BlogsQueryParamsDto,
  ): Promise<BlogsResponseDto | { message: string } | { success: boolean }> {
    try {
      const {
        searchNameTerm = null,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        pageNumber = 1,
        pageSize = 10,
      } = queryParams;

      const skipCount = (pageNumber - 1) * pageSize;
      const filter: any = {};

      if (searchNameTerm) {
        filter['name'] = {
          $regex: searchNameTerm,
          $options: 'i',
        };
      }

      const totalCount = await this.blogModel.countDocuments(filter).exec();
      const totalPages = Math.ceil(totalCount / pageSize);

      const blogs = await this.blogModel
        .find(filter)
        .sort({ [sortBy]: sortDirection === 'desc' ? -1 : 1 })
        .skip(skipCount)
        .limit(pageSize)
        .exec();

      const blogsViewModels = blogs.map((blog) => ({
        id: blog._id.toString(),
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        createdAt: blog.createdAt,
        isMembership: blog.isMembership,
      }));

      const blogsResponse: BlogsResponseDto = {
        pagesCount: totalPages,
        page: pageNumber,
        pageSize: pageSize,
        totalCount: totalCount,
        items: blogsViewModels,
      };

      return blogsResponse;
    } catch (e) {
      console.error('An error occurred while getting all blogs', e);

      return {
        success: false,
        message: 'An error occurred while getting all blogs',
      };
    }
  }

  async create(createBlogDto) {
    try {
      const newBlog = new this.blogModel({
        name: createBlogDto.name,
        description: createBlogDto.description,
        websiteUrl: createBlogDto.websiteUrl,
      });

      const createdBlog = await newBlog.save();

      return {
        id: createdBlog._id,
        name: createdBlog.name,
        description: createdBlog.description,
        websiteUrl: createdBlog.websiteUrl,
        createdAt: createdBlog.createdAt,
        isMembership: createdBlog.isMembership,
      };
    } catch (e) {
      console.error('An error occurred while creating a blog:', e);

      return {
        success: false,
        message: 'An error occurred while creating a blog.',
      };
    }
  }

  async findOne(_id: string) {
    const blog = await this.blogModel.findById(_id).exec();
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return {
      id: blog._id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }

  async updateOne(id: string, updateBlogDto: UpdateBlogDto) {
    try {
      const updatedBlog = await this.blogModel
        .findByIdAndUpdate(
          id,
          {
            $set: updateBlogDto,
          },
          { new: true },
        )
        .exec();

      if (!updatedBlog) {
        throw new NotFoundException('Blog not found');
      }

      return;
    } catch (e) {
      console.error('An error occurred while updating the blog:', e);

      return {
        success: false,
        message: 'An error occurred while updating the blog.',
      };
    }
  }

  async remove(id: string) {
    try {
      const deletedBlog = await this.blogModel.findByIdAndDelete(id).exec();
      if (!deletedBlog) {
        throw new NotFoundException('Blog not found');
      }
      return;
    } catch (e) {
      console.error('An error occurred while deleting the blog:', e);
      if (e instanceof NotFoundException) {
        throw e;
      }
    }
  }
}

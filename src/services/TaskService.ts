import prisma from "../db/prismaClient";
import { Task } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type CreateTaskDto = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

class TaskService {
  async getTasksByUserId(userId: string): Promise<Task[]> {
    return await prisma.task.findMany({
      where: { userId },
      orderBy: [{ completed: 'asc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createTask(data: CreateTaskDto): Promise<Task> {
    if (data.imageUrl) {
      data.imageUrl = await this.uploadImage(data.imageUrl);
    }

    return await prisma.task.create({
      data
    });
  }

  async updateTask(id: string, data: Partial<CreateTaskDto>): Promise<Task> {
    if (data.imageUrl) {
      data.imageUrl = await this.uploadImage(data.imageUrl);
    }
    
    if (data.imageUrl && data.imageUrl === undefined) {
      data.imageUrl = null
    }

    return await prisma.task.update({
      where: { id },
      data,
    });
  }

  async deleteTask(id: string): Promise<Task> {
    return await prisma.task.delete({
      where: { id },
    });
  }

  async uploadImage(file: any): Promise<string> {
    const result = await cloudinary.uploader.upload(file);
    return result.secure_url;
  }
}

export default new TaskService();
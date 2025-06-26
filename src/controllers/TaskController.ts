import TaskService from "../services/TaskService.ts";

class TaskController {
  async createTask(req: any, res: any) {
    try {
      const task = await TaskService.createTask({
        userId: req.userId,
        ...req.body,
        imageUrl: req.files?.imageUrl?.tempFilePath
      });

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: task,
      });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create task",
      });
    }
  }

  async getTaskByUserId(req: any, res: any) {
    try {
      const userId = req.userId;
      const tasks = await TaskService.getTasksByUserId(userId);

      res.status(200).json({
        success: true,
        message: "Tasks retrieved successfully",
        data: tasks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve tasks",
      });
    }
  }

  async updateTask(req: any, res: any) {
    try {
      const taskId = req.params.id;
      const updatedTaskData = { ...req.body };

      if (req.files?.imageUrl) {
        updatedTaskData.imageUrl = req.files.imageUrl.tempFilePath;
      }

      const updatedTask = await TaskService.updateTask(taskId, {
        ...updatedTaskData,
      });

      res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update task",
      });
    }
  }

  async deleteTask(req: any, res: any) {
    try {
      const taskId = req.params.id;
      const deletedTask = await TaskService.deleteTask(taskId);
      
      res.status(200).json({
        success: true,
        message: "Task deleted successfully",
        data: deletedTask,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete task",
      });
    }
  }
}

export default new TaskController();
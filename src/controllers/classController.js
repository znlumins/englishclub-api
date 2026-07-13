import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all classes
export const getAllClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        instructor: { select: { id: true, full_name: true } },
        _count: { select: { enrollments: true } }
      }
    });
    res.json({ success: true, data: classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch classes' } });
  }
};

// Create a new class (Admin/Instructor)
export const createClass = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'instructor') {
      return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        instructorId: userId
      }
    });

    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to create class' } });
  }
};

// Enroll in a class
export const enrollClass = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;

    // check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { userId_classId: { userId, classId } }
    });

    if (existingEnrollment) {
      return res.status(400).json({ success: false, error: { message: 'Already enrolled' } });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        classId
      }
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to enroll in class' } });
  }
};

// Get single class detail with materials
export const getClassDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const classDetail = await prisma.class.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, full_name: true } },
        materials: true
      }
    });

    if (!classDetail) {
      return res.status(404).json({ success: false, error: { message: 'Class not found' } });
    }

    res.json({ success: true, data: classDetail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch class detail' } });
  }
};

// Add Material to Class
export const addMaterial = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { title, url, type } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'instructor') {
      return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    }

    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData) {
      return res.status(404).json({ success: false, error: { message: 'Class not found' } });
    }

    if (userRole === 'instructor' && classData.instructorId !== userId) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden. Not your class.' } });
    }

    const material = await prisma.material.create({
      data: {
        title, url, type: type || 'link', classId
      }
    });

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to add material' } });
  }
};

// Get Enrolled Classes for User
export const getMyClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        class: {
          include: {
            instructor: { select: { full_name: true } }
          }
        }
      }
    });

    const myClasses = enrollments.map(e => e.class);
    res.json({ success: true, data: myClasses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch enrolled classes' } });
  }
};

// Get Managed Classes (Admin/Instructor)
export const getManagedClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'instructor') {
      return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    }

    let whereClause = {};
    if (userRole === 'instructor') {
      whereClause.instructorId = userId;
    }

    const classes = await prisma.class.findMany({
      where: whereClause,
      include: {
        _count: { select: { enrollments: true, materials: true } }
      }
    });

    res.json({ success: true, data: classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch managed classes' } });
  }
};

// Get Class Members
export const getClassMembers = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'instructor') {
      return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    }

    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData) {
      return res.status(404).json({ success: false, error: { message: 'Class not found' } });
    }

    if (userRole === 'instructor' && classData.instructorId !== userId) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden. Not your class.' } });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        user: { select: { id: true, full_name: true, nim: true, email: true, joined_at: true } }
      }
    });

    const members = enrollments.map(e => ({
      ...e.user,
      enrolled_at: e.joined_at
    }));

    res.json({ success: true, data: members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch members' } });
  }
};

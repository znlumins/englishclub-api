import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const register = async (req, res) => {
  try {
    const { email, password, nim, full_name, program_studi, angkatan, phone } = req.body;

    // Validate if email or NIM already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { nim }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email or NIM already registered' }
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash,
        nim,
        full_name,
        program_studi,
        angkatan: angkatan ? parseInt(angkatan) : null,
        phone,
        status: 'pending', // Waiting for admin approval
        role: 'member'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Waiting for admin approval.',
      data: { id: newUser.id, email: newUser.email, status: newUser.status }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, error: { message: 'Your account has been blocked' } });
    }

    // Gamification: Daily Login Logic
    const now = new Date();
    let newStreak = user.streak_days || 0;
    let newPoints = user.points || 0;

    if (!user.last_active_at) {
      // First time login
      newStreak = 1;
      newPoints += 10;
    } else {
      const lastActive = new Date(user.last_active_at);
      const isToday = lastActive.toDateString() === now.toDateString();
      
      if (!isToday) {
        // Calculate difference in days
        const diffTime = Math.abs(now - lastActive);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          // Logged in yesterday, increment streak
          newStreak += 1;
        } else {
          // Streak broken
          newStreak = 1;
        }
        newPoints += 10; // +10 points for daily login
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_active_at: now,
        streak_days: newStreak,
        points: newPoints
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, nim: true, full_name: true, role: true,
        status: true, avatar_url: true, bio: true, phone: true,
        program_studi: true, angkatan: true, points: true, streak_days: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { bio, phone, program_studi, avatar_url } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { bio, phone, program_studi, avatar_url }
    });

    res.json({ success: true, message: 'Profile updated', data: { id: updatedUser.id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 10,
      select: {
        id: true,
        full_name: true,
        points: true,
        streak_days: true,
        avatar_url: true
      }
    });

    res.json({ success: true, data: topUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch leaderboard' } });
  }
};

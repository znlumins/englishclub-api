import Joi from 'joi';

// B-9 (MEDIUM): kunci jawaban wajib merupakan salah satu opsi yang tersedia.
// Tanpa ini, typo instructor → kuis tidak bisa diselesaikan dengan benar.
const questionSchema = Joi.object({
  question_text: Joi.string().min(1).required(),
  options: Joi.array().items(Joi.string()).min(2).max(6).required(),
  correct_answer: Joi.string()
    .valid(Joi.in('options'))
    .required()
    .messages({
      'any.only': 'Kunci jawaban harus merupakan salah satu opsi yang tersedia',
      'any.required': 'Kunci jawaban wajib diisi'
    })
});

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message).join(', ');
    return res.status(400).json({
      success: false,
      error: { message: messages }
    });
  }
  req.body = value;
  next();
};

export const schemas = {
  register: Joi.object({
    full_name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nama lengkap minimal 2 karakter',
      'any.required': 'Nama lengkap wajib diisi'
    }),
    nim: Joi.string().pattern(/^\d+$/).min(5).max(20).required().messages({
      'string.pattern.base': 'NIM harus berupa angka',
      'any.required': 'NIM wajib diisi'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email tidak valid',
      'any.required': 'Email wajib diisi'
    }),
    password: Joi.string().min(6).max(100).required().messages({
      'string.min': 'Password minimal 6 karakter',
      'any.required': 'Password wajib diisi'
    }),
    program_studi: Joi.string().allow('', null).optional(),
    angkatan: Joi.number().integer().min(2020).max(2035).allow(null).optional(),
    phone: Joi.string().allow('', null).optional()
  }),

  createUser: Joi.object({
    full_name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nama lengkap minimal 2 karakter',
      'any.required': 'Nama lengkap wajib diisi'
    }),
    nim: Joi.string().pattern(/^\d+$/).min(5).max(20).required().messages({
      'string.pattern.base': 'NIM harus berupa angka',
      'any.required': 'NIM wajib diisi'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email tidak valid',
      'any.required': 'Email wajib diisi'
    }),
    password: Joi.string().min(6).max(100).required().messages({
      'string.min': 'Password minimal 6 karakter',
      'any.required': 'Password wajib diisi'
    }),
    role: Joi.string().valid('member', 'instructor', 'admin').default('member'),
    program_studi: Joi.string().allow('', null).optional(),
    angkatan: Joi.number().integer().min(2020).max(2035).allow(null).optional(),
    phone: Joi.string().allow('', null).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateUserByAdmin: Joi.object({
    full_name: Joi.string().min(2).max(100).optional().messages({
      'string.min': 'Nama lengkap minimal 2 karakter'
    }),
    email: Joi.string().email().optional().messages({
      'string.email': 'Email tidak valid'
    }),
    nim: Joi.string().pattern(/^\d+$/).min(5).max(20).optional().messages({
      'string.pattern.base': 'NIM harus berupa angka'
    }),
    program_studi: Joi.string().allow('', null).optional(),
    angkatan: Joi.number().integer().min(2020).max(2035).allow(null).optional(),
    phone: Joi.string().allow('', null).optional()
  }),

  adjustPoints: Joi.object({
    amount: Joi.number().integer().min(-10000).max(10000).required().messages({
      'any.required': 'Jumlah poin wajib diisi (boleh negatif untuk mengurangi)'
    }),
    description: Joi.string().min(3).max(200).required().messages({
      'any.required': 'Alasan wajib diisi'
    })
  }),

  createClass: Joi.object({
    name: Joi.string().min(2).max(200).required().messages({
      'string.min': 'Nama course minimal 2 karakter',
      'any.required': 'Nama course wajib diisi'
    }),
    description: Joi.string().max(500).allow('', null).optional()
  }),

  updateClass: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(500).allow('', null).optional(),
    instructorId: Joi.string().uuid().optional()
  }),

  addMaterial: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    url: Joi.string().uri({ scheme: ['http', 'https'] }).required().messages({
      'string.uri': 'URL tidak valid. Harus dimulai dengan http:// atau https://'
    }),
    type: Joi.string().valid('link', 'video', 'pdf').default('link')
  }),

  updateMaterial: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    url: Joi.string().uri({ scheme: ['http', 'https'] }).optional().messages({
      'string.uri': 'URL tidak valid. Harus dimulai dengan http:// atau https://'
    }),
    type: Joi.string().valid('link', 'video', 'pdf').optional()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).max(100).required().messages({
      'string.min': 'Password minimal 6 karakter',
      'any.required': 'Password wajib diisi'
    })
  }),

  createQuiz: Joi.object({
    classId: Joi.string().uuid().required(),
    title: Joi.string().min(1).max(200).required(),
    max_attempts: Joi.number().integer().min(1).max(99).optional(),
    questions: Joi.array().min(1).items(questionSchema).required()
  }),

  updateQuiz: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    max_attempts: Joi.number().integer().min(1).max(99).allow(null).optional(),
    questions: Joi.array().min(1).items(questionSchema).optional()
  }),

  // B-4 (HIGH): validasi body submit kuis. `answers` adalah map questionId → jawaban.
  // Tanpa skema ini, body kosong → TypeError → 500 dijamin (PRD bug B-4).
  submitQuiz: Joi.object({
    answers: Joi.object()
      .pattern(Joi.string(), Joi.string().allow(null))
      .required()
      .messages({
        'any.required': 'Jawaban wajib dikirim',
        'object.base': 'Format jawaban tidak valid'
      })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Password saat ini wajib diisi'
    }),
    newPassword: Joi.string().min(6).max(100).required().messages({
      'string.min': 'Password baru minimal 6 karakter',
      'any.required': 'Password baru wajib diisi'
    })
  }),

  updateProfile: Joi.object({
    bio: Joi.string().max(500).allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    program_studi: Joi.string().allow('', null).optional(),
    avatar_url: Joi.string().uri({ scheme: ['http', 'https'] }).allow('', null).optional().messages({
      'string.uri': 'URL avatar tidak valid. Harus dimulai dengan http:// atau https://'
    })
  })
};

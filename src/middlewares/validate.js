import Joi from 'joi';

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
    angkatan: Joi.number().integer().min(2000).max(2030).allow(null).optional(),
    phone: Joi.string().allow('', null).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
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
    description: Joi.string().max(500).allow('', null).optional()
  }),

  addMaterial: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    url: Joi.string().uri().required().messages({
      'string.uri': 'URL tidak valid. Harus dimulai dengan http:// atau https://'
    }),
    type: Joi.string().valid('link', 'video', 'pdf').default('link')
  }),

  updateMaterial: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    url: Joi.string().uri().optional(),
    type: Joi.string().valid('link', 'video', 'pdf').optional()
  }),

  createQuiz: Joi.object({
    classId: Joi.string().uuid().required(),
    title: Joi.string().min(1).max(200).required(),
    questions: Joi.array().min(1).items(Joi.object({
      question_text: Joi.string().min(1).required(),
      options: Joi.array().items(Joi.string()).min(2).max(6).required(),
      correct_answer: Joi.string().required()
    })).required()
  }),

  updateProfile: Joi.object({
    bio: Joi.string().max(500).allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    program_studi: Joi.string().allow('', null).optional(),
    avatar_url: Joi.string().uri().allow('', null).optional()
  })
};

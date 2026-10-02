export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = {};

  if (!name || name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (name.length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  }

  if (!email || email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.email = 'Please provide a valid email';
  }

  if (!password || password.length === 0) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || email.trim().length === 0) {
    errors.email = 'Email is required';
  }

  if (!password || password.length === 0) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

export const validateLocation = (req, res, next) => {
  const { latitude, longitude } = req.body;
  const errors = {};

  if (latitude === undefined || latitude === null) {
    errors.latitude = 'Latitude is required';
  } else if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    errors.latitude = 'Latitude must be a number between -90 and 90';
  }

  if (longitude === undefined || longitude === null) {
    errors.longitude = 'Longitude is required';
  } else if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    errors.longitude = 'Longitude must be a number between -180 and 180';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

export const validateMessage = (req, res, next) => {
  const { message } = req.body;
  const errors = {};

  if (!message || message.trim().length === 0) {
    errors.message = 'Message is required';
  } else if (message.length > 2000) {
    errors.message = 'Message cannot exceed 2000 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};
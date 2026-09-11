const { registerUser, loginUser, refreshSession, changePassword } = require('../services/authService');
const { validateCredentials } = require('../utils/validation');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    validateCredentials({ name, email, password }, true);
    const user = await registerUser({ name, email, password });
    return res.status(201).json({ user });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    validateCredentials({ email, password });
    return res.json(await loginUser({ email, password }));
  } catch (error) { next(error); }
}

function me(req, res) { return res.json({ user: req.user }); }

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (typeof refreshToken !== 'string' || !refreshToken) {
      return res.status(400).json({ message: 'Refresh token é obrigatório.' });
    }
    return res.json(await refreshSession(refreshToken));
  } catch (error) { next(error); }
}

async function changePasswordHandler(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    validateCredentials({ email: req.user.email, password: currentPassword });
    validateCredentials({ email: req.user.email, password: newPassword });
    await changePassword(req.user.id, currentPassword, newPassword);
    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) { next(error); }
}

module.exports = { register, login, me, refresh, changePasswordHandler };

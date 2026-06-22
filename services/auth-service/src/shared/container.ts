import prisma from './database/prisma.js';
import { UsuarioRepository }  from '../modules/usuarios/usuario.repository.js';
import { AuthService }        from '../modules/auth/auth.service.js';
import { AuthController }     from '../modules/auth/auth.controller.js';
import { UsuarioController }  from '../modules/usuarios/usuario.controller.js';

export const usuarioRepo = new UsuarioRepository(prisma);
export const authService = new AuthService(usuarioRepo);

export const authController    = new AuthController(authService);
export const usuarioController = new UsuarioController(usuarioRepo);
